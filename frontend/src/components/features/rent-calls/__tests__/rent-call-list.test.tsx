import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { RentCallList } from "../rent-call-list";
import type { RentCallData } from "@/lib/api/rent-calls-api";

const baseRentCall: RentCallData = {
  id: "rc-1",
  entityId: "entity-1",
  leaseId: "lease-1",
  tenantId: "tenant-1",
  unitId: "unit-1",
  month: "2026-03",
  rentAmountCents: 80000,
  billingLines: [
    { label: "Charges", amountCents: 5000, type: "provision" },
  ],
  totalAmountCents: 85000,
  isProRata: false,
  occupiedDays: null,
  totalDaysInMonth: null,
  createdAt: "2026-03-01T00:00:00.000Z",
};

const tenantNames = new Map([["tenant-1", "Jean Dupont"]]);
const unitIdentifiers = new Map([["unit-1", "Appt A1"]]);

describe("RentCallList", () => {
  it("should render empty state when no rent calls", () => {
    renderWithProviders(
      <RentCallList
        rentCalls={[]}
        tenantNames={tenantNames}
        unitIdentifiers={unitIdentifiers}
      />,
    );

    expect(screen.getByText("Aucun appel de loyer")).toBeInTheDocument();
  });

  it("should render rent call with tenant name and unit", () => {
    renderWithProviders(
      <RentCallList
        rentCalls={[baseRentCall]}
        tenantNames={tenantNames}
        unitIdentifiers={unitIdentifiers}
      />,
    );

    expect(screen.getByText("Jean Dupont")).toBeInTheDocument();
    expect(screen.getByText("Appt A1")).toBeInTheDocument();
  });

  it("should format amounts in French currency", () => {
    renderWithProviders(
      <RentCallList
        rentCalls={[baseRentCall]}
        tenantNames={tenantNames}
        unitIdentifiers={unitIdentifiers}
      />,
    );

    // Total amount: 850,00 €
    expect(screen.getByText(/850,00/)).toBeInTheDocument();
  });

  it("should display billing lines breakdown", () => {
    renderWithProviders(
      <RentCallList
        rentCalls={[baseRentCall]}
        tenantNames={tenantNames}
        unitIdentifiers={unitIdentifiers}
      />,
    );

    expect(screen.getByText(/Charges/)).toBeInTheDocument();
  });

  it("should show pro-rata badge when applicable", () => {
    const proRataRentCall: RentCallData = {
      ...baseRentCall,
      isProRata: true,
      occupiedDays: 15,
      totalDaysInMonth: 31,
    };

    renderWithProviders(
      <RentCallList
        rentCalls={[proRataRentCall]}
        tenantNames={tenantNames}
        unitIdentifiers={unitIdentifiers}
      />,
    );

    expect(screen.getByText("Pro-rata")).toBeInTheDocument();
  });

  it("should show fallback when tenant or unit unknown", () => {
    renderWithProviders(
      <RentCallList
        rentCalls={[{ ...baseRentCall, tenantId: "unknown", unitId: "unknown" }]}
        tenantNames={tenantNames}
        unitIdentifiers={unitIdentifiers}
      />,
    );

    expect(screen.getByText("Locataire inconnu")).toBeInTheDocument();
    expect(screen.getByText("Lot inconnu")).toBeInTheDocument();
  });
});
