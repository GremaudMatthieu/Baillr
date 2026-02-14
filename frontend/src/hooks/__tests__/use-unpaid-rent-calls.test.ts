import { describe, it, expect, vi, beforeEach } from "vitest";
import { waitFor } from "@testing-library/react";
import { renderHookWithProviders } from "@/test/test-utils";
import { useUnpaidRentCalls } from "../use-unpaid-rent-calls";
import type { UnpaidRentCallData } from "@/lib/api/rent-calls-api";

const mockUnpaidData: UnpaidRentCallData[] = [
  {
    id: "rc-1",
    entityId: "entity-1",
    leaseId: "lease-1",
    tenantId: "tenant-1",
    unitId: "unit-1",
    month: "2026-01",
    totalAmountCents: 80000,
    paidAmountCents: null,
    remainingBalanceCents: null,
    paymentStatus: null,
    sentAt: "2026-01-01T00:00:00Z",
    tenantFirstName: "Jean",
    tenantLastName: "Dupont",
    tenantCompanyName: null,
    tenantType: "individual",
    unitIdentifier: "A1",
    dueDate: "2026-01-05T00:00:00Z",
    daysLate: 36,
  },
];

const mockGetUnpaidRentCalls = vi.fn().mockResolvedValue(mockUnpaidData);

vi.mock("@/lib/api/rent-calls-api", () => ({
  useRentCallsApi: () => ({
    getUnpaidRentCalls: mockGetUnpaidRentCalls,
  }),
}));

describe("useUnpaidRentCalls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch unpaid rent calls for entity", async () => {
    const { result } = renderHookWithProviders(() =>
      useUnpaidRentCalls("entity-1"),
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockUnpaidData);
    expect(mockGetUnpaidRentCalls).toHaveBeenCalledWith("entity-1");
  });

  it("should not fetch when entityId is undefined", () => {
    const { result } = renderHookWithProviders(() =>
      useUnpaidRentCalls(undefined),
    );

    expect(result.current.isFetching).toBe(false);
    expect(mockGetUnpaidRentCalls).not.toHaveBeenCalled();
  });
});
