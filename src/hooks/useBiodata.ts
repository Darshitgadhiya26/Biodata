import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import * as biodataService from '@/services/biodataService';
import * as hobbiesService from '@/services/hobbiesService';
import * as maternalService from '@/services/maternalService';
import { DEFAULT_HOBBIES, DEFAULT_MATERNAL_RELATIVES } from '@/data/defaults';
import type { Biodata, BiodataUpdate } from '@/types';

/** The single source of truth for the public page and the admin editor. */
export function useBiodata(): UseQueryResult<Biodata | null> {
  return useQuery({
    queryKey: queryKeys.biodata,
    queryFn: biodataService.getBiodata,
  });
}

/** Saves a partial update, then refetches so every view reflects the truth. */
export function useUpdateBiodata() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: BiodataUpdate }) =>
      biodataService.updateBiodata(id, patch),
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKeys.biodata, saved);
      void queryClient.invalidateQueries({ queryKey: queryKeys.biodata });
    },
  });
}

/** Seeds the profile from the PDF defaults when the table is empty. */
export function useCreateBiodata() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: biodataService.createBiodataFromDefaults,
    onSuccess: async (created) => {
      await Promise.all([
        hobbiesService.replaceHobbies(created.id, DEFAULT_HOBBIES),
        maternalService.replaceMaternalRelatives(created.id, DEFAULT_MATERNAL_RELATIVES),
      ]);
      queryClient.setQueryData(queryKeys.biodata, created);
      await queryClient.invalidateQueries();
    },
  });
}

/**
 * "Reset to default": restores every text field, the hobbies and the maternal
 * relatives to the values from the original biodata PDF. The uploaded photo is
 * left untouched on purpose.
 */
export function useResetBiodata() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const restored = await biodataService.resetBiodataToDefaults(id);
      await Promise.all([
        hobbiesService.replaceHobbies(id, DEFAULT_HOBBIES),
        maternalService.replaceMaternalRelatives(id, DEFAULT_MATERNAL_RELATIVES),
      ]);
      return restored;
    },
    onSuccess: async (restored) => {
      queryClient.setQueryData(queryKeys.biodata, restored);
      await queryClient.invalidateQueries();
    },
  });
}

export function useSetPublished() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      biodataService.setPublished(id, isPublished),
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKeys.biodata, saved);
      void queryClient.invalidateQueries({ queryKey: queryKeys.biodata });
    },
  });
}
