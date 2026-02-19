import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { ConnectBankDialog } from "../connect-bank-dialog";

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({
    getToken: vi.fn().mockResolvedValue("mock-token"),
  }),
}));

const mockInstitutions = [
  {
    id: "BNP_BNPAFRPP",
    name: "BNP Paribas",
    bic: "BNPAFRPP",
    logo: "https://cdn.example.com/bnp.png",
    countries: ["FR"],
  },
  {
    id: "CA_AGRIFRPP",
    name: "Crédit Agricole",
    bic: "AGRIFRPP",
    logo: "https://cdn.example.com/ca.png",
    countries: ["FR"],
  },
  {
    id: "SG_SOGEFRPP",
    name: "Société Générale",
    bic: "SOGEFRPP",
    logo: "",
    countries: ["FR"],
  },
];

vi.mock("@/hooks/use-bank-connections", () => ({
  useInstitutions: () => ({
    data: mockInstitutions,
    isLoading: false,
  }),
}));

describe("ConnectBankDialog", () => {
  const defaultProps = {
    entityId: "entity-1",
    bankAccountId: "ba-1",
    open: true,
    onOpenChange: vi.fn(),
    onSelectInstitution: vi.fn(),
    isPending: false,
  };

  it("should render dialog title and description", () => {
    renderWithProviders(<ConnectBankDialog {...defaultProps} />);

    expect(screen.getByText("Connecter ma banque")).toBeInTheDocument();
    expect(
      screen.getByText(/Sélectionnez votre banque/),
    ).toBeInTheDocument();
  });

  it("should display institutions list", () => {
    renderWithProviders(<ConnectBankDialog {...defaultProps} />);

    expect(screen.getByText("BNP Paribas")).toBeInTheDocument();
    expect(screen.getByText("Crédit Agricole")).toBeInTheDocument();
    expect(screen.getByText("Société Générale")).toBeInTheDocument();
  });

  it("should filter institutions by search term", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConnectBankDialog {...defaultProps} />);

    const searchInput = screen.getByLabelText("Rechercher une banque");
    await user.type(searchInput, "BNP");

    expect(screen.getByText("BNP Paribas")).toBeInTheDocument();
    expect(screen.queryByText("Crédit Agricole")).not.toBeInTheDocument();
    expect(screen.queryByText("Société Générale")).not.toBeInTheDocument();
  });

  it("should enable connect button when institution is selected", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConnectBankDialog {...defaultProps} />);

    const connectButton = screen.getByRole("button", { name: "Connecter" });
    expect(connectButton).toBeDisabled();

    await user.click(screen.getByText("BNP Paribas"));
    expect(connectButton).not.toBeDisabled();
  });

  it("should call onSelectInstitution when connect is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderWithProviders(
      <ConnectBankDialog {...defaultProps} onSelectInstitution={onSelect} />,
    );

    await user.click(screen.getByText("BNP Paribas"));
    await user.click(screen.getByRole("button", { name: "Connecter" }));

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "BNP_BNPAFRPP", name: "BNP Paribas" }),
    );
  });

  it("should show empty state when no banks match search", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConnectBankDialog {...defaultProps} />);

    const searchInput = screen.getByLabelText("Rechercher une banque");
    await user.type(searchInput, "xyz-nonexistent");

    expect(screen.getByText("Aucune banque trouvée")).toBeInTheDocument();
  });
});
