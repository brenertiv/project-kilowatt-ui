import { QueryClient } from '@tanstack/react-query';

/** A client with the app's query defaults. Storybook makes one per story so caches stay apart. */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
      },
    },
  });
}

export const queryClient = createQueryClient();
