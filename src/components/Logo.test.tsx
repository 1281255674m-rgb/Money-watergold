import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { Logo } from "./Logo";

describe("Logo", () => {
  it("renders editable brand copy", () => {
    render(
      <MemoryRouter>
        <Logo brandName="校园新品牌" brandTagline="CAMPUS PARTNERS" />
      </MemoryRouter>,
    );

    expect(screen.getByText("校园新品牌")).toBeInTheDocument();
    expect(screen.getByText("CAMPUS PARTNERS")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "返回校园新品牌首页" })).toBeInTheDocument();
  });

  it("keeps compact logos icon-only", () => {
    render(
      <MemoryRouter>
        <Logo compact brandName="校园新品牌" />
      </MemoryRouter>,
    );

    expect(screen.queryByText("校园新品牌")).not.toBeInTheDocument();
  });
});
