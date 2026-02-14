import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";

// Mock the API module
const mockGetAnnualCharges = vi.fn();
const mockRecordAnnualCharges = vi.fn();
const mockGetProvisionsCollected = vi.fn();

vi.mock("@/lib/api/annual-charges-api", () => ({
  useAnnualChargesApi: () => ({
    getAnnualCharges: mockGetAnnualCharges,
    recordAnnualCharges: mockRecordAnnualCharges,
    getProvisionsCollected: mockGetProvisionsCollected,
  }),
}));

import {
  useAnnualCharges,
  useRecordAnnualCharges,
  useProvisionsCollected,
} from "../use-annual-charges";

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

describe("useAnnualCharges", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch annual charges for entity and fiscal year", async () => {
    const mockData = {
      id: "entity-1-2025",
      entityId: "entity-1",
      userId: "user_1",
      fiscalYear: 2025,
      charges: [
        { category: "water", label: "Eau", amountCents: 50000 },
        { category: "electricity", label: "Électricité", amountCents: 30000 },
      ],
      totalAmountCents: 80000,
      createdAt: "2026-01-15T00:00:00Z",
      updatedAt: "2026-01-15T00:00:00Z",
    };
    mockGetAnnualCharges.mockResolvedValue(mockData);

    const { result } = renderHook(
      () => useAnnualCharges("entity-1", 2025),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(mockGetAnnualCharges).toHaveBeenCalledWith("entity-1", 2025);
  });

  it("should not fetch when entityId is empty", () => {
    const { result } = renderHook(
      () => useAnnualCharges(""),
      { wrapper: createWrapper() },
    );

    expect(result.current.isFetching).toBe(false);
    expect(mockGetAnnualCharges).not.toHaveBeenCalled();
  });

  it("should use 'all' key when no fiscal year provided", async () => {
    mockGetAnnualCharges.mockResolvedValue(null);

    const { result } = renderHook(
      () => useAnnualCharges("entity-1"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetAnnualCharges).toHaveBeenCalledWith("entity-1", undefined);
  });
});

describe("useRecordAnnualCharges", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call record API on mutate", async () => {
    mockRecordAnnualCharges.mockResolvedValue(undefined);

    const { result } = renderHook(
      () => useRecordAnnualCharges("entity-1"),
      { wrapper: createWrapper() },
    );

    const payload = {
      id: "entity-1-2025",
      fiscalYear: 2025,
      charges: [
        { category: "water", label: "Eau", amountCents: 50000 },
      ],
    };

    result.current.mutate(payload);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRecordAnnualCharges).toHaveBeenCalledWith("entity-1", payload);
  });

  it("should handle mutation error", async () => {
    mockRecordAnnualCharges.mockRejectedValue(new Error("Server error"));

    const { result } = renderHook(
      () => useRecordAnnualCharges("entity-1"),
      { wrapper: createWrapper() },
    );

    result.current.mutate({
      id: "entity-1-2025",
      fiscalYear: 2025,
      charges: [],
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Server error");
  });
});

describe("useProvisionsCollected", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch provisions for entity and fiscal year", async () => {
    const mockData = {
      totalProvisionsCents: 60000,
      details: [
        { label: "Provisions sur charges", totalCents: 60000 },
      ],
    };
    mockGetProvisionsCollected.mockResolvedValue(mockData);

    const { result } = renderHook(
      () => useProvisionsCollected("entity-1", 2025),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(mockGetProvisionsCollected).toHaveBeenCalledWith("entity-1", 2025);
  });

  it("should not fetch when entityId is empty", () => {
    const { result } = renderHook(
      () => useProvisionsCollected("", 2025),
      { wrapper: createWrapper() },
    );

    expect(result.current.isFetching).toBe(false);
    expect(mockGetProvisionsCollected).not.toHaveBeenCalled();
  });

  it("should not fetch when fiscalYear is undefined", () => {
    const { result } = renderHook(
      () => useProvisionsCollected("entity-1"),
      { wrapper: createWrapper() },
    );

    expect(result.current.isFetching).toBe(false);
    expect(mockGetProvisionsCollected).not.toHaveBeenCalled();
  });
});
