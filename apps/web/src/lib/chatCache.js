import { queryKeys } from './queryKeys';

// Messages cache: infinite query whose pages[0] is the newest page; items within a page are newest-first.

const isSameMessage = (a, b) =>
  a.id === b.id || (a.senderId === b.senderId && a.clientMsgId === b.clientMsgId);

const containsMessage = (data, message) =>
  data.pages.some((page) => page.items.some((existing) => isSameMessage(existing, message)));

const mapMessages = (data, mapMessage) => ({
  ...data,
  pages: data.pages.map((page) => ({ ...page, items: page.items.map(mapMessage) })),
});

const addAsNewest = (data, message) => {
  const [newest, ...older] = data.pages;
  return { ...data, pages: [{ ...newest, items: [message, ...newest.items] }, ...older] };
};

/** Replaces the matching message (same id, or same sender + clientMsgId), otherwise adds it as the newest. */
export const upsertMessage = (queryClient, message) =>
  queryClient.setQueryData(queryKeys.messages(message.conversationId), (data) => {
    if (!data) return data;
    if (!containsMessage(data, message)) return addAsNewest(data, message);
    return mapMessages(data, (existing) => (isSameMessage(existing, message) ? message : existing));
  });

/** Only optimistic messages carry a status, so a confirmed message is never downgraded. */
export const setPendingMessageStatus = (queryClient, conversationId, clientMsgId, status) =>
  queryClient.setQueryData(queryKeys.messages(conversationId), (data) =>
    data && mapMessages(data, (existing) =>
      existing.status && existing.clientMsgId === clientMsgId ? { ...existing, status } : existing,
    ),
  );

const moveToTop = (conversations, conversation) => [
  conversation,
  ...conversations.filter(({ id }) => id !== conversation.id),
];

const updateConversationPreview = (queryClient, message, currentUserId) =>
  queryClient.setQueryData(queryKeys.conversations, (conversations) => {
    const conversation = conversations?.find(({ id }) => id === message.conversationId);
    if (!conversation || conversation.lastMessage?.id === message.id) return conversations;

    const isMine = message.senderId === currentUserId;
    return moveToTop(conversations, {
      ...conversation,
      lastMessage: message,
      lastMessageAt: message.createdAt,
      unreadCount: isMine ? conversation.unreadCount : conversation.unreadCount + 1,
    });
  });

export const applyIncomingMessage = (queryClient, message, currentUserId) => {
  upsertMessage(queryClient, message);
  updateConversationPreview(queryClient, message, currentUserId);
};

export const upsertConversation = (queryClient, conversation) =>
  queryClient.setQueryData(queryKeys.conversations, (conversations) => {
    if (!conversations || conversations.some(({ id }) => id === conversation.id)) return conversations;
    return [conversation, ...conversations];
  });

export const clearUnread = (queryClient, conversationId) =>
  queryClient.setQueryData(queryKeys.conversations, (conversations) =>
    conversations?.map((conversation) =>
      conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation,
    ),
  );

/** Presence is just two fields on conversation members; socket events patch them in place. */
export const applyPresenceUpdate = (queryClient, { userId, isOnline, lastSeenAt }) =>
  queryClient.setQueryData(queryKeys.conversations, (conversations) =>
    conversations?.map((conversation) => ({
      ...conversation,
      members: conversation.members.map((member) =>
        member.id === userId ? { ...member, isOnline, lastSeenAt: lastSeenAt ?? member.lastSeenAt } : member,
      ),
    })),
  );
