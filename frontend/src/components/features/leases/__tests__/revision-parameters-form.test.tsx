import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { RevisionParametersForm } from "../revision-parameters-form";
import { revisionParametersSchema } from "../revision-parameters-schema";

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

function renderForm(
  overrides: Partial<{
    revisionIndexType: string;
    initialValues: {
      revisionDay: number | null;
      revisionMonth: number | null;
      referenceQuarter: string | null;
      referenceYear: number | null;
      baseIndexValue: number | null;
    };
    onSubmit: (...args: unknown[]) => void;
    onCancel: () => void;
    isPending: boolean;
  }> = {},
) {
  const props = {
    revisionIndexType: overrides.revisionIndexType ?? "IRL",
    initialValues: overrides.initialValues,
    onSubmit: overrides.onSubmit ?? vi.fn(),
    onCancel: overrides.onCancel ?? vi.fn(),
    isPending: overrides.isPending,
  };
  return {
    ...renderWithProviders(<RevisionParametersForm {...props} />),
    props,
  };
}

describe("RevisionParametersForm", () => {
  let mockOnSubmit: (...args: unknown[]) => void;
  let mockOnCancel: () => void;

  beforeEach(() => {
    mockOnSubmit = vi.fn();
    mockOnCancel = vi.fn();
  });

  it("should render all form fields", () => {
    renderForm({ onSubmit: mockOnSubmit, onCancel: mockOnCancel });

    expect(screen.getByText("Jour de révision")).toBeInTheDocument();
    expect(screen.getByText("Mois de révision")).toBeInTheDocument();
    expect(screen.getByText("Trimestre de référence")).toBeInTheDocument();
    expect(screen.getByLabelText("Année de référence")).toBeInTheDocument();
    expect(screen.getByLabelText(/Indice de base/)).toBeInTheDocument();
  });

  it("should display revision index type as read-only badge", () => {
    renderForm({
      revisionIndexType: "IRL",
      onSubmit: mockOnSubmit,
      onCancel: mockOnCancel,
    });

    expect(
      screen.getByText("IRL — Indice de Référence des Loyers"),
    ).toBeInTheDocument();
  });

  it("should pre-fill existing values", () => {
    renderForm({
      initialValues: {
        revisionDay: 15,
        revisionMonth: 3,
        referenceQuarter: "Q2",
        referenceYear: 2025,
        baseIndexValue: 142.06,
      },
      onSubmit: mockOnSubmit,
      onCancel: mockOnCancel,
    });

    expect(screen.getByLabelText("Année de référence")).toHaveValue(2025);
    expect(screen.getByLabelText(/Indice de base/)).toHaveValue(142.06);
  });

  it("should submit valid data", async () => {
    const user = userEvent.setup();
    renderForm({
      initialValues: {
        revisionDay: 15,
        revisionMonth: 3,
        referenceQuarter: "Q2",
        referenceYear: 2025,
        baseIndexValue: 142.06,
      },
      onSubmit: mockOnSubmit,
      onCancel: mockOnCancel,
    });

    await user.click(screen.getByText("Enregistrer"));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    const callArgs = (mockOnSubmit as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as Record<string, unknown>;
    expect(callArgs.revisionDay).toBe(15);
    expect(callArgs.revisionMonth).toBe(3);
    expect(callArgs.referenceQuarter).toBe("Q2");
    expect(callArgs.referenceYear).toBe(2025);
    expect(callArgs.baseIndexValue).toBe(142.06);
  });

  it("should call onCancel when cancel button clicked", async () => {
    const user = userEvent.setup();
    renderForm({ onSubmit: mockOnSubmit, onCancel: mockOnCancel });

    await user.click(screen.getByText("Annuler"));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("should disable submit button when isPending", () => {
    renderForm({
      onSubmit: mockOnSubmit,
      onCancel: mockOnCancel,
      isPending: true,
    });

    expect(screen.getByText("Enregistrement…")).toBeDisabled();
  });

  it("should render with null base index value (optional field empty)", () => {
    renderForm({
      initialValues: {
        revisionDay: 1,
        revisionMonth: 1,
        referenceQuarter: "Q1",
        referenceYear: 2026,
        baseIndexValue: null,
      },
      onSubmit: mockOnSubmit,
      onCancel: mockOnCancel,
    });

    const baseIndexInput = screen.getByLabelText(/Indice de base/);
    expect(baseIndexInput).toHaveValue(null);
    expect(screen.getByText(/optionnel/)).toBeInTheDocument();
  });

  it("should enforce year input constraints (min/max)", () => {
    renderForm({
      onSubmit: mockOnSubmit,
      onCancel: mockOnCancel,
    });

    const yearInput = screen.getByLabelText("Année de référence");
    expect(yearInput).toHaveAttribute("type", "number");
    expect(yearInput).toHaveAttribute("min", "2000");
    expect(yearInput).toHaveAttribute("max", "2100");
  });

  it("should handle unknown revision index type gracefully", () => {
    renderForm({
      revisionIndexType: "UNKNOWN",
      onSubmit: mockOnSubmit,
      onCancel: mockOnCancel,
    });

    // Falls back to raw value when no label mapping exists
    expect(screen.getByText("UNKNOWN")).toBeInTheDocument();
  });

  describe("schema validation", () => {
    it("should reject year below 2000", () => {
      const result = revisionParametersSchema.safeParse({
        revisionDay: 1,
        revisionMonth: 1,
        referenceQuarter: "Q1",
        referenceYear: 1999,
      });
      expect(result.success).toBe(false);
    });

    it("should reject year above 2100", () => {
      const result = revisionParametersSchema.safeParse({
        revisionDay: 1,
        revisionMonth: 1,
        referenceQuarter: "Q1",
        referenceYear: 2101,
      });
      expect(result.success).toBe(false);
    });

    it("should reject baseIndexValue of 0", () => {
      const result = revisionParametersSchema.safeParse({
        revisionDay: 1,
        revisionMonth: 1,
        referenceQuarter: "Q1",
        referenceYear: 2025,
        baseIndexValue: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should accept valid data without baseIndexValue", () => {
      const result = revisionParametersSchema.safeParse({
        revisionDay: 15,
        revisionMonth: 3,
        referenceQuarter: "Q2",
        referenceYear: 2025,
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid referenceQuarter", () => {
      const result = revisionParametersSchema.safeParse({
        revisionDay: 1,
        revisionMonth: 1,
        referenceQuarter: "Q5",
        referenceYear: 2025,
      });
      expect(result.success).toBe(false);
    });
  });

  it("should display ILC revision index type", () => {
    renderForm({
      revisionIndexType: "ILC",
      onSubmit: mockOnSubmit,
      onCancel: mockOnCancel,
    });

    expect(
      screen.getByText("ILC — Indice des Loyers Commerciaux"),
    ).toBeInTheDocument();
  });
});
