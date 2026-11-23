'use client';

import { useState } from 'react';
import { createTheme, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './AuthProvider';

const theme = createTheme({ primaryColor: 'indigo', defaultRadius: 'md' });

// Socket events keep cached data fresh and a reconnect invalidates it, so queries never go stale on their own.
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { staleTime: Infinity, refetchOnWindowFocus: false, retry: 1 },
    },
  });

export function AppProviders({ children }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <MantineProvider theme={theme}>
      <Notifications position="top-right" />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    </MantineProvider>
  );
}
