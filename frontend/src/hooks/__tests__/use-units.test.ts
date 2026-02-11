import { describe, it, expect, vi, beforeEach } from "vitest";
import { waitFor, act } from "@testing-library/react";
import { renderHookWithProviders } from "@/test/test-utils";
import { useEntityUnits, useUnits, useCreateUnit, useUpdateUnit } from "../use-units";
import type { UnitData } from "@/lib/api/units-api";

const mockUnits: UnitData[] = [
  {
    id: "unit-1",
    propertyId: "prop-1",
    userId: "user_test123",
    identifier: "Apt 101",
    type: "apartment",
    floor: 1,
    surfaceArea: 45.5,
    billableOptions: [{ label: "Loyer", amountCents: 85000 }],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
];

const mockGetUnitsByEntity = vi.fn().mockResolvedValue(mockUnits);
const mockGetUnits = vi.fn().mockResolvedValue(mockUnits);
const mockGetUnit = vi.fn();
const mockCreateUnit = vi.fn().mockResolvedValue(undefined);
const mockUpdateUnit = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/api/units-api", () => ({
  useUnitsApi: () => ({
    getUnitsByEntity: mockGetUnitsByEntity,
    getUnits: mockGetUnits,
    getUnit: mockGetUnit,
    createUnit: mockCreateUnit,
    updateUnit: mockUpdateUnit,
  }),
}));

describe("useEntityUnits", () => {
  it("should fetch units by entity", async () => {
    const { result } = renderHookWithProviders(() =>
      useEntityUnits("entity-1"),
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockUnits);
    expect(mockGetUnitsByEntity).toHaveBeenCalledWith("entity-1");
  });

  it("should not fetch when entityId is empty", () => {
    const { result } = renderHookWithProviders(() => useEntityUnits(""));

    expect(result.current.isFetching).toBe(false);
    expect(mockGetUnitsByEntity).not.toHaveBeenCalled();
  });
});

describe("useUnits", () => {
  it("should fetch units by property", async () => {
    const { result } = renderHookWithProviders(() => useUnits("prop-1"));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockGetUnits).toHaveBeenCalledWith("prop-1");
  });

  it("should use property-scoped query key", async () => {
    const { queryClient } = renderHookWithProviders(() => useUnits("prop-1"));

    await waitFor(() => {
      const data = queryClient.getQueryData(["properties", "prop-1", "units"]);
      expect(data).toBeDefined();
    });
  });
});

describe("useCreateUnit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should optimistically add a unit", async () => {
    vi.useFakeTimers();
    const { result, queryClient } = renderHookWithProviders(() =>
      useCreateUnit("prop-1"),
    );
    queryClient.setQueryData(["properties", "prop-1", "units"], mockUnits);

    await act(async () => {
      result.current.mutate({
        id: "unit-2",
        identifier: "Parking P01",
        type: "parking",
        surfaceArea: 12,
        billableOptions: [],
      });
    });

    const data = queryClient.getQueryData<UnitData[]>([
      "properties", "prop-1", "units",
    ]);
    expect(data).toHaveLength(2);
    expect(data?.[1]?.identifier).toBe("Parking P01");
    vi.useRealTimers();
  });

  it("should handle floor undefined as null in optimistic data", async () => {
    vi.useFakeTimers();
    const { result, queryClient } = renderHookWithProviders(() =>
      useCreateUnit("prop-1"),
    );
    queryClient.setQueryData(["properties", "prop-1", "units"], []);

    await act(async () => {
      result.current.mutate({
        id: "unit-2",
        identifier: "Parking P01",
        type: "parking",
        surfaceArea: 12,
      });
    });

    const data = queryClient.getQueryData<UnitData[]>([
      "properties", "prop-1", "units",
    ]);
    expect(data?.[0]?.floor).toBeNull();
    vi.useRealTimers();
  });

  it("should default billableOptions to empty array in optimistic data", async () => {
    vi.useFakeTimers();
    const { result, queryClient } = renderHookWithProviders(() =>
      useCreateUnit("prop-1"),
    );
    queryClient.setQueryData(["properties", "prop-1", "units"], []);

    await act(async () => {
      result.current.mutate({
        id: "unit-2",
        identifier: "Apt 202",
        type: "apartment",
        surfaceArea: 30,
      });
    });

    const data = queryClient.getQueryData<UnitData[]>([
      "properties", "prop-1", "units",
    ]);
    expect(data?.[0]?.billableOptions).toEqual([]);
    vi.useRealTimers();
  });

  it("should invalidate entities query on settled (cross-query)", async () => {
    vi.useFakeTimers();
    const { result, queryClient } = renderHookWithProviders(() =>
      useCreateUnit("prop-1"),
    );
    queryClient.setQueryData(["properties", "prop-1", "units"], []);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    await act(async () => {
      result.current.mutate({
        id: "unit-2",
        identifier: "Apt 202",
        type: "apartment",
        surfaceArea: 30,
      });
    });

    expect(invalidateSpy).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["entities"],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["properties", "prop-1", "units"],
    });
    vi.useRealTimers();
  });

  it("should rollback on error", async () => {
    mockCreateUnit.mockRejectedValueOnce(new Error("Server error"));

    const { result, queryClient } = renderHookWithProviders(() =>
      useCreateUnit("prop-1"),
    );
    queryClient.setQueryData(["properties", "prop-1", "units"], mockUnits);

    act(() => {
      result.current.mutate({
        id: "unit-2",
        identifier: "Fail",
        type: "parking",
        surfaceArea: 12,
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const data = queryClient.getQueryData<UnitData[]>([
      "properties", "prop-1", "units",
    ]);
    expect(data).toHaveLength(1);
  });
});

describe("useUpdateUnit", () => {
  it("should optimistically update a unit", async () => {
    vi.useFakeTimers();
    const { result, queryClient } = renderHookWithProviders(() =>
      useUpdateUnit("unit-1", "prop-1"),
    );
    queryClient.setQueryData(["properties", "prop-1", "units"], mockUnits);

    await act(async () => {
      result.current.mutate({ identifier: "Apt 102" });
    });

    const data = queryClient.getQueryData<UnitData[]>([
      "properties", "prop-1", "units",
    ]);
    expect(data?.[0]?.identifier).toBe("Apt 102");
    vi.useRealTimers();
  });
});
