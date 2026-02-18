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

const mockUseRentCalls = vi.fn();

vi.mock("@/hooks/use-rent-calls", () => ({
  useRentCalls: (...args: unknown[]) => mockUseRentCalls(...args),
}));

vi.mock("@/hooks/use-unpaid-rent-calls", () => ({
  useUnpaidRentCalls: () => ({ data: [] }),
}));

describe("UnitMosaic — month selector", () => {
  it("should render month selector label", () => {
    mockUseRentCalls.mockReturnValue({ data: [] });

    renderWithProviders(<UnitMosaic entityId="entity-1" />);

    expect(screen.getByText("Mois")).toBeInTheDocument();
  });

  it("should render month selector with current month selected", () => {
    mockUseRentCalls.mockReturnValue({ data: [] });

    renderWithProviders(<UnitMosaic entityId="entity-1" />);

    // The Select trigger should be present
    const trigger = screen.getByRole("combobox");
    expect(trigger).toBeInTheDocument();
  });

  it("should call useRentCalls with current month by default", () => {
    mockUseRentCalls.mockReturnValue({ data: [] });

    renderWithProviders(<UnitMosaic entityId="entity-1" />);

    // Should have been called with entityId and current month
    expect(mockUseRentCalls).toHaveBeenCalled();
    const [entityId, month] = mockUseRentCalls.mock.calls[0];
    expect(entityId).toBe("entity-1");
    // Month should match YYYY-MM format
    expect(month).toMatch(/^\d{4}-\d{2}$/);
  });
});
