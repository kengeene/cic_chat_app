export function InlineError({ message, onRetry }) {
  return (
    <p role="alert" className="flex flex-wrap items-center justify-center gap-x-2 px-3 py-2 text-center text-sm text-red-700">
      {message}
      {onRetry && (
        <button type="button" onClick={onRetry} className="font-medium underline hover:text-red-900">
          Try again
        </button>
      )}
    </p>
  );
}
