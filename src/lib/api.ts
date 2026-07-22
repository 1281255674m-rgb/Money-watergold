import { localStore } from "./localStore";
import type {
  AnalyticsEventInput,
  ApiResponse,
  ApplicationFilters,
  ApplicationInput,
  ApplicationRecord,
  ApplicationStatus,
  DashboardStats,
  SiteContent,
} from "../types";

const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.trim();
const localDemoEnabled = import.meta.env.DEV && !configuredApiBase;
const apiBase = (configuredApiBase || "/api").replace(/\/$/, "");

function requestErrorMessage(status: number): string {
  if (status === 404) return "网站接口尚未部署，请联系网站负责人";
  if (status >= 500) return "服务暂时不可用，请稍后重试";
  return "请求失败，请稍后重试";
}

async function parseResponse<T>(response: Response): Promise<T> {
  let result: ApiResponse<T> | null = null;
  try {
    result = await response.json() as ApiResponse<T>;
  } catch {
    // A missing Pages Function often returns an HTML error page.
  }
  if (!response.ok || !result?.ok) {
    throw new Error(result?.error || requestErrorMessage(response.status));
  }
  return result.data as T;
}

async function callApi<T>(action: string, payload: Record<string, unknown> = {}, token?: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(apiBase, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, payload, token }),
    });
  } catch {
    throw new Error("网络连接失败，请检查网络后重试");
  }
  return parseResponse<T>(response);
}

export const api = {
  isCloud: !localDemoEnabled,
  isLocalDemo: localDemoEnabled,
  isSubmissionAvailable: true,

  async getContent(): Promise<SiteContent> {
    if (localDemoEnabled) return localStore.getContent();
    return callApi<SiteContent>("getContent");
  },

  async submitApplication(input: ApplicationInput): Promise<ApplicationRecord> {
    if (localDemoEnabled) return localStore.submitApplication(input);
    return callApi<ApplicationRecord>("submitApplication", { input });
  },

  async trackEvent(event: AnalyticsEventInput): Promise<void> {
    if (localDemoEnabled) {
      localStore.trackEvent(event);
      return;
    }
    await callApi<null>("trackEvent", { event });
  },

  async adminLogin(password: string): Promise<string> {
    if (localDemoEnabled) return localStore.login(password);
    return callApi<string>("adminLogin", { password });
  },

  async getDashboard(token: string): Promise<DashboardStats> {
    if (localDemoEnabled) return localStore.dashboard(token);
    return callApi<DashboardStats>("getDashboard", {}, token);
  },

  async listApplications(token: string, filters: ApplicationFilters): Promise<ApplicationRecord[]> {
    if (localDemoEnabled) return localStore.listApplications(token, filters);
    return callApi<ApplicationRecord[]>("listApplications", { filters }, token);
  },

  async updateApplication(
    token: string,
    id: string,
    changes: { status?: ApplicationStatus; adminNotes?: string },
  ): Promise<ApplicationRecord> {
    if (localDemoEnabled) return localStore.updateApplication(token, id, changes);
    return callApi<ApplicationRecord>("updateApplication", { id, changes }, token);
  },

  async deleteApplication(token: string, id: string): Promise<void> {
    if (localDemoEnabled) {
      localStore.deleteApplication(token, id);
      return;
    }
    await callApi<null>("deleteApplication", { id }, token);
  },

  async getAdminContent(token: string): Promise<SiteContent> {
    if (localDemoEnabled) return localStore.getContent();
    return callApi<SiteContent>("getAdminContent", {}, token);
  },

  async saveContent(token: string, content: SiteContent): Promise<SiteContent> {
    if (localDemoEnabled) return localStore.saveContent(content);
    return callApi<SiteContent>("saveContent", { content }, token);
  },

  async uploadAsset(token: string, file: File, kind: "qr" | "image"): Promise<string> {
    if (localDemoEnabled) {
      localStore.verifyToken(token);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("图片读取失败"));
        reader.readAsDataURL(file);
      });
    }

    const query = new URLSearchParams({ kind, name: file.name });
    let response: Response;
    try {
      response = await fetch(`${apiBase}/assets?${query.toString()}`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": file.type,
        },
        body: file,
      });
    } catch {
      throw new Error("网络连接失败，请检查网络后重试");
    }
    return parseResponse<string>(response);
  },
};
