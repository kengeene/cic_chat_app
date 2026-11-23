import { Avatar } from './Avatar';

export function UserSummary({ user }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <Avatar name={user.displayName} size="sm" />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-slate-900">{user.displayName}</span>
        <span className="block truncate text-xs text-slate-500">{user.email}</span>
      </span>
    </span>
  );
}
