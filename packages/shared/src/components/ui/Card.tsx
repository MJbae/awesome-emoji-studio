import { cn } from '@/utils/cn';

interface CardProps {
  children: React.ReactNode;
  selected?: boolean;
  hoverable?: boolean;
  onClick?: () => void;
  className?: string;
}

function Card({ children, selected, hoverable, onClick, className }: CardProps) {
  const isInteractive = !!onClick;
  const Comp = isInteractive ? 'button' : 'div';

  return (
    <Comp
      onClick={onClick}
      className={cn(
        'rounded-2xl border bg-white transition-all duration-200 shadow-sm',
        selected
          ? 'border-primary ring-3 ring-primary/20'
          : 'border-slate-200',
        hoverable && 'hover:border-slate-300 hover:shadow-xs',
        isInteractive && 'cursor-pointer text-left w-full',
        className,
      )}
    >
      {children}
    </Comp>
  );
}

export { Card };
export type { CardProps };
