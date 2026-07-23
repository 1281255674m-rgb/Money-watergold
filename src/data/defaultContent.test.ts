import { describe, expect, it } from "vitest";
import { defaultContent, mergeSiteContent } from "./defaultContent";

describe("default public content", () => {
  it("uses the approved brand language", () => {
    expect(defaultContent.brandName).toBe("颢行科技");
    expect(defaultContent.brandTagline).toBe("HAOXING TECHNOLOGY");
    expect(defaultContent.slogan).toBe("同心共筑梦想，共创校园价值");
  });

  it("migrates the previous brand stored in published content", () => {
    const migrated = mergeSiteContent({
      brandName: "浩航科技",
      brandTagline: "HAOHANG TECHNOLOGY",
      companyName: "济南浩航网络科技公司",
      recruitmentDescription: "把需求介绍给浩航科技。",
    });

    expect(migrated.brandName).toBe("颢行科技");
    expect(migrated.brandTagline).toBe("HAOXING TECHNOLOGY");
    expect(migrated.companyName).toBe("济南颢行网络科技公司");
    expect(migrated.recruitmentDescription).toBe("把需求介绍给颢行科技。");
  });

  it("does not publish unconfirmed commission details", () => {
    const publicCopy = JSON.stringify(defaultContent);
    expect(publicCopy).not.toContain("20%");
    expect(publicCopy).not.toContain("7天");
  });

  it("states the academic integrity boundary", () => {
    const publicCopy = JSON.stringify(defaultContent);
    expect(publicCopy).toContain("不提供代写、替考或虚假学术材料");
  });
});
