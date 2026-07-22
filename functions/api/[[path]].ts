import { defaultContent } from "../../src/data/defaultContent";
import type { ApplicationFilters, ApplicationInput, ApplicationRecord, ApplicationStatus, DashboardStats, SiteContent } from "../../src/types";

interface D1Result<T> { results?: T[] }
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run(): Promise<unknown>;
}
interface D1Database { prepare(query: string): D1PreparedStatement }
interface R2ObjectBody {
  body: ReadableStream;
  etag: string;
  httpMetadata?: { contentType?: string };
}
interface R2Bucket {
  put(key: string, value: ArrayBuffer, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
  get(key: string): Promise<R2ObjectBody | null>;
}
interface Env {
  DB?: D1Database;
  ASSETS_BUCKET?: R2Bucket;
  ADMIN_PASSWORD_HASH?: string;
  ADMIN_SESSION_SECRET?: string;
  DATA_ENCRYPTION_KEY?: string;
  DATA_HASH_SECRET?: string;
  WECOM_WEBHOOK_URL?: string;
}
interface PagesContext {
  request: Request;
  env: Env;
  waitUntil(promise: Promise<unknown>): void;
}

interface ApplicationRow {
  id: string;
  school: string;
  grade: string;
  wechat_encrypted: string;
  phone_encrypted: string;
  wechat_hash: string;
  interests_json: string;
  ideas: string;
  source: string;
  status: ApplicationStatus;
  agent_code: string;
  admin_notes: string;
  duplicate_suspected: number;
  created_at: string;
  updated_at: string;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const ALLOWED_GRADES = ["大一", "大二", "大三", "大四", "大五", "研究生", "其他"];
const ALLOWED_EVENTS = ["page_view", "consult_click", "application_start", "application_submit"];
const SAFE_ERRORS = new Set([
  "参数不完整",
  "提交过于频繁，请稍后再试",
  "尝试次数过多，请稍后再试",
  "登录已失效，请重新登录",
  "管理员密码不正确",
  "报名记录不存在",
  "图片格式不支持",
  "图片不能超过5MB",
  "图片存储尚未配置",
  "服务暂未配置，请联系网站负责人",
]);

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function success<T>(data: T): Response { return json({ ok: true, data }); }
function cleanText(value: unknown, max: number): string { return String(value || "").trim().slice(0, max); }
function requireDb(env: Env): D1Database {
  if (!env.DB) throw new Error("服务暂未配置，请联系网站负责人");
  return env.DB;
}
function requireSecret(env: Env, name: keyof Env): string {
  const value = env[name];
  if (typeof value !== "string" || !value) throw new Error("服务暂未配置，请联系网站负责人");
  return value;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
function base64UrlEncode(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function base64UrlDecode(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return base64ToBytes(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
}
function hexToBytes(value: string): Uint8Array | null {
  if (!/^[a-f0-9]{64}$/i.test(value)) return null;
  return Uint8Array.from(value.match(/.{2}/g) || [], (pair) => Number.parseInt(pair, 16));
}
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index];
  return difference === 0;
}

async function hmacBytes(secret: string, value: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}
async function hashValue(env: Env, value: string): Promise<string> {
  const bytes = await hmacBytes(requireSecret(env, "DATA_HASH_SECRET"), value);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
async function encryptionKey(env: Env): Promise<CryptoKey> {
  const bytes = base64ToBytes(requireSecret(env, "DATA_ENCRYPTION_KEY"));
  if (bytes.length !== 32) throw new Error("服务暂未配置，请联系网站负责人");
  return crypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}
async function encryptText(env: Env, value: string): Promise<string> {
  if (!value) return "";
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await encryptionKey(env), encoder.encode(value));
  return `v1.${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(encrypted))}`;
}
async function decryptText(env: Env, value: string): Promise<string> {
  if (!value) return "";
  const [version, iv, ciphertext] = value.split(".");
  if (version !== "v1" || !iv || !ciphertext) throw new Error("Encrypted value is invalid");
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(iv) }, await encryptionKey(env), base64ToBytes(ciphertext));
  return decoder.decode(decrypted);
}

async function verifyPassword(env: Env, password: string): Promise<boolean> {
  const configuredHash = requireSecret(env, "ADMIN_PASSWORD_HASH").trim().replace(/^([`'"])|([`'"])$/g, "");
  const [scheme, first, second, third] = configuredHash.split(":");
  if (scheme === "sha256-hex" && first && !second) {
    const expected = hexToBytes(first);
    if (!expected) return false;
    const actual = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(password)));
    return constantTimeEqual(actual, expected);
  }
  if (scheme === "sha256-salted" && first && second && !third) {
    const salt = base64ToBytes(first);
    const passwordBytes = encoder.encode(password);
    const combined = new Uint8Array(salt.length + passwordBytes.length);
    combined.set(salt);
    combined.set(passwordBytes, salt.length);
    const actual = new Uint8Array(await crypto.subtle.digest("SHA-256", combined));
    return constantTimeEqual(actual, base64ToBytes(second));
  }

  const iterationText = first;
  const saltText = second;
  const expectedText = third;
  const iterations = Number(iterationText);
  if (scheme !== "pbkdf2-sha256" || !Number.isInteger(iterations) || iterations < 100000 || !saltText || !expectedText) return false;
  const material = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const actual = new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: base64ToBytes(saltText), iterations }, material, base64ToBytes(expectedText).length * 8));
  return constantTimeEqual(actual, base64ToBytes(expectedText));
}
async function signToken(env: Env): Promise<string> {
  const body = base64UrlEncode(encoder.encode(JSON.stringify({ scope: "admin", exp: Date.now() + 8 * 60 * 60 * 1000, nonce: crypto.randomUUID() })));
  return `${body}.${base64UrlEncode(await hmacBytes(requireSecret(env, "ADMIN_SESSION_SECRET"), body))}`;
}
async function verifyToken(env: Env, token: string): Promise<void> {
  const [body, signature] = String(token || "").split(".");
  if (!body || !signature) throw new Error("登录已失效，请重新登录");
  const expected = await hmacBytes(requireSecret(env, "ADMIN_SESSION_SECRET"), body);
  if (!constantTimeEqual(expected, base64UrlDecode(signature))) throw new Error("登录已失效，请重新登录");
  const payload = JSON.parse(decoder.decode(base64UrlDecode(body))) as { scope?: string; exp?: number };
  if (payload.scope !== "admin" || !payload.exp || payload.exp < Date.now()) throw new Error("登录已失效，请重新登录");
}

function validateApplication(input: Partial<ApplicationInput>): Omit<ApplicationInput, "privacyAccepted" | "website"> {
  const school = cleanText(input.school, 60);
  const wechatId = cleanText(input.wechatId, 50);
  const phone = cleanText(input.phone, 11);
  const interests = Array.isArray(input.interests) ? input.interests.map((value) => cleanText(value, 50)).filter(Boolean).slice(0, 8) : [];
  if (cleanText(input.website, 100)) throw new Error("参数不完整");
  if (school.length < 2 || wechatId.length < 3 || !ALLOWED_GRADES.includes(String(input.grade)) || !interests.length || input.privacyAccepted !== true) throw new Error("参数不完整");
  if (phone && !/^1\d{10}$/.test(phone)) throw new Error("参数不完整");
  return { school, grade: input.grade as ApplicationInput["grade"], wechatId, phone, interests, ideas: cleanText(input.ideas, 800), source: cleanText(input.source, 60) || "direct" };
}

async function toApplicationRecord(env: Env, row: ApplicationRow): Promise<ApplicationRecord> {
  const [wechatId, phone] = await Promise.all([decryptText(env, row.wechat_encrypted), decryptText(env, row.phone_encrypted)]);
  return {
    id: row.id,
    school: row.school,
    grade: row.grade as ApplicationRecord["grade"],
    wechatId,
    phone: phone || undefined,
    interests: JSON.parse(row.interests_json) as string[],
    ideas: row.ideas || undefined,
    source: row.source,
    status: row.status,
    agentCode: row.agent_code || undefined,
    adminNotes: row.admin_notes,
    duplicateSuspected: Boolean(row.duplicate_suspected),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function readContent(env: Env): Promise<SiteContent> {
  const row = await requireDb(env).prepare("SELECT content_json FROM site_content WHERE id = ?").bind("published").first<{ content_json: string }>();
  if (!row) return defaultContent;
  try { return { ...defaultContent, ...(JSON.parse(row.content_json) as Partial<SiteContent>) }; }
  catch { return defaultContent; }
}
async function saveContent(env: Env, input: unknown): Promise<SiteContent> {
  const content = input as Partial<SiteContent> | null;
  if (!content || !Array.isArray(content.services) || !Array.isArray(content.rules) || !Array.isArray(content.faqs)) throw new Error("参数不完整");
  const saved = { ...defaultContent, ...content, updatedAt: new Date().toISOString() };
  await requireDb(env).prepare("INSERT INTO site_content (id, content_json, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET content_json = excluded.content_json, updated_at = excluded.updated_at")
    .bind("published", JSON.stringify(saved), saved.updatedAt).run();
  return saved;
}

async function enforceRateLimit(
  env: Env,
  request: Request,
  scope: "application" | "admin-login",
  maximum: number,
  windowMs: number,
): Promise<void> {
  const db = requireDb(env);
  const fingerprint = await hashValue(env, `${scope}|${request.headers.get("CF-Connecting-IP") || "unknown"}|${request.headers.get("user-agent") || ""}`);
  const since = new Date(Date.now() - windowMs).toISOString();
  const count = await db.prepare("SELECT COUNT(*) AS total FROM submission_rate_limits WHERE fingerprint = ? AND created_at >= ?").bind(fingerprint, since).first<{ total: number }>();
  if (Number(count?.total || 0) >= maximum) {
    throw new Error(scope === "application" ? "提交过于频繁，请稍后再试" : "尝试次数过多，请稍后再试");
  }
  await db.prepare("INSERT INTO submission_rate_limits (fingerprint, created_at) VALUES (?, ?)").bind(fingerprint, new Date().toISOString()).run();
  if (crypto.getRandomValues(new Uint8Array(1))[0] === 0) {
    await db.prepare("DELETE FROM submission_rate_limits WHERE created_at < ?").bind(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()).run();
  }
}

async function notifyWeCom(env: Env, record: ApplicationRecord): Promise<void> {
  if (!env.WECOM_WEBHOOK_URL) return;
  const markdown = ["### 新的校园代理报名", `> 学校：${record.school}`, `> 年级：${record.grade}`, `> 方向：${record.interests.join("、")}`, `> 报名编号：${record.id}`].join("\n");
  await fetch(env.WECOM_WEBHOOK_URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ msgtype: "markdown", markdown: { content: markdown } }) });
}

async function submitApplication(context: PagesContext, input: Partial<ApplicationInput>): Promise<ApplicationRecord> {
  const { env, request } = context;
  const clean = validateApplication(input);
  await enforceRateLimit(env, request, "application", 5, 10 * 60 * 1000);
  const db = requireDb(env);
  const wechatHash = await hashValue(env, clean.wechatId.toLowerCase());
  const duplicate = await db.prepare("SELECT COUNT(*) AS total FROM applications WHERE wechat_hash = ?").bind(wechatHash).first<{ total: number }>();
  const duplicateSuspected = Number(duplicate?.total || 0) > 0;
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const [wechatEncrypted, phoneEncrypted] = await Promise.all([encryptText(env, clean.wechatId), encryptText(env, clean.phone || "")]);
  await db.prepare("INSERT INTO applications (id, school, grade, wechat_encrypted, phone_encrypted, wechat_hash, interests_json, ideas, source, status, agent_code, admin_notes, duplicate_suspected, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', '', '', ?, ?, ?)")
    .bind(id, clean.school, clean.grade, wechatEncrypted, phoneEncrypted, wechatHash, JSON.stringify(clean.interests), clean.ideas || "", clean.source, duplicateSuspected ? 1 : 0, now, now).run();
  const record: ApplicationRecord = { ...clean, id, status: "pending", adminNotes: "", duplicateSuspected, createdAt: now, updatedAt: now };
  context.waitUntil(notifyWeCom(env, record).catch(() => undefined));
  return record;
}

async function listApplications(env: Env, filters: ApplicationFilters = {}): Promise<ApplicationRecord[]> {
  const response = await requireDb(env).prepare("SELECT * FROM applications ORDER BY created_at DESC LIMIT 1000").all<ApplicationRow>();
  const records = await Promise.all((response.results || []).map((row) => toApplicationRecord(env, row)));
  const query = cleanText(filters.query, 80).toLowerCase();
  return records.filter((record) => {
    if (query && !`${record.school} ${record.wechatId} ${record.phone || ""} ${record.agentCode || ""}`.toLowerCase().includes(query)) return false;
    if (filters.school && record.school !== filters.school) return false;
    if (filters.grade && record.grade !== filters.grade) return false;
    if (filters.status && record.status !== filters.status) return false;
    if (filters.interest && !record.interests.includes(filters.interest)) return false;
    if (filters.source && record.source !== filters.source) return false;
    if (filters.startDate && record.createdAt.slice(0, 10) < filters.startDate) return false;
    if (filters.endDate && record.createdAt.slice(0, 10) > filters.endDate) return false;
    return true;
  });
}

async function updateApplication(env: Env, idValue: unknown, changesValue: unknown): Promise<ApplicationRecord> {
  const id = cleanText(idValue, 80);
  const changes = (changesValue || {}) as { status?: ApplicationStatus; adminNotes?: string };
  const db = requireDb(env);
  const row = await db.prepare("SELECT * FROM applications WHERE id = ?").bind(id).first<ApplicationRow>();
  if (!row) throw new Error("报名记录不存在");
  const status = (["pending", "approved", "not_suitable"] as ApplicationStatus[]).includes(changes.status as ApplicationStatus) ? changes.status as ApplicationStatus : row.status;
  const adminNotes = typeof changes.adminNotes === "string" ? cleanText(changes.adminNotes, 1000) : row.admin_notes;
  let agentCode = row.agent_code;
  const now = new Date().toISOString();
  if (status === "approved" && !agentCode) {
    const counter = await db.prepare("INSERT INTO sequence_counters (counter_key, value, updated_at) VALUES ('agent-code', 1, ?) ON CONFLICT(counter_key) DO UPDATE SET value = value + 1, updated_at = excluded.updated_at RETURNING value").bind(now).first<{ value: number }>();
    agentCode = `HH-SD-${String(counter?.value || 1).padStart(6, "0")}`;
  }
  await db.prepare("UPDATE applications SET status = ?, agent_code = ?, admin_notes = ?, updated_at = ? WHERE id = ?").bind(status, agentCode, adminNotes, now, id).run();
  return toApplicationRecord(env, { ...row, status, agent_code: agentCode, admin_notes: adminNotes, updated_at: now });
}

function countBy(values: string[]): Array<{ name: string; count: number }> {
  return Object.entries(values.reduce<Record<string, number>>((result, value) => {
    const key = value || "未知";
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {})).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}
async function dashboard(env: Env): Promise<DashboardStats> {
  const records = await listApplications(env);
  const events = await requireDb(env).prepare("SELECT name FROM analytics_events ORDER BY created_at DESC LIMIT 5000").all<{ name: string }>();
  const eventCount = (name: string) => (events.results || []).filter((event) => event.name === name).length;
  const pageViews = eventCount("page_view");
  const applicationSubmits = eventCount("application_submit");
  return {
    pageViews,
    consultationClicks: eventCount("consult_click"),
    applicationStarts: eventCount("application_start"),
    applicationSubmits,
    conversionRate: pageViews ? Math.round((applicationSubmits / pageViews) * 1000) / 10 : 0,
    statusCounts: {
      pending: records.filter((record) => record.status === "pending").length,
      approved: records.filter((record) => record.status === "approved").length,
      not_suitable: records.filter((record) => record.status === "not_suitable").length,
    },
    sourceBreakdown: countBy(records.map((record) => record.source)).slice(0, 8),
    schoolBreakdown: countBy(records.map((record) => record.school)).slice(0, 8),
    recentApplications: records.slice(0, 5),
  };
}

async function routeRpc(context: PagesContext, event: { action?: string; payload?: Record<string, unknown>; token?: string }): Promise<unknown> {
  const { env } = context;
  const action = event.action;
  const payload = event.payload || {};
  if (action === "getContent") return readContent(env);
  if (action === "submitApplication") return submitApplication(context, (payload.input || {}) as Partial<ApplicationInput>);
  if (action === "trackEvent") {
    const item = (payload.event || {}) as Record<string, unknown>;
    if (!ALLOWED_EVENTS.includes(String(item.name))) throw new Error("参数不完整");
    await requireDb(env).prepare("INSERT INTO analytics_events (id, name, path, source, session_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(crypto.randomUUID(), String(item.name), cleanText(item.path, 120), cleanText(item.source, 60) || "direct", await hashValue(env, cleanText(item.sessionId, 80)), new Date().toISOString()).run();
    return null;
  }
  if (action === "adminLogin") {
    await enforceRateLimit(env, context.request, "admin-login", 10, 15 * 60 * 1000);
    if (!await verifyPassword(env, cleanText(payload.password, 200))) throw new Error("管理员密码不正确");
    return signToken(env);
  }
  await verifyToken(env, event.token || "");
  if (action === "verifyAdmin") return null;
  if (action === "getDashboard") return dashboard(env);
  if (action === "listApplications") return listApplications(env, (payload.filters || {}) as ApplicationFilters);
  if (action === "updateApplication") return updateApplication(env, payload.id, payload.changes);
  if (action === "deleteApplication") {
    const id = cleanText(payload.id, 80);
    if (!id) throw new Error("参数不完整");
    await requireDb(env).prepare("DELETE FROM applications WHERE id = ?").bind(id).run();
    return null;
  }
  if (action === "getAdminContent") return readContent(env);
  if (action === "saveContent") return saveContent(env, payload.content);
  throw new Error("参数不完整");
}

async function handleAsset(context: PagesContext, pathname: string): Promise<Response> {
  const { request, env } = context;
  if (!env.ASSETS_BUCKET) throw new Error("图片存储尚未配置");
  if (request.method === "GET") {
    const key = decodeURIComponent(pathname.slice("/api/assets/".length));
    if (!key) return new Response("Not found", { status: 404 });
    const object = await env.ASSETS_BUCKET.get(key);
    if (!object) return new Response("Not found", { status: 404 });
    return new Response(object.body, { headers: { "content-type": object.httpMetadata?.contentType || "application/octet-stream", "cache-control": "public, max-age=3600", etag: object.etag } });
  }
  if (request.method !== "POST" || pathname !== "/api/assets") return new Response("Method not allowed", { status: 405 });
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  await verifyToken(env, token);
  const contentType = request.headers.get("content-type") || "";
  if (!/^image\/(png|jpeg|webp)$/.test(contentType)) throw new Error("图片格式不支持");
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > 5 * 1024 * 1024) throw new Error("图片不能超过5MB");
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") === "image" ? "image" : "qr";
  const safeName = cleanText(url.searchParams.get("name"), 100).replace(/[^a-zA-Z0-9._-]/g, "-") || "asset";
  const key = `site-assets/${kind}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
  await env.ASSETS_BUCKET.put(key, bytes, { httpMetadata: { contentType } });
  return success(`/api/assets/${encodeURIComponent(key)}`);
}

export const onRequest = async (context: PagesContext): Promise<Response> => {
  const { request } = context;
  const pathname = new URL(request.url).pathname;
  try {
    if (pathname.startsWith("/api/assets")) return await handleAsset(context, pathname);
    if (pathname !== "/api" || request.method !== "POST") return new Response("Not found", { status: 404 });
    const event = await request.json() as { action?: string; payload?: Record<string, unknown>; token?: string };
    return success(await routeRpc(context, event));
  } catch (error) {
    console.error("API request failed", error instanceof Error ? error.message : error);
    const message = error instanceof Error && SAFE_ERRORS.has(error.message) ? error.message : "请求失败，请稍后重试";
    return json({ ok: false, error: message }, SAFE_ERRORS.has(message) ? 400 : 500);
  }
};
