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
  {
    id: "u2",
    propertyId: "p1",
    propertyName: "Résidence A",
    userId: "user_1",
    identifier: "Apt 2",
    type: "apartment",
    floor: 2,
    surfaceArea: 50,
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
  useLeases: () => ({
    data: [
      { id: "l1", unitId: "u1", endDate: null },
      { id: "l2", unitId: "u2", endDate: null },
    ],
  }),
}));

let mockRentCallsData: unknown[] = [];

vi.mock("@/hooks/use-rent-calls", () => ({
  useRentCalls: () => ({ data: mockRentCallsData }),
}));

describe("UnitMosaic — sent rent call status", () => {
  it("should show orange tile when rent call has been sent for unit", () => {
    mockRentCallsData = [
      { id: "rc1", unitId: "u1", sentAt: "2026-02-10T10:00:00.000Z" },
    ];

    renderWithProviders(<UnitMosaic entityId="entity-1" />);

    const apt1 = screen.getByRole("gridcell", {
      name: /Apt 1.*envoyé/,
    });
    expect(apt1).toBeInTheDocument();
    expect(apt1.className).toContain("bg-orange-100");

    // u2 has no sent rent call — should remain green (occupied)
    const apt2 = screen.getByRole("gridcell", {
      name: /Apt 2.*occupé/,
    });
    expect(apt2).toBeInTheDocument();
    expect(apt2.className).toContain("bg-green-100");
  });

  it("should remain green when rent calls exist but none are sent", () => {
    mockRentCallsData = [
      { id: "rc1", unitId: "u1", sentAt: null },
    ];

    renderWithProviders(<UnitMosaic entityId="entity-1" />);

    const apt1 = screen.getByRole("gridcell", {
      name: /Apt 1.*occupé/,
    });
    expect(apt1).toBeInTheDocument();
    expect(apt1.className).toContain("bg-green-100");
  });
});
