import { cn } from '@/utils/cn';
import { Sparkles } from 'lucide-react';

interface LoaderProps {
  title?: string;
  text?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZE_MAP: Record<NonNullable<LoaderProps['size']>, { w: string; innerIcon: number }> = {
  sm: { w: 'w-6 h-6', innerIcon: 12 },
  md: { w: 'w-12 h-12', innerIcon: 24 },
  lg: { w: 'w-20 h-20', innerIcon: 32 },
  xl: { w: 'w-24 h-24 text-primary', innerIcon: 40 },
};

function Loader({ title, text, size = 'md' }: LoaderProps) {
  const dimensions = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={title ?? text ?? 'Loading'}
      className="flex flex-col items-center justify-center gap-4 py-8"
    >
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulsing ring */}
        <div className={cn("absolute inset-0 rounded-full bg-primary/20 blur-md animate-pulse", dimensions.w)} />

        {/* Core spinning/gradient circle without an inner mask, so it's filled */}
        <div
          className={cn('relative rounded-full flex items-center justify-center shadow-inner overflow-hidden', dimensions.w)}
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#7c3aed] to-[#a78bfa] animate-[spin_3s_linear_infinite]" />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#7c3aed]/50 to-transparent animate-[spin_2s_linear_infinite_reverse]" />

          {/* A soft inner glow rather than cutting out the center */}
          <div className="absolute inset-1 rounded-full bg-white/20 backdrop-blur-sm" />

          {/* Icon in the center for better aesthetics */}
          <Sparkles size={dimensions.innerIcon} className="relative z-10 text-white animate-pulse" />
        </div>
      </div>

      <div className="text-center space-y-2 mt-2">
        {title && <h2 className="text-2xl font-bold text-text animate-pulse">{title}</h2>}
        {text && <p className={cn("font-medium text-slate-600 animate-pulse", size === 'xl' ? "text-base" : "text-sm")}>{text}</p>}
      </div>
    </div>
  );
}

export { Loader };
export type { LoaderProps };
