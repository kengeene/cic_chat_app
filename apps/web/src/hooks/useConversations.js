import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { api } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { clearUnread, upsertConversation } from '@/lib/chatCache';

export const useConversations = () =>
  useQuery({
    queryKey: queryKeys.conversations,
    queryFn: async () => (await api.get('conversations').json()).conversations,
  });

const useCreateConversation = (path) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body) => (await api.post(path, { json: body }).json()).conversation,
    onSuccess: (conversation) => upsertConversation(queryClient, conversation),
    onError: (error) => notifications.show({ color: 'red', title: "Couldn't create the chat", message: error.message }),
  });
};

/** mutate({ userId }) → resolves to the existing or newly created direct conversation. */
export const useCreateDirectConversation = () => useCreateConversation('conversations/direct');

/** mutate({ name, memberIds }) */
export const useCreateGroupConversation = () => useCreateConversation('conversations/group');

export const useMarkConversationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId) => api.post(`conversations/${conversationId}/read`),
    onMutate: (conversationId) => clearUnread(queryClient, conversationId),
  });
};
