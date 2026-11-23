import { useId, useState } from 'react';
import { Button } from '@/components/ui/Button';

export function MessageComposer({ onSend }) {
  const [body, setBody] = useState('');
  const inputId = useId();
  const canSend = body.trim().length > 0;

  const submit = () => {
    if (!canSend) return;
    onSend(body.trim());
    setBody('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submit();
  };

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    submit();
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-slate-200 bg-white p-3">
      <label htmlFor={inputId} className="sr-only">
        Message
      </label>
      <textarea
        id={inputId}
        rows={1}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Write a message…  (Shift+Enter for a new line)"
        className="field-sizing-content max-h-40 min-h-10 flex-1 resize-none rounded-md border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-accent"
      />
      <Button type="submit" disabled={!canSend}>
        Send
      </Button>
    </form>
  );
}
