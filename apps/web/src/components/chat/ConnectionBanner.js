import { Alert } from '@mantine/core';
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
        <Alert color="yellow" radius={0} pos="fixed" top={0} left={0} right={0} ta="center" style={{ zIndex: 300 }}>
          {message}
        </Alert>
      )}
    </div>
  );
}
