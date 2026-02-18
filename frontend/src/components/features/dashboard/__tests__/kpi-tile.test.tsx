import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { Percent } from "lucide-react";
import { KpiTile } from "../kpi-tile";

describe("KpiTile", () => {
  it("should render label and formatted value", () => {
    renderWithProviders(
      <KpiTile
        label="Taux d'encaissement"
        value="85,2 %"
        trend={null}
        icon={Percent}
      />,
    );

    expect(screen.getByText("Taux d'encaissement")).toBeInTheDocument();
    expect(screen.getByText("85,2 %")).toBeInTheDocument();
  });

  it("should apply tabular-nums class on value", () => {
    renderWithProviders(
      <KpiTile
        label="Loyers appelés"
        value="12 450,00 €"
        trend={null}
        icon={Percent}
      />,
    );

    const valueEl = screen.getByText("12 450,00 €");
    expect(valueEl.className).toContain("tabular-nums");
  });

  it("should show green up arrow for positive trend (isPositiveGood=true)", () => {
    renderWithProviders(
      <KpiTile
        label="Collection"
        value="90 %"
        trend={5}
        trendLabel="+5,0 pts"
        icon={Percent}
        isPositiveGood
      />,
    );

    expect(screen.getByText("+5,0 pts")).toBeInTheDocument();
    const trendEl = screen.getByLabelText("En hausse");
    expect(trendEl.className).toContain("text-green-600");
  });

  it("should show red down arrow for negative trend (isPositiveGood=true)", () => {
    renderWithProviders(
      <KpiTile
        label="Collection"
        value="70 %"
        trend={-10}
        trendLabel="-10,0 pts"
        icon={Percent}
        isPositiveGood
      />,
    );

    const trendEl = screen.getByLabelText("En baisse");
    expect(trendEl.className).toContain("text-red-600");
  });

  it("should show green down arrow for negative trend on inverted KPI (isPositiveGood=false)", () => {
    renderWithProviders(
      <KpiTile
        label="Impayés"
        value="2"
        trend={-1}
        trendLabel="-1"
        icon={Percent}
        isPositiveGood={false}
      />,
    );

    const trendEl = screen.getByLabelText("En baisse");
    expect(trendEl.className).toContain("text-green-600");
  });

  it("should show neutral dash for zero trend", () => {
    renderWithProviders(
      <KpiTile
        label="Collection"
        value="85 %"
        trend={0}
        icon={Percent}
        isPositiveGood
      />,
    );

    // No hausse/baisse label, should have Minus icon rendered
    expect(screen.queryByLabelText("En hausse")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("En baisse")).not.toBeInTheDocument();
  });

  it("should not show any trend indicator when trend is null", () => {
    renderWithProviders(
      <KpiTile
        label="Collection"
        value="85 %"
        trend={null}
        icon={Percent}
      />,
    );

    expect(screen.queryByLabelText("En hausse")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("En baisse")).not.toBeInTheDocument();
  });

  it("should render skeleton when loading", () => {
    const { container } = renderWithProviders(
      <KpiTile
        label="Collection"
        value="85 %"
        trend={5}
        icon={Percent}
        loading
      />,
    );

    // Should not render the value text
    expect(screen.queryByText("85 %")).not.toBeInTheDocument();
    // Should have skeleton elements (pulse animation placeholders)
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
