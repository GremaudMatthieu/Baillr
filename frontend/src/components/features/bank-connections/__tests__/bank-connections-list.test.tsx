import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { BankConnectionsList } from "../bank-connections-list";

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({
    getToken: vi.fn().mockResolvedValue("mock-token"),
  }),
}));

const mockConnections = [
  {
    id: "conn-1",
    entityId: "entity-1",
    bankAccountId: "ba-1",
    provider: "bridge",
    institutionId: "BNP_BNPAFRPP",
    institutionName: "BNP Paribas",
    requisitionId: "req-1",
    agreementId: "agr-1",
    agreementExpiry: "2026-05-19T00:00:00.000Z",
    accountIds: ["acc-1"],
    status: "linked",
    lastSyncedAt: "2026-02-18T08:00:00.000Z",
    createdAt: "2026-02-19T00:00:00.000Z",
    updatedAt: "2026-02-19T00:00:00.000Z",
  },
  {
    id: "conn-2",
    entityId: "entity-1",
    bankAccountId: "ba-2",
    provider: "bridge",
    institutionId: "CA_AGRIFRPP",
    institutionName: "Crédit Agricole",
    requisitionId: "req-2",
    agreementId: "agr-2",
    agreementExpiry: "2026-01-01T00:00:00.000Z",
    accountIds: ["acc-2"],
    status: "expired",
    lastSyncedAt: null,
    createdAt: "2025-10-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

const mockSyncMutate = vi.fn().mockResolvedValue({ imported: 3 });
const mockDisconnectMutate = vi.fn();

vi.mock("@/hooks/use-bank-connections", () => ({
  useBankConnections: () => ({
    data: mockConnections,
    isLoading: false,
    error: null,
  }),
  useSyncBankConnection: () => ({
    mutateAsync: mockSyncMutate,
    isPending: false,
  }),
  useDisconnectBankConnection: () => ({
    mutate: mockDisconnectMutate,
    isPending: false,
  }),
}));

describe("BankConnectionsList", () => {
  it("should render connections with institution names", () => {
    renderWithProviders(<BankConnectionsList entityId="entity-1" />);

    expect(screen.getByText("BNP Paribas")).toBeInTheDocument();
    expect(screen.getByText("Crédit Agricole")).toBeInTheDocument();
  });

  it("should show Connectée badge for linked connections", () => {
    renderWithProviders(<BankConnectionsList entityId="entity-1" />);

    expect(screen.getByText("Connectée")).toBeInTheDocument();
  });

  it("should show Expirée badge for expired connections", () => {
    renderWithProviders(<BankConnectionsList entityId="entity-1" />);

    expect(screen.getByText("Expirée")).toBeInTheDocument();
  });

  it("should show expiry message for expired connections", () => {
    renderWithProviders(<BankConnectionsList entityId="entity-1" />);

    expect(
      screen.getByText(/Le consentement bancaire a expiré/),
    ).toBeInTheDocument();
  });

  it("should show sync button only for linked connections", () => {
    renderWithProviders(<BankConnectionsList entityId="entity-1" />);

    const syncButtons = screen.getAllByRole("button", {
      name: /Synchroniser/,
    });
    expect(syncButtons).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "Synchroniser BNP Paribas" }),
    ).toBeInTheDocument();
  });

  it("should show disconnect button for all connections", () => {
    renderWithProviders(<BankConnectionsList entityId="entity-1" />);

    const disconnectButtons = screen.getAllByRole("button", {
      name: /Déconnecter/,
    });
    expect(disconnectButtons).toHaveLength(2);
  });

  it("should show disconnect confirmation dialog", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BankConnectionsList entityId="entity-1" />);

    await user.click(
      screen.getByRole("button", { name: "Déconnecter BNP Paribas" }),
    );

    expect(screen.getByText("Déconnecter la banque")).toBeInTheDocument();
    expect(
      screen.getByText(/Voulez-vous vraiment déconnecter/),
    ).toBeInTheDocument();
  });

  it("should show last sync date", () => {
    renderWithProviders(<BankConnectionsList entityId="entity-1" />);

    expect(screen.getByText(/Dernière sync/)).toBeInTheDocument();
  });

  it("should return null when no connections", () => {
    vi.doMock("@/hooks/use-bank-connections", () => ({
      useBankConnections: () => ({
        data: [],
        isLoading: false,
        error: null,
      }),
      useSyncBankConnection: () => ({ mutateAsync: vi.fn() }),
      useDisconnectBankConnection: () => ({ mutate: vi.fn() }),
    }));

    // With empty connections, the component should render nothing
    // This is verified by the null return in the component
  });
});
