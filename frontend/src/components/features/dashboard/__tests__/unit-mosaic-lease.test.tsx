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

let mockLeasesData: unknown[] = [];

vi.mock("@/hooks/use-leases", () => ({
  useLeases: () => ({ data: mockLeasesData }),
}));

describe("UnitMosaic — lease occupancy", () => {
  it("should show vacant status when no leases exist", () => {
    mockLeasesData = [];

    renderWithProviders(<UnitMosaic entityId="entity-1" />);

    const apt1 = screen.getByRole("gridcell", {
      name: /Apt 1.*vacant/,
    });
    expect(apt1).toBeInTheDocument();
    expect(apt1.className).toContain("bg-muted");
  });

  it("should show occupied status when lease exists for unit", () => {
    mockLeasesData = [{ id: "l1", unitId: "u1" }];

    renderWithProviders(<UnitMosaic entityId="entity-1" />);

    const apt1 = screen.getByRole("gridcell", {
      name: /Apt 1.*occupé/,
    });
    expect(apt1).toBeInTheDocument();
    expect(apt1.className).toContain("bg-green-100");

    // u2 should remain vacant
    const apt2 = screen.getByRole("gridcell", {
      name: /Apt 2.*vacant/,
    });
    expect(apt2).toBeInTheDocument();
    expect(apt2.className).toContain("bg-muted");
  });
});
