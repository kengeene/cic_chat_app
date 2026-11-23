import { useCreateDirectConversation } from '@/hooks/useConversations';
import { UserSummary } from './UserSummary';

export function DirectChatPicker({ users, onCreated }) {
  const createDirect = useCreateDirectConversation();

  const startChat = (userId) => createDirect.mutate({ userId }, { onSuccess: onCreated });

  return (
    <>
      <ul className="max-h-72 overflow-y-auto">
        {users.map((user) => (
          <li key={user.id}>
            <button
              type="button"
              onClick={() => startChat(user.id)}
              disabled={createDirect.isPending}
              className="flex w-full rounded-md px-2 py-2 text-left hover:bg-slate-100 disabled:opacity-50"
            >
              <UserSummary user={user} />
            </button>
          </li>
        ))}
      </ul>
      {createDirect.isError && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {createDirect.error.message}
        </p>
      )}
    </>
  );
}
