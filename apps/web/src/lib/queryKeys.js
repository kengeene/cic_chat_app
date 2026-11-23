export const queryKeys = {
  me: ['me'],
  conversations: ['conversations'],
  allMessages: ['messages'],
  messages: (conversationId) => ['messages', conversationId],
  directory: ['directory'],
};
