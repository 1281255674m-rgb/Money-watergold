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
const localDemoEnabled = !envId && import.meta.env.DEV;
const backendUnavailableMessage = "线上报名尚未连接云端数据库，请联系网站负责人";

interface CloudAuth {
  hasLoginState(): unknown | null;
  signInAnonymously(): Promise<{ error?: { message?: string } | null }>;
}

interface CloudApp {
  auth(options?: { persistence: "local" }): CloudAuth;
  callFunction(options: { name: string; data: Record<string, unknown> }): Promise<{ result: unknown }>;
  uploadFile(options: { cloudPath: string; filePath: string }): Promise<{ fileID: string }>;
}

const cloudAppPromise: Promise<CloudApp> | null = envId
  ? import("@cloudbase/js-sdk").then(async (module) => {
    const app = module.default.init({ env: envId }) as unknown as CloudApp;
    const auth = app.auth({ persistence: "local" });
    if (!auth.hasLoginState()) {
      const response = await auth.signInAnonymously();
      if (response.error) throw new Error(response.error.message || "云端匿名登录失败");
    }
    return app;
  })
  : null;

function unavailable(): never {
  throw new Error(backendUnavailableMessage);
}

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
  isLocalDemo: localDemoEnabled,
  isSubmissionAvailable: Boolean(cloudAppPromise) || localDemoEnabled,

  async getContent(): Promise<SiteContent> {
    if (cloudAppPromise) return callCloud<SiteContent>("getContent");
    if (localDemoEnabled) return localStore.getContent();
    return unavailable();
  },

  async submitApplication(input: ApplicationInput): Promise<ApplicationRecord> {
    if (cloudAppPromise) return callCloud<ApplicationRecord>("submitApplication", { input });
    if (localDemoEnabled) return localStore.submitApplication(input);
    return unavailable();
  },

  async trackEvent(event: AnalyticsEventInput): Promise<void> {
    if (cloudAppPromise) await callCloud<void>("trackEvent", { event });
    else if (localDemoEnabled) localStore.trackEvent(event);
  },

  async adminLogin(password: string): Promise<string> {
    if (cloudAppPromise) return callCloud<string>("adminLogin", { password });
    if (localDemoEnabled) return localStore.login(password);
    return unavailable();
  },

  async getDashboard(token: string): Promise<DashboardStats> {
    if (cloudAppPromise) return callCloud<DashboardStats>("getDashboard", {}, token);
    if (localDemoEnabled) return localStore.dashboard(token);
    return unavailable();
  },

  async listApplications(token: string, filters: ApplicationFilters): Promise<ApplicationRecord[]> {
    if (cloudAppPromise) return callCloud<ApplicationRecord[]>("listApplications", { filters }, token);
    if (localDemoEnabled) return localStore.listApplications(token, filters);
    return unavailable();
  },

  async updateApplication(
    token: string,
    id: string,
    changes: { status?: ApplicationStatus; adminNotes?: string },
  ): Promise<ApplicationRecord> {
    if (cloudAppPromise) return callCloud<ApplicationRecord>("updateApplication", { id, changes }, token);
    if (localDemoEnabled) return localStore.updateApplication(token, id, changes);
    return unavailable();
  },

  async deleteApplication(token: string, id: string): Promise<void> {
    if (cloudAppPromise) await callCloud<void>("deleteApplication", { id }, token);
    else if (localDemoEnabled) localStore.deleteApplication(token, id);
    else unavailable();
  },

  async getAdminContent(token: string): Promise<SiteContent> {
    if (cloudAppPromise) return callCloud<SiteContent>("getAdminContent", {}, token);
    if (localDemoEnabled) return localStore.getContent();
    return unavailable();
  },

  async saveContent(token: string, content: SiteContent): Promise<SiteContent> {
    if (cloudAppPromise) return callCloud<SiteContent>("saveContent", { content }, token);
    if (localDemoEnabled) return localStore.saveContent(content);
    return unavailable();
  },

  async uploadAsset(token: string, file: File, kind: "qr" | "image"): Promise<string> {
    if (!cloudAppPromise) {
      if (!localDemoEnabled) return unavailable();
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
