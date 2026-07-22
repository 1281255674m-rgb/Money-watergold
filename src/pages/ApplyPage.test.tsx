import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ApplyPage } from "./ApplyPage";

const apiMocks = vi.hoisted(() => ({
  submitApplication: vi.fn(),
  trackEvent: vi.fn(),
}));

vi.mock("../lib/api", () => ({
  api: {
    isSubmissionAvailable: true,
    submitApplication: apiMocks.submitApplication,
    trackEvent: apiMocks.trackEvent,
  },
}));

vi.mock("../lib/analytics", () => ({
  getSessionId: () => "test-session",
  getSource: () => "test",
}));

vi.mock("../context/SiteContentContext", () => ({
  useSiteContent: () => ({
    content: {
      services: [{ id: "graduation-recycle", shortTitle: "毕业季回收" }],
      contactQrUrl: "",
      contactLabel: "企业微信",
      personalContactQrUrl: "",
      personalContactLabel: "私人微信",
    },
  }),
}));

describe("ApplyPage", () => {
  it("shows success when the application is saved even if analytics fails", async () => {
    Object.defineProperty(window, "scrollTo", { configurable: true, value: vi.fn() });
    apiMocks.submitApplication.mockResolvedValueOnce({ id: "application-1" });
    apiMocks.trackEvent.mockRejectedValue(new Error("analytics unavailable"));
    const user = userEvent.setup();

    render(<MemoryRouter><ApplyPage /></MemoryRouter>);
    await user.type(screen.getByLabelText(/学校名称/), "山东大学");
    await user.type(screen.getByLabelText(/微信号/), "student_001");
    await user.click(screen.getByRole("checkbox", { name: "毕业季回收" }));
    await user.click(screen.getByRole("checkbox", { name: /我已阅读并同意/ }));
    await user.click(screen.getByRole("button", { name: "提交报名" }));

    expect(await screen.findByRole("heading", { name: "我们已经收到你的信息" })).toBeInTheDocument();
    expect(apiMocks.submitApplication).toHaveBeenCalledOnce();
  });
});
