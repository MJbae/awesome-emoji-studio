import { forwardRef } from 'react';
import { cn } from '@/utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-dark focus-visible:ring-primary/40 shadow-xs',
  secondary:
    'bg-slate-100 text-slate-700 hover:bg-slate-200 focus-visible:ring-slate-300',
  outline:
    'border border-slate-300 text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-300',
  danger:
    'bg-danger text-white hover:bg-red-600 focus-visible:ring-danger/40 shadow-xs',
  ghost:
    'text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-300',
};

const SIZE_CLASSES: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
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
        className={cn(
          'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 active:scale-95',
          'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-offset-1',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className,
        )}
        {...rest}
      >
        {loading ? (
          <div
            className={cn(
              'relative shrink-0 overflow-hidden rounded-full',
              size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
            )}
            aria-hidden="true"
          >
            <span className="absolute left-1/2 top-1/2 aspect-square w-[200%] -translate-x-1/2 -translate-y-1/2 animate-[spin_1s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0_270deg,rgba(255,255,255,0.4)_330deg,#ffffff_360deg)]" />
            <span
              className={cn(
                'absolute inset-[2px] rounded-full',
                variant === 'primary' || variant === 'danger' ? 'bg-black/10' : 'bg-slate-300'
              )}
            />
          </div>
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
