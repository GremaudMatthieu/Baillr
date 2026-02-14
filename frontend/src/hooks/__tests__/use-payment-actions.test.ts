import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";

// Mock the API module
const mockValidateMatch = vi.fn();
const mockRejectMatch = vi.fn();
const mockManualAssignMatch = vi.fn();

vi.mock("@/lib/api/bank-statements-api", () => ({
  useBankStatementsApi: () => ({
    validateMatch: mockValidateMatch,
    rejectMatch: mockRejectMatch,
    manualAssignMatch: mockManualAssignMatch,
  }),
}));

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: vi.fn().mockResolvedValue("test-token") }),
}));

import {
  useValidateMatch,
  useRejectMatch,
  useManualAssignMatch,
  usePaymentActions,
} from "../use-payment-actions";

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

const ENTITY_ID = "entity-1";

const validatePayload = {
  transactionId: "tx-1",
  rentCallId: "rc-1",
  amountCents: 85000,
  payerName: "Dupont Jean",
  paymentDate: "2026-02-15",
  bankStatementId: "bs-1",
};

const rejectPayload = { transactionId: "tx-2" };

const assignPayload = {
  transactionId: "tx-3",
  rentCallId: "rc-2",
  amountCents: 75000,
  payerName: "Martin Marie",
  paymentDate: "2026-02-16",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useValidateMatch", () => {
  it("should call API and return success", async () => {
    mockValidateMatch.mockResolvedValue(undefined);

    const { result } = renderHook(() => useValidateMatch(ENTITY_ID), {
      wrapper: createWrapper(),
    });

    let success: boolean;
    await act(async () => {
      success = await result.current.validate(validatePayload);
    });

    expect(success!).toBe(true);
    expect(mockValidateMatch).toHaveBeenCalledWith(ENTITY_ID, validatePayload);
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should set error on failure", async () => {
    mockValidateMatch.mockRejectedValue(new Error("Validation failed"));

    const { result } = renderHook(() => useValidateMatch(ENTITY_ID), {
      wrapper: createWrapper(),
    });

    let success: boolean;
    await act(async () => {
      success = await result.current.validate(validatePayload);
    });

    expect(success!).toBe(false);
    expect(result.current.error).toBe("Validation failed");
  });
});

describe("useRejectMatch", () => {
  it("should call API and return success", async () => {
    mockRejectMatch.mockResolvedValue(undefined);

    const { result } = renderHook(() => useRejectMatch(ENTITY_ID), {
      wrapper: createWrapper(),
    });

    let success: boolean;
    await act(async () => {
      success = await result.current.reject(rejectPayload);
    });

    expect(success!).toBe(true);
    expect(mockRejectMatch).toHaveBeenCalledWith(ENTITY_ID, rejectPayload);
  });

  it("should set error on failure", async () => {
    mockRejectMatch.mockRejectedValue(new Error("Reject failed"));

    const { result } = renderHook(() => useRejectMatch(ENTITY_ID), {
      wrapper: createWrapper(),
    });

    let success: boolean;
    await act(async () => {
      success = await result.current.reject(rejectPayload);
    });

    expect(success!).toBe(false);
    expect(result.current.error).toBe("Reject failed");
  });
});

describe("useManualAssignMatch", () => {
  it("should call API and return success", async () => {
    mockManualAssignMatch.mockResolvedValue(undefined);

    const { result } = renderHook(() => useManualAssignMatch(ENTITY_ID), {
      wrapper: createWrapper(),
    });

    let success: boolean;
    await act(async () => {
      success = await result.current.assign(assignPayload);
    });

    expect(success!).toBe(true);
    expect(mockManualAssignMatch).toHaveBeenCalledWith(ENTITY_ID, assignPayload);
  });

  it("should set error on failure", async () => {
    mockManualAssignMatch.mockRejectedValue(new Error("Assign failed"));

    const { result } = renderHook(() => useManualAssignMatch(ENTITY_ID), {
      wrapper: createWrapper(),
    });

    let success: boolean;
    await act(async () => {
      success = await result.current.assign(assignPayload);
    });

    expect(success!).toBe(false);
    expect(result.current.error).toBe("Assign failed");
  });
});

describe("usePaymentActions", () => {
  it("should track validated row status and progress", async () => {
    mockValidateMatch.mockResolvedValue(undefined);

    const { result } = renderHook(() => usePaymentActions(ENTITY_ID), {
      wrapper: createWrapper(),
    });

    expect(result.current.getRowStatus("tx-1")).toBe("default");
    expect(result.current.progress).toEqual({
      validated: 0,
      rejected: 0,
      assigned: 0,
    });

    await act(async () => {
      await result.current.handleValidate(validatePayload);
    });

    expect(result.current.getRowStatus("tx-1")).toBe("validated");
    expect(result.current.progress.validated).toBe(1);
  });

  it("should track rejected row status and progress", async () => {
    mockRejectMatch.mockResolvedValue(undefined);

    const { result } = renderHook(() => usePaymentActions(ENTITY_ID), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.handleReject(rejectPayload);
    });

    expect(result.current.getRowStatus("tx-2")).toBe("rejected");
    expect(result.current.progress.rejected).toBe(1);
  });

  it("should track assigned row status and progress", async () => {
    mockManualAssignMatch.mockResolvedValue(undefined);

    const { result } = renderHook(() => usePaymentActions(ENTITY_ID), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.handleAssign(assignPayload);
    });

    expect(result.current.getRowStatus("tx-3")).toBe("assigned");
    expect(result.current.progress.assigned).toBe(1);
  });

  it("should revert to default on validation failure", async () => {
    mockValidateMatch.mockRejectedValue(new Error("fail"));

    const { result } = renderHook(() => usePaymentActions(ENTITY_ID), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.handleValidate(validatePayload);
    });

    expect(result.current.getRowStatus("tx-1")).toBe("default");
    expect(result.current.progress.validated).toBe(0);
    expect(result.current.error).toBe("fail");
  });

  it("should ignore double-click when row is already processed", async () => {
    mockValidateMatch.mockResolvedValue(undefined);

    const { result } = renderHook(() => usePaymentActions(ENTITY_ID), {
      wrapper: createWrapper(),
    });

    // First call succeeds
    await act(async () => {
      await result.current.handleValidate(validatePayload);
    });
    expect(result.current.getRowStatus("tx-1")).toBe("validated");
    expect(mockValidateMatch).toHaveBeenCalledTimes(1);

    // Second call on same row should be ignored (guard)
    let secondResult: boolean;
    await act(async () => {
      secondResult = await result.current.handleValidate(validatePayload);
    });
    expect(secondResult!).toBe(false);
    expect(mockValidateMatch).toHaveBeenCalledTimes(1); // NOT called again
  });

  it("should aggregate errors from sub-hooks", async () => {
    mockValidateMatch.mockRejectedValue(new Error("API error"));

    const { result } = renderHook(() => usePaymentActions(ENTITY_ID), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.handleValidate(validatePayload);
    });

    expect(result.current.error).toBe("API error");
  });
});
