import Link from 'next/link';
import { formatLastSeen } from '@/lib/formatTime';
import { useConversationDisplay } from '@/hooks/useConversationDisplay';
import { usePresence } from '@/providers/PresenceProvider';
import { Avatar } from './Avatar';
import { PresenceDot } from './PresenceDot';

function PresenceLabel({ userId }) {
  const { isOnline, lastSeenAt } = usePresence(userId);
  return isOnline ? 'Online' : formatLastSeen(lastSeenAt);
}

export function ChatHeader({ conversation }) {
  const { title, otherMember } = useConversationDisplay(conversation);

  return (
    <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
      <Link
        href="/chat"
        aria-label="Back to conversations"
        className="-ml-1 rounded p-1 text-slate-600 hover:bg-slate-100 md:hidden"
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5" fill="currentColor">
          <path d="M12.7 4.3a1 1 0 0 1 0 1.4L8.4 10l4.3 4.3a1 1 0 0 1-1.4 1.4l-5-5a1 1 0 0 1 0-1.4l5-5a1 1 0 0 1 1.4 0Z" />
        </svg>
      </Link>
      <Avatar name={title}>{otherMember && <PresenceDot userId={otherMember.id} />}</Avatar>
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold text-slate-900">{title}</h1>
        <p className="text-xs text-slate-500">
          {otherMember ? <PresenceLabel userId={otherMember.id} /> : `${conversation.members.length} members`}
        </p>
      </div>
    </header>
  );
}
