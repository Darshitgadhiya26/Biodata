import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SUPABASE_READY, supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Keeps an open page in sync with Supabase.
 *
 * When the admin saves on their phone, every other device showing the public
 * biodata refetches within a moment — no rebuild, no redeploy. Realtime still
 * evaluates RLS per subscriber, so this leaks nothing an anonymous visitor
 * could not already read.
 *
 * If the Realtime socket cannot connect (some corporate networks block
 * WebSockets) the page still refreshes on load, focus and reconnect via the
 * TanStack Query defaults — this is an enhancement, not a dependency.
 */
export function useRealtimeBiodata(biodataId: string | undefined): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!SUPABASE_READY) return;

    const channel = supabase
      .channel('public:biodata-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'biodata' }, () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.biodata });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hobbies' }, () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.hobbies(biodataId) });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maternal_relatives' }, () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.maternalRelatives(biodataId) });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, biodataId]);
}
