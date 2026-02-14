import { describe, it, expect, vi, beforeEach } from "vitest";
import { waitFor, act } from "@testing-library/react";
import { renderHookWithProviders } from "@/test/test-utils";
import { useConfigureLatePaymentDelay } from "../use-configure-late-payment-delay";

const mockConfigureLatePaymentDelay = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/api/entities-api", () => ({
  useEntitiesApi: () => ({
    configureLatePaymentDelay: mockConfigureLatePaymentDelay,
  }),
}));

describe("useConfigureLatePaymentDelay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call configureLatePaymentDelay API with correct params", async () => {
    const { result } = renderHookWithProviders(() =>
      useConfigureLatePaymentDelay("entity-1"),
    );

    await act(async () => {
      result.current.mutate(10);
    });

    await waitFor(() => {
      expect(mockConfigureLatePaymentDelay).toHaveBeenCalledWith(
        "entity-1",
        10,
      );
    });
  });

  it("should set isPending while mutating", async () => {
    let resolvePromise: () => void;
    mockConfigureLatePaymentDelay.mockReturnValue(
      new Promise<void>((resolve) => {
        resolvePromise = resolve;
      }),
    );

    const { result } = renderHookWithProviders(() =>
      useConfigureLatePaymentDelay("entity-1"),
    );

    act(() => {
      result.current.mutate(10);
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    await act(async () => {
      resolvePromise!();
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });
});
