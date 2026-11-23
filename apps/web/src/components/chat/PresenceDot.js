import { usePresence } from '@/providers/PresenceProvider';

export function PresenceDot({ userId }) {
  const { isOnline } = usePresence(userId);

  return (
    <span
      className={`absolute right-0 bottom-0 size-3 rounded-full ring-2 ring-white ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`}
    >
      <span className="sr-only">{isOnline ? 'Online' : 'Offline'}</span>
    </span>
  );
}
