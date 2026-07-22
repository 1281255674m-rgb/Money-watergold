import { defaultContent } from "../data/defaultContent";
import type {
  AnalyticsEventInput,
  ApplicationFilters,
  ApplicationInput,
  ApplicationRecord,
  ApplicationStatus,
  DashboardStats,
  SiteContent,
} from "../types";

const CONTENT_KEY = "haohang-site-content-v1";
const APPLICATIONS_KEY = "haohang-applications-v1";
const EVENTS_KEY = "haohang-events-v1";
const DEMO_TOKEN = "haohang-local-admin";

type StoredEvent = AnalyticsEventInput & { id: string; createdAt: string };

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function applications(): ApplicationRecord[] {
  return readJson<ApplicationRecord[]>(APPLICATIONS_KEY, []);
}

export const localStore = {
  getContent(): SiteContent {
    const stored = readJson<Partial<SiteContent> | null>(CONTENT_KEY, null);
    if (!stored) return defaultContent;

    const migrated = { ...defaultContent, ...stored };
    if (!("personalContactQrUrl" in stored)) {
      migrated.contactQrUrl = defaultContent.contactQrUrl;
      migrated.contactLabel = defaultContent.contactLabel;
      migrated.personalContactQrUrl = defaultContent.personalContactQrUrl;
      migrated.personalContactLabel = defaultContent.personalContactLabel;
      writeJson(CONTENT_KEY, migrated);
    }
    return migrated;
  },

  saveContent(content: SiteContent): SiteContent {
    const saved = { ...content, updatedAt: new Date().toISOString() };
    writeJson(CONTENT_KEY, saved);
    return saved;
  },

  submitApplication(input: ApplicationInput): ApplicationRecord {
    const records = applications();
    const normalizedWechat = input.wechatId.trim().toLowerCase();
    const duplicateSuspected = records.some((record) => record.wechatId.trim().toLowerCase() === normalizedWechat);
    const now = new Date().toISOString();
    const record: ApplicationRecord = {
      id: crypto.randomUUID(),
      school: input.school.trim(),
      grade: input.grade,
      wechatId: input.wechatId.trim(),
      phone: input.phone?.trim() || undefined,
      interests: input.interests,
      ideas: input.ideas?.trim() || undefined,
      source: input.source || "direct",
      status: "pending",
      adminNotes: "",
      duplicateSuspected,
      createdAt: now,
      updatedAt: now,
    };
    records.unshift(record);
    writeJson(APPLICATIONS_KEY, records);
    return record;
  },

  login(password: string): string {
    const expected = import.meta.env.VITE_DEMO_ADMIN_PASSWORD || "demo1234";
    if (password !== expected) throw new Error("密码不正确");
    return DEMO_TOKEN;
  },

  verifyToken(token: string): void {
    if (token !== DEMO_TOKEN) throw new Error("登录已失效，请重新登录");
  },

  listApplications(token: string, filters: ApplicationFilters): ApplicationRecord[] {
    this.verifyToken(token);
    const query = filters.query?.trim().toLowerCase();
    return applications().filter((record) => {
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
  },

  updateApplication(token: string, id: string, changes: { status?: ApplicationStatus; adminNotes?: string }): ApplicationRecord {
    this.verifyToken(token);
    const records = applications();
    const index = records.findIndex((record) => record.id === id);
    if (index < 0) throw new Error("报名记录不存在");
    const current = records[index];
    const agentCode = changes.status === "approved" && !current.agentCode
      ? `HH-SD-${String(records.filter((record) => record.agentCode).length + 1).padStart(6, "0")}`
      : current.agentCode;
    records[index] = {
      ...current,
      ...changes,
      agentCode,
      updatedAt: new Date().toISOString(),
    };
    writeJson(APPLICATIONS_KEY, records);
    return records[index];
  },

  deleteApplication(token: string, id: string): void {
    this.verifyToken(token);
    writeJson(APPLICATIONS_KEY, applications().filter((record) => record.id !== id));
  },

  trackEvent(event: AnalyticsEventInput): void {
    const events = readJson<StoredEvent[]>(EVENTS_KEY, []);
    events.push({ ...event, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
    writeJson(EVENTS_KEY, events.slice(-5000));
  },

  dashboard(token: string): DashboardStats {
    this.verifyToken(token);
    const records = applications();
    const events = readJson<StoredEvent[]>(EVENTS_KEY, []);
    const eventCount = (name: AnalyticsEventInput["name"]) => events.filter((event) => event.name === name).length;
    const pageViews = eventCount("page_view");
    const applicationSubmits = eventCount("application_submit");
    const countBy = (items: string[]) => Object.entries(items.reduce<Record<string, number>>((acc, item) => {
      acc[item || "未知"] = (acc[item || "未知"] || 0) + 1;
      return acc;
    }, {})).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

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
  },
};
