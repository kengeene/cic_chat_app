import { useParams } from 'next/navigation';
import { useConversations } from '@/hooks/useConversations';
import { ConversationListItem } from './ConversationListItem';

const StatusText = ({ children, ...props }) => (
  <p className="px-3 py-2 text-sm text-slate-500" {...props}>
    {children}
  </p>
);

export function ConversationList() {
  const { data: conversations, isPending, isError } = useConversations();
  const { conversationId: activeConversationId } = useParams();

  if (isPending) return <StatusText>Loading conversations…</StatusText>;
  if (isError) return <StatusText role="alert">Couldn&apos;t load conversations.</StatusText>;
  if (conversations.length === 0) return <StatusText>No conversations yet. Start one with “New chat”.</StatusText>;

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
