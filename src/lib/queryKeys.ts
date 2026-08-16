/**
 * Central registry of TanStack Query keys.
 *
 * Having them in one place means an invalidation after a save can never drift
 * from the key a hook subscribed with.
 */
export const queryKeys = {
  biodata: ['biodata'] as const,
  hobbies: (biodataId: string | undefined) => ['hobbies', biodataId ?? 'none'] as const,
  maternalRelatives: (biodataId: string | undefined) => ['maternal-relatives', biodataId ?? 'none'] as const,
  session: ['auth', 'session'] as const,
};
