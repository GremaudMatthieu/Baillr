import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { AnnualChargesForm } from "../annual-charges-form";

describe("AnnualChargesForm", () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    isSubmitting: false,
  };

  it("renders all four fixed category fields", () => {
    renderWithProviders(<AnnualChargesForm {...defaultProps} />);

    expect(screen.getByLabelText("Eau")).toBeInTheDocument();
    expect(screen.getByLabelText("Électricité")).toBeInTheDocument();
    expect(screen.getByLabelText("TEOM")).toBeInTheDocument();
    expect(screen.getByLabelText("Nettoyage")).toBeInTheDocument();
  });

  it("renders submit button", () => {
    renderWithProviders(<AnnualChargesForm {...defaultProps} />);

    expect(
      screen.getByRole("button", { name: "Enregistrer les charges" }),
    ).toBeInTheDocument();
  });

  it("renders add custom category button", () => {
    renderWithProviders(<AnnualChargesForm {...defaultProps} />);

    expect(
      screen.getByRole("button", { name: "Ajouter une catégorie" }),
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

  it("adds a custom category field when clicking add button", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AnnualChargesForm {...defaultProps} />);

    await user.click(
      screen.getByRole("button", { name: "Ajouter une catégorie" }),
    );

    expect(
      screen.getByLabelText("Libellé catégorie personnalisée 1"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Montant catégorie personnalisée 1"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Supprimer catégorie personnalisée 1",
      }),
    ).toBeInTheDocument();
  });

  it("removes a custom category field when clicking remove button", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AnnualChargesForm {...defaultProps} />);

    await user.click(
      screen.getByRole("button", { name: "Ajouter une catégorie" }),
    );
    expect(
      screen.getByLabelText("Libellé catégorie personnalisée 1"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Supprimer catégorie personnalisée 1",
      }),
    );

    expect(
      screen.queryByLabelText("Libellé catégorie personnalisée 1"),
    ).not.toBeInTheDocument();
  });

  it("submits with converted cents for fixed categories", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithProviders(
      <AnnualChargesForm {...defaultProps} onSubmit={onSubmit} />,
    );

    const waterInput = screen.getByLabelText("Eau");
    const electricityInput = screen.getByLabelText("Électricité");
    const teomInput = screen.getByLabelText("TEOM");
    const cleaningInput = screen.getByLabelText("Nettoyage");

    await user.clear(waterInput);
    await user.type(waterInput, "123.45");
    await user.clear(electricityInput);
    await user.type(electricityInput, "200");
    await user.clear(teomInput);
    await user.type(teomInput, "50.5");
    await user.clear(cleaningInput);
    await user.type(cleaningInput, "75");

    await user.click(
      screen.getByRole("button", { name: "Enregistrer les charges" }),
    );

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const charges = onSubmit.mock.calls[0][0];

    expect(charges).toHaveLength(4);
    expect(charges[0]).toEqual({
      category: "water",
      label: "Eau",
      amountCents: 12345,
    });
    expect(charges[1]).toEqual({
      category: "electricity",
      label: "Électricité",
      amountCents: 20000,
    });
    expect(charges[2]).toEqual({
      category: "teom",
      label: "TEOM",
      amountCents: 5050,
    });
    expect(charges[3]).toEqual({
      category: "cleaning",
      label: "Nettoyage",
      amountCents: 7500,
    });
  });

  it("submits with custom categories included", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithProviders(
      <AnnualChargesForm {...defaultProps} onSubmit={onSubmit} />,
    );

    // Add a custom category
    await user.click(
      screen.getByRole("button", { name: "Ajouter une catégorie" }),
    );

    const labelInput = screen.getByLabelText(
      "Libellé catégorie personnalisée 1",
    );
    const amountInput = screen.getByLabelText(
      "Montant catégorie personnalisée 1",
    );

    await user.type(labelInput, "Gardiennage");
    await user.clear(amountInput);
    await user.type(amountInput, "150");

    // Fill a fixed category too
    const waterInput = screen.getByLabelText("Eau");
    await user.clear(waterInput);
    await user.type(waterInput, "100");

    await user.click(
      screen.getByRole("button", { name: "Enregistrer les charges" }),
    );

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const charges = onSubmit.mock.calls[0][0];

    // 4 fixed + 1 custom = 5 entries
    expect(charges).toHaveLength(5);
    expect(charges[4]).toEqual({
      category: "custom",
      label: "Gardiennage",
      amountCents: 15000,
    });
  });

  it("populates form with initial charges", () => {
    const initialCharges = [
      { category: "water", label: "Eau", amountCents: 50000 },
      { category: "electricity", label: "Électricité", amountCents: 30000 },
      { category: "teom", label: "TEOM", amountCents: 10000 },
      { category: "cleaning", label: "Nettoyage", amountCents: 5000 },
      { category: "custom", label: "Ascenseur", amountCents: 20000 },
    ];

    renderWithProviders(
      <AnnualChargesForm
        {...defaultProps}
        initialCharges={initialCharges}
      />,
    );

    expect((screen.getByLabelText("Eau") as HTMLInputElement).value).toBe(
      "500",
    );
    expect(
      (screen.getByLabelText("Électricité") as HTMLInputElement).value,
    ).toBe("300");
    expect((screen.getByLabelText("TEOM") as HTMLInputElement).value).toBe(
      "100",
    );
    expect(
      (screen.getByLabelText("Nettoyage") as HTMLInputElement).value,
    ).toBe("50");

    // Custom category should be pre-populated
    expect(
      screen.getByLabelText("Libellé catégorie personnalisée 1"),
    ).toHaveValue("Ascenseur");
    expect(
      (
        screen.getByLabelText(
          "Montant catégorie personnalisée 1",
        ) as HTMLInputElement
      ).value,
    ).toBe("200");
  });

  it("renders fixed category inputs with correct attributes", () => {
    renderWithProviders(<AnnualChargesForm {...defaultProps} />);

    const waterInput = screen.getByLabelText("Eau") as HTMLInputElement;
    expect(waterInput.type).toBe("number");
    expect(waterInput.step).toBe("0.01");
    expect(waterInput.min).toBe("0");
  });
});
