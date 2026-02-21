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
  usePathname: () => "/dashboard",
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

describe("Sidebar", () => {
  it("should render brand name Baillr", () => {
    renderWithProviders(
      <Sidebar mobileOpen={false} onMobileClose={vi.fn()} />,
    );
    // There are multiple instances (desktop, tablet, mobile)
    const brands = screen.getAllByText("Baillr");
    expect(brands.length).toBeGreaterThan(0);
  });

  it("should render collapsed brand B", () => {
    renderWithProviders(
      <Sidebar mobileOpen={false} onMobileClose={vi.fn()} />,
    );
    // Tablet collapsed shows "B"
    const collapsedBrands = screen.getAllByText("B");
    expect(collapsedBrands.length).toBeGreaterThan(0);
  });

  it("should render all navigation items", () => {
    renderWithProviders(
      <Sidebar mobileOpen={false} onMobileClose={vi.fn()} />,
    );
    // Navigation items appear in multiple sidebar variants (desktop, tablet, mobile)
    expect(screen.getAllByText("Tableau de bord").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Entités").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Biens").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Locataires").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Baux").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Comptabilité").length).toBeGreaterThan(0);
  });

  it("should mark current page as active (aria-current)", () => {
    renderWithProviders(
      <Sidebar mobileOpen={false} onMobileClose={vi.fn()} />,
    );
    // Dashboard is active (pathname = /dashboard)
    const dashboardLinks = screen.getAllByRole("link", {
      name: /Tableau de bord/i,
    });
    const activeLinks = dashboardLinks.filter(
      (link) => link.getAttribute("aria-current") === "page",
    );
    expect(activeLinks.length).toBeGreaterThan(0);
  });

  it("should render sidebar with accessible label", () => {
    renderWithProviders(
      <Sidebar mobileOpen={false} onMobileClose={vi.fn()} />,
    );
    // Multiple aside elements for desktop/tablet
    const sidebars = screen.getAllByRole("complementary", {
      name: /Barre latérale/i,
    });
    expect(sidebars.length).toBeGreaterThanOrEqual(2);
  });

  it("should render navigation with aria-label", () => {
    renderWithProviders(
      <Sidebar mobileOpen={false} onMobileClose={vi.fn()} />,
    );
    const navs = screen.getAllByRole("navigation", {
      name: /Navigation principale/i,
    });
    expect(navs.length).toBeGreaterThan(0);
  });

  it("should render dashboard link with correct href", () => {
    renderWithProviders(
      <Sidebar mobileOpen={false} onMobileClose={vi.fn()} />,
    );
    const dashboardLinks = screen.getAllByRole("link", {
      name: /Tableau de bord/i,
    });
    expect(dashboardLinks[0]).toHaveAttribute("href", "/dashboard");
  });
});
