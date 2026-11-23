const BUBBLES = [
  { isMine: false, width: 'w-48' },
  { isMine: false, width: 'w-64' },
  { isMine: true, width: 'w-40' },
  { isMine: false, width: 'w-56' },
  { isMine: true, width: 'w-72' },
];

export function MessageListSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse space-y-3 py-3">
      {BUBBLES.map(({ isMine, width }, index) => (
        <div key={index} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
          <span className={`block h-9 max-w-[80%] rounded-2xl bg-slate-200 ${width}`} />
        </div>
      ))}
    </div>
  );
}
