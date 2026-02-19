"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useOpenBankingApi,
  type BankConnectionData,
} from "@/lib/api/open-banking-api";

export function useOpenBankingStatus() {
  const api = useOpenBankingApi();
  return useQuery({
    queryKey: ["open-banking-status"],
    queryFn: () => api.getStatus(),
    staleTime: 60_000,
  });
}

export function useInstitutions(entityId: string, country: string = "fr") {
  const api = useOpenBankingApi();
  return useQuery({
    queryKey: ["entities", entityId, "institutions", country],
    queryFn: () => api.getInstitutions(entityId, country),
    enabled: !!entityId,
    staleTime: 60_000,
  });
}

export function useBankConnections(entityId: string) {
  const api = useOpenBankingApi();
  return useQuery({
    queryKey: ["entities", entityId, "bank-connections"],
    queryFn: () => api.getBankConnections(entityId),
    enabled: !!entityId,
    staleTime: 5 * 60_000,
  });
}

export function useInitiateBankConnection(entityId: string) {
  const api = useOpenBankingApi();
  return useMutation({
    mutationFn: ({
      bankAccountId,
      institutionId,
    }: {
      bankAccountId: string;
      institutionId: string;
    }) => api.initiateBankConnection(entityId, bankAccountId, institutionId),
  });
}

export function useCompleteBankConnection(entityId: string) {
  const api = useOpenBankingApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bankAccountId }: { bankAccountId: string }) =>
      api.completeBankConnection(entityId, bankAccountId),
    onSettled: () => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: ["entities", entityId, "bank-connections"],
        });
        void queryClient.invalidateQueries({
          queryKey: ["entities", entityId, "bank-accounts"],
        });
      }, 1500);
    },
  });
}

export function useSyncBankConnection(entityId: string) {
  const api = useOpenBankingApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      connectionId,
      since,
      until,
    }: {
      connectionId: string;
      since?: string;
      until?: string;
    }) =>
      api.syncBankConnection(entityId, connectionId, { since, until }),
    onSettled: () => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: ["entities", entityId, "bank-connections"],
        });
        void queryClient.invalidateQueries({
          queryKey: ["entities", entityId, "bank-statements"],
        });
        void queryClient.invalidateQueries({
          queryKey: ["entities", entityId, "rent-calls"],
        });
      }, 1500);
    },
  });
}

export function useDisconnectBankConnection(entityId: string) {
  const api = useOpenBankingApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (connectionId: string) =>
      api.disconnectBankConnection(entityId, connectionId),
    onMutate: async (connectionId) => {
      const queryKey = ["entities", entityId, "bank-connections"];
      await queryClient.cancelQueries({ queryKey });
      const previous =
        queryClient.getQueryData<BankConnectionData[]>(queryKey);

      queryClient.setQueryData<BankConnectionData[]>(queryKey, (old) =>
        old?.filter((c) => c.id !== connectionId),
      );

      return { previous };
    },
    onError: (_err, _connectionId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["entities", entityId, "bank-connections"],
          context.previous,
        );
      }
    },
    onSettled: () => {
      setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: ["entities", entityId, "bank-connections"],
        });
        void queryClient.invalidateQueries({
          queryKey: ["entities", entityId, "bank-accounts"],
        });
      }, 1500);
    },
  });
}
