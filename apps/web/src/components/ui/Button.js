const BASE_CLASSES =
  'inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50';

const VARIANT_CLASSES = {
  primary: 'bg-accent text-white hover:bg-accent-hover',
  secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900',
};

export function Button({ variant = 'primary', type = 'button', className = '', ...props }) {
  return <button type={type} className={`${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${className}`} {...props} />;
}
