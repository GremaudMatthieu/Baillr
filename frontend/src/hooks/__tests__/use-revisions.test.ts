import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useRevisions, useCalculateRevisions } from "@/hooks/use-revisions";

const mockGetRevisions = vi.fn();
const mockCalculateRevisions = vi.fn();

vi.mock("@/lib/api/revisions-api", () => ({
  useRevisionsApi: () => ({
    getRevisions: mockGetRevisions,
    calculateRevisions: mockCalculateRevisions,
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useRevisions", () => {
  beforeEach(() => {
    mockGetRevisions.mockReset();
  });

  it("should fetch revisions for entity", async () => {
    const mockData = [
      { id: "rev-1", tenantName: "Dupont", status: "pending" },
    ];
    mockGetRevisions.mockResolvedValue(mockData);

    const { result } = renderHook(() => useRevisions("entity-123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockGetRevisions).toHaveBeenCalledWith("entity-123");
    expect(result.current.data).toEqual(mockData);
  });

  it("should not fetch when entityId is undefined", () => {
    mockGetRevisions.mockResolvedValue([]);

    renderHook(() => useRevisions(undefined), {
      wrapper: createWrapper(),
    });

    expect(mockGetRevisions).not.toHaveBeenCalled();
  });
});

describe("useCalculateRevisions", () => {
  beforeEach(() => {
    mockCalculateRevisions.mockReset();
  });

  it("should call calculateRevisions API", async () => {
    mockCalculateRevisions.mockResolvedValue({
      calculated: 2,
      skipped: [],
      errors: [],
    });

    const { result } = renderHook(
      () => useCalculateRevisions("entity-123"),
      { wrapper: createWrapper() },
    );

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockCalculateRevisions).toHaveBeenCalledWith("entity-123");
    expect(result.current.data?.calculated).toBe(2);
  });

  it("should handle errors", async () => {
    mockCalculateRevisions.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(
      () => useCalculateRevisions("entity-123"),
      { wrapper: createWrapper() },
    );

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
