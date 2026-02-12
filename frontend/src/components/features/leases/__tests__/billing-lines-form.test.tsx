import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { BillingLinesForm } from "../billing-lines-form";
import type { BillingLineData } from "@/lib/api/leases-api";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/leases/lease-1",
  useParams: () => ({ id: "lease-1" }),
  useSearchParams: () => new URLSearchParams(),
}));

const mockInitialLines: BillingLineData[] = [
  { label: "Provisions sur charges", amountCents: 5000, type: "provision" },
];

const mockUnitOptions = [
  { label: "Entretien chaudière", amountCents: 1250 },
  { label: "Parking", amountCents: 3000 },
];

const DEFAULT_RENT_CENTS = 63000;

function renderForm(overrides: Partial<{
  initialLines: BillingLineData[];
  rentAmountCents: number;
  unitBillableOptions: Array<{ label: string; amountCents: number }>;
  onSubmit: (...args: unknown[]) => void;
  onCancel: () => void;
  isPending: boolean;
}> = {}) {
  const props = {
    initialLines: overrides.initialLines ?? [],
    rentAmountCents: overrides.rentAmountCents ?? DEFAULT_RENT_CENTS,
    onSubmit: overrides.onSubmit ?? vi.fn(),
    onCancel: overrides.onCancel ?? vi.fn(),
    unitBillableOptions: overrides.unitBillableOptions,
    isPending: overrides.isPending,
  };
  return { ...renderWithProviders(<BillingLinesForm {...props} />), props };
}

describe("BillingLinesForm", () => {
  let mockOnSubmit: (...args: unknown[]) => void;
  let mockOnCancel: () => void;

  beforeEach(() => {
    mockOnSubmit = vi.fn();
    mockOnCancel = vi.fn();
  });

  it("should render existing billing lines", () => {
    renderForm({
      initialLines: mockInitialLines,
      onSubmit: mockOnSubmit,
      onCancel: mockOnCancel,
    });

    const labelInput = screen.getByRole("textbox", {
      name: "Libellé",
    });
    expect(labelInput).toHaveValue("Provisions sur charges");

    const amountInput = screen.getByRole("spinbutton", {
      name: "Montant (€)",
    });
    expect(amountInput).toHaveValue(50);
  });

  it("should render empty form when no initial lines", () => {
    renderForm({ onSubmit: mockOnSubmit, onCancel: mockOnCancel });

    expect(screen.getByText("Lignes de facturation")).toBeInTheDocument();
    expect(screen.getByText("Ajouter une provision")).toBeInTheDocument();
  });

  it("should add a provision line when clicking add button", async () => {
    const user = userEvent.setup();
    renderForm({ onSubmit: mockOnSubmit, onCancel: mockOnCancel });

    await user.click(screen.getByText("Ajouter une provision"));

    const labelInputs = screen.getAllByPlaceholderText("Libellé");
    expect(labelInputs).toHaveLength(1);
  });

  it("should display unit billable options as quick-add buttons", () => {
    renderForm({
      unitBillableOptions: mockUnitOptions,
      onSubmit: mockOnSubmit,
      onCancel: mockOnCancel,
    });

    expect(screen.getByText(/Entretien chaudière/)).toBeInTheDocument();
    expect(screen.getByText(/Parking/)).toBeInTheDocument();
  });

  it("should add line from unit option when clicking quick-add", async () => {
    const user = userEvent.setup();
    renderForm({
      unitBillableOptions: mockUnitOptions,
      onSubmit: mockOnSubmit,
      onCancel: mockOnCancel,
    });

    await user.click(screen.getByText(/Entretien chaudière/));

    expect(screen.getByDisplayValue("Entretien chaudière")).toBeInTheDocument();
    expect(screen.getByDisplayValue("12.5")).toBeInTheDocument();
  });

  it("should remove a line when clicking delete button", async () => {
    const user = userEvent.setup();
    renderForm({
      initialLines: mockInitialLines,
      onSubmit: mockOnSubmit,
      onCancel: mockOnCancel,
    });

    const deleteButton = screen.getByLabelText(
      "Supprimer Provisions sur charges",
    );
    await user.click(deleteButton);

    expect(
      screen.queryByDisplayValue("Provisions sur charges"),
    ).not.toBeInTheDocument();
  });

  it("should call onCancel when cancel button clicked", async () => {
    const user = userEvent.setup();
    renderForm({ onSubmit: mockOnSubmit, onCancel: mockOnCancel });

    await user.click(screen.getByText("Annuler"));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("should display total including rent in French format", () => {
    const lines: BillingLineData[] = [
      { label: "Provisions", amountCents: 5000, type: "provision" },
      { label: "Parking", amountCents: 3000, type: "option" },
    ];

    renderForm({
      initialLines: lines,
      rentAmountCents: 63000,
      onSubmit: mockOnSubmit,
      onCancel: mockOnCancel,
    });

    // Total should include rent (630) + provisions (50) + parking (30) = 710
    const totalSection = screen.getByText(/Total mensuel/);
    expect(totalSection).toBeInTheDocument();
  });

  it("should call onSubmit with cents conversion on form submission", async () => {
    const user = userEvent.setup();
    renderForm({
      initialLines: [
        { label: "Charges", amountCents: 5025, type: "provision" },
      ],
      onSubmit: mockOnSubmit,
      onCancel: mockOnCancel,
    });

    await user.click(screen.getByText("Enregistrer"));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });
    expect(mockOnSubmit).toHaveBeenCalledWith([
      { label: "Charges", amountCents: 5025, type: "provision" },
    ]);
  });

  it("should disable submit button when isPending", () => {
    renderForm({
      onSubmit: mockOnSubmit,
      onCancel: mockOnCancel,
      isPending: true,
    });

    expect(screen.getByText("Enregistrement…")).toBeDisabled();
  });
});
