"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEntitiesApi, type EntityData } from "@/lib/api/entities-api";

export function useConfigureLatePaymentDelay(entityId: string) {
  const api = useEntitiesApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (days: number) =>
      api.configureLatePaymentDelay(entityId, days),
    onMutate: async (days) => {
      await queryClient.cancelQueries({ queryKey: ["entities", entityId] });
      await queryClient.cancelQueries({ queryKey: ["entities"] });

      const previousDetail = queryClient.getQueryData<EntityData>([
        "entities",
        entityId,
      ]);
      const previousList =
        queryClient.getQueryData<EntityData[]>(["entities"]);

      if (previousDetail) {
        queryClient.setQueryData<EntityData>(["entities", entityId], {
          ...previousDetail,
          latePaymentDelayDays: days,
        });
      }

      queryClient.setQueryData<EntityData[]>(["entities"], (old) =>
        old?.map((e) =>
          e.id === entityId ? { ...e, latePaymentDelayDays: days } : e,
        ),
      );

      return { previousDetail, previousList };
    },
    onError: (_err, _days, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(
          ["entities", entityId],
          context.previousDetail,
        );
      }
      if (context?.previousList) {
        queryClient.setQueryData(["entities"], context.previousList);
      }
    },
    onSettled: () => {
      setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: ["entities"] });
        void queryClient.invalidateQueries({
          queryKey: ["entities", entityId],
        });
        void queryClient.invalidateQueries({
          queryKey: ["entities", entityId, "rent-calls", "unpaid"],
        });
      }, 1500);
    },
  });
}
