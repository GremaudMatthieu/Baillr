import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, waitFor } from "@testing-library/react";
import { renderHookWithProviders } from "@/test/test-utils";
import { useFetchInseeIndices } from "@/hooks/use-insee-indices";

const mockFetchInseeIndices = vi.fn();

vi.mock("@/lib/api/insee-indices-api", () => ({
  useInseeIndicesApi: () => ({
    getInseeIndices: vi.fn().mockResolvedValue([]),
    recordInseeIndex: vi.fn().mockResolvedValue(undefined),
    fetchInseeIndices: mockFetchInseeIndices,
  }),
}));

describe("useFetchInseeIndices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchInseeIndices.mockResolvedValue({
      fetched: 8,
      newIndices: 3,
      skipped: 5,
    });
  });

  const entityId = "entity-123";

  it("calls API with correct entity ID", async () => {
    const { result } = renderHookWithProviders(() =>
      useFetchInseeIndices(entityId),
    );

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(mockFetchInseeIndices).toHaveBeenCalledWith(entityId);
    });
  });

  it("returns fetch results on success", async () => {
    const { result } = renderHookWithProviders(() =>
      useFetchInseeIndices(entityId),
    );

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual({
        fetched: 8,
        newIndices: 3,
        skipped: 5,
      });
    });
  });

  it("reports error on API failure", async () => {
    mockFetchInseeIndices.mockRejectedValue(new Error("Service unavailable"));

    const { result } = renderHookWithProviders(() =>
      useFetchInseeIndices(entityId),
    );

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
