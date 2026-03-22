import { CheckCircle2, Circle, XCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from './Button';

interface GridItem {
  id: string;
  src: string;
  name: string;
}

interface SelectionGridProps {
  items: GridItem[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
}

function SelectionGrid({
  items,
  selectedIds,
  onToggle,
  onSelectAll,
  onClearAll,
}: SelectionGridProps) {
  const selectedCount = selectedIds.size;

  return (
    <div className="space-y-4" aria-label="Select images for processing">
      <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 sticky top-0 z-10">
        <div>
          <p className="text-sm text-text-muted">
            선택: <span className="font-semibold text-primary">{selectedCount}</span> /{' '}
            {items.length}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSelectAll}
            aria-label="Select all images"
            data-testid="select-all-btn"
          >
            전체 선택
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            icon={<XCircle size={14} />}
            aria-label="Clear selection"
            data-testid="clear-selection-btn"
          >
            초기화
          </Button>
        </div>
      </div>

      <div
        className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3"
        role="listbox"
        aria-multiselectable="true"
        aria-label="Image selection grid"
      >
        {items.map((item) => {
          const isSelected = selectedIds.has(item.id);

          return (
            <button
              key={item.id}
              role="option"
              aria-selected={isSelected}
              aria-label={`${item.name}${isSelected ? ' (selected)' : ''}`}
              data-testid={`grid-item-${item.id}`}
              onClick={() => onToggle(item.id)}
              className={cn(
                'relative aspect-square rounded-xl cursor-pointer group transition-all duration-200',
                isSelected
                  ? 'ring-3 ring-primary ring-offset-2 bg-primary/5'
                  : 'bg-white border border-slate-200 hover:border-primary-light',
              )}
            >
              <div className="absolute top-1.5 right-1.5 z-10">
                {isSelected ? (
                  <CheckCircle2 className="text-primary fill-white" size={20} />
                ) : (
                  <Circle
                    className="text-slate-300 fill-white/50 group-hover:text-primary-light"
                    size={20}
                  />
                )}
              </div>
              <div className="w-full h-full p-3 flex items-center justify-center">
                <img
                  src={item.src}
                  alt={item.name}
                  className="max-w-full max-h-full object-contain"
                  loading="lazy"
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { SelectionGrid };
export type { SelectionGridProps, GridItem };
