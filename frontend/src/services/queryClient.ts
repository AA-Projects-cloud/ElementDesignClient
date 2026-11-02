import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      // If the server is busy, wait a little longer each time instead of hammering it
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      // Many people switching tabs must not trigger a wave of requests
      refetchOnWindowFocus: false,
    },
  },
});
