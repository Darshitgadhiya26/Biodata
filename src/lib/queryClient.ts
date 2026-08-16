import { QueryClient } from '@tanstack/react-query';

/**
 * Query defaults tuned for a read-mostly public page:
 *  - data is considered fresh for 30s, so navigating around does not refetch
 *  - every fresh page load and tab focus revalidates, so a visitor always sees
 *    the latest saved biodata without any redeploy
 *  - Realtime (see useRealtimeBiodata) invalidates these keys on write
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
      retry: (failureCount, error) => {
        // Configuration problems will never succeed on retry.
        if (error instanceof Error && error.message.includes('not configured')) return false;
        return failureCount < 2;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    },
    mutations: {
      retry: 0,
    },
  },
});
