import { formatTime } from '@/lib/formatTime';

function MessageStatus({ message, showSent, onRetry }) {
  if (message.status === 'sending') return <span className="text-slate-400">Sending…</span>;
  if (message.status === 'failed') {
    return (
      <span className="text-red-600">
        Failed to send ·{' '}
        <button type="button" onClick={() => onRetry(message)} className="font-medium underline">
          Retry
        </button>
      </span>
    );
  }
  return showSent ? <span className="text-slate-400">Sent</span> : null;
}

export function MessageBubble({ message, isMine, senderName, isFirstInGroup, showSenderName, showSent, onRetry }) {
  return (
    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} ${isFirstInGroup ? 'mt-3' : 'mt-0.5'}`}>
      {isFirstInGroup && (
        <div className="mb-1 flex items-baseline gap-2 px-1 text-xs text-slate-500">
          {showSenderName && <span className="font-semibold text-slate-700">{senderName}</span>}
          <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
        </div>
      )}
      <p
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm break-words whitespace-pre-wrap md:max-w-[65%] ${
          isMine ? 'bg-accent text-white' : 'border border-slate-200 bg-white text-slate-900'
        } ${message.status === 'sending' ? 'opacity-70' : ''}`}
      >
        {message.body}
      </p>
      {isMine && (
        <div className="mt-0.5 px-1 text-xs">
          <MessageStatus message={message} showSent={showSent} onRetry={onRetry} />
        </div>
      )}
    </div>
  );
}
