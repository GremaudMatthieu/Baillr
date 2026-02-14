'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useRevisionsApi,
  type Revision,
  type BatchCalculationResult,
} from '@/lib/api/revisions-api';

export function useRevisions(entityId: string | undefined) {
  const api = useRevisionsApi();
  return useQuery<Revision[]>({
    queryKey: ['entities', entityId, 'revisions'],
    queryFn: () => api.getRevisions(entityId!),
    enabled: !!entityId,
    staleTime: 30_000,
  });
}

export function useCalculateRevisions(entityId: string | undefined) {
  const api = useRevisionsApi();
  const queryClient = useQueryClient();

  return useMutation<BatchCalculationResult, Error>({
    mutationFn: () => api.calculateRevisions(entityId!),
    onSettled: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ['entities', entityId, 'revisions'],
        });
      }, 1500);
    },
  });
}
