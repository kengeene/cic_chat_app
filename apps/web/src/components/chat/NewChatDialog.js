'use client';

import { useDeferredValue, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserSearch } from '@/hooks/useUserSearch';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { DirectChatPicker } from './DirectChatPicker';
import { GroupChatForm } from './GroupChatForm';

const MODES = [
  { id: 'direct', label: 'Direct message' },
  { id: 'group', label: 'Group' },
];

function ModeToggle({ mode, onChange }) {
  return (
    <div role="group" aria-label="Chat type" className="mb-4 grid grid-cols-2 gap-1 rounded-md bg-slate-100 p-1">
      {MODES.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          aria-pressed={mode === id}
          onClick={() => onChange(id)}
          className={`rounded px-3 py-1.5 text-sm font-medium ${mode === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function NewChatDialog({ onClose }) {
  const router = useRouter();
  const [mode, setMode] = useState('direct');
  const [search, setSearch] = useState('');
  const { data: users = [], isPending, isError } = useUserSearch(useDeferredValue(search.trim()));

  const openConversation = (conversation) => {
    onClose();
    router.push(`/chat/${conversation.id}`);
  };

  return (
    <Dialog title="New chat" onClose={onClose}>
      <ModeToggle mode={mode} onChange={setMode} />
      <Input
        label="Search people"
        hideLabel
        type="search"
        placeholder="Search by name or email"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        autoFocus
        className="mb-3"
      />
      {isError && (
        <p role="alert" className="text-sm text-red-600">
          Couldn&apos;t load the directory.
        </p>
      )}
      {!isPending && !isError && users.length === 0 && <p className="text-sm text-slate-500">No people found.</p>}
      {mode === 'direct' ? (
        <DirectChatPicker users={users} onCreated={openConversation} />
      ) : (
        <GroupChatForm users={users} onCreated={openConversation} />
      )}
    </Dialog>
  );
}
