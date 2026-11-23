'use client';

import { createContext, useContext, useMemo } from 'react';
import { hashKey, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';

const AuthContext = createContext(null);

const fetchCurrentUser = async () => {
  try {
    const { user } = await apiClient.get('/auth/me');
    return user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
};

/** Drops every cached query except the current user, so one account never sees another's data. */
const clearAccountData = (queryClient) =>
  queryClient.removeQueries({ predicate: (query) => query.queryHash !== hashKey(queryKeys.me) });

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const { data: user, isPending } = useQuery({
    queryKey: queryKeys.me,
    queryFn: fetchCurrentUser,
    retry: false,
  });

  const value = useMemo(() => {
    const setUser = (nextUser) => {
      clearAccountData(queryClient);
      queryClient.setQueryData(queryKeys.me, nextUser);
    };

    return {
      user: user ?? null,
      isLoading: isPending,
      login: async (credentials) => setUser((await apiClient.post('/auth/login', credentials)).user),
      register: async (details) => setUser((await apiClient.post('/auth/register', details)).user),
      logout: async () => {
        await apiClient.post('/auth/logout');
        setUser(null);
      },
    };
  }, [user, isPending, queryClient]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
