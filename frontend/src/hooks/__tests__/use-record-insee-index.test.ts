import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, waitFor } from "@testing-library/react";
import { renderHookWithProviders } from "@/test/test-utils";
import { useRecordInseeIndex } from "@/hooks/use-insee-indices";

const mockRecordInseeIndex = vi.fn();

vi.mock("@/lib/api/insee-indices-api", () => ({
  useInseeIndicesApi: () => ({
    getInseeIndices: vi.fn().mockResolvedValue([]),
    recordInseeIndex: mockRecordInseeIndex,
    fetchInseeIndices: vi.fn().mockResolvedValue({ fetched: 0, newIndices: 0, skipped: 0 }),
  }),
}));

describe("useRecordInseeIndex", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRecordInseeIndex.mockResolvedValue(undefined);
  });

  const entityId = "entity-123";

  const payload = {
    id: "idx-001",
    type: "IRL",
    quarter: "Q1",
    year: 2025,
    value: 142.06,
  };

  it("calls API with correct payload", async () => {
    const { result } = renderHookWithProviders(() =>
      useRecordInseeIndex(entityId),
    );

    await act(async () => {
      result.current.mutate(payload);
    });

    await waitFor(() => {
      expect(mockRecordInseeIndex).toHaveBeenCalledWith(entityId, payload);
    });
  });

  it("applies optimistic update to cache", async () => {
    const { result, queryClient } = renderHookWithProviders(() =>
      useRecordInseeIndex(entityId),
    );

    const queryKey = ["entities", entityId, "insee-indices"];
    queryClient.setQueryData(queryKey, []);

    await act(async () => {
      result.current.mutate(payload);
    });

    const cached = queryClient.getQueryData<unknown[]>(queryKey);
    expect(cached).toHaveLength(1);
    expect(cached?.[0]).toMatchObject({
      id: "idx-001",
      type: "IRL",
      quarter: "Q1",
      year: 2025,
      value: 142.06,
      entityId,
    });
  });

  it("rolls back cache on error", async () => {
    mockRecordInseeIndex.mockRejectedValue(new Error("Conflict"));

    const { result, queryClient } = renderHookWithProviders(() =>
      useRecordInseeIndex(entityId),
    );

    const queryKey = ["entities", entityId, "insee-indices"];
    const original = [{ id: "existing", type: "IRL", quarter: "Q1", year: 2024, value: 140 }];
    queryClient.setQueryData(queryKey, original);

    await act(async () => {
      result.current.mutate(payload);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const cached = queryClient.getQueryData<unknown[]>(queryKey);
    expect(cached).toEqual(original);
  });
});
