import { useId } from 'react';

export function Input({ label, hideLabel = false, className = '', ...props }) {
  const id = useId();

  return (
    <div className={className}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'mb-1 block text-sm font-medium text-slate-700'}>
        {label}
      </label>
      <input
        id={id}
        className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-accent"
        {...props}
      />
    </div>
  );
}
