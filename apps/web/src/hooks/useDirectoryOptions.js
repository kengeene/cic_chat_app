import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';

const DIRECTORY_STALE_MS = 60 * 1000;

/** Employee directory (the server excludes the current user) as Select/MultiSelect options. */
export const useDirectoryOptions = () => {
  const { data: users } = useQuery({
    queryKey: queryKeys.directory,
    queryFn: async () => (await api.get('users').json()).users,
    staleTime: DIRECTORY_STALE_MS,
  });

  return useMemo(
    () => (users ?? []).map(({ id, displayName, email }) => ({ value: id, label: `${displayName} (${email})` })),
    [users],
  );
};
