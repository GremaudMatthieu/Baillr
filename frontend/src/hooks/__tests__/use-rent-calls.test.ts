import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi } from "vitest";
import React from "react";

// Mock the API module
const mockGenerateRentCalls = vi.fn();
const mockGetRentCalls = vi.fn();
const mockSendRentCallsByEmail = vi.fn();

vi.mock("@/lib/api/rent-calls-api", () => ({
  useRentCallsApi: () => ({
    generateRentCalls: mockGenerateRentCalls,
    getRentCalls: mockGetRentCalls,
    sendRentCallsByEmail: mockSendRentCallsByEmail,
  }),
}));

import {
  useRentCalls,
  useGenerateRentCalls,
  useSendRentCallsByEmail,
} from "../use-rent-calls";

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

describe("useRentCalls", () => {
  it("should fetch rent calls for entity", async () => {
    const mockData = [
      {
        id: "rc-1",
        entityId: "entity-1",
        month: "2026-03",
        totalAmountCents: 85000,
      },
    ];
    mockGetRentCalls.mockResolvedValue(mockData);

    const { result } = renderHook(() => useRentCalls("entity-1", "2026-03"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(mockGetRentCalls).toHaveBeenCalledWith("entity-1", "2026-03");
  });

  it("should not fetch when entityId is empty", () => {
    const { result } = renderHook(() => useRentCalls(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(mockGetRentCalls).not.toHaveBeenCalled();
  });
});

describe("useGenerateRentCalls", () => {
  it("should call generate API on mutate", async () => {
    const mockResult = {
      generated: 2,
      totalAmountCents: 150000,
      exceptions: [],
    };
    mockGenerateRentCalls.mockResolvedValue(mockResult);

    const { result } = renderHook(() => useGenerateRentCalls("entity-1"), {
      wrapper: createWrapper(),
    });

    result.current.mutate("2026-03");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockResult);
    expect(mockGenerateRentCalls).toHaveBeenCalledWith("entity-1", "2026-03");
  });

  it("should handle error", async () => {
    mockGenerateRentCalls.mockRejectedValue(new Error("Already generated"));

    const { result } = renderHook(() => useGenerateRentCalls("entity-1"), {
      wrapper: createWrapper(),
    });

    result.current.mutate("2026-03");

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Already generated");
  });
});

describe("useSendRentCallsByEmail", () => {
  it("should call send API on mutate and return SendResult", async () => {
    const mockResult = {
      sent: 3,
      failed: 1,
      totalAmountCents: 255000,
      failures: ["Jean Dupont"],
    };
    mockSendRentCallsByEmail.mockResolvedValue(mockResult);

    const { result } = renderHook(
      () => useSendRentCallsByEmail("entity-1"),
      { wrapper: createWrapper() },
    );

    result.current.mutate("2026-02");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockResult);
    expect(mockSendRentCallsByEmail).toHaveBeenCalledWith("entity-1", "2026-02");
  });

  it("should handle API error", async () => {
    mockSendRentCallsByEmail.mockRejectedValue(new Error("SMTP error"));

    const { result } = renderHook(
      () => useSendRentCallsByEmail("entity-1"),
      { wrapper: createWrapper() },
    );

    result.current.mutate("2026-02");

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("SMTP error");
  });

  it("should return SendResult with failures", async () => {
    const mockResult = {
      sent: 0,
      failed: 2,
      totalAmountCents: 0,
      failures: ["Tenant A", "Tenant B"],
    };
    mockSendRentCallsByEmail.mockResolvedValue(mockResult);

    const { result } = renderHook(
      () => useSendRentCallsByEmail("entity-1"),
      { wrapper: createWrapper() },
    );

    result.current.mutate("2026-02");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.failures).toEqual(["Tenant A", "Tenant B"]);
    expect(result.current.data?.sent).toBe(0);
    expect(result.current.data?.failed).toBe(2);
  });
});
