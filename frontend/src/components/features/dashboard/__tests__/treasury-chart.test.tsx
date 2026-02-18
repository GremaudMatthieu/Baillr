import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { TreasuryChart } from "../treasury-chart";

const mockUseTreasuryChart = vi.fn();

vi.mock("@/hooks/use-rent-calls", () => ({
  useTreasuryChart: (...args: unknown[]) => mockUseTreasuryChart(...args),
}));

// Mock recharts to avoid SVG rendering issues in jsdom
vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("recharts")>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container" style={{ width: 800, height: 300 }}>
        {children}
      </div>
    ),
  };
});

const mockData = [
  { month: "2025-03", calledCents: 100000, receivedCents: 80000 },
  { month: "2025-04", calledCents: 120000, receivedCents: 110000 },
  { month: "2025-05", calledCents: 130000, receivedCents: 130000 },
  { month: "2025-06", calledCents: 140000, receivedCents: 100000 },
  { month: "2025-07", calledCents: 150000, receivedCents: 140000 },
  { month: "2025-08", calledCents: 145000, receivedCents: 145000 },
  { month: "2025-09", calledCents: 160000, receivedCents: 150000 },
  { month: "2025-10", calledCents: 155000, receivedCents: 155000 },
  { month: "2025-11", calledCents: 170000, receivedCents: 160000 },
  { month: "2025-12", calledCents: 165000, receivedCents: 165000 },
  { month: "2026-01", calledCents: 180000, receivedCents: 170000 },
  { month: "2026-02", calledCents: 175000, receivedCents: 175000 },
];

describe("TreasuryChart", () => {
  it("should render chart with data for 12 months", () => {
    mockUseTreasuryChart.mockReturnValue({
      data: mockData,
      isLoading: false,
    });

    renderWithProviders(<TreasuryChart entityId="entity-1" />);

    expect(screen.getByText("Trésorerie")).toBeInTheDocument();
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    // Default 12 months selected
    expect(mockUseTreasuryChart).toHaveBeenCalledWith("entity-1", 12);
  });

  it("should render loading skeleton", () => {
    mockUseTreasuryChart.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    const { container } = renderWithProviders(
      <TreasuryChart entityId="entity-1" />,
    );

    // Skeleton elements present (no chart title visible yet, just skeletons)
    const skeletons = container.querySelectorAll('[class*="skeleton"], [data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("should render empty state when no data", () => {
    mockUseTreasuryChart.mockReturnValue({
      data: [],
      isLoading: false,
    });

    renderWithProviders(<TreasuryChart entityId="entity-1" />);

    expect(
      screen.getByText("Aucune donnée financière disponible"),
    ).toBeInTheDocument();
  });

  it("should render empty state when data is undefined", () => {
    mockUseTreasuryChart.mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    renderWithProviders(<TreasuryChart entityId="entity-1" />);

    expect(
      screen.getByText("Aucune donnée financière disponible"),
    ).toBeInTheDocument();
  });

  it("should render time range selector buttons", () => {
    mockUseTreasuryChart.mockReturnValue({
      data: mockData,
      isLoading: false,
    });

    renderWithProviders(<TreasuryChart entityId="entity-1" />);

    expect(screen.getByRole("button", { name: "6 mois" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "12 mois" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "24 mois" }),
    ).toBeInTheDocument();
  });

  it("should change months param when time range button is clicked", () => {
    mockUseTreasuryChart.mockReturnValue({
      data: mockData,
      isLoading: false,
    });

    renderWithProviders(<TreasuryChart entityId="entity-1" />);

    // Default is 12
    expect(mockUseTreasuryChart).toHaveBeenLastCalledWith("entity-1", 12);

    // Click 6 months
    fireEvent.click(screen.getByRole("button", { name: "6 mois" }));
    expect(mockUseTreasuryChart).toHaveBeenLastCalledWith("entity-1", 6);

    // Click 24 months
    fireEvent.click(screen.getByRole("button", { name: "24 mois" }));
    expect(mockUseTreasuryChart).toHaveBeenLastCalledWith("entity-1", 24);
  });

  it("should have 12 months button active by default", () => {
    mockUseTreasuryChart.mockReturnValue({
      data: mockData,
      isLoading: false,
    });

    renderWithProviders(<TreasuryChart entityId="entity-1" />);

    const btn12 = screen.getByRole("button", { name: "12 mois" });
    expect(btn12).toHaveAttribute("aria-pressed", "true");

    const btn6 = screen.getByRole("button", { name: "6 mois" });
    expect(btn6).toHaveAttribute("aria-pressed", "false");
  });

  it("should render recharts wrapper with chart data", () => {
    mockUseTreasuryChart.mockReturnValue({
      data: mockData,
      isLoading: false,
    });

    const { container } = renderWithProviders(
      <TreasuryChart entityId="entity-1" />,
    );

    // Recharts renders a wrapper div inside ResponsiveContainer
    const rechartsWrapper = container.querySelector(".recharts-wrapper");
    expect(rechartsWrapper).toBeInTheDocument();
  });
});
