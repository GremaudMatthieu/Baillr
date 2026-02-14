import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import {
  useRevisions,
  useCalculateRevisions,
  useApproveRevisions,
} from "@/hooks/use-revisions";

const mockGetRevisions = vi.fn();
const mockCalculateRevisions = vi.fn();
const mockApproveRevisions = vi.fn();

vi.mock("@/lib/api/revisions-api", () => ({
  useRevisionsApi: () => ({
    getRevisions: mockGetRevisions,
    calculateRevisions: mockCalculateRevisions,
    approveRevisions: mockApproveRevisions,
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

describe("useApproveRevisions", () => {
  beforeEach(() => {
    mockApproveRevisions.mockReset();
  });

  it("should call approveRevisions API with revision ids", async () => {
    mockApproveRevisions.mockResolvedValue(undefined);

    const { result } = renderHook(
      () => useApproveRevisions("entity-123"),
      { wrapper: createWrapper() },
    );

    result.current.mutate(["rev-1", "rev-2"]);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApproveRevisions).toHaveBeenCalledWith(
      "entity-123",
      ["rev-1", "rev-2"],
    );
  });

  it("should handle approval errors", async () => {
    mockApproveRevisions.mockRejectedValue(new Error("Approval failed"));

    const { result } = renderHook(
      () => useApproveRevisions("entity-123"),
      { wrapper: createWrapper() },
    );

    result.current.mutate(["rev-1"]);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it("should optimistically update revision status to approved", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    // Pre-populate cache with pending revisions
    queryClient.setQueryData(["entities", "entity-123", "revisions"], [
      { id: "rev-1", status: "pending", approvedAt: null },
      { id: "rev-2", status: "pending", approvedAt: null },
    ]);

    // API resolves successfully — onMutate runs before mutationFn,
    // onSettled invalidation is delayed 1500ms so optimistic data persists
    mockApproveRevisions.mockResolvedValue(undefined);

    const { result } = renderHook(
      () => useApproveRevisions("entity-123"),
      { wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync(["rev-1"]);
    });

    const cached = queryClient.getQueryData<
      { id: string; status: string; approvedAt: string | null }[]
    >(["entities", "entity-123", "revisions"]);
    expect(cached?.[0].status).toBe("approved");
    expect(cached?.[0].approvedAt).toBeTruthy();
    expect(cached?.[1].status).toBe("pending");
  });

  it("should rollback optimistic update on error", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);

    queryClient.setQueryData(["entities", "entity-123", "revisions"], [
      { id: "rev-1", status: "pending", approvedAt: null },
    ]);

    mockApproveRevisions.mockRejectedValue(new Error("Server error"));

    const { result } = renderHook(
      () => useApproveRevisions("entity-123"),
      { wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync(["rev-1"]).catch(() => {});
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
      const cached = queryClient.getQueryData<
        { id: string; status: string }[]
      >(["entities", "entity-123", "revisions"]);
      expect(cached?.[0].status).toBe("pending");
    });
  });
});
