import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { InseeIndexForm } from "../insee-index-form";

describe("InseeIndexForm", () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    isSubmitting: false,
  };

  it("renders all form fields", () => {
    renderWithProviders(<InseeIndexForm {...defaultProps} />);

    expect(
      screen.getByRole("form", {
        name: "Formulaire d'enregistrement d'indice INSEE",
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Type d'indice")).toBeInTheDocument();
    expect(screen.getByLabelText("Trimestre")).toBeInTheDocument();
    expect(screen.getByLabelText("Année")).toBeInTheDocument();
    expect(screen.getByLabelText("Valeur")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Enregistrer l'indice" }),
    ).toBeInTheDocument();
  });

  it("has correct default values", () => {
    renderWithProviders(<InseeIndexForm {...defaultProps} />);

    const yearInput = screen.getByLabelText("Année") as HTMLInputElement;
    expect(yearInput.value).toBe(String(new Date().getFullYear()));
  });

  it("shows validation error for missing value", async () => {
    const user = userEvent.setup();
    renderWithProviders(<InseeIndexForm {...defaultProps} />);

    await user.click(
      screen.getByRole("button", { name: "Enregistrer l'indice" }),
    );

    await waitFor(() => {
      expect(screen.getByText("Valeur requise")).toBeInTheDocument();
    });
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it("disables submit button when isSubmitting", () => {
    renderWithProviders(
      <InseeIndexForm {...defaultProps} isSubmitting={true} />,
    );

    const button = screen.getByRole("button", { name: "Enregistrement…" });
    expect(button).toBeDisabled();
  });

  it("shows submitting text when isSubmitting", () => {
    renderWithProviders(
      <InseeIndexForm {...defaultProps} isSubmitting={true} />,
    );

    expect(screen.getByText("Enregistrement…")).toBeInTheDocument();
    expect(screen.queryByText("Enregistrer l'indice")).not.toBeInTheDocument();
  });

  it("renders value input with correct attributes", () => {
    renderWithProviders(<InseeIndexForm {...defaultProps} />);

    const valueInput = screen.getByLabelText("Valeur") as HTMLInputElement;
    expect(valueInput.type).toBe("number");
    expect(valueInput.step).toBe("0.01");
    expect(valueInput.min).toBe("0.001");
    expect(valueInput.max).toBe("500");
    expect(valueInput.placeholder).toBe("Ex: 142.06");
  });

  it("renders year input with correct attributes", () => {
    renderWithProviders(<InseeIndexForm {...defaultProps} />);

    const yearInput = screen.getByLabelText("Année") as HTMLInputElement;
    expect(yearInput.type).toBe("number");
    expect(yearInput.min).toBe("2000");
    expect(yearInput.max).toBe("2100");
  });
});
