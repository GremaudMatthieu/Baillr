import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi } from "vitest";
import React from "react";

// Mock the API module
const mockGetBankStatements = vi.fn();
const mockGetBankTransactions = vi.fn();
const mockImportBankStatement = vi.fn();

vi.mock("@/lib/api/bank-statements-api", () => ({
  useBankStatementsApi: () => ({
    getBankStatements: mockGetBankStatements,
    getBankTransactions: mockGetBankTransactions,
    importBankStatement: mockImportBankStatement,
  }),
}));

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: vi.fn().mockResolvedValue("test-token") }),
}));

import {
  useBankStatements,
  useBankTransactions,
  useImportBankStatement,
} from "../use-bank-statements";

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

describe("useBankStatements", () => {
  it("should fetch bank statements for entity", async () => {
    const mockData = [
      {
        id: "bs-1",
        bankAccountId: "ba-1",
        fileName: "releve.csv",
        transactionCount: 5,
        importedAt: "2026-02-13T10:00:00Z",
      },
    ];
    mockGetBankStatements.mockResolvedValue(mockData);

    const { result } = renderHook(() => useBankStatements("entity-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(mockGetBankStatements).toHaveBeenCalledWith("entity-1");
  });

  it("should not fetch when entityId is empty", () => {
    const { result } = renderHook(() => useBankStatements(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(mockGetBankStatements).not.toHaveBeenCalled();
  });
});

describe("useBankTransactions", () => {
  it("should fetch transactions for a bank statement", async () => {
    const mockData = [
      {
        id: "tx-1",
        bankStatementId: "bs-1",
        date: "2026-02-01",
        amountCents: 85000,
        payerName: "Jean Dupont",
        reference: "LOYER-FEV",
      },
    ];
    mockGetBankTransactions.mockResolvedValue(mockData);

    const { result } = renderHook(
      () => useBankTransactions("entity-1", "bs-1"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(mockGetBankTransactions).toHaveBeenCalledWith("entity-1", "bs-1");
  });

  it("should not fetch when bankStatementId is empty", () => {
    const { result } = renderHook(
      () => useBankTransactions("entity-1", ""),
      { wrapper: createWrapper() },
    );

    expect(result.current.isFetching).toBe(false);
  });
});

describe("useImportBankStatement", () => {
  it("should call import API and return result", async () => {
    const mockResult = {
      bankStatementId: "bs-1",
      transactionCount: 3,
      transactions: [
        {
          date: "2026-02-01",
          amountCents: 85000,
          payerName: "Jean Dupont",
          reference: "LOYER",
        },
      ],
    };
    mockImportBankStatement.mockResolvedValue(mockResult);

    const { result } = renderHook(
      () => useImportBankStatement("entity-1"),
      { wrapper: createWrapper() },
    );

    const file = new File(["content"], "releve.csv", { type: "text/csv" });
    const importResult = await result.current.importStatement(file, "ba-1");

    expect(importResult).toEqual(mockResult);
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should set error on failure", async () => {
    mockImportBankStatement.mockRejectedValue(new Error("Parse error"));

    const { result } = renderHook(
      () => useImportBankStatement("entity-1"),
      { wrapper: createWrapper() },
    );

    const file = new File(["content"], "releve.csv", { type: "text/csv" });
    let importResult: unknown;
    await waitFor(async () => {
      importResult = await result.current.importStatement(file, "ba-1");
    });

    expect(importResult).toBeNull();
    await waitFor(() => expect(result.current.error).toBe("Parse error"));
  });
});
