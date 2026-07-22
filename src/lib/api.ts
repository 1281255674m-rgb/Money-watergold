import { localStore } from "./localStore";
import type {
  AnalyticsEventInput,
  ApplicationFilters,
  ApplicationInput,
  ApplicationRecord,
  ApplicationStatus,
  DashboardStats,
  SiteContent,
} from "../types";

const envId = import.meta.env.VITE_CLOUDBASE_ENV_ID?.trim();
const functionName = import.meta.env.VITE_CLOUDBASE_FUNCTION_NAME || "haohang-api";

interface CloudApp {
  callFunction(options: { name: string; data: Record<string, unknown> }): Promise<{ result: unknown }>;
  uploadFile(options: { cloudPath: string; filePath: string }): Promise<{ fileID: string }>;
}

const cloudAppPromise: Promise<CloudApp> | null = envId
  ? import("@cloudbase/js-sdk").then((module) => module.default.init({ env: envId }) as unknown as CloudApp)
  : null;

async function callCloud<T>(action: string, payload: Record<string, unknown> = {}, token?: string): Promise<T> {
  if (!cloudAppPromise) throw new Error("CloudBase 尚未配置");
  const cloudApp = await cloudAppPromise;
  const response = await cloudApp.callFunction({
    name: functionName,
    data: { action, payload, token },
  });
  const result = response.result as { ok: boolean; data?: T; error?: string };
  if (!result?.ok) throw new Error(result?.error || "请求失败，请稍后重试");
  return result.data as T;
}

export const api = {
  isCloud: Boolean(cloudAppPromise),

  async getContent(): Promise<SiteContent> {
    return cloudAppPromise ? callCloud<SiteContent>("getContent") : localStore.getContent();
  },

  async submitApplication(input: ApplicationInput): Promise<ApplicationRecord> {
    return cloudAppPromise ? callCloud<ApplicationRecord>("submitApplication", { input }) : localStore.submitApplication(input);
  },

  async trackEvent(event: AnalyticsEventInput): Promise<void> {
    if (cloudAppPromise) await callCloud<void>("trackEvent", { event });
    else localStore.trackEvent(event);
  },

  async adminLogin(password: string): Promise<string> {
    return cloudAppPromise ? callCloud<string>("adminLogin", { password }) : localStore.login(password);
  },

  async getDashboard(token: string): Promise<DashboardStats> {
    return cloudAppPromise ? callCloud<DashboardStats>("getDashboard", {}, token) : localStore.dashboard(token);
  },

  async listApplications(token: string, filters: ApplicationFilters): Promise<ApplicationRecord[]> {
    return cloudAppPromise
      ? callCloud<ApplicationRecord[]>("listApplications", { filters }, token)
      : localStore.listApplications(token, filters);
  },

  async updateApplication(
    token: string,
    id: string,
    changes: { status?: ApplicationStatus; adminNotes?: string },
  ): Promise<ApplicationRecord> {
    return cloudAppPromise
      ? callCloud<ApplicationRecord>("updateApplication", { id, changes }, token)
      : localStore.updateApplication(token, id, changes);
  },

  async deleteApplication(token: string, id: string): Promise<void> {
    if (cloudAppPromise) await callCloud<void>("deleteApplication", { id }, token);
    else localStore.deleteApplication(token, id);
  },

  async getAdminContent(token: string): Promise<SiteContent> {
    return cloudAppPromise ? callCloud<SiteContent>("getAdminContent", {}, token) : localStore.getContent();
  },

  async saveContent(token: string, content: SiteContent): Promise<SiteContent> {
    return cloudAppPromise
      ? callCloud<SiteContent>("saveContent", { content }, token)
      : localStore.saveContent(content);
  },

  async uploadAsset(token: string, file: File, kind: "qr" | "image"): Promise<string> {
    if (!cloudAppPromise) {
      localStore.verifyToken(token);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("图片读取失败"));
        reader.readAsDataURL(file);
      });
    }
    const cloudApp = await cloudAppPromise;
    await callCloud<void>("verifyAdmin", {}, token);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const cloudPath = `site-assets/${kind}/${Date.now()}-${safeName}`;
    // The browser SDK accepts File objects although its shared declaration uses a string path.
    const result = await cloudApp.uploadFile({ cloudPath, filePath: file as unknown as string });
    return result.fileID;
  },
};
