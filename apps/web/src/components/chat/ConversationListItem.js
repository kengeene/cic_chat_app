import Link from 'next/link';
import { formatListTimestamp } from '@/lib/formatTime';
import { useConversationDisplay } from '@/hooks/useConversationDisplay';
import { Avatar } from './Avatar';
import { PresenceDot } from './PresenceDot';

export function ConversationListItem({ conversation, isActive }) {
  const { title, otherMember } = useConversationDisplay(conversation);
  const { lastMessage, unreadCount } = conversation;
  const hasUnread = unreadCount > 0;

  return (
    <Link
      href={`/chat/${conversation.id}`}
      aria-current={isActive ? 'page' : undefined}
      className={`flex items-center gap-3 rounded-md px-3 py-2 ${isActive ? 'bg-accent-soft' : 'hover:bg-slate-200/60'}`}
    >
      <Avatar name={title}>{otherMember && <PresenceDot userId={otherMember.id} />}</Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className={`truncate text-sm text-slate-900 ${hasUnread ? 'font-semibold' : 'font-medium'}`}>{title}</span>
          {lastMessage && (
            <time dateTime={lastMessage.createdAt} className="shrink-0 text-xs text-slate-500">
              {formatListTimestamp(lastMessage.createdAt)}
            </time>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className={`truncate text-sm ${hasUnread ? 'text-slate-800' : 'text-slate-500'}`}>
            {lastMessage?.body ?? 'No messages yet'}
          </p>
          {hasUnread && (
            <span className="min-w-5 shrink-0 rounded-full bg-accent px-1.5 text-center text-xs leading-5 font-semibold text-white">
              {unreadCount}
              <span className="sr-only"> unread</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
