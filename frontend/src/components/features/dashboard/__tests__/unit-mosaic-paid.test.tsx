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
  {
    id: "u3",
    propertyId: "p1",
    propertyName: "Résidence A",
    userId: "user_1",
    identifier: "Apt 3",
    type: "apartment",
    floor: 3,
    surfaceArea: 55,
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
      { id: "l3", unitId: "u3", endDate: null },
    ],
  }),
}));

let mockRentCallsData: unknown[] = [];

vi.mock("@/hooks/use-rent-calls", () => ({
  useRentCalls: () => ({ data: mockRentCallsData }),
}));

describe("UnitMosaic — paid rent call status", () => {
  it("should show green tile with 'payé' label when rent call is paid", () => {
    mockRentCallsData = [
      { id: "rc1", unitId: "u1", sentAt: "2026-02-10T10:00:00.000Z", paidAt: "2026-02-12T14:00:00.000Z", paymentStatus: "paid" },
    ];

    renderWithProviders(<UnitMosaic entityId="entity-1" />);

    const apt1 = screen.getByRole("gridcell", {
      name: /Apt 1.*payé/,
    });
    expect(apt1).toBeInTheDocument();
    expect(apt1.className).toContain("bg-green-100");
  });

  it("should show amber tile for sent-but-not-paid unit", () => {
    mockRentCallsData = [
      { id: "rc1", unitId: "u1", sentAt: "2026-02-10T10:00:00.000Z", paidAt: "2026-02-12T14:00:00.000Z", paymentStatus: "paid" },
      { id: "rc2", unitId: "u2", sentAt: "2026-02-10T10:00:00.000Z", paidAt: null, paymentStatus: null },
    ];

    renderWithProviders(<UnitMosaic entityId="entity-1" />);

    // u1 is paid → green + payé
    const apt1 = screen.getByRole("gridcell", {
      name: /Apt 1.*payé/,
    });
    expect(apt1.className).toContain("bg-green-100");

    // u2 is sent but not paid → amber + envoyé
    const apt2 = screen.getByRole("gridcell", {
      name: /Apt 2.*envoyé/,
    });
    expect(apt2.className).toContain("bg-amber-100");
  });

  it("should show occupied green for unit with no rent call", () => {
    mockRentCallsData = [
      { id: "rc1", unitId: "u1", sentAt: "2026-02-10T10:00:00.000Z", paidAt: "2026-02-12T14:00:00.000Z", paymentStatus: "paid" },
    ];

    renderWithProviders(<UnitMosaic entityId="entity-1" />);

    // u3 has lease but no rent call → occupied green
    const apt3 = screen.getByRole("gridcell", {
      name: /Apt 3.*occupé/,
    });
    expect(apt3.className).toContain("bg-green-100");
  });

  it("should prioritize paid over sent status", () => {
    // A rent call that is both sent AND paid should show "payé" not "envoyé"
    mockRentCallsData = [
      { id: "rc1", unitId: "u1", sentAt: "2026-02-10T10:00:00.000Z", paidAt: "2026-02-12T14:00:00.000Z", paymentStatus: "paid" },
    ];

    renderWithProviders(<UnitMosaic entityId="entity-1" />);

    // Should NOT match "envoyé" for u1
    expect(
      screen.queryByRole("gridcell", { name: /Apt 1.*envoyé/ }),
    ).not.toBeInTheDocument();

    // Should match "payé"
    expect(
      screen.getByRole("gridcell", { name: /Apt 1.*payé/ }),
    ).toBeInTheDocument();
  });

  it("should show amber tile for partially paid rent call (NOT green)", () => {
    mockRentCallsData = [
      { id: "rc1", unitId: "u1", sentAt: "2026-02-10T10:00:00.000Z", paidAt: null, paymentStatus: "partial" },
    ];

    renderWithProviders(<UnitMosaic entityId="entity-1" />);

    const apt1 = screen.getByRole("gridcell", {
      name: /Apt 1.*partiellement payé/,
    });
    expect(apt1).toBeInTheDocument();
    expect(apt1.className).toContain("bg-amber-100");
    expect(apt1.className).not.toContain("bg-green-100");
  });

  it("should show green tile for overpaid rent call", () => {
    mockRentCallsData = [
      { id: "rc1", unitId: "u1", sentAt: "2026-02-10T10:00:00.000Z", paidAt: "2026-02-12T14:00:00.000Z", paymentStatus: "overpaid" },
    ];

    renderWithProviders(<UnitMosaic entityId="entity-1" />);

    const apt1 = screen.getByRole("gridcell", {
      name: /Apt 1.*payé/,
    });
    expect(apt1).toBeInTheDocument();
    expect(apt1.className).toContain("bg-green-100");
  });
});
