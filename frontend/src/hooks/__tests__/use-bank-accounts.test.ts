import { describe, it, expect, vi, beforeEach } from "vitest";
import { waitFor, act } from "@testing-library/react";
import { renderHookWithProviders } from "@/test/test-utils";
import {
  useBankAccounts,
  useAddBankAccount,
  useUpdateBankAccount,
  useRemoveBankAccount,
} from "../use-bank-accounts";
import type { BankAccountData } from "@/lib/api/bank-accounts-api";

const mockAccounts: BankAccountData[] = [
  {
    id: "ba-1",
    entityId: "entity-1",
    type: "bank_account",
    label: "Compte courant",
    iban: "FR7612345678901234567890123",
    bic: "BNPAFRPP",
    bankName: "BNP Paribas",
    isDefault: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  },
];

const mockGetBankAccounts = vi.fn().mockResolvedValue(mockAccounts);
const mockAddBankAccount = vi.fn().mockResolvedValue(undefined);
const mockUpdateBankAccount = vi.fn().mockResolvedValue(undefined);
const mockRemoveBankAccount = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/api/bank-accounts-api", () => ({
  useBankAccountsApi: () => ({
    getBankAccounts: mockGetBankAccounts,
    addBankAccount: mockAddBankAccount,
    updateBankAccount: mockUpdateBankAccount,
    removeBankAccount: mockRemoveBankAccount,
  }),
}));

describe("useBankAccounts", () => {
  it("should fetch bank accounts for an entity", async () => {
    const { result } = renderHookWithProviders(() =>
      useBankAccounts("entity-1"),
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockAccounts);
    expect(mockGetBankAccounts).toHaveBeenCalledWith("entity-1");
  });

  it("should not fetch when entityId is empty", () => {
    const { result } = renderHookWithProviders(() => useBankAccounts(""));

    expect(result.current.isFetching).toBe(false);
    expect(mockGetBankAccounts).not.toHaveBeenCalled();
  });
});

describe("useAddBankAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should optimistically add a bank account", async () => {
    vi.useFakeTimers();
    const { result, queryClient } = renderHookWithProviders(() =>
      useAddBankAccount("entity-1"),
    );
    queryClient.setQueryData(["entities", "entity-1", "bank-accounts"], mockAccounts);

    await act(async () => {
      result.current.mutate({
        accountId: "ba-2",
        type: "bank_account",
        label: "Compte épargne",
        iban: "FR7698765432109876543210987",
        isDefault: false,
      });
    });

    const data = queryClient.getQueryData<BankAccountData[]>([
      "entities", "entity-1", "bank-accounts",
    ]);
    expect(data).toHaveLength(2);
    expect(data?.[1]?.label).toBe("Compte épargne");
    vi.useRealTimers();
  });

  it("should unset previous default when adding new default", async () => {
    vi.useFakeTimers();
    const { result, queryClient } = renderHookWithProviders(() =>
      useAddBankAccount("entity-1"),
    );
    queryClient.setQueryData(["entities", "entity-1", "bank-accounts"], mockAccounts);

    await act(async () => {
      result.current.mutate({
        accountId: "ba-2",
        type: "bank_account",
        label: "Nouveau défaut",
        isDefault: true,
      });
    });

    const data = queryClient.getQueryData<BankAccountData[]>([
      "entities", "entity-1", "bank-accounts",
    ]);
    expect(data?.[0]?.isDefault).toBe(false);
    expect(data?.[1]?.isDefault).toBe(true);
    vi.useRealTimers();
  });

  it("should rollback on error", async () => {
    mockAddBankAccount.mockRejectedValueOnce(new Error("Server error"));

    const { result, queryClient } = renderHookWithProviders(() =>
      useAddBankAccount("entity-1"),
    );
    queryClient.setQueryData(["entities", "entity-1", "bank-accounts"], mockAccounts);

    act(() => {
      result.current.mutate({
        accountId: "ba-2",
        type: "bank_account",
        label: "Compte épargne",
        isDefault: false,
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const data = queryClient.getQueryData<BankAccountData[]>([
      "entities", "entity-1", "bank-accounts",
    ]);
    expect(data).toHaveLength(1);
    expect(data?.[0]?.id).toBe("ba-1");
  });
});

describe("useUpdateBankAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should optimistically update a bank account label", async () => {
    vi.useFakeTimers();
    const { result, queryClient } = renderHookWithProviders(() =>
      useUpdateBankAccount("entity-1"),
    );
    queryClient.setQueryData(["entities", "entity-1", "bank-accounts"], mockAccounts);

    await act(async () => {
      result.current.mutate({
        accountId: "ba-1",
        payload: { label: "Compte principal" },
      });
    });

    const data = queryClient.getQueryData<BankAccountData[]>([
      "entities", "entity-1", "bank-accounts",
    ]);
    expect(data?.[0]?.label).toBe("Compte principal");
    vi.useRealTimers();
  });

  it("should unset previous default when updating to new default", async () => {
    vi.useFakeTimers();
    const twoAccounts: BankAccountData[] = [
      ...mockAccounts,
      {
        id: "ba-2",
        entityId: "entity-1",
        type: "bank_account",
        label: "Épargne",
        iban: "FR7698765432109876543210987",
        bic: null,
        bankName: null,
        isDefault: false,
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
    ];
    const { result, queryClient } = renderHookWithProviders(() =>
      useUpdateBankAccount("entity-1"),
    );
    queryClient.setQueryData(["entities", "entity-1", "bank-accounts"], twoAccounts);

    await act(async () => {
      result.current.mutate({
        accountId: "ba-2",
        payload: { isDefault: true },
      });
    });

    const data = queryClient.getQueryData<BankAccountData[]>([
      "entities", "entity-1", "bank-accounts",
    ]);
    expect(data?.[0]?.isDefault).toBe(false);
    expect(data?.[1]?.isDefault).toBe(true);
    vi.useRealTimers();
  });

  it("should rollback on error", async () => {
    mockUpdateBankAccount.mockRejectedValueOnce(new Error("Server error"));

    const { result, queryClient } = renderHookWithProviders(() =>
      useUpdateBankAccount("entity-1"),
    );
    queryClient.setQueryData(["entities", "entity-1", "bank-accounts"], mockAccounts);

    act(() => {
      result.current.mutate({
        accountId: "ba-1",
        payload: { label: "Nom modifié" },
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    const data = queryClient.getQueryData<BankAccountData[]>([
      "entities", "entity-1", "bank-accounts",
    ]);
    expect(data?.[0]?.label).toBe("Compte courant");
  });
});

describe("useRemoveBankAccount", () => {
  it("should optimistically remove a bank account", async () => {
    vi.useFakeTimers();
    const { result, queryClient } = renderHookWithProviders(() =>
      useRemoveBankAccount("entity-1"),
    );
    queryClient.setQueryData(["entities", "entity-1", "bank-accounts"], mockAccounts);

    await act(async () => {
      result.current.mutate("ba-1");
    });

    const data = queryClient.getQueryData<BankAccountData[]>([
      "entities", "entity-1", "bank-accounts",
    ]);
    expect(data).toHaveLength(0);
    vi.useRealTimers();
  });
});
