import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useRecordManualPayment } from "../use-record-manual-payment";

const mockRecordManualPayment = vi.fn();

vi.mock("@/lib/api/rent-calls-api", () => ({
  useRentCallsApi: () => ({
    recordManualPayment: mockRecordManualPayment,
  }),
}));

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: vi.fn() }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      children,
    );
  };
}

const paymentData = {
  amountCents: 85000,
  paymentMethod: "cash" as const,
  paymentDate: "2026-02-14",
  payerName: "Jean Dupont",
};

describe("useRecordManualPayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return initial state", () => {
    const { result } = renderHook(
      () => useRecordManualPayment("entity-1"),
      { wrapper: createWrapper() },
    );

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.recordPayment).toBe("function");
  });

  it("should record payment successfully", async () => {
    mockRecordManualPayment.mockResolvedValue(undefined);

    const { result } = renderHook(
      () => useRecordManualPayment("entity-1"),
      { wrapper: createWrapper() },
    );

    let success: boolean = false;
    await act(async () => {
      success = await result.current.recordPayment("rc-1", paymentData);
    });

    expect(success).toBe(true);
    expect(result.current.error).toBeNull();
    expect(mockRecordManualPayment).toHaveBeenCalledWith(
      "entity-1",
      "rc-1",
      paymentData,
    );
  });

  it("should handle error", async () => {
    mockRecordManualPayment.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(
      () => useRecordManualPayment("entity-1"),
      { wrapper: createWrapper() },
    );

    let success: boolean = true;
    await act(async () => {
      success = await result.current.recordPayment("rc-1", paymentData);
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe("Network error");
  });

  it("should reset error on new attempt", async () => {
    mockRecordManualPayment.mockRejectedValueOnce(new Error("Fail"));
    mockRecordManualPayment.mockResolvedValueOnce(undefined);

    const { result } = renderHook(
      () => useRecordManualPayment("entity-1"),
      { wrapper: createWrapper() },
    );

    await act(async () => {
      await result.current.recordPayment("rc-1", paymentData);
    });
    expect(result.current.error).toBe("Fail");

    await act(async () => {
      await result.current.recordPayment("rc-1", paymentData);
    });
    expect(result.current.error).toBeNull();
  });
});
