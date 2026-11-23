'use client';

import { useParams } from 'next/navigation';
import { useConversations } from '@/hooks/useConversations';
import { ConversationView } from '@/components/chat/ConversationView';
import { EmptyPane } from '@/components/chat/EmptyPane';

export default function ConversationPage() {
  const { conversationId } = useParams();
  const { data: conversations, isPending } = useConversations();
  const conversation = conversations?.find(({ id }) => id === conversationId);

  if (isPending) return <EmptyPane title="Loading conversation…" />;
  if (!conversation) return <EmptyPane title="Conversation not found" showBackLink />;

  return <ConversationView key={conversation.id} conversation={conversation} />;
}
