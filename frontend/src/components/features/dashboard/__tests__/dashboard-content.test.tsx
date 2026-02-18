import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { DashboardContent } from "../dashboard-content";

const mockUseCurrentEntity = vi.fn();

vi.mock("@/hooks/use-current-entity", () => ({
  useCurrentEntity: () => mockUseCurrentEntity(),
}));

vi.mock("@/lib/month-options", () => ({
  getCurrentMonth: () => "2026-02",
  getMonthOptions: () => [{ value: "2026-02", label: "février 2026" }],
}));

vi.mock("../kpi-tiles", () => ({
  KpiTiles: ({
    entityId,
    selectedMonth,
  }: {
    entityId: string;
    selectedMonth: string;
  }) => (
    <div data-testid="kpi-tiles">
      {entityId}-{selectedMonth}
    </div>
  ),
}));

vi.mock("../unit-mosaic", () => ({
  UnitMosaic: ({
    entityId,
    selectedMonth,
  }: {
    entityId: string;
    selectedMonth: string;
  }) => (
    <div data-testid="unit-mosaic">
      {entityId}-{selectedMonth}
    </div>
  ),
}));

vi.mock("../unit-mosaic-placeholder", () => ({
  UnitMosaicPlaceholder: () => <div data-testid="unit-mosaic-placeholder" />,
}));

describe("DashboardContent", () => {
  it("should render KpiTiles when entityId is available", () => {
    mockUseCurrentEntity.mockReturnValue({
      entityId: "entity-1",
      entity: null,
      entities: [],
      setCurrentEntityId: vi.fn(),
      isLoading: false,
    });

    renderWithProviders(<DashboardContent />);
    expect(screen.getByTestId("kpi-tiles")).toBeInTheDocument();
    expect(screen.getByTestId("kpi-tiles")).toHaveTextContent(
      "entity-1-2026-02",
    );
  });

  it("should render UnitMosaic when entityId is available", () => {
    mockUseCurrentEntity.mockReturnValue({
      entityId: "entity-1",
      entity: null,
      entities: [],
      setCurrentEntityId: vi.fn(),
      isLoading: false,
    });

    renderWithProviders(<DashboardContent />);
    expect(screen.getByTestId("unit-mosaic")).toBeInTheDocument();
    expect(screen.getByTestId("unit-mosaic")).toHaveTextContent(
      "entity-1-2026-02",
    );
  });

  it("should render placeholders when no entityId", () => {
    mockUseCurrentEntity.mockReturnValue({
      entityId: null,
      entity: null,
      entities: [],
      setCurrentEntityId: vi.fn(),
      isLoading: false,
    });

    renderWithProviders(<DashboardContent />);
    expect(
      screen.getByTestId("unit-mosaic-placeholder"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("kpi-tiles")).not.toBeInTheDocument();
    expect(screen.queryByTestId("unit-mosaic")).not.toBeInTheDocument();
  });
});
