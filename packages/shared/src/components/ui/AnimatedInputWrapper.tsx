import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface AnimatedInputWrapperProps {
  children: ReactNode;
  className?: string;
  error?: boolean;
}

export function AnimatedInputWrapper({ children, className, error }: AnimatedInputWrapperProps) {
  return (
    <div
      className={cn(
        'relative flex w-full overflow-hidden rounded-xl border bg-slate-50/50 transition-colors focus-within:bg-white focus-within:ring-3',
        error
          ? 'border-danger focus-within:ring-danger/10'
          : 'border-slate-200 focus-within:border-primary/70 focus-within:ring-primary/10',
      )}
    >
      <div className={cn('relative flex w-full', className)}>{children}</div>
    </div>
  );
}
