import { useSocket } from '@/providers/SocketProvider';

const STATUS_MESSAGES = {
  reconnecting: 'Connection lost. Reconnecting…',
  disconnected: 'You are offline. New messages will not arrive until you reconnect.',
};

export function ConnectionBanner() {
  const { status } = useSocket();
  const message = STATUS_MESSAGES[status];

  return (
    <div role="status">
      {message && (
        <p className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">{message}</p>
      )}
    </div>
  );
}
