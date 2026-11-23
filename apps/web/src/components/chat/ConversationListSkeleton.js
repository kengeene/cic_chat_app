const ROWS = 6;

export function ConversationListSkeleton() {
  return (
    <ul aria-hidden="true" className="space-y-0.5">
      {Array.from({ length: ROWS }, (_, index) => (
        <li key={index} className="flex animate-pulse items-center gap-3 px-3 py-2">
          <span className="size-10 shrink-0 rounded-full bg-slate-200" />
          <span className="flex-1 space-y-2">
            <span className="block h-3 w-2/3 rounded bg-slate-200" />
            <span className="block h-3 w-1/2 rounded bg-slate-200" />
          </span>
        </li>
      ))}
    </ul>
  );
}
