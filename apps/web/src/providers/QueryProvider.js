'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Socket events keep cached data fresh and a reconnect invalidates it, so queries never go stale on their own.
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { staleTime: Infinity, refetchOnWindowFocus: false, retry: 1 },
    },
  });

export function QueryProvider({ children }) {
  const [queryClient] = useState(createQueryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
