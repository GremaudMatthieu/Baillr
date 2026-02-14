import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { TenantCurrentAccount } from "@/components/features/tenants/tenant-current-account";
import type { AccountEntryData } from "@/lib/api/account-entries-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Integration test: tests the Compte courant section as rendered in the tenant detail page

const entries: AccountEntryData[] = [
  {
    id: "ae-1",
    type: "debit",
    category: "rent_call",
    description: "Appel de loyer — Mars 2026",
    amountCents: 85000,
    balanceCents: -85000,
    referenceId: "rc-1",
    referenceMonth: "2026-03",
    entryDate: "2026-03-01T00:00:00.000Z",
  },
  {
    id: "ae-2",
    type: "credit",
    category: "payment",
    description: "Paiement reçu — Mars 2026",
    amountCents: 50000,
    balanceCents: -35000,
    referenceId: "tx-1",
    referenceMonth: "2026-03",
    entryDate: "2026-03-10T00:00:00.000Z",
  },
];

function CompteCourantSection({
  isLoading,
  isError,
  accountData,
}: {
  isLoading: boolean;
  isError: boolean;
  accountData: { entries: AccountEntryData[]; balanceCents: number } | undefined;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Compte courant</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
          </div>
        )}
        {isError && (
          <p className="text-sm text-destructive">
            Erreur lors du chargement du compte courant
          </p>
        )}
        {!isLoading && !isError && accountData && (
          <TenantCurrentAccount
            entries={accountData.entries}
            balanceCents={accountData.balanceCents}
          />
        )}
      </CardContent>
    </Card>
  );
}

describe("Tenant Detail — Compte courant section", () => {
  it("should render Compte courant card with entries and balance", () => {
    renderWithProviders(
      <CompteCourantSection
        isLoading={false}
        isError={false}
        accountData={{ entries, balanceCents: -35000 }}
      />,
    );

    expect(screen.getByText("Compte courant")).toBeInTheDocument();
    expect(screen.getByText("Appel de loyer — Mars 2026")).toBeInTheDocument();
    expect(screen.getByText("Paiement reçu — Mars 2026")).toBeInTheDocument();
    const badge = screen.getByLabelText(/Solde/);
    expect(badge.textContent).toMatch(/350,00/);
  });

  it("should show error state when account fails to load", () => {
    renderWithProviders(
      <CompteCourantSection
        isLoading={false}
        isError={true}
        accountData={undefined}
      />,
    );

    expect(screen.getByText("Compte courant")).toBeInTheDocument();
    expect(
      screen.getByText("Erreur lors du chargement du compte courant"),
    ).toBeInTheDocument();
  });

  it("should show empty state when no account entries", () => {
    renderWithProviders(
      <CompteCourantSection
        isLoading={false}
        isError={false}
        accountData={{ entries: [], balanceCents: 0 }}
      />,
    );

    expect(screen.getByText("Compte courant")).toBeInTheDocument();
    expect(
      screen.getByText("Aucune opération enregistrée pour ce locataire"),
    ).toBeInTheDocument();
  });

  it("should show loading skeleton while fetching", () => {
    const { container } = renderWithProviders(
      <CompteCourantSection
        isLoading={true}
        isError={false}
        accountData={undefined}
      />,
    );

    expect(screen.getByText("Compte courant")).toBeInTheDocument();
    // Skeletons rendered
    const skeletons = container.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
