import { useParams } from 'next/navigation';
import { useConversations } from '@/hooks/useConversations';
import { ConversationListItem } from './ConversationListItem';
import { ConversationListSkeleton } from './ConversationListSkeleton';
import { InlineError } from './InlineError';

export function ConversationList() {
  const { data: conversations, isPending, isError, refetch } = useConversations();
  const { conversationId: activeConversationId } = useParams();

  if (isPending) return <ConversationListSkeleton />;
  if (isError) return <InlineError message="Couldn't load conversations." onRetry={refetch} />;
  if (conversations.length === 0) {
    return (
      <div className="px-3 py-8 text-center">
        <p className="text-sm font-medium text-slate-700">No conversations yet</p>
        <p className="mt-1 text-sm text-slate-500">Start one with “New chat”.</p>
      </div>
    );
  }

  return (
    <nav aria-label="Conversations">
      <ul className="space-y-0.5">
        {conversations.map((conversation) => (
          <li key={conversation.id}>
            <ConversationListItem conversation={conversation} isActive={conversation.id === activeConversationId} />
          </li>
        ))}
      </ul>
    </nav>
  );
}
