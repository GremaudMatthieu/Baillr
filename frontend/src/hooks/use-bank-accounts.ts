"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useBankAccountsApi,
  type AddBankAccountPayload,
  type UpdateBankAccountPayload,
  type BankAccountData,
} from "@/lib/api/bank-accounts-api";

export function useBankAccounts(entityId: string) {
  const api = useBankAccountsApi();
  return useQuery({
    queryKey: ["entities", entityId, "bank-accounts"],
    queryFn: () => api.getBankAccounts(entityId),
    enabled: !!entityId,
    staleTime: 30_000,
  });
}

export function useAddBankAccount(entityId: string) {
  const api = useBankAccountsApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddBankAccountPayload) =>
      api.addBankAccount(entityId, payload),
    onMutate: async (payload) => {
      const queryKey = ["entities", entityId, "bank-accounts"];
      await queryClient.cancelQueries({ queryKey });
      const previous =
        queryClient.getQueryData<BankAccountData[]>(queryKey);

      const optimistic: BankAccountData = {
        id: payload.accountId,
        entityId,
        type: payload.type,
        label: payload.label,
        iban: payload.iban ?? null,
        bic: payload.bic ?? null,
        bankName: payload.bankName ?? null,
        isDefault: payload.isDefault,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<BankAccountData[]>(queryKey, (old) => {
        const list = old ?? [];
        // If new account is default, unset previous default
        if (payload.isDefault) {
          return [
            ...list.map((a) => (a.isDefault ? { ...a, isDefault: false } : a)),
            optimistic,
          ];
        }
        return [...list, optimistic];
      });

      return { previous };
    },
    onError: (_err, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["entities", entityId, "bank-accounts"],
          context.previous,
        );
      }
    },
    onSettled: () => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: ["entities", entityId, "bank-accounts"],
        });
      }, 1500);
    },
  });
}

export function useUpdateBankAccount(entityId: string) {
  const api = useBankAccountsApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      payload,
    }: {
      accountId: string;
      payload: UpdateBankAccountPayload;
    }) => api.updateBankAccount(entityId, accountId, payload),
    onMutate: async ({ accountId, payload }) => {
      const queryKey = ["entities", entityId, "bank-accounts"];
      await queryClient.cancelQueries({ queryKey });
      const previous =
        queryClient.getQueryData<BankAccountData[]>(queryKey);

      queryClient.setQueryData<BankAccountData[]>(queryKey, (old) =>
        old?.map((a) => {
          if (a.id === accountId) {
            return {
              ...a,
              ...(payload.label !== undefined && { label: payload.label }),
              ...(payload.iban !== undefined && { iban: payload.iban ?? null }),
              ...(payload.bic !== undefined && { bic: payload.bic ?? null }),
              ...(payload.bankName !== undefined && {
                bankName: payload.bankName ?? null,
              }),
              ...(payload.isDefault !== undefined && {
                isDefault: payload.isDefault,
              }),
              updatedAt: new Date().toISOString(),
            };
          }
          // If setting new default, unset others
          if (payload.isDefault === true && a.isDefault) {
            return { ...a, isDefault: false };
          }
          return a;
        }),
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["entities", entityId, "bank-accounts"],
          context.previous,
        );
      }
    },
    onSettled: () => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: ["entities", entityId, "bank-accounts"],
        });
      }, 1500);
    },
  });
}

export function useRemoveBankAccount(entityId: string) {
  const api = useBankAccountsApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (accountId: string) =>
      api.removeBankAccount(entityId, accountId),
    onMutate: async (accountId) => {
      const queryKey = ["entities", entityId, "bank-accounts"];
      await queryClient.cancelQueries({ queryKey });
      const previous =
        queryClient.getQueryData<BankAccountData[]>(queryKey);

      queryClient.setQueryData<BankAccountData[]>(queryKey, (old) =>
        old?.filter((a) => a.id !== accountId),
      );

      return { previous };
    },
    onError: (_err, _accountId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["entities", entityId, "bank-accounts"],
          context.previous,
        );
      }
    },
    onSettled: () => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: ["entities", entityId, "bank-accounts"],
        });
      }, 1500);
    },
  });
}
