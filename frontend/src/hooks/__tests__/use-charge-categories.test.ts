import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";

const mockGetChargeCategories = vi.fn();
const mockCreateChargeCategory = vi.fn();

vi.mock("@/lib/api/charge-categories-api", () => ({
  useChargeCategoriesApi: () => ({
    getChargeCategories: mockGetChargeCategories,
    createChargeCategory: mockCreateChargeCategory,
  }),
}));

import { useChargeCategories, useCreateChargeCategory } from "../use-charge-categories";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
}

describe("useChargeCategories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch charge categories for entity", async () => {
    const mockData = [
      { id: "cat-1", entityId: "entity-1", slug: "water", label: "Eau", isStandard: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
      { id: "cat-2", entityId: "entity-1", slug: "electricity", label: "Électricité", isStandard: true, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
    ];
    mockGetChargeCategories.mockResolvedValue(mockData);

    const { result } = renderHook(
      () => useChargeCategories("entity-1"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(mockGetChargeCategories).toHaveBeenCalledWith("entity-1");
  });

  it("should not fetch when entityId is empty", () => {
    const { result } = renderHook(
      () => useChargeCategories(""),
      { wrapper: createWrapper() },
    );

    expect(result.current.isFetching).toBe(false);
    expect(mockGetChargeCategories).not.toHaveBeenCalled();
  });
});

describe("useCreateChargeCategory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call create API on mutate", async () => {
    const created = { id: "cat-new", entityId: "entity-1", slug: "custom", label: "Custom", isStandard: false, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" };
    mockCreateChargeCategory.mockResolvedValue(created);

    const { result } = renderHook(
      () => useCreateChargeCategory("entity-1"),
      { wrapper: createWrapper() },
    );

    result.current.mutate("Custom");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockCreateChargeCategory).toHaveBeenCalledWith("entity-1", "Custom");
  });

  it("should handle mutation error", async () => {
    mockCreateChargeCategory.mockRejectedValue(new Error("Conflict"));

    const { result } = renderHook(
      () => useCreateChargeCategory("entity-1"),
      { wrapper: createWrapper() },
    );

    result.current.mutate("Duplicate");

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Conflict");
  });
});
