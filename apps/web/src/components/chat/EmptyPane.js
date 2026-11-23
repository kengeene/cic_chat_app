import Link from 'next/link';

export function EmptyPane({ title, description, showBackLink = false }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      <p className="text-base font-medium text-slate-700">{title}</p>
      {description && <p className="text-sm text-slate-500">{description}</p>}
      {showBackLink && (
        <Link href="/chat" className="text-sm font-medium text-accent hover:underline md:hidden">
          Back to conversations
        </Link>
      )}
    </div>
  );
}
