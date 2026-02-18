import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { KpiTiles } from "../kpi-tiles";

const mockUseDashboardKpis = vi.fn();

vi.mock("@/hooks/use-rent-calls", () => ({
  useDashboardKpis: (...args: unknown[]) => mockUseDashboardKpis(...args),
}));

const mockData = {
  currentMonth: {
    collectionRatePercent: 85.5,
    totalCalledCents: 200000,
    totalReceivedCents: 171000,
    unpaidCount: 2,
    outstandingDebtCents: 29000,
  },
  previousMonth: {
    collectionRatePercent: 80,
    totalCalledCents: 180000,
    totalReceivedCents: 144000,
    unpaidCount: 3,
    outstandingDebtCents: 0,
  },
};

describe("KpiTiles", () => {
  it("should render 5 KPI tiles with correct labels", () => {
    mockUseDashboardKpis.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(
      <KpiTiles entityId="entity-1" selectedMonth="2026-02" />,
    );

    expect(screen.getByText("Taux d'encaissement")).toBeInTheDocument();
    expect(screen.getByText("Loyers appelés")).toBeInTheDocument();
    expect(screen.getByText("Paiements reçus")).toBeInTheDocument();
    expect(screen.getByText("Impayés")).toBeInTheDocument();
    expect(screen.getByText("Encours total")).toBeInTheDocument();
  });

  it("should show collection rate as percentage", () => {
    mockUseDashboardKpis.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(
      <KpiTiles entityId="entity-1" selectedMonth="2026-02" />,
    );

    // 85.5% → "85,5 %"
    expect(screen.getByText("85,5 %")).toBeInTheDocument();
  });

  it("should show compact amounts without cents", () => {
    mockUseDashboardKpis.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
    });

    renderWithProviders(
      <KpiTiles entityId="entity-1" selectedMonth="2026-02" />,
    );

    // 200000 cents = 2000€ → compact "2 000 €" (no cents, narrow no-break space)
    expect(screen.getByText(/2.000.€/)).toBeInTheDocument();
    // 171000 cents = 1710€ → compact "1 710 €"
    expect(screen.getByText(/1.710.€/)).toBeInTheDocument();
    // 29000 cents = 290€ → compact "290 €"
    expect(screen.getByText(/290.€/)).toBeInTheDocument();
    // Verify unpaid count
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("should show loading skeletons when loading", () => {
    mockUseDashboardKpis.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    const { container } = renderWithProviders(
      <KpiTiles entityId="entity-1" selectedMonth="2026-02" />,
    );

    // Should have skeleton elements (5 tiles)
    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
    // Should NOT show any label text
    expect(screen.queryByText("Taux d'encaissement")).not.toBeInTheDocument();
  });

  it("should show zeros for empty data (no rent calls)", () => {
    mockUseDashboardKpis.mockReturnValue({
      data: {
        currentMonth: {
          collectionRatePercent: 0,
          totalCalledCents: 0,
          totalReceivedCents: 0,
          unpaidCount: 0,
          outstandingDebtCents: 0,
        },
        previousMonth: {
          collectionRatePercent: 0,
          totalCalledCents: 0,
          totalReceivedCents: 0,
          unpaidCount: 0,
          outstandingDebtCents: 0,
        },
      },
      isLoading: false,
      isError: false,
    });

    renderWithProviders(
      <KpiTiles entityId="entity-1" selectedMonth="2026-02" />,
    );

    expect(screen.getByText("0,0 %")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("should show dash for error state", () => {
    mockUseDashboardKpis.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    renderWithProviders(
      <KpiTiles entityId="entity-1" selectedMonth="2026-02" />,
    );

    const dashes = screen.getAllByText("—");
    expect(dashes).toHaveLength(5);
  });

  it("should show negative trend with minus sign for percentage", () => {
    mockUseDashboardKpis.mockReturnValue({
      data: {
        currentMonth: {
          collectionRatePercent: 75,
          totalCalledCents: 200000,
          totalReceivedCents: 150000,
          unpaidCount: 3,
          outstandingDebtCents: 50000,
        },
        previousMonth: {
          collectionRatePercent: 80,
          totalCalledCents: 180000,
          totalReceivedCents: 144000,
          unpaidCount: 2,
          outstandingDebtCents: 0,
        },
      },
      isLoading: false,
      isError: false,
    });

    renderWithProviders(
      <KpiTiles entityId="entity-1" selectedMonth="2026-02" />,
    );

    // Collection rate dropped 80 → 75 = -5.0 pts, must show "-5,0 pts"
    expect(screen.getByText("-5,0 pts")).toBeInTheDocument();
  });

  it("should not show trends when previous month has no data", () => {
    mockUseDashboardKpis.mockReturnValue({
      data: {
        currentMonth: {
          collectionRatePercent: 85.5,
          totalCalledCents: 200000,
          totalReceivedCents: 171000,
          unpaidCount: 2,
          outstandingDebtCents: 29000,
        },
        previousMonth: {
          collectionRatePercent: 0,
          totalCalledCents: 0,
          totalReceivedCents: 0,
          unpaidCount: 0,
          outstandingDebtCents: 0,
        },
      },
      isLoading: false,
      isError: false,
    });

    renderWithProviders(
      <KpiTiles entityId="entity-1" selectedMonth="2026-02" />,
    );

    // No trend indicators should be shown when previous month has no activity
    expect(screen.queryByLabelText("En hausse")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("En baisse")).not.toBeInTheDocument();
  });
});
