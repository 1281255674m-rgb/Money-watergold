import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WelcomeInvitationDialog } from "./WelcomeInvitationDialog";

const props = {
  enabled: true,
  brandName: "颢行科技",
  title: "一起把事情做成",
  body: "第一段。\n\n第二段。",
  onChat: vi.fn(),
  onExplore: vi.fn(),
};

describe("WelcomeInvitationDialog", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    props.onChat.mockClear();
    props.onExplore.mockClear();
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
      configurable: true,
      value() { this.setAttribute("open", ""); },
    });
    Object.defineProperty(HTMLDialogElement.prototype, "close", {
      configurable: true,
      value() { this.removeAttribute("open"); },
    });
  });

  afterEach(() => vi.useRealTimers());

  it("shows after a short delay every time the home page opens", () => {
    const first = render(<WelcomeInvitationDialog {...props} />);
    const dialog = first.container.querySelector("dialog");
    expect(dialog).not.toHaveAttribute("open");

    act(() => vi.advanceTimersByTime(900));
    expect(dialog).toHaveAttribute("open");
    fireEvent.click(screen.getByRole("button", { name: "关闭邀请" }));
    first.unmount();

    const second = render(<WelcomeInvitationDialog {...props} />);
    act(() => vi.advanceTimersByTime(900));
    expect(second.container.querySelector("dialog")).toHaveAttribute("open");
  });

  it("opens the contact flow from the primary action", () => {
    render(<WelcomeInvitationDialog {...props} />);
    act(() => vi.advanceTimersByTime(900));
    fireEvent.click(screen.getByRole("button", { name: "我想先聊聊" }));
    expect(props.onChat).toHaveBeenCalledOnce();
  });
});
