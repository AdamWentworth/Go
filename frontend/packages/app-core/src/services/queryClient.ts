import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 10 * 60_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const socialQueryKeys = {
  friends: ['social', 'friends'] as const,
  preferences: ['social', 'preferences'] as const,
  profile: (username: string) => ['social', 'profile', username.toLowerCase()] as const,
};
