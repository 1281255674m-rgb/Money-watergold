import { afterEach, describe, expect, it, vi } from "vitest";
import type { ApplicationInput, ApplicationRecord } from "../types";

const input: ApplicationInput = {
  school: "山东大学",
  grade: "大一",
  wechatId: "student-test",
  phone: "",
  interests: ["campus-co-create"],
  ideas: "",
  privacyAccepted: true,
  source: "test",
  website: "",
};

const record: ApplicationRecord = {
  id: "application-id",
  school: input.school,
  grade: input.grade,
  wechatId: input.wechatId,
  interests: input.interests,
  source: input.source,
  status: "pending",
  adminNotes: "",
  duplicateSuspected: false,
  createdAt: "2026-07-22T00:00:00.000Z",
  updatedAt: "2026-07-22T00:00:00.000Z",
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("Cloudflare API client", () => {
  it("submits applications to the same-origin API", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "/api");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ ok: true, data: record }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }));
    const { api } = await import("./api");

    await expect(api.submitApplication(input)).resolves.toEqual(record);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe("/api");
    const options = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(options.body))).toEqual({ action: "submitApplication", payload: { input } });
  });

  it("shows a clear message when Pages Functions are missing", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "/api");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("Not found", {
      status: 404,
      headers: { "content-type": "text/plain" },
    }));
    const { api } = await import("./api");

    await expect(api.submitApplication(input)).rejects.toThrow("网站接口尚未部署，请联系网站负责人");
  });
});
