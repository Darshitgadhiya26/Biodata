import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import * as maternalService from '@/services/maternalService';
import type { MaternalRelative } from '@/types';

export function useMaternalRelatives(biodataId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.maternalRelatives(biodataId),
    queryFn: () => maternalService.getMaternalRelatives(biodataId as string),
    enabled: Boolean(biodataId),
  });
}

function useMaternalInvalidation(biodataId: string | undefined) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.maternalRelatives(biodataId) });
}

export function useAddMaternalRelative(biodataId: string | undefined) {
  const invalidate = useMaternalInvalidation(biodataId);

  return useMutation({
    mutationFn: ({ name, displayOrder }: { name: string; displayOrder: number }) =>
      maternalService.addMaternalRelative(biodataId as string, name, displayOrder),
    onSuccess: invalidate,
  });
}

export function useUpdateMaternalRelative(biodataId: string | undefined) {
  const invalidate = useMaternalInvalidation(biodataId);

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      maternalService.updateMaternalRelative(id, name),
    onSuccess: invalidate,
  });
}

export function useDeleteMaternalRelative(biodataId: string | undefined) {
  const invalidate = useMaternalInvalidation(biodataId);

  return useMutation({
    mutationFn: (id: string) => maternalService.deleteMaternalRelative(id),
    onSuccess: invalidate,
  });
}

export function useReorderMaternalRelatives(biodataId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (items: MaternalRelative[]) =>
      maternalService.reorderMaternalRelatives(
        items.map((item, index) => ({ id: item.id, display_order: index })),
      ),
    onMutate: async (items) => {
      const key = queryKeys.maternalRelatives(biodataId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<MaternalRelative[]>(key);
      queryClient.setQueryData<MaternalRelative[]>(
        key,
        items.map((item, index) => ({ ...item, display_order: index })),
      );
      return { previous };
    },
    onError: (_error, _items, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.maternalRelatives(biodataId), context.previous);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.maternalRelatives(biodataId) }),
  });
}
