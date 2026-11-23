import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { clearUnread, upsertConversation } from '@/lib/chatCache';

export const useConversations = () =>
  useQuery({
    queryKey: queryKeys.conversations,
    queryFn: async () => (await apiClient.get('/conversations')).conversations,
  });

const useCreateConversation = (path) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body) => (await apiClient.post(path, body)).conversation,
    onSuccess: (conversation) => upsertConversation(queryClient, conversation),
  });
};

/** mutate({ userId }) → resolves to the existing or newly created direct conversation. */
export const useCreateDirectConversation = () => useCreateConversation('/conversations/direct');

/** mutate({ name, memberIds }) */
export const useCreateGroupConversation = () => useCreateConversation('/conversations/group');

export const useMarkConversationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId) => apiClient.post(`/conversations/${conversationId}/read`),
    onMutate: (conversationId) => clearUnread(queryClient, conversationId),
  });
};
