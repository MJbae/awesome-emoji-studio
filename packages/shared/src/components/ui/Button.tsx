import { forwardRef } from 'react';
import { cn } from '@/utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-primary text-white hover:bg-primary-dark focus-visible:ring-primary/40 shadow-xs',
  secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus-visible:ring-slate-300',
  outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-300',
  danger: 'bg-danger text-white hover:bg-red-600 focus-visible:ring-danger/40 shadow-xs',
  ghost: 'text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-300',
};

const SIZE_CLASSES: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'min-h-9 px-3 py-2 text-xs gap-1.5',
  md: 'min-h-10 px-4 py-2.5 text-sm gap-2',
  lg: 'min-h-12 px-6 py-3 text-sm gap-2.5',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      children,
      className,
      disabled,
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        className={cn(
          'inline-flex items-center justify-center font-semibold rounded-xl transition-colors duration-150 active:translate-y-px',
          'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-offset-1',
          'disabled:opacity-45 disabled:cursor-not-allowed disabled:active:translate-y-0',
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className,
        )}
        {...rest}
      >
        {loading ? (
          <span
            className={cn(
              'shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent',
              size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4',
            )}
            aria-hidden="true"
          />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps };
