import { describe, it, expect, vi, beforeEach } from "vitest";
import { waitFor, act } from "@testing-library/react";
import { renderHookWithProviders } from "@/test/test-utils";
import { useProperties, useCreateProperty, useUpdateProperty } from "../use-properties";
import type { PropertyData } from "@/lib/api/properties-api";

const mockProperties: PropertyData[] = [
  {
    id: "prop-1",
    entityId: "entity-1",
    userId: "user_test123",
    name: "Résidence Les Pins",
    type: "immeuble",
    addressStreet: "12 Rue des Lilas",
    addressPostalCode: "75001",
    addressCity: "Paris",
    addressCountry: "France",
    addressComplement: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
];

const mockGetProperties = vi.fn().mockResolvedValue(mockProperties);
const mockGetProperty = vi.fn();
const mockCreateProperty = vi.fn().mockResolvedValue(undefined);
const mockUpdateProperty = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/api/properties-api", () => ({
  usePropertiesApi: () => ({
    getProperties: mockGetProperties,
    getProperty: mockGetProperty,
    createProperty: mockCreateProperty,
    updateProperty: mockUpdateProperty,
  }),
}));

describe("useProperties", () => {
  it("should fetch properties for an entity", async () => {
    const { result } = renderHookWithProviders(() =>
      useProperties("entity-1"),
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockProperties);
    expect(mockGetProperties).toHaveBeenCalledWith("entity-1");
  });

  it("should not fetch when entityId is empty", () => {
    const { result } = renderHookWithProviders(() => useProperties(""));

    expect(result.current.isFetching).toBe(false);
    expect(mockGetProperties).not.toHaveBeenCalled();
  });
});

describe("useCreateProperty", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should optimistically add a property with country default", async () => {
    vi.useFakeTimers();
    const { result, queryClient } = renderHookWithProviders(() =>
      useCreateProperty("entity-1"),
    );
    queryClient.setQueryData(["entities", "entity-1", "properties"], mockProperties);

    await act(async () => {
      result.current.mutate({
        id: "prop-2",
        name: "Résidence Les Chênes",
        address: {
          street: "5 Avenue Victor Hugo",
          postalCode: "69001",
          city: "Lyon",
        },
      });
    });

    const data = queryClient.getQueryData<PropertyData[]>([
      "entities", "entity-1", "properties",
    ]);
    expect(data).toHaveLength(2);
    expect(data?.[1]?.name).toBe("Résidence Les Chênes");
    expect(data?.[1]?.addressCountry).toBe("France");
    vi.useRealTimers();
  });

  it("should rollback on error", async () => {
    mockCreateProperty.mockRejectedValueOnce(new Error("Server error"));

    const { result, queryClient } = renderHookWithProviders(() =>
      useCreateProperty("entity-1"),
    );
    queryClient.setQueryData(["entities", "entity-1", "properties"], mockProperties);

    act(() => {
      result.current.mutate({
        id: "prop-2",
        name: "Fail",
        address: { street: "1", postalCode: "75001", city: "Paris" },
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const data = queryClient.getQueryData<PropertyData[]>([
      "entities", "entity-1", "properties",
    ]);
    expect(data).toHaveLength(1);
  });

  it("should delay invalidation by 1500ms", async () => {
    vi.useFakeTimers();
    const { result, queryClient } = renderHookWithProviders(() =>
      useCreateProperty("entity-1"),
    );
    queryClient.setQueryData(["entities", "entity-1", "properties"], []);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    await act(async () => {
      result.current.mutate({
        id: "prop-2",
        name: "Test",
        address: { street: "1", postalCode: "75001", city: "Paris" },
      });
    });

    expect(invalidateSpy).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["entities", "entity-1", "properties"],
    });
    vi.useRealTimers();
  });
});

describe("useUpdateProperty", () => {
  it("should optimistically update a property", async () => {
    vi.useFakeTimers();
    const { result, queryClient } = renderHookWithProviders(() =>
      useUpdateProperty("prop-1", "entity-1"),
    );
    queryClient.setQueryData(["entities", "entity-1", "properties"], mockProperties);

    await act(async () => {
      result.current.mutate({ name: "Résidence Renommée" });
    });

    const data = queryClient.getQueryData<PropertyData[]>([
      "entities", "entity-1", "properties",
    ]);
    expect(data?.[0]?.name).toBe("Résidence Renommée");
    vi.useRealTimers();
  });
});
