import { describe, expect, it } from "vitest";
import { localStore } from "./localStore";
import type { ApplicationInput } from "../types";

const input: ApplicationInput = {
  school: "山东大学",
  grade: "大二",
  wechatId: "student_001",
  phone: "",
  interests: ["graduation-recycle"],
  ideas: "希望在毕业季组织回收。",
  privacyAccepted: true,
  source: "wechat-group",
  website: "",
};

describe("localStore", () => {
  it("stores applications without collecting a name", () => {
    const record = localStore.submitApplication(input);
    expect(record.school).toBe("山东大学");
    expect(record.status).toBe("pending");
    expect(record).not.toHaveProperty("name");
  });

  it("marks repeated WeChat IDs without overwriting the first record", () => {
    const first = localStore.submitApplication(input);
    const second = localStore.submitApplication({ ...input, school: "济南大学" });
    expect(first.duplicateSuspected).toBe(false);
    expect(second.duplicateSuspected).toBe(true);
    expect(localStore.listApplications("haohang-local-admin", {})).toHaveLength(2);
  });

  it("generates a unique agent code when an application is approved", () => {
    const first = localStore.submitApplication(input);
    const second = localStore.submitApplication({ ...input, wechatId: "student_002" });
    const approvedFirst = localStore.updateApplication("haohang-local-admin", first.id, { status: "approved" });
    const approvedSecond = localStore.updateApplication("haohang-local-admin", second.id, { status: "approved" });
    expect(approvedFirst.agentCode).toBe("HH-SD-000001");
    expect(approvedSecond.agentCode).toBe("HH-SD-000002");
  });

  it("deletes exactly one selected application", () => {
    const first = localStore.submitApplication(input);
    localStore.submitApplication({ ...input, wechatId: "student_003" });
    localStore.deleteApplication("haohang-local-admin", first.id);
    expect(localStore.listApplications("haohang-local-admin", {})).toHaveLength(1);
  });
});
