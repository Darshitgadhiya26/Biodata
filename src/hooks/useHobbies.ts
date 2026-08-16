import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import * as hobbiesService from '@/services/hobbiesService';
import type { Hobby } from '@/types';

export function useHobbies(biodataId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.hobbies(biodataId),
    queryFn: () => hobbiesService.getHobbies(biodataId as string),
    enabled: Boolean(biodataId),
  });
}

/** Shared invalidation so every mutation below refreshes the same cache entry. */
function useHobbyInvalidation(biodataId: string | undefined) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.hobbies(biodataId) });
}

export function useAddHobby(biodataId: string | undefined) {
  const invalidate = useHobbyInvalidation(biodataId);

  return useMutation({
    mutationFn: ({ name, displayOrder }: { name: string; displayOrder: number }) =>
      hobbiesService.addHobby(biodataId as string, name, displayOrder),
    onSuccess: invalidate,
  });
}

export function useUpdateHobby(biodataId: string | undefined) {
  const invalidate = useHobbyInvalidation(biodataId);

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => hobbiesService.updateHobby(id, name),
    onSuccess: invalidate,
  });
}

export function useDeleteHobby(biodataId: string | undefined) {
  const invalidate = useHobbyInvalidation(biodataId);

  return useMutation({
    mutationFn: (id: string) => hobbiesService.deleteHobby(id),
    onSuccess: invalidate,
  });
}

export function useReorderHobbies(biodataId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (items: Hobby[]) =>
      hobbiesService.reorderHobbies(items.map((item, index) => ({ id: item.id, display_order: index }))),
    // Reordering should feel instant; the list is re-read on settle.
    onMutate: async (items) => {
      const key = queryKeys.hobbies(biodataId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Hobby[]>(key);
      queryClient.setQueryData<Hobby[]>(
        key,
        items.map((item, index) => ({ ...item, display_order: index })),
      );
      return { previous };
    },
    onError: (_error, _items, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.hobbies(biodataId), context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.hobbies(biodataId) }),
  });
}
