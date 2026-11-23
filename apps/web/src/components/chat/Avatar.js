const SIZE_CLASSES = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
};

const getInitials = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

/** Initials avatar; `children` renders on top (e.g. a PresenceDot). */
export function Avatar({ name, size = 'md', children }) {
  return (
    <span className="relative inline-flex shrink-0">
      <span
        aria-hidden="true"
        className={`flex items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-700 ${SIZE_CLASSES[size]}`}
      >
        {getInitials(name)}
      </span>
      {children}
    </span>
  );
}
