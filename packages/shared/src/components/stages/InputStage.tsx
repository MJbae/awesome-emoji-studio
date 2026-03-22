import { useTranslation } from 'react-i18next';
import { useState, useId } from 'react';
import { Image as ImageIcon, Sparkles } from 'lucide-react';
import type { UserInput } from '@/types/domain';
import { Button } from '@/components/ui/Button';
import { AnimatedInputWrapper } from '@/components/ui/AnimatedInputWrapper';
import { cn } from '@/utils/cn';

interface InputStageProps {
  onSubmit: (input: UserInput) => void;
  initialData?: UserInput;
}

const LANGUAGES = ['Korean', 'Japanese', 'Traditional Chinese'] as const;

const LANG_META: Record<(typeof LANGUAGES)[number], { native: string }> = {
  Korean: { native: '한국' },
  Japanese: { native: '일본' },
  'Traditional Chinese': { native: '대만' },
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
  const [preview, setPreview] = useState<string | null>(null);
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
    <section data-stage="input" className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
          <Sparkles size={14} />
          {t('input.step1')}
        </div>
        <h2 className="text-3xl font-bold text-text">{t('input.title')}</h2>
        <p className="text-text-muted">{t('input.subtitle')}</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-xs border border-slate-100 space-y-6">
        <div className="space-y-1.5">
          <label htmlFor={conceptId} className="block text-sm font-medium text-slate-700">
            {t('input.conceptLabel')} <span className="text-danger">*</span>
          </label>
          <AnimatedInputWrapper>
            <textarea
              id={conceptId}
              value={data.concept}
              onChange={(e) => setData((prev) => ({ ...prev, concept: e.target.value }))}
              placeholder={t('input.conceptPlaceholder')}
              aria-label="Character concept description"
              data-testid="concept-textarea"
              className="h-28 sm:h-32 w-full resize-none bg-transparent p-3 sm:p-4 text-sm outline-none"
            />
          </AnimatedInputWrapper>
          <p className="text-xs text-text-muted">
            {data.concept.length < 3
              ? t('input.charsNeeded', { count: 3 - data.concept.length })
              : t('input.charsCount', { count: data.concept.length })}
          </p>
        </div>

        <fieldset className="space-y-1.5">
          <legend className="block text-sm font-medium text-slate-700 mb-2">{t('input.targetMarket')}</legend>
          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-3"
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
                    'group relative flex flex-col items-center justify-center rounded-2xl text-sm sm:text-base font-bold transition-all duration-300 w-full text-center overflow-hidden',
                    isSelected
                      ? 'p-[2px] shadow-lg scale-[1.02] sm:scale-105 z-10 text-[#111111] bg-white'
                      : 'p-3 sm:p-4 border-2 bg-white border-slate-100 hover:border-[#06C755]/40 hover:bg-slate-50 hover:-translate-y-[2px] sm:hover:-translate-y-1 hover:shadow-sm sm:hover:shadow-md text-slate-500 active:scale-95',
                  )}
                >
                  {isSelected && (
                    <>
                      <span className="absolute left-1/2 top-1/2 aspect-square w-[200%] -translate-x-1/2 -translate-y-1/2 animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0_270deg,rgba(6,199,85,0.2)_330deg,#06C755_360deg)]" />
                      <span className="absolute inset-[2px] rounded-[14px] bg-[#EBF7EF]" />
                    </>
                  )}

                  <span className={cn(
                    "relative z-10 transition-transform duration-300 ease-out sm:group-hover:scale-110",
                    isSelected && "w-full py-[10px] sm:py-[14px] px-[10px] sm:px-[14px] flex items-center justify-center"
                  )}>
                    {meta.native}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="space-y-1.5">
          <label htmlFor={fileId} className="block text-sm font-medium text-slate-700">
            {t('input.referenceImage')}
          </label>
          <div
            className={cn(
              'mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition-colors cursor-pointer relative',
              'border-slate-200 hover:bg-slate-50',
            )}
          >
            <input
              id={fileId}
              type="file"
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleImageUpload}
              aria-label="Upload reference image"
              data-testid="reference-image-input"
            />
            <div className="text-center">
              {preview ? (
                <div>
                  <img
                    src={preview}
                    alt="Reference preview"
                    className="mx-auto h-40 object-contain rounded-lg"
                  />
                  <p className="mt-2 text-xs text-text-muted">{t('input.clickToChange')}</p>
                </div>
              ) : (
                <>
                  <ImageIcon className="mx-auto h-10 w-10 text-slate-400" />
                  <p className="mt-2 text-sm text-slate-600">
                    <span className="font-medium text-primary">{t('input.upload')}</span> {t('input.orDrag')}
                  </p>
                  <p className="text-xs text-text-muted">{t('input.imageReqs')}</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-slate-700">{t('input.useAsBase')}</p>
            <p className="text-xs text-text-muted">
              {t('input.skipCharGen')}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={!!data.skipCharacterGen && !!data.referenceImage}
            disabled={!data.referenceImage}
            data-testid="skip-chargen-toggle"
            onClick={() =>
              setData((prev) => ({ ...prev, skipCharacterGen: !prev.skipCharacterGen }))
            }
            className={cn(
              'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2',
              data.skipCharacterGen && data.referenceImage ? 'bg-primary' : 'bg-slate-200',
              !data.referenceImage && 'opacity-50 cursor-not-allowed',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out',
                data.skipCharacterGen && data.referenceImage ? 'translate-x-5' : 'translate-x-0',
              )}
            />
          </button>
        </div>

        <div className="pt-3">
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
    </section>
  );
}

export { InputStage };
export type { InputStageProps };
