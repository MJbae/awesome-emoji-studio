import { useTranslation } from 'react-i18next';
import { useState, useId } from 'react';
import { ImagePlus, Sparkles, Globe2, ArrowUpRight, Check, Layers3 } from 'lucide-react';
import type { UserInput } from '@/types/domain';
import { Button } from '@/components/ui/Button';
import { AnimatedInputWrapper } from '@/components/ui/AnimatedInputWrapper';
import { cn } from '@/utils/cn';
import samples from '@/assets/studio-samples.svg';

interface InputStageProps {
  onSubmit: (input: UserInput) => void;
  initialData?: UserInput;
}

const LANGUAGES = [
  'Korean',
  'Japanese',
  'Traditional Chinese',
  'Simplified Chinese',
  'Thai',
] as const;
const LANG_META: Record<(typeof LANGUAGES)[number], { native: string; code: string }> = {
  Korean: { native: '한국', code: 'KR' },
  Japanese: { native: '日本', code: 'JP' },
  'Traditional Chinese': { native: '台灣', code: 'TW' },
  'Simplified Chinese': { native: '中国', code: 'CN' },
  Thai: { native: 'ไทย', code: 'TH' },
};

function InputStage({ onSubmit, initialData }: InputStageProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<UserInput>(
    initialData ?? {
      concept: '',
      referenceImage: null,
      language: 'Korean',
      skipCharacterGen: false,
    },
  );
  const [preview, setPreview] = useState<string | null>(
    initialData?.referenceImage ? `data:image/png;base64,${initialData.referenceImage}` : null,
  );
  const conceptId = useId();
  const fileId = useId();
  const isValid = data.concept.trim().length >= 3;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreview(result);
      const base64 = result.split(',')[1] ?? null;
      setData((prev) => ({
        ...prev,
        referenceImage: base64,
        ...(!base64 && { skipCharacterGen: false }),
      }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <section data-stage="input" className="space-y-7">
      <div className="space-y-3">
        <span className="stage-eyebrow">
          <Sparkles size={14} />
          {t('input.step1')}
          <span className="mx-1 text-slate-300">/</span>
          {t('studio.newCollection')}
        </span>
        <h2 className="stage-heading">{t('input.title')}</h2>
        <p className="max-w-xl text-sm leading-relaxed text-text-muted">{t('input.subtitle')}</p>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(260px,1fr)]">
        <div className="studio-card space-y-6 p-5 sm:p-7">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor={conceptId} className="studio-label">
                {t('input.conceptLabel')} <span className="text-primary">*</span>
              </label>
              <span className="text-[10px] text-text-muted">{t('studio.required')}</span>
            </div>
            <AnimatedInputWrapper>
              <textarea
                id={conceptId}
                value={data.concept}
                onChange={(e) => setData((prev) => ({ ...prev, concept: e.target.value }))}
                placeholder={t('input.conceptPlaceholder')}
                aria-label="Character concept description"
                aria-describedby={`${conceptId}-hint`}
                data-testid="concept-textarea"
                className="h-32 w-full resize-y bg-transparent p-4 text-sm leading-7 outline-none placeholder:text-slate-400"
              />
            </AnimatedInputWrapper>
            <p
              id={`${conceptId}-hint`}
              className="text-right text-[11px] tabular-nums text-text-muted"
            >
              {data.concept.trim().length < 3
                ? t('input.charsNeeded', { count: 3 - data.concept.trim().length })
                : t('input.charsCount', { count: data.concept.length })}
            </p>
          </div>

          <fieldset className="space-y-3">
            <legend className="studio-label mb-3">
              <span className="inline-flex items-center gap-2">
                <Globe2 size={15} className="text-text-muted" />
                {t('input.targetMarket')}
              </span>
            </legend>
            <div
              className="grid grid-cols-5 gap-1.5 sm:gap-2"
              role="radiogroup"
              aria-label="Target language"
            >
              {LANGUAGES.map((lang) => {
                const meta = LANG_META[lang];
                const isSelected = data.language === lang;
                return (
                  <button
                    key={lang}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={`Language: ${lang}`}
                    data-testid={`lang-${lang.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => setData((prev) => ({ ...prev, language: lang }))}
                    className={cn(
                      'relative flex min-h-[74px] flex-col items-center justify-center gap-1.5 rounded-xl border text-center transition-colors',
                      isSelected
                        ? 'border-primary/70 bg-primary-50 text-primary'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50',
                    )}
                  >
                    <span className="text-[10px] font-semibold tracking-wider opacity-65">
                      {meta.code}
                    </span>
                    <span className="text-xs font-semibold">{meta.native}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="space-y-3 border-t border-slate-100 pt-6">
            <label htmlFor={fileId} className="studio-label">
              {t('input.referenceImage')}
            </label>
            <div className="relative flex min-h-28 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4 transition-colors hover:border-primary/60 hover:bg-primary-50/40 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary">
              <input
                id={fileId}
                type="file"
                accept="image/*"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                onChange={handleImageUpload}
                aria-label="Upload reference image"
                data-testid="reference-image-input"
              />
              {preview ? (
                <div className="pointer-events-none text-center">
                  <img
                    src={preview}
                    alt="Reference preview"
                    className="mx-auto h-28 rounded-lg object-contain"
                  />
                  <p className="mt-2 text-xs text-text-muted">{t('input.clickToChange')}</p>
                </div>
              ) : (
                <div className="pointer-events-none flex items-center gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500">
                    <ImagePlus size={21} strokeWidth={1.5} />
                  </span>
                  <div>
                    <p className="text-xs text-slate-600">
                      <span className="font-semibold text-primary">{t('input.upload')}</span>{' '}
                      {t('input.orDrag')}
                    </p>
                    <p className="mt-1.5 text-[10px] text-text-muted">{t('input.imageReqs')}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-4 pt-1">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-700">{t('input.useAsBase')}</p>
                <p className="max-w-sm text-[11px] leading-relaxed text-text-muted">
                  {t('input.skipCharGen')}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-label={t('input.useAsBase')}
                aria-checked={!!data.skipCharacterGen && !!data.referenceImage}
                disabled={!data.referenceImage}
                data-testid="skip-chargen-toggle"
                onClick={() =>
                  setData((prev) => ({ ...prev, skipCharacterGen: !prev.skipCharacterGen }))
                }
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors',
                  data.skipCharacterGen && data.referenceImage ? 'bg-primary' : 'bg-slate-300',
                  !data.referenceImage && 'cursor-not-allowed opacity-50',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-xs transition-transform',
                    data.skipCharacterGen && data.referenceImage
                      ? 'translate-x-5'
                      : 'translate-x-0',
                  )}
                />
              </button>
            </div>
          </div>
          <div className="border-t border-slate-100 pt-5">
            <Button
              onClick={() => onSubmit(data)}
              disabled={!isValid}
              className="w-full"
              size="lg"
              aria-label="Analyze concept and proceed"
              data-testid="analyze-btn"
            >
              {t('input.analyzeConcept')}
            </Button>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="overflow-hidden rounded-[20px] border border-[#dfe3ce] bg-[#eef0e1]">
            <div className="flex items-center justify-between px-5 pt-5">
              <span className="rounded-full border border-[#d5dac1] bg-white/65 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-widest text-[#5c6842]">
                {t('studio.madeOfIdeas')}
              </span>
              <Sparkles size={17} className="text-[#7a875b]" />
            </div>
            <img
              src={samples}
              alt={t('studio.sampleAlt')}
              className="mx-auto w-full max-w-[400px] px-2"
            />
            <div className="px-6 pb-6">
              <h3 className="max-w-[270px] break-keep text-xl font-semibold leading-snug tracking-tight text-[#3b452c]">
                {t('studio.previewTitle')}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#6a745b]">
                {t('studio.previewDescription')}
              </p>
            </div>
          </div>
          <div className="studio-card p-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold">
              <Layers3 size={15} className="text-primary" />
              {t('studio.collectionIncludes')}
            </div>
            <ul className="space-y-3 text-[11px] text-text-muted">
              {[
                t('studio.includesImages'),
                t('studio.includesLanguages'),
                t('studio.includesExports'),
              ].map((line) => (
                <li key={line} className="flex items-center gap-2">
                  <Check size={13} className="shrink-0 text-success" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <p className="flex items-center gap-1.5 px-1 text-[10px] text-text-muted">
            <ArrowUpRight size={12} />
            {t('studio.exampleNote')}
          </p>
        </aside>
      </div>
    </section>
  );
}

export { InputStage };
export type { InputStageProps };
