import { cn } from '@/utils/cn';
import { Sparkles } from 'lucide-react';

interface LoaderProps {
  title?: string;
  text?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZE_MAP: Record<NonNullable<LoaderProps['size']>, { w: string; innerIcon: number }> = {
  sm: { w: 'w-6 h-6', innerIcon: 12 },
  md: { w: 'w-12 h-12', innerIcon: 20 },
  lg: { w: 'w-20 h-20', innerIcon: 28 },
  xl: { w: 'w-24 h-24', innerIcon: 32 },
};

function Loader({ title, text, size = 'md' }: LoaderProps) {
  const dimensions = SIZE_MAP[size] || SIZE_MAP.md;
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={title ?? text ?? 'Loading'}
      className="flex flex-col items-center justify-center gap-5 py-12"
    >
      <div
        className={cn(
          'relative flex items-center justify-center rounded-full bg-primary-50',
          dimensions.w,
        )}
        aria-hidden="true"
      >
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-primary/10 border-t-primary" />
        <Sparkles size={dimensions.innerIcon} className="text-primary" strokeWidth={1.5} />
      </div>
      <div className="max-w-md space-y-2 text-center">
        {title && <h2 className="text-xl font-semibold tracking-tight text-text">{title}</h2>}
        {text && <p className="text-sm leading-relaxed text-text-muted">{text}</p>}
      </div>
    </div>
  );
}

export { Loader };
export type { LoaderProps };
