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

export function useApproveRevisions(entityId: string | undefined) {
  const api = useRevisionsApi();
  const queryClient = useQueryClient();

  return useMutation<void, Error, string[]>({
    mutationFn: (revisionIds: string[]) =>
      api.approveRevisions(entityId!, revisionIds),
    onMutate: async (revisionIds: string[]) => {
      await queryClient.cancelQueries({
        queryKey: ['entities', entityId, 'revisions'],
      });
      const previous = queryClient.getQueryData<Revision[]>([
        'entities',
        entityId,
        'revisions',
      ]);
      queryClient.setQueryData<Revision[]>(
        ['entities', entityId, 'revisions'],
        (old) =>
          old?.map((r) =>
            revisionIds.includes(r.id)
              ? { ...r, status: 'approved', approvedAt: new Date().toISOString() }
              : r,
          ),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if ((context as { previous?: Revision[] })?.previous) {
        queryClient.setQueryData(
          ['entities', entityId, 'revisions'],
          (context as { previous: Revision[] }).previous,
        );
      }
    },
    onSettled: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ['entities', entityId, 'revisions'],
        });
        queryClient.invalidateQueries({
          queryKey: ['entities', entityId, 'leases'],
        });
      }, 1500);
    },
  });
}
