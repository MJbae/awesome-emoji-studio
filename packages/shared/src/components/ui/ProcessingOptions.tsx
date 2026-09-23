import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Wand2, Layers } from 'lucide-react';
import type { ProcessingOptions as ProcessingOptionsType, OutlineStyle } from '@/types/domain';
import { cn } from '@/utils/cn';

interface ProcessingOptionsProps {
  options: ProcessingOptionsType;
  onChange: (options: ProcessingOptionsType) => void;
}

function Toggle({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  const id = useId();

  return (
    <div className="flex items-center justify-between">
      <label htmlFor={id} className="text-slate-700 text-sm font-medium cursor-pointer">
        {label}
      </label>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onToggle}
        data-testid={`toggle-${label.toLowerCase().replace(/\s+/g, '-')}`}
        className={cn(
          'w-11 h-6 rounded-full transition-colors relative',
          checked ? 'bg-primary' : 'bg-slate-300',
        )}
      >
        <div
          className={cn(
            'w-4 h-4 bg-white rounded-full absolute top-1 transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1',
          )}
        />
      </button>
    </div>
  );
}

function ProcessingOptions({ options, onChange }: ProcessingOptionsProps) {
  const { t } = useTranslation();
  const thicknessId = useId();
  const opacityId = useId();

  const update = <K extends keyof ProcessingOptionsType>(
    key: K,
    value: ProcessingOptionsType[K],
  ) => {
    onChange({ ...options, [key]: value });
  };

  const outlineStyles: { value: OutlineStyle; label: string; dotClass: string }[] = [
    {
      value: 'white',
      label: t('postprocess.outlineWhite'),
      dotClass: 'bg-white border border-slate-300',
    },
    { value: 'black', label: t('postprocess.outlineBlack'), dotClass: 'bg-black' },
  ];

  return (
    <div className="space-y-5">
      <section className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2 text-slate-800">
          <Wand2 size={16} className="text-primary" />
          {t('postprocess.cleanup')}
        </h3>
        <Toggle
          checked={options.isBgRemovalEnabled}
          onToggle={() => update('isBgRemovalEnabled', !options.isBgRemovalEnabled)}
          label={t('postprocess.removeBg')}
        />
        <p className="text-xs text-text-muted">{t('postprocess.removeBgDesc')}</p>
      </section>

      <section className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2 text-slate-800">
          <Layers size={16} className="text-primary" />
          {t('postprocess.outlineEffect')}
        </h3>

        <Toggle
          checked={options.isOutlineEnabled}
          onToggle={() => update('isOutlineEnabled', !options.isOutlineEnabled)}
          label={t('postprocess.enableOutline')}
        />

        {options.isOutlineEnabled && (
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <fieldset>
              <legend className="text-xs font-medium text-slate-600 mb-2">
                {t('postprocess.style')}
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {outlineStyles.map((s) => (
                  <button
                    key={s.value}
                    aria-label={`Outline style: ${s.label}`}
                    aria-pressed={options.outlineStyle === s.value}
                    data-testid={`outline-style-${s.value}`}
                    onClick={() => update('outlineStyle', s.value)}
                    className={cn(
                      'flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors',
                      options.outlineStyle === s.value
                        ? 'border-primary/70 bg-primary-50 text-primary'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                    )}
                  >
                    <span className={cn('h-3.5 w-3.5 rounded-full', s.dotClass)} />
                    {s.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div>
              <label
                htmlFor={thicknessId}
                className="text-xs font-medium text-slate-600 block mb-1.5"
              >
                {t('postprocess.thickness')} ({options.outlineThickness}px)
              </label>
              <input
                id={thicknessId}
                type="range"
                min={1}
                max={12}
                value={options.outlineThickness}
                onChange={(e) => update('outlineThickness', Number(e.target.value))}
                aria-label={`Outline thickness: ${options.outlineThickness} pixels`}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            <div>
              <label
                htmlFor={opacityId}
                className="text-xs font-medium text-slate-600 block mb-1.5"
              >
                {t('postprocess.opacity')} ({options.outlineOpacity}%)
              </label>
              <input
                id={opacityId}
                type="range"
                min={0}
                max={100}
                value={options.outlineOpacity}
                onChange={(e) => update('outlineOpacity', Number(e.target.value))}
                aria-label={`Outline opacity: ${options.outlineOpacity} percent`}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export { ProcessingOptions };
export type { ProcessingOptionsProps };
