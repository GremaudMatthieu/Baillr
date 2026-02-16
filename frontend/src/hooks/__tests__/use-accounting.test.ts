import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";

const mockGetAccountBook = vi.fn();

vi.mock("@/lib/api/accounting-api", () => ({
  useAccountingApi: () => ({
    getAccountBook: mockGetAccountBook,
  }),
}));

import { useAccountBook } from "../use-accounting";

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

describe("useAccountBook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch account book for entity", async () => {
    const mockData = {
      entries: [
        {
          id: "ae-1",
          entityId: "entity-1",
          tenantId: "tenant-1",
          type: "debit",
          category: "rent_call",
          description: "Appel de loyer - 2026-01",
          amountCents: 80000,
          balanceCents: 80000,
          referenceId: "rc-1",
          referenceMonth: "2026-01",
          entryDate: "2026-01-05T00:00:00Z",
          createdAt: "2026-01-05T00:00:00Z",
          tenant: {
            firstName: "Jean",
            lastName: "Dupont",
            companyName: null,
            type: "individual",
          },
        },
      ],
      totalBalanceCents: 80000,
      availableCategories: ["rent_call"],
    };
    mockGetAccountBook.mockResolvedValue(mockData);

    const { result } = renderHook(
      () => useAccountBook("entity-1"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(mockGetAccountBook).toHaveBeenCalledWith("entity-1", undefined);
  });

  it("should not fetch when entityId is undefined", () => {
    const { result } = renderHook(
      () => useAccountBook(undefined),
      { wrapper: createWrapper() },
    );

    expect(result.current.isFetching).toBe(false);
    expect(mockGetAccountBook).not.toHaveBeenCalled();
  });

  it("should forward filters to the API", async () => {
    mockGetAccountBook.mockResolvedValue({
      entries: [],
      totalBalanceCents: 0,
      availableCategories: [],
    });

    const filters = {
      startDate: "2026-01-01",
      endDate: "2026-01-31",
      category: "payment",
      tenantId: "tenant-1",
    };

    const { result } = renderHook(
      () => useAccountBook("entity-1", filters),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetAccountBook).toHaveBeenCalledWith("entity-1", filters);
  });

  it("should return loading state initially", () => {
    mockGetAccountBook.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(
      () => useAccountBook("entity-1"),
      { wrapper: createWrapper() },
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });
});
