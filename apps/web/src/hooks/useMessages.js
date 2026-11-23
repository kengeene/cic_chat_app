import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';

const PAGE_SIZE = 30;

const fetchMessagesPage = (conversationId, cursor) => {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
  if (cursor) params.set('cursor', cursor);
  return apiClient.get(`/conversations/${conversationId}/messages?${params}`);
};

/** Pages and their items are newest-first; `messages` is flattened oldest → newest for rendering. */
export const useMessages = (conversationId) => {
  const { data, isPending, isError, isFetchNextPageError, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } = useInfiniteQuery({
    queryKey: queryKeys.messages(conversationId),
    queryFn: ({ pageParam }) => fetchMessagesPage(conversationId, pageParam),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const messages = useMemo(
    () => (data ? data.pages.flatMap((page) => page.items).reverse() : []),
    [data],
  );

  return {
    messages,
    isPending,
    isError: isError && !isFetchNextPageError,
    retry: refetch,
    hasOlder: hasNextPage,
    isLoadingOlder: isFetchingNextPage,
    isLoadOlderError: isFetchNextPageError,
    loadOlder: fetchNextPage,
  };
};
