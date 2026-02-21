import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { InseeSourceBadge } from "../insee-source-badge";

describe("InseeSourceBadge", () => {
  it('renders "Auto" badge with blue styling for auto source', () => {
    renderWithProviders(<InseeSourceBadge source="auto" />);

    const badge = screen.getByText("Auto");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("bg-blue-100");
    expect(badge.className).toContain("text-blue-800");
  });

  it('renders "Manuel" badge with gray styling for manual source', () => {
    renderWithProviders(<InseeSourceBadge source="manual" />);

    const badge = screen.getByText("Manuel");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("bg-gray-100");
    expect(badge.className).toContain("text-gray-800");
  });

  it('renders "Manuel" badge as default for manual source', () => {
    renderWithProviders(<InseeSourceBadge source="manual" />);

    const badge = screen.getByText("Manuel");
    expect(badge.className).toContain("bg-gray-100");
  });
});
