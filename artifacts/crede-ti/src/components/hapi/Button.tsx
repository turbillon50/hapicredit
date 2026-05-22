import { type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<Variant, { className: string; style?: React.CSSProperties }> = {
  primary:   { className: 'text-white shadow-md active:scale-95', style: { background: 'var(--accent)' } },
  secondary: { className: 'bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 active:scale-95' },
  ghost:     { className: 'bg-transparent text-gray-600 hover:bg-gray-100 active:scale-95' },
  danger:    { className: 'bg-red-500 text-white hover:bg-red-600 active:scale-95' },
  outline:   { className: 'border-2 text-white hover:bg-white/10 active:scale-95', style: { borderColor: 'rgba(255,255,255,0.35)' } },
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 h-8 text-xs gap-1.5',
  md: 'px-4 h-11 text-sm gap-2',
  lg: 'px-6 h-13 text-base gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  children,
  className = '',
  disabled,
  style,
  ...props
}: ButtonProps) {
  const vs = variantStyles[variant];
  return (
    <button
      className={`inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${vs.className} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      style={{ ...vs.style, ...style }}
      disabled={loading || disabled}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      )}
      {children}
    </button>
  );
}
