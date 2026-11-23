import { useState } from 'react';
import { useCreateGroupConversation } from '@/hooks/useConversations';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UserSummary } from './UserSummary';

const MIN_OTHER_MEMBERS = 2;

const toggleInSet = (set, value) => {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
};

export function GroupChatForm({ users, onCreated }) {
  const [name, setName] = useState('');
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const createGroup = useCreateGroupConversation();
  const canCreate = name.trim().length > 0 && selectedIds.size >= MIN_OTHER_MEMBERS && !createGroup.isPending;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canCreate) return;
    createGroup.mutate({ name: name.trim(), memberIds: [...selectedIds] }, { onSuccess: onCreated });
  };

  return (
    <form onSubmit={handleSubmit}>
      <fieldset>
        <legend className="sr-only">Members</legend>
        <ul className="max-h-60 overflow-y-auto">
          {users.map((user) => (
            <li key={user.id}>
              <label className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={selectedIds.has(user.id)}
                  onChange={() => setSelectedIds((previous) => toggleInSet(previous, user.id))}
                  className="size-4 accent-accent"
                />
                <UserSummary user={user} />
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
      <p className="mt-2 text-xs text-slate-500">
        {selectedIds.size} selected · choose at least {MIN_OTHER_MEMBERS}
      </p>
      <Input
        label="Group name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        maxLength={80}
        className="mt-3"
      />
      {createGroup.isError && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {createGroup.error.message}
        </p>
      )}
      <div className="mt-4 flex justify-end">
        <Button type="submit" disabled={!canCreate}>
          {createGroup.isPending ? 'Creating…' : 'Create group'}
        </Button>
      </div>
    </form>
  );
}
