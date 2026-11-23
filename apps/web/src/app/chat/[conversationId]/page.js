'use client';

import { useParams } from 'next/navigation';
import { useConversations } from '@/hooks/useConversations';
import { ConversationView } from '@/components/chat/ConversationView';
import { EmptyPane } from '@/components/chat/EmptyPane';

export default function ConversationPage() {
  const { conversationId } = useParams();
  const { data: conversations, isPending, isError } = useConversations();
  const conversation = conversations?.find(({ id }) => id === conversationId);

  if (isPending) return <EmptyPane title="Loading conversation…" />;
  if (isError && !conversations) {
    return <EmptyPane title="Couldn't load this conversation" description="Check your connection and try again." showBackLink />;
  }
  if (!conversation) return <EmptyPane title="Conversation not found" showBackLink />;

  return <ConversationView key={conversation.id} conversation={conversation} />;
}
