import { ReactNode } from 'react';
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
                'group/input relative flex w-full overflow-hidden rounded-xl border-2 transition-all duration-300',
                error
                    ? 'border-danger focus-within:border-danger'
                    : 'border-slate-200 focus-within:border-transparent focus-within:shadow-[0_4px_20px_rgba(6,199,85,0.15)]',
            )}
        >
            {!error && (
                <>
                    <span className="absolute left-1/2 top-1/2 aspect-square w-[200%] -translate-x-1/2 -translate-y-1/2 animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0_270deg,rgba(6,199,85,0.2)_330deg,#06C755_360deg)] opacity-0 transition-opacity duration-300 group-focus-within/input:opacity-100" />
                    <span className="absolute inset-[2px] rounded-[10px] bg-white transition-colors duration-300 group-focus-within/input:bg-[#f4fbf6]" />
                </>
            )}
            <div className={cn('relative z-10 flex w-full', className)}>{children}</div>
        </div>
    );
}
