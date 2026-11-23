import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';

/** Searches the employee directory (the server excludes the current user). */
export const useUserSearch = (search) =>
  useQuery({
    queryKey: queryKeys.users(search),
    queryFn: async () => (await apiClient.get(`/users?${new URLSearchParams({ search })}`)).users,
    placeholderData: keepPreviousData,
  });
