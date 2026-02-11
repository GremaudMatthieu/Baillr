import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { DashboardContent } from "../dashboard-content";

const mockUseCurrentEntity = vi.fn();

vi.mock("@/hooks/use-current-entity", () => ({
  useCurrentEntity: () => mockUseCurrentEntity(),
}));

vi.mock("../kpi-tiles-placeholder", () => ({
  KpiTilesPlaceholder: () => <div data-testid="kpi-tiles-placeholder" />,
}));

vi.mock("../unit-mosaic", () => ({
  UnitMosaic: ({ entityId }: { entityId: string }) => (
    <div data-testid="unit-mosaic">{entityId}</div>
  ),
}));

vi.mock("../unit-mosaic-placeholder", () => ({
  UnitMosaicPlaceholder: () => <div data-testid="unit-mosaic-placeholder" />,
}));

describe("DashboardContent", () => {
  it("should render KPI tiles placeholder", () => {
    mockUseCurrentEntity.mockReturnValue({
      entityId: "entity-1",
      entity: null,
      entities: [],
      setCurrentEntityId: vi.fn(),
      isLoading: false,
    });

    renderWithProviders(<DashboardContent />);
    expect(screen.getByTestId("kpi-tiles-placeholder")).toBeInTheDocument();
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
    expect(screen.getByTestId("unit-mosaic")).toHaveTextContent("entity-1");
  });

  it("should render UnitMosaicPlaceholder when no entityId", () => {
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
    expect(screen.queryByTestId("unit-mosaic")).not.toBeInTheDocument();
  });
});
