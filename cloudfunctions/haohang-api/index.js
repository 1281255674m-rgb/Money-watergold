const cloud = require("@cloudbase/node-sdk");
const {
  createCipheriv,
  createDecipheriv,
  createHmac,
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} = require("node:crypto");

const app = cloud.init({ env: cloud.SYMBOL_CURRENT_ENV });
const db = app.database();
const _ = db.command;

const COLLECTIONS = {
  content: "site_content",
  applications: "applications",
  events: "analytics_events",
  rateLimits: "submission_rate_limits",
  counters: "sequence_counters",
};

const SERVICE_LABELS = {
  "graduation-recycle": "毕业季回收",
  "presentation-design": "展示设计",
  "learning-support": "学习辅导",
  "postgraduate-planning": "考研规划",
  "campus-co-create": "校园共创",
};

function interestLabels(ids) {
  return (ids || []).map((id) => SERVICE_LABELS[id] || id).join("、");
}

const DEFAULT_CONTENT = {
  brandName: "浩航科技",
  companyName: "济南浩航网络科技公司",
  slogan: "同心共筑梦想，共创校园价值",
  heroEyebrow: "山东高校校园代理招募计划",
  heroDescription: "从身边一条真实需求开始，连接校园与可靠服务。我们正在山东寻找愿意观察、沟通、共创的学生代理。",
  recruitmentTitle: "你了解校园，我们认真承接",
  recruitmentDescription: "不要求推销固定商品。发现同学的真实需求，介绍给浩航科技并通过微信完成初步对接，就是合作的开始。",
  invitationEnabled: true,
  invitationTitle: "想找的不是“代理”，是能一起把事情做成的人",
  invitationBody: "如果你在山东上大学，愿意留意身边的真实需求，也愿意把一件小事认真做好，我们很想认识你。\n\n这不是让你天天发广告、硬着头皮推销。你负责发现需求、连接同学，我们负责把服务、沟通和后续工作认真接住。合作怎么认定、成果怎么归属、回报怎么结算，都会提前说清楚。认真做事、真正带来结果的人，我们不会让你吃亏。\n\n除了合作，我们也希望大家能成为长期认识的朋友，可以一起吃饭、交流学校里的新机会，也可以共同尝试新的校园项目。合作顺利、能力和方向合适，毕业后的实习、工作或长期共创机会，也会优先和你沟通。先加私人微信，告诉我你在哪所学校、有什么想法，我们像朋友一样认真聊一聊。",
  services: [
    { id: "graduation-recycle", title: "毕业季物品回收", shortTitle: "毕业季回收", summary: "围绕书籍、被褥等毕业物品，连接校园内真实回收需求。", details: ["毕业书籍回收", "被褥等物品回收", "校内需求集中对接"], icon: "recycle" },
    { id: "presentation-design", title: "PPT 与展示设计", shortTitle: "展示设计", summary: "帮助学生优化演示逻辑、视觉表达与答辩呈现。", details: ["PPT视觉设计", "内容结构优化", "答辩与路演表达"], icon: "presentation" },
    { id: "learning-support", title: "学习与学术方法辅导", shortTitle: "学习辅导", summary: "提供答疑、方法、资料整理与工具使用方面的合规支持。", details: ["课程答疑", "学习方法辅导", "资料检索与整理"], icon: "learning" },
    { id: "postgraduate-planning", title: "考研规划", shortTitle: "考研规划", summary: "围绕目标选择、备考节奏与阶段复盘提供规划支持。", details: ["目标与方向梳理", "阶段计划制定", "备考节奏复盘"], icon: "planning" },
    { id: "campus-co-create", title: "校园需求共创", shortTitle: "校园共创", summary: "每所学校都有不同需求。欢迎提出新的服务想法，与我们一起验证。", details: ["本校特色需求", "校园资源合作", "新服务共同验证"], icon: "sparkles" },
  ],
  rules: [
    { title: "需求推荐", description: "发现身边真实需求，通过微信完成介绍。" },
    { title: "成交确认", description: "明确需求、服务边界与合作归属，关键过程留痕。" },
    { title: "合作结算", description: "具体比例与结算方式，在合作确认后按规则执行。" },
    { title: "持续沟通", description: "先通过私人微信交流，确认合作后进入企业微信。" },
  ],
  faqs: [
    { question: "需要有销售经验吗？", answer: "不需要。我们更看重你是否了解本校、愿意认真沟通并尊重真实需求。" },
    { question: "必须每天投入很多时间吗？", answer: "不需要固定坐班。根据身边需求和自己的时间参与，具体合作通过企业微信确认。" },
    { question: "学校不在列表里怎么办？", answer: "可以直接填写学校名称。第一阶段面向山东省内高校持续招募。" },
    { question: "报名后多久能收到回复？", answer: "提交后建议先添加私人微信，我们会结合报名信息尽快沟通；确认合作意向后再邀请进入企业微信。" },
    { question: "学习辅导包含哪些内容？", answer: "仅提供答疑、方法辅导、资料整理和展示优化，不提供代写、替考或虚假学术材料。" },
  ],
  publicMetrics: [],
  contactQrUrl: "/wechat-enterprise.png",
  contactLabel: "企业微信",
  personalContactQrUrl: "/wechat-personal.png",
  personalContactLabel: "私人微信 · 茂实",
  updatedAt: new Date(0).toISOString(),
};

function result(data) { return { ok: true, data }; }
function failure(error) {
  console.error(error);
  const safeMessages = ["参数不完整", "提交过于频繁，请稍后再试", "登录已失效，请重新登录", "管理员密码不正确", "报名记录不存在"];
  const message = error instanceof Error && safeMessages.includes(error.message) ? error.message : "请求失败，请稍后重试";
  return { ok: false, error: message };
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function hashValue(value) {
  return createHmac("sha256", requiredEnv("DATA_HASH_SECRET")).update(String(value)).digest("hex");
}

function encryptionKey() {
  const key = Buffer.from(requiredEnv("DATA_ENCRYPTION_KEY"), "base64");
  if (key.length !== 32) throw new Error("DATA_ENCRYPTION_KEY must decode to 32 bytes");
  return key;
}

function encryptText(value) {
  if (!value) return "";
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(String(value), "utf8"), cipher.final()]);
  return [iv.toString("base64"), cipher.getAuthTag().toString("base64"), ciphertext.toString("base64")].join(".");
}

function decryptText(value) {
  if (!value) return "";
  const [iv, tag, ciphertext] = String(value).split(".");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64")), decipher.final()]).toString("utf8");
}

function verifyPassword(password) {
  const [salt, expectedHex] = requiredEnv("ADMIN_PASSWORD_HASH").split(":");
  if (!salt || !expectedHex) return false;
  const actual = scryptSync(String(password || ""), salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return expected.length === actual.length && timingSafeEqual(actual, expected);
}

function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", requiredEnv("ADMIN_SESSION_SECRET")).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function verifyToken(token) {
  if (!token || !token.includes(".")) throw new Error("登录已失效，请重新登录");
  const [body, signature] = token.split(".");
  const expected = createHmac("sha256", requiredEnv("ADMIN_SESSION_SECRET")).update(body).digest("base64url");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("登录已失效，请重新登录");
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  if (payload.scope !== "admin" || payload.exp < Date.now()) throw new Error("登录已失效，请重新登录");
  return payload;
}

function cleanText(value, max) { return String(value || "").trim().slice(0, max); }
function validateApplication(input) {
  const allowedGrades = ["大一", "大二", "大三", "大四", "大五", "研究生", "其他"];
  const school = cleanText(input.school, 60);
  const wechatId = cleanText(input.wechatId, 50);
  const phone = cleanText(input.phone, 11);
  const interests = Array.isArray(input.interests) ? input.interests.map((value) => cleanText(value, 50)).filter(Boolean).slice(0, 8) : [];
  if (cleanText(input.website, 100)) throw new Error("参数不完整");
  if (school.length < 2 || wechatId.length < 3 || !allowedGrades.includes(input.grade) || !interests.length || input.privacyAccepted !== true) throw new Error("参数不完整");
  if (phone && !/^1\d{10}$/.test(phone)) throw new Error("参数不完整");
  return {
    school,
    grade: input.grade,
    wechatId,
    phone,
    interests,
    ideas: cleanText(input.ideas, 800),
    source: cleanText(input.source, 60) || "direct",
  };
}

async function resolveAssetUrls(content) {
  const fields = ["contactQrUrl", "personalContactQrUrl"];
  const cloudFields = fields.filter((field) => content[field] && String(content[field]).startsWith("cloud://"));
  if (!cloudFields.length) return content;
  try {
    const response = await app.getTempFileURL({ fileList: cloudFields.map((field) => content[field]) });
    const resolved = { ...content };
    cloudFields.forEach((field, index) => { resolved[field] = response.fileList?.[index]?.tempFileURL || ""; });
    return resolved;
  } catch {
    const resolved = { ...content };
    cloudFields.forEach((field) => { resolved[field] = ""; });
    return resolved;
  }
}

async function readContent(resolveUrls = true) {
  const response = await db.collection(COLLECTIONS.content).doc("published").get();
  const content = response.data?.[0] || response.data || DEFAULT_CONTENT;
  const normalized = { ...DEFAULT_CONTENT, ...content };
  if (!Object.prototype.hasOwnProperty.call(content, "personalContactQrUrl")) {
    normalized.contactQrUrl = DEFAULT_CONTENT.contactQrUrl;
    normalized.contactLabel = DEFAULT_CONTENT.contactLabel;
  }
  delete normalized._id;
  return resolveUrls ? resolveAssetUrls(normalized) : normalized;
}

async function enforceRateLimit() {
  const context = cloud.getCloudbaseContext();
  const fingerprint = hashValue(context.CLIENTIP || context.OPENID || context.WX_OPENID || "unknown");
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const recent = await db.collection(COLLECTIONS.rateLimits).where({ fingerprint, createdAt: _.gte(since) }).count();
  if (recent.total >= 5) throw new Error("提交过于频繁，请稍后再试");
  await db.collection(COLLECTIONS.rateLimits).add({ fingerprint, createdAt: new Date().toISOString() });
}

async function notifyWeCom(record) {
  const url = process.env.WECOM_WEBHOOK_URL;
  if (!url) return;
  const markdown = [
    "### 新的校园代理报名",
    `> 学校：${record.school}`,
    `> 年级：${record.grade}`,
    `> 方向：${interestLabels(record.interests)}`,
    `> 报名编号：${record.id}`,
  ].join("\n");
  await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ msgtype: "markdown", markdown: { content: markdown } }) });
}

function publicRecord(stored) {
  return {
    id: stored._id,
    school: stored.school,
    grade: stored.grade,
    wechatId: decryptText(stored.wechatEncrypted),
    phone: decryptText(stored.phoneEncrypted) || undefined,
    interests: stored.interests || [],
    ideas: stored.ideas || undefined,
    source: stored.source || "direct",
    status: stored.status,
    agentCode: stored.agentCode || undefined,
    adminNotes: stored.adminNotes || "",
    duplicateSuspected: Boolean(stored.duplicateSuspected),
    createdAt: stored.createdAt,
    updatedAt: stored.updatedAt,
  };
}

async function submitApplication(input) {
  await enforceRateLimit();
  const clean = validateApplication(input || {});
  const wechatHash = hashValue(clean.wechatId.toLowerCase());
  const duplicates = await db.collection(COLLECTIONS.applications).where({ wechatHash }).count();
  const now = new Date().toISOString();
  const response = await db.collection(COLLECTIONS.applications).add({
    school: clean.school,
    grade: clean.grade,
    wechatEncrypted: encryptText(clean.wechatId),
    phoneEncrypted: encryptText(clean.phone),
    wechatHash,
    interests: clean.interests,
    ideas: clean.ideas,
    source: clean.source,
    status: "pending",
    agentCode: "",
    adminNotes: "",
    duplicateSuspected: duplicates.total > 0,
    createdAt: now,
    updatedAt: now,
  });
  const record = { ...clean, id: response.id, status: "pending", adminNotes: "", duplicateSuspected: duplicates.total > 0, createdAt: now, updatedAt: now };
  try { await notifyWeCom(record); } catch (error) { console.error("WeCom notification failed", error); }
  return record;
}

async function nextAgentCode() {
  return db.runTransaction(async (transaction) => {
    const ref = transaction.collection(COLLECTIONS.counters).doc("agent-code");
    const response = await ref.get();
    const current = response.data?.[0]?.value || response.data?.value || 0;
    const next = current + 1;
    if (current) await ref.update({ value: next, updatedAt: new Date().toISOString() });
    else await ref.set({ value: next, updatedAt: new Date().toISOString() });
    return `HH-SD-${String(next).padStart(6, "0")}`;
  });
}

async function listStoredApplications() {
  const response = await db.collection(COLLECTIONS.applications).orderBy("createdAt", "desc").limit(1000).get();
  return response.data || [];
}

function filterApplications(records, filters = {}) {
  const query = cleanText(filters.query, 80).toLowerCase();
  return records.filter((record) => {
    const item = publicRecord(record);
    if (query && !`${item.school} ${item.wechatId} ${item.phone || ""} ${item.agentCode || ""}`.toLowerCase().includes(query)) return false;
    if (filters.school && item.school !== filters.school) return false;
    if (filters.grade && item.grade !== filters.grade) return false;
    if (filters.status && item.status !== filters.status) return false;
    if (filters.interest && !item.interests.includes(filters.interest)) return false;
    if (filters.source && item.source !== filters.source) return false;
    if (filters.startDate && item.createdAt.slice(0, 10) < filters.startDate) return false;
    if (filters.endDate && item.createdAt.slice(0, 10) > filters.endDate) return false;
    return true;
  }).map(publicRecord);
}

async function dashboard() {
  const records = (await listStoredApplications()).map(publicRecord);
  const eventResponse = await db.collection(COLLECTIONS.events).orderBy("createdAt", "desc").limit(5000).get();
  const events = eventResponse.data || [];
  const eventCount = (name) => events.filter((event) => event.name === name).length;
  const pageViews = eventCount("page_view");
  const applicationSubmits = eventCount("application_submit");
  const countBy = (values) => Object.entries(values.reduce((acc, value) => { acc[value || "未知"] = (acc[value || "未知"] || 0) + 1; return acc; }, {})).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
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

async function route(event) {
  const action = event.action;
  const payload = event.payload || {};

  if (action === "getContent") return readContent(true);
  if (action === "submitApplication") return submitApplication(payload.input);
  if (action === "trackEvent") {
    const item = payload.event || {};
    const allowed = ["page_view", "consult_click", "application_start", "application_submit"];
    if (!allowed.includes(item.name)) throw new Error("参数不完整");
    await db.collection(COLLECTIONS.events).add({
      name: item.name,
      path: cleanText(item.path, 120),
      source: cleanText(item.source, 60) || "direct",
      sessionHash: hashValue(cleanText(item.sessionId, 80)),
      createdAt: new Date().toISOString(),
    });
    return null;
  }
  if (action === "adminLogin") {
    if (!verifyPassword(payload.password)) throw new Error("管理员密码不正确");
    return signToken({ scope: "admin", exp: Date.now() + 8 * 60 * 60 * 1000, nonce: randomBytes(12).toString("hex") });
  }

  verifyToken(event.token);
  if (action === "verifyAdmin") return null;
  if (action === "getDashboard") return dashboard();
  if (action === "listApplications") return filterApplications(await listStoredApplications(), payload.filters);
  if (action === "updateApplication") {
    const id = cleanText(payload.id, 80);
    const response = await db.collection(COLLECTIONS.applications).doc(id).get();
    const stored = response.data?.[0] || response.data;
    if (!stored?._id) throw new Error("报名记录不存在");
    const changes = payload.changes || {};
    const update = { updatedAt: new Date().toISOString() };
    if (["pending", "approved", "not_suitable"].includes(changes.status)) update.status = changes.status;
    if (typeof changes.adminNotes === "string") update.adminNotes = cleanText(changes.adminNotes, 1000);
    if (update.status === "approved" && !stored.agentCode) update.agentCode = await nextAgentCode();
    await db.collection(COLLECTIONS.applications).doc(id).update(update);
    return publicRecord({ ...stored, ...update });
  }
  if (action === "deleteApplication") {
    const id = cleanText(payload.id, 80);
    if (!id) throw new Error("参数不完整");
    await db.collection(COLLECTIONS.applications).doc(id).remove();
    return null;
  }
  if (action === "getAdminContent") return readContent(false);
  if (action === "saveContent") {
    const content = payload.content;
    if (!content || !Array.isArray(content.services) || !Array.isArray(content.rules) || !Array.isArray(content.faqs)) throw new Error("参数不完整");
    const saved = { ...DEFAULT_CONTENT, ...content, _id: "published", updatedAt: new Date().toISOString() };
    await db.collection(COLLECTIONS.content).doc("published").set(saved);
    delete saved._id;
    return saved;
  }
  throw new Error("参数不完整");
}

exports.main = async (event) => {
  try { return result(await route(event || {})); }
  catch (error) { return failure(error); }
};
