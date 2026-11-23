import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Avatar } from './Avatar';
import { ConversationList } from './ConversationList';
import { NewChatDialog } from './NewChatDialog';

export function Sidebar() {
  const { user, logout } = useAuth();
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  return (
    <aside className="flex h-full w-full flex-col border-r border-slate-200 bg-slate-50">
      <header className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar name={user.displayName} size="sm" />
          <span className="truncate text-sm font-semibold text-slate-900">{user.displayName}</span>
        </div>
        <Button variant="ghost" onClick={logout}>
          Sign out
        </Button>
      </header>
      <div className="p-3">
        <Button className="w-full" onClick={() => setIsNewChatOpen(true)}>
          New chat
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        <ConversationList />
      </div>
      {isNewChatOpen && <NewChatDialog onClose={() => setIsNewChatOpen(false)} />}
    </aside>
  );
}
