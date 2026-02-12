import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { Sidebar } from "../sidebar";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/rent-calls",
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/contexts/entity-context", () => ({
  useEntityContext: () => ({
    currentEntityId: "entity-1",
    setCurrentEntityId: vi.fn(),
    currentEntity: {
      id: "entity-1",
      name: "SCI Alpha",
      type: "sci",
    },
    entities: [
      {
        id: "entity-1",
        name: "SCI Alpha",
        type: "sci",
      },
    ],
    isLoading: false,
  }),
}));

describe("Sidebar — rent calls link", () => {
  it("should display 'Appels de loyer' navigation link", () => {
    renderWithProviders(
      <Sidebar mobileOpen={false} onMobileClose={vi.fn()} />,
    );

    const links = screen.getAllByText("Appels de loyer");
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  it("should highlight rent-calls link when on /rent-calls", () => {
    renderWithProviders(
      <Sidebar mobileOpen={false} onMobileClose={vi.fn()} />,
    );

    const links = screen.getAllByText("Appels de loyer");
    const link = links[0].closest("a");
    expect(link).toHaveAttribute("aria-current", "page");
  });

  it("should have correct href for rent-calls link", () => {
    renderWithProviders(
      <Sidebar mobileOpen={false} onMobileClose={vi.fn()} />,
    );

    const links = screen.getAllByRole("link", {
      name: /Appels de loyer/i,
    });
    expect(links[0]).toHaveAttribute("href", "/rent-calls");
  });
});
