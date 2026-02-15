import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { AnnualChargesForm } from "../annual-charges-form";
import type { ChargeCategoryData } from "@/lib/api/charge-categories-api";

const mockChargeCategories: ChargeCategoryData[] = [
  {
    id: "cat-water",
    entityId: "entity-1",
    slug: "water",
    label: "Eau",
    isStandard: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "cat-electricity",
    entityId: "entity-1",
    slug: "electricity",
    label: "Électricité",
    isStandard: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "cat-teom",
    entityId: "entity-1",
    slug: "teom",
    label: "TEOM",
    isStandard: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "cat-cleaning",
    entityId: "entity-1",
    slug: "cleaning",
    label: "Nettoyage",
    isStandard: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "cat-custom-tva",
    entityId: "entity-1",
    slug: "tva",
    label: "Tva",
    isStandard: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
];

describe("AnnualChargesForm", () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    isSubmitting: false,
    chargeCategories: mockChargeCategories,
  };

  it("renders empty form when no initial charges", () => {
    renderWithProviders(<AnnualChargesForm {...defaultProps} />);

    // No rows initially — user adds categories manually
    expect(screen.queryAllByRole("spinbutton")).toHaveLength(0);
  });

  it("renders submit button", () => {
    renderWithProviders(<AnnualChargesForm {...defaultProps} />);

    expect(
      screen.getByRole("button", { name: "Enregistrer les charges" }),
    ).toBeInTheDocument();
  });

  it("renders existing category selector with all categories available", () => {
    renderWithProviders(<AnnualChargesForm {...defaultProps} />);

    // No rows → all 5 categories available in the add selector
    expect(
      screen.getByRole("combobox", { name: "Ajouter une catégorie existante" }),
    ).toBeInTheDocument();
  });

  it("disables submit button when isSubmitting", () => {
    renderWithProviders(
      <AnnualChargesForm {...defaultProps} isSubmitting={true} />,
    );

    const button = screen.getByRole("button", { name: "Enregistrement…" });
    expect(button).toBeDisabled();
  });

  it("shows submitting text when isSubmitting", () => {
    renderWithProviders(
      <AnnualChargesForm {...defaultProps} isSubmitting={true} />,
    );

    expect(screen.getByText("Enregistrement…")).toBeInTheDocument();
    expect(
      screen.queryByText("Enregistrer les charges"),
    ).not.toBeInTheDocument();
  });

  it("hides existing category selector when all categories are used", () => {
    // Provide initial charges using all categories
    const initialCharges = mockChargeCategories.map((cat) => ({
      chargeCategoryId: cat.id,
      label: cat.label,
      amountCents: 10000,
    }));
    renderWithProviders(
      <AnnualChargesForm {...defaultProps} initialCharges={initialCharges} />,
    );

    // All 5 categories used → selector hidden
    expect(
      screen.queryByRole("combobox", { name: "Ajouter une catégorie existante" }),
    ).not.toBeInTheDocument();
  });

  it("removes a row when clicking delete button", async () => {
    const user = userEvent.setup();
    const initialCharges = [
      { chargeCategoryId: "cat-water", label: "Eau", amountCents: 50000 },
      { chargeCategoryId: "cat-electricity", label: "Électricité", amountCents: 30000 },
    ];
    renderWithProviders(
      <AnnualChargesForm {...defaultProps} initialCharges={initialCharges} />,
    );

    // 2 rows initially
    expect(screen.getAllByRole("spinbutton")).toHaveLength(2);

    // Remove "Eau" row
    const deleteButton = screen.getByLabelText("Supprimer Eau");
    await user.click(deleteButton);

    // Should have 1 row now
    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs).toHaveLength(1);
  });

  it("submits with chargeCategoryId, label, and amountCents", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const initialCharges = [
      { chargeCategoryId: "cat-water", label: "Eau", amountCents: 0 },
    ];
    renderWithProviders(
      <AnnualChargesForm
        {...defaultProps}
        onSubmit={onSubmit}
        initialCharges={initialCharges}
      />,
    );

    // Fill the water amount
    const amountInputs = screen.getAllByRole("spinbutton");
    await user.clear(amountInputs[0]);
    await user.type(amountInputs[0], "123.45");

    await user.click(
      screen.getByRole("button", { name: "Enregistrer les charges" }),
    );

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const charges = onSubmit.mock.calls[0][0];

    expect(charges).toHaveLength(1);
    expect(charges[0]).toEqual({
      chargeCategoryId: "cat-water",
      label: "Eau",
      amountCents: 12345,
    });
  });

  it("populates form with initial charges", () => {
    const initialCharges = [
      { chargeCategoryId: "cat-water", label: "Eau", amountCents: 50000 },
      { chargeCategoryId: "cat-electricity", label: "Électricité", amountCents: 30000 },
      { chargeCategoryId: "cat-custom-tva", label: "Tva", amountCents: 12000 },
    ];

    renderWithProviders(
      <AnnualChargesForm
        {...defaultProps}
        initialCharges={initialCharges}
      />,
    );

    // 3 rows from initial data
    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs).toHaveLength(3);

    // Check amounts (cents → euros)
    expect((inputs[0] as HTMLInputElement).value).toBe("500");
    expect((inputs[1] as HTMLInputElement).value).toBe("300");
    expect((inputs[2] as HTMLInputElement).value).toBe("120");
  });

  it("renders amount inputs with correct attributes", () => {
    const initialCharges = [
      { chargeCategoryId: "cat-water", label: "Eau", amountCents: 50000 },
    ];
    renderWithProviders(
      <AnnualChargesForm {...defaultProps} initialCharges={initialCharges} />,
    );

    const amountInputs = screen.getAllByRole("spinbutton");
    const firstInput = amountInputs[0] as HTMLInputElement;
    expect(firstInput.type).toBe("number");
    expect(firstInput.step).toBe("0.01");
    expect(firstInput.min).toBe("0");
  });

  it("shows unused categories in the add selector", () => {
    const initialCharges = [
      { chargeCategoryId: "cat-water", label: "Eau", amountCents: 50000 },
    ];
    renderWithProviders(
      <AnnualChargesForm {...defaultProps} initialCharges={initialCharges} />,
    );

    // 1 category used → 4 available in add selector
    const addSelector = screen.getByRole("combobox", { name: "Ajouter une catégorie existante" });
    expect(addSelector).toBeInTheDocument();
  });

  it("does not show create category input when onCreateCategory is not provided", () => {
    renderWithProviders(<AnnualChargesForm {...defaultProps} />);

    expect(
      screen.queryByLabelText("Nom de la nouvelle catégorie"),
    ).not.toBeInTheDocument();
  });

  it("shows create category input when onCreateCategory is provided", () => {
    renderWithProviders(
      <AnnualChargesForm
        {...defaultProps}
        onCreateCategory={vi.fn()}
      />,
    );

    expect(
      screen.getByLabelText("Nom de la nouvelle catégorie"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Créer" }),
    ).toBeInTheDocument();
  });

  it("creates a new category and appends a row", async () => {
    const user = userEvent.setup();
    const createdCategory: ChargeCategoryData = {
      id: "cat-new-1",
      entityId: "entity-1",
      slug: "gardiennage",
      label: "Gardiennage",
      isStandard: false,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    const onCreateCategory = vi.fn().mockResolvedValue(createdCategory);

    renderWithProviders(
      <AnnualChargesForm
        {...defaultProps}
        onCreateCategory={onCreateCategory}
      />,
    );

    // 0 rows initially (empty form)
    expect(screen.queryAllByRole("spinbutton")).toHaveLength(0);

    // Type new category name
    const input = screen.getByLabelText("Nom de la nouvelle catégorie");
    await user.type(input, "Gardiennage");

    // Click create
    await user.click(screen.getByRole("button", { name: "Créer" }));

    await waitFor(() => {
      expect(onCreateCategory).toHaveBeenCalledWith("Gardiennage");
    });

    // New row should be appended (1 row now)
    await waitFor(() => {
      expect(screen.getAllByRole("spinbutton")).toHaveLength(1);
    });

    // Input should be cleared
    expect((input as HTMLInputElement).value).toBe("");
  });

  it("disables create button when input is empty", () => {
    renderWithProviders(
      <AnnualChargesForm
        {...defaultProps}
        onCreateCategory={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Créer" }),
    ).toBeDisabled();
  });
});
