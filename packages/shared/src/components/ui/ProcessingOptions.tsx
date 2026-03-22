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
    { value: 'white', label: t('postprocess.outlineWhite'), dotClass: 'bg-white border border-slate-300' },
    { value: 'black', label: t('postprocess.outlineBlack'), dotClass: 'bg-black' },
  ];

  return (
    <div className="space-y-5">
      <section className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
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

      <section className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
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
              <legend className="text-xs font-medium text-slate-600 mb-2">{t('postprocess.style')}</legend>
              <div className="grid grid-cols-2 gap-2">
                {outlineStyles.map((s) => (
                  <button
                    key={s.value}
                    aria-label={`Outline style: ${s.label}`}
                    aria-pressed={options.outlineStyle === s.value}
                    data-testid={`outline-style-${s.value}`}
                    onClick={() => update('outlineStyle', s.value)}
                    className={cn(
                      'group relative overflow-hidden rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center text-center',
                      options.outlineStyle === s.value
                        ? 'p-[2px] shadow-sm scale-[1.02] text-[#111111] bg-white z-10'
                        : 'p-2 border border-slate-200 bg-white hover:border-[#06C755]/40 hover:bg-slate-50 text-slate-500 active:scale-95'
                    )}
                  >
                    {options.outlineStyle === s.value && (
                      <>
                        <span className="absolute left-1/2 top-1/2 aspect-square w-[200%] -translate-x-1/2 -translate-y-1/2 animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0_270deg,rgba(6,199,85,0.2)_330deg,#06C755_360deg)]" />
                        <span className="absolute inset-[1px] rounded-[11px] bg-[#EBF7EF]" />
                      </>
                    )}
                    <span className={cn(
                      "relative z-10 transition-transform duration-300 ease-out group-hover:scale-110 flex items-center justify-center gap-2",
                      options.outlineStyle === s.value && "w-full py-[7px] px-2 flex items-center justify-center"
                    )}>
                      <div className={cn('w-3 h-3 rounded-full', s.dotClass)} />
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>

            <div>
              <label
                htmlFor={thicknessId}
                className="text-xs font-medium text-slate-600 block mb-1.5"
              >
                Thickness ({options.outlineThickness}px)
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
                Opacity ({options.outlineOpacity}%)
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
