import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { UnitMosaic } from "../unit-mosaic";

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

const mockUnits = [
  {
    id: "u1",
    propertyId: "p1",
    propertyName: "Résidence A",
    userId: "user_1",
    identifier: "Apt 1",
    type: "apartment",
    floor: 1,
    surfaceArea: 45,
    billableOptions: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
];

vi.mock("@/hooks/use-units", () => ({
  useEntityUnits: () => ({
    data: mockUnits,
    isLoading: false,
    isError: false,
  }),
}));

vi.mock("@/hooks/use-leases", () => ({
  useLeases: () => ({ data: [] }),
}));

vi.mock("@/hooks/use-rent-calls", () => ({
  useRentCalls: () => ({ data: [] }),
}));

vi.mock("@/hooks/use-unpaid-rent-calls", () => ({
  useUnpaidRentCalls: () => ({ data: [] }),
}));

describe("UnitMosaicLegend", () => {
  it("should render legend with 5 status items", () => {
    renderWithProviders(<UnitMosaic entityId="entity-1" />);

    const legend = screen.getByRole("list", { name: "Légende des statuts" });
    expect(legend).toBeInTheDocument();

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(5);
  });

  it("should display all 5 status labels", () => {
    renderWithProviders(<UnitMosaic entityId="entity-1" />);

    expect(screen.getByText("Payé")).toBeInTheDocument();
    expect(screen.getByText("Partiellement payé")).toBeInTheDocument();
    expect(screen.getByText("Envoyé")).toBeInTheDocument();
    expect(screen.getByText("Impayé")).toBeInTheDocument();
    expect(screen.getByText("Vacant")).toBeInTheDocument();
  });

  it("should have color indicators for each status", () => {
    renderWithProviders(<UnitMosaic entityId="entity-1" />);

    const items = screen.getAllByRole("listitem");
    // Each list item should contain a color indicator span
    for (const item of items) {
      const colorSpan = item.querySelector("span[aria-hidden='true']");
      expect(colorSpan).toBeTruthy();
    }
  });
});
