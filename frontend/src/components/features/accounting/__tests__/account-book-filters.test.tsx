import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AccountBookFilters } from "../account-book-filters";

const mockTenants = [
  {
    id: "t-1",
    firstName: "Jean",
    lastName: "Dupont",
    companyName: null,
    type: "individual",
  },
  {
    id: "t-2",
    firstName: "",
    lastName: "",
    companyName: "SCI Martin",
    type: "company",
  },
];

describe("AccountBookFilters", () => {
  it("should render all filter controls", () => {
    render(
      <AccountBookFilters
        filters={{}}
        onFiltersChange={vi.fn()}
        tenants={mockTenants}
        availableCategories={["rent_call", "payment"]}
      />,
    );

    expect(screen.getByLabelText("Date début")).toBeInTheDocument();
    expect(screen.getByLabelText("Date fin")).toBeInTheDocument();
    expect(screen.getByLabelText("Filtrer par type")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Filtrer par locataire"),
    ).toBeInTheDocument();
  });

  it("should call onFiltersChange when start date changes", () => {
    const onChange = vi.fn();
    render(
      <AccountBookFilters
        filters={{}}
        onFiltersChange={onChange}
        tenants={[]}
        availableCategories={[]}
      />,
    );

    fireEvent.change(screen.getByLabelText("Date début"), {
      target: { value: "2026-01-01" },
    });

    expect(onChange).toHaveBeenCalledWith({
      startDate: "2026-01-01",
    });
  });

  it("should call onFiltersChange when end date changes", () => {
    const onChange = vi.fn();
    render(
      <AccountBookFilters
        filters={{ startDate: "2026-01-01" }}
        onFiltersChange={onChange}
        tenants={[]}
        availableCategories={[]}
      />,
    );

    fireEvent.change(screen.getByLabelText("Date fin"), {
      target: { value: "2026-01-31" },
    });

    expect(onChange).toHaveBeenCalledWith({
      startDate: "2026-01-01",
      endDate: "2026-01-31",
    });
  });

  it("should clear date when value is empty", () => {
    const onChange = vi.fn();
    render(
      <AccountBookFilters
        filters={{ startDate: "2026-01-01" }}
        onFiltersChange={onChange}
        tenants={[]}
        availableCategories={[]}
      />,
    );

    fireEvent.change(screen.getByLabelText("Date début"), {
      target: { value: "" },
    });

    expect(onChange).toHaveBeenCalledWith({
      startDate: undefined,
    });
  });
});
