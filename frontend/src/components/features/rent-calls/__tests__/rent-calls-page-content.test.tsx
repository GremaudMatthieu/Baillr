import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { RentCallsPageContent } from "../rent-calls-page-content";

vi.mock("@/hooks/use-rent-calls", () => ({
  useRentCalls: () => ({ data: [], isLoading: false, isError: false }),
  useGenerateRentCalls: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useDownloadRentCallPdf: () => ({
    downloadPdf: vi.fn(),
    isDownloading: false,
    downloadingId: null,
    error: null,
  }),
}));

vi.mock("@/hooks/use-leases", () => ({
  useLeases: () => ({
    data: [
      {
        id: "l1",
        tenantId: "t1",
        unitId: "u1",
        rentAmountCents: 80000,
        startDate: "2026-01-01",
        endDate: null,
      },
    ],
  }),
}));

vi.mock("@/hooks/use-tenants", () => ({
  useTenants: () => ({
    data: [{ id: "t1", firstName: "Jean", lastName: "Dupont" }],
  }),
}));

vi.mock("@/hooks/use-units", () => ({
  useEntityUnits: () => ({
    data: [{ id: "u1", identifier: "Appt A1" }],
  }),
}));

describe("RentCallsPageContent", () => {
  it("should render page title and month selector", () => {
    renderWithProviders(<RentCallsPageContent entityId="entity-1" />);

    expect(
      screen.getByText("Appels de loyer"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Sélectionner le mois" }),
    ).toBeInTheDocument();
  });

  it("should render generate button", () => {
    renderWithProviders(<RentCallsPageContent entityId="entity-1" />);

    expect(
      screen.getByRole("button", { name: /Générer les appels/ }),
    ).toBeInTheDocument();
  });

  it("should show empty state when no rent calls for month", () => {
    renderWithProviders(<RentCallsPageContent entityId="entity-1" />);

    expect(screen.getByText("Aucun appel de loyer")).toBeInTheDocument();
  });

  it("should enable generate button when active leases exist and no rent calls", () => {
    renderWithProviders(<RentCallsPageContent entityId="entity-1" />);

    const btn = screen.getByRole("button", { name: /Générer les appels/ });
    expect(btn).not.toBeDisabled();
  });
});
