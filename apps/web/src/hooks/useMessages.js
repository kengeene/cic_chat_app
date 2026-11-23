import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';

const PAGE_SIZE = 30;

const fetchMessagesPage = (conversationId, cursor) =>
  api
    .get(`conversations/${conversationId}/messages`, { searchParams: { limit: PAGE_SIZE, ...(cursor && { cursor }) } })
    .json();

/**
 * Pages and their items are newest-first; `messages` is flattened oldest → newest for rendering.
 * `olderMessageCount` (messages loaded via "Load older") lets the list keep its scroll position.
 */
export const useMessages = (conversationId) => {
  const { data, isPending, isError, isFetchNextPageError, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } =
    useInfiniteQuery({
      queryKey: queryKeys.messages(conversationId),
      queryFn: ({ pageParam }) => fetchMessagesPage(conversationId, pageParam),
      initialPageParam: null,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    });

  const messages = useMemo(() => (data ? data.pages.flatMap((page) => page.items).reverse() : []), [data]);
  const olderMessageCount = data ? data.pages.slice(1).reduce((count, page) => count + page.items.length, 0) : 0;

  return {
    messages,
    olderMessageCount,
    isPending,
    isError: isError && !isFetchNextPageError,
    retry: refetch,
    hasOlder: hasNextPage,
    isLoadingOlder: isFetchingNextPage,
    isLoadOlderError: isFetchNextPageError,
    loadOlder: fetchNextPage,
  };
};
