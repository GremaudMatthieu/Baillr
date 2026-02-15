import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useChargeCategoriesApi, type ChargeCategoryData } from "@/lib/api/charge-categories-api";

export function useChargeCategories(entityId: string) {
  const api = useChargeCategoriesApi();

  return useQuery({
    queryKey: ["entities", entityId, "charge-categories"],
    queryFn: () => api.getChargeCategories(entityId),
    enabled: !!entityId,
    staleTime: 60 * 1000,
  });
}

export function useCreateChargeCategory(entityId: string) {
  const api = useChargeCategoriesApi();
  const queryClient = useQueryClient();

  return useMutation<ChargeCategoryData, Error, string>({
    mutationFn: (label: string) => api.createChargeCategory(entityId, label),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["entities", entityId, "charge-categories"],
      });
    },
  });
}

export function useDeleteChargeCategory(entityId: string) {
  const api = useChargeCategoriesApi();
  const queryClient = useQueryClient();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const mutation = useMutation<void, Error, string>({
    mutationFn: (id: string) => api.deleteChargeCategory(entityId, id),
    onSuccess: () => {
      setDeleteError(null);
      queryClient.invalidateQueries({
        queryKey: ["entities", entityId, "charge-categories"],
      });
    },
    onError: (error) => {
      setDeleteError(error.message);
    },
  });

  return { ...mutation, deleteError, clearDeleteError: () => setDeleteError(null) };
}
