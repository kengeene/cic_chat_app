import { useMemo } from 'react';
import { formatDayLabel, isSameDay } from '@/lib/formatTime';
import { useMessages } from '@/hooks/useMessages';
import { useChatScroll } from '@/hooks/useChatScroll';
import { useConversationDisplay } from '@/hooks/useConversationDisplay';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { MessageBubble } from './MessageBubble';

const GROUPING_WINDOW_MS = 5 * 60 * 1000;

const startsNewDay = (message, previous) => !previous || !isSameDay(previous.createdAt, message.createdAt);

const startsNewGroup = (message, previous) =>
  startsNewDay(message, previous) ||
  previous.senderId !== message.senderId ||
  new Date(message.createdAt) - new Date(previous.createdAt) > GROUPING_WINDOW_MS;

const findLastConfirmedId = (messages, senderId) =>
  messages.findLast((message) => message.senderId === senderId && !message.status)?.id;

function DaySeparator({ date }) {
  return (
    <div className="my-4 flex items-center gap-3 text-xs font-medium text-slate-500">
      <span className="h-px flex-1 bg-slate-200" />
      <span>{formatDayLabel(date)}</span>
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

export function MessageList({ conversation, onRetry }) {
  const { user } = useAuth();
  const { title } = useConversationDisplay(conversation);
  const { messages, isPending, isError, hasOlder, isLoadingOlder, loadOlder } = useMessages(conversation.id);
  const { containerRef, handleScroll, anchorBeforeLoadingOlder } = useChatScroll({
    firstMessageId: messages[0]?.id,
    lastMessageId: messages.at(-1)?.id,
  });

  const memberNames = useMemo(
    () => new Map(conversation.members.map(({ id, displayName }) => [id, displayName])),
    [conversation.members],
  );
  const lastConfirmedMineId = findLastConfirmedId(messages, user.id);
  const isGroup = conversation.type === 'group';

  const handleLoadOlder = () => {
    anchorBeforeLoadingOlder();
    loadOlder();
  };

  return (
    <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-3">
      {hasOlder && (
        <div className="flex justify-center py-2">
          <Button variant="secondary" onClick={handleLoadOlder} disabled={isLoadingOlder}>
            {isLoadingOlder ? 'Loading…' : 'Load older messages'}
          </Button>
        </div>
      )}
      {isPending && <p className="py-6 text-center text-sm text-slate-500">Loading messages…</p>}
      {isError && (
        <p role="alert" className="py-6 text-center text-sm text-red-600">
          Couldn&apos;t load messages.
        </p>
      )}
      <ol aria-live="polite" aria-label={`Messages in ${title}`}>
        {messages.map((message, index) => {
          const previous = messages[index - 1];
          const isMine = message.senderId === user.id;
          return (
            <li key={message.id}>
              {startsNewDay(message, previous) && <DaySeparator date={message.createdAt} />}
              <MessageBubble
                message={message}
                isMine={isMine}
                senderName={memberNames.get(message.senderId) ?? 'Former member'}
                isFirstInGroup={startsNewGroup(message, previous)}
                showSenderName={isGroup && !isMine}
                showSent={message.id === lastConfirmedMineId}
                onRetry={onRetry}
              />
            </li>
          );
        })}
      </ol>
    </div>
  );
}
