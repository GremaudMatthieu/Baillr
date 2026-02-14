import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createWrapper } from "@/test/test-utils";

const mockMatchPayments = vi.fn();

vi.mock("@/lib/api/bank-statements-api", () => ({
  useBankStatementsApi: () => ({
    matchPayments: mockMatchPayments,
  }),
}));

import { useMatchPayments } from "../use-bank-statements";

describe("useMatchPayments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useMatchPayments("entity-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.result).toBeNull();
  });

  it("should call matchPayments API and return result", async () => {
    const mockResult = {
      matches: [{ transactionId: "tx-1", rentCallId: "rc-1" }],
      ambiguous: [],
      unmatched: [],
      summary: { matched: 1, unmatched: 0, ambiguous: 0, rentCallCount: 1 },
    };
    mockMatchPayments.mockResolvedValue(mockResult);

    const { result } = renderHook(() => useMatchPayments("entity-1"), {
      wrapper: createWrapper(),
    });

    let matchResult: unknown;
    await act(async () => {
      matchResult = await result.current.matchPayments("bs-1", "2026-02");
    });

    expect(mockMatchPayments).toHaveBeenCalledWith("entity-1", "bs-1", "2026-02");
    expect(result.current.result).toEqual(mockResult);
    expect(matchResult).toEqual(mockResult);
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should handle errors", async () => {
    mockMatchPayments.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useMatchPayments("entity-1"), {
      wrapper: createWrapper(),
    });

    let matchResult: unknown;
    await act(async () => {
      matchResult = await result.current.matchPayments("bs-1", "2026-02");
    });

    expect(result.current.error).toBe("Network error");
    expect(result.current.result).toBeNull();
    expect(matchResult).toBeNull();
    expect(result.current.isPending).toBe(false);
  });

  it("should set isPending during execution", async () => {
    let resolvePromise!: (value: unknown) => void;
    mockMatchPayments.mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      }),
    );

    const { result } = renderHook(() => useMatchPayments("entity-1"), {
      wrapper: createWrapper(),
    });

    let pendingPromise: Promise<unknown>;
    act(() => {
      pendingPromise = result.current.matchPayments("bs-1", "2026-02");
    });

    expect(result.current.isPending).toBe(true);

    await act(async () => {
      resolvePromise({ matches: [], ambiguous: [], unmatched: [], summary: { matched: 0, unmatched: 0, ambiguous: 0, rentCallCount: 0 } });
      await pendingPromise!;
    });

    expect(result.current.isPending).toBe(false);
  });
});
