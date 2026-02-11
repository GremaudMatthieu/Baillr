import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";
import { UnitForm } from "../unit-form";
import type { UnitData } from "@/lib/api/units-api";

const mockBack = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: mockBack,
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/properties/prop-1/units/new",
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

const mockCreateMutateAsync = vi.fn().mockResolvedValue(undefined);
const mockUpdateMutateAsync = vi.fn().mockResolvedValue(undefined);

vi.mock("@/hooks/use-units", () => ({
  useCreateUnit: () => ({
    isPending: false,
    mutateAsync: mockCreateMutateAsync,
  }),
  useUpdateUnit: () => ({
    isPending: false,
    mutateAsync: mockUpdateMutateAsync,
  }),
}));

const editUnit: UnitData = {
  id: "unit-1",
  propertyId: "prop-1",
  userId: "user_test123",
  identifier: "Apt 3B",
  type: "apartment",
  floor: 3,
  surfaceArea: 65.5,
  billableOptions: [{ label: "Loyer", amountCents: 85000 }],
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("UnitForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render create form with empty fields", () => {
    renderWithProviders(<UnitForm propertyId="prop-1" />);
    expect(
      screen.getByRole("button", { name: /Créer le lot/i }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Apt 3B, Parking B1/)).toHaveValue("");
  });

  it("should render edit form with prefilled fields", () => {
    renderWithProviders(
      <UnitForm propertyId="prop-1" initialData={editUnit} />,
    );
    expect(
      screen.getByRole("button", { name: /Enregistrer/i }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Apt 3B, Parking B1/)).toHaveValue("Apt 3B");
  });

  it("should render type select", () => {
    renderWithProviders(<UnitForm propertyId="prop-1" />);
    // Radix Select renders a combobox button with placeholder
    expect(screen.getByText(/Sélectionnez un type/i)).toBeInTheDocument();
  });

  it("should validate required identifier", async () => {
    const user = userEvent.setup();
    renderWithProviders(<UnitForm propertyId="prop-1" />);

    await user.click(
      screen.getByRole("button", { name: /Créer le lot/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/L'identifiant est requis/i),
      ).toBeInTheDocument();
    });
  });

  it("should show floor and surface fields", () => {
    renderWithProviders(<UnitForm propertyId="prop-1" />);
    expect(screen.getByPlaceholderText(/Ex : 3/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ex : 65.5/)).toBeInTheDocument();
  });

  it("should show billable options fieldset", () => {
    renderWithProviders(<UnitForm propertyId="prop-1" />);
    expect(
      screen.getByText(/Options facturables \(optionnel\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Ajouter une option/i }),
    ).toBeInTheDocument();
  });

  it("should add billable option row on click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<UnitForm propertyId="prop-1" />);

    await user.click(
      screen.getByRole("button", { name: /Ajouter une option/i }),
    );

    // Should now show label and amount input fields by placeholder
    expect(screen.getByPlaceholderText(/Entretien chaudière/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/0\.00/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Supprimer cette option/i }),
    ).toBeInTheDocument();
  });

  it("should remove billable option row on delete", async () => {
    const user = userEvent.setup();
    renderWithProviders(<UnitForm propertyId="prop-1" />);

    await user.click(
      screen.getByRole("button", { name: /Ajouter une option/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /Supprimer cette option/i }),
    );

    expect(screen.queryByPlaceholderText(/Entretien chaudière/)).not.toBeInTheDocument();
  });

  it("should render billable options from initialData in edit mode", () => {
    renderWithProviders(
      <UnitForm propertyId="prop-1" initialData={editUnit} />,
    );
    // Should show the pre-existing billable option
    expect(
      screen.getByRole("button", { name: /Supprimer cette option/i }),
    ).toBeInTheDocument();
  });

  it("should call onCancel prop when provided", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    renderWithProviders(
      <UnitForm propertyId="prop-1" onCancel={onCancel} />,
    );

    await user.click(screen.getByRole("button", { name: /Annuler/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("should fallback to router.back when no onCancel", async () => {
    const user = userEvent.setup();
    renderWithProviders(<UnitForm propertyId="prop-1" />);

    await user.click(screen.getByRole("button", { name: /Annuler/i }));
    expect(mockBack).toHaveBeenCalled();
  });

  it("should show validation errors for missing required fields on submit", async () => {
    const user = userEvent.setup();
    renderWithProviders(<UnitForm propertyId="prop-1" />);

    // Submit with no fields filled
    await user.click(
      screen.getByRole("button", { name: /Créer le lot/i }),
    );

    await waitFor(() => {
      // Type is required and not filled
      expect(screen.getByText(/Le type est requis/i)).toBeInTheDocument();
    });
  });
});
