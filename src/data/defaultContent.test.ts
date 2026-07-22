import { describe, expect, it } from "vitest";
import { defaultContent } from "./defaultContent";

describe("default public content", () => {
  it("uses the approved brand language", () => {
    expect(defaultContent.brandName).toBe("浩航科技");
    expect(defaultContent.slogan).toBe("同心共筑梦想，共创校园价值");
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
