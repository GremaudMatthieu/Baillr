import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { CalculateRevisionsDialog } from "../calculate-revisions-dialog";

const mockMutateAsync = vi.fn();
const mockReset = vi.fn();
let mockIsPending = false;
let mockIsError = false;

vi.mock("@/hooks/use-revisions", () => ({
  useRevisions: () => ({ data: [], isLoading: false }),
  useCalculateRevisions: () => ({
    mutateAsync: mockMutateAsync,
    isPending: mockIsPending,
    isError: mockIsError,
    reset: mockReset,
  }),
}));

describe("CalculateRevisionsDialog", () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockReset.mockReset();
    mockIsPending = false;
    mockIsError = false;
  });

  it("renders trigger button", () => {
    renderWithProviders(
      <CalculateRevisionsDialog entityId="entity-1" />,
    );
    expect(
      screen.getByRole("button", { name: /calculer les révisions/i }),
    ).toBeInTheDocument();
  });

  it("opens dialog when trigger clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CalculateRevisionsDialog entityId="entity-1" />,
    );

    await user.click(
      screen.getByRole("button", { name: /calculer les révisions/i }),
    );

    expect(
      screen.getByText("Calculer les révisions de loyer"),
    ).toBeInTheDocument();
    expect(screen.getByText(/formule officielle/)).toBeInTheDocument();
  });

  it("shows summary after successful calculation", async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({
      calculated: 3,
      skipped: ["lease-1"],
      errors: [],
    });

    renderWithProviders(
      <CalculateRevisionsDialog entityId="entity-1" />,
    );

    await user.click(
      screen.getByRole("button", { name: /calculer les révisions/i }),
    );
    await user.click(screen.getByRole("button", { name: "Calculer" }));

    expect(await screen.findByText("Résultat du calcul")).toBeInTheDocument();
    expect(screen.getByText(/3 révisions calculées/)).toBeInTheDocument();
  });

  it("shows error message when calculation fails", async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValue(new Error("Network error"));
    mockIsError = true;

    renderWithProviders(
      <CalculateRevisionsDialog entityId="entity-1" />,
    );

    await user.click(
      screen.getByRole("button", { name: /calculer les révisions/i }),
    );
    await user.click(screen.getByRole("button", { name: "Calculer" }));

    expect(
      await screen.findByText(/erreur est survenue/i),
    ).toBeInTheDocument();
  });

  it("shows no eligible message when all empty", async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({
      calculated: 0,
      skipped: [],
      errors: [],
    });

    renderWithProviders(
      <CalculateRevisionsDialog entityId="entity-1" />,
    );

    await user.click(
      screen.getByRole("button", { name: /calculer les révisions/i }),
    );
    await user.click(screen.getByRole("button", { name: "Calculer" }));

    expect(
      await screen.findByText(/aucun bail éligible/i),
    ).toBeInTheDocument();
  });
});
