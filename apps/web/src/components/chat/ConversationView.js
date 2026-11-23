import { useEffect } from 'react';
import { useMarkConversationRead } from '@/hooks/useConversations';
import { useSendMessage } from '@/hooks/useSendMessage';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageComposer } from './MessageComposer';

export function ConversationView({ conversation }) {
  const { send, retry } = useSendMessage(conversation.id);
  const { mutate: markRead } = useMarkConversationRead();
  const lastMessageId = conversation.lastMessage?.id;

  // Marks read when opened and again whenever a new message arrives while it is open.
  useEffect(() => {
    markRead(conversation.id);
  }, [conversation.id, lastMessageId, markRead]);

  return (
    <>
      <ChatHeader conversation={conversation} />
      <MessageList conversation={conversation} onRetry={retry} />
      <MessageComposer onSend={send} />
    </>
  );
}
