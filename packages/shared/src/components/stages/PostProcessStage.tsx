import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Wand2, Image as ImageIcon } from 'lucide-react';
import type { ProcessingOptions as ProcessingOptionsType } from '@/types/domain';
import { ProcessingOptions } from '@/components/ui/ProcessingOptions';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { cn } from '@/utils/cn';

interface PostProcessStageProps {
  selectedIds: Set<string>;
  processingOptions: ProcessingOptionsType;
  onOptionsChange: (opts: ProcessingOptionsType) => void;
  previewSrc: string | null;
  isProcessing: boolean;
  onContinue: () => void;
  onBack: () => void;
}

type PreviewBg = 'white' | 'black';

function PostProcessStage({
  selectedIds,
  processingOptions,
  onOptionsChange,
  previewSrc,
  isProcessing,
  onContinue,
  onBack,
}: PostProcessStageProps) {
  const { t } = useTranslation();
  const [previewBg, setPreviewBg] = useState<PreviewBg>('white');

  return (
    <section data-stage="postprocess" className="max-w-6xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="stage-eyebrow">
          <Wand2 size={14} />
          {t('postprocess.step5')}
        </div>
        <h2 className="stage-heading">{t('postprocess.title')}</h2>
        <p className="text-text-muted leading-relaxed">{t('postprocess.subtitle')}</p>
      </div>

      <p className="inline-flex items-center gap-2 rounded-full bg-[#edf0ce] px-4 py-2 text-sm font-medium text-[#59612d]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#7e8a42]" aria-hidden="true" />
        {t('postprocess.applyCount', { count: selectedIds.size })}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.65fr)] gap-6 items-start">
        <div className="space-y-4">
          <ProcessingOptions options={processingOptions} onChange={onOptionsChange} />
        </div>

        <div className="bg-[#eeefe7] border border-[#e0e2d6] rounded-3xl p-4 sm:p-6 flex flex-col min-h-[420px] sm:min-h-[500px]">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="font-semibold text-text text-sm flex items-center gap-2">
              <ImageIcon size={16} className="text-[#7e8a42]" />
              {t('postprocess.livePreview')}
            </h3>
            <div
              className="flex items-center gap-1.5 bg-white/70 border border-[#e0e2d6] rounded-2xl p-1.5"
              role="radiogroup"
              aria-label="Preview background color"
            >
              <button
                role="radio"
                aria-checked={previewBg === 'white'}
                aria-label="White background"
                onClick={() => setPreviewBg('white')}
                className={cn(
                  'w-10 h-10 rounded-xl border-2 transition-colors',
                  previewBg === 'white'
                    ? 'border-primary ring-2 ring-primary/15 bg-white'
                    : 'border-[#d7d9ce] bg-white hover:border-primary/50',
                )}
              />
              <button
                role="radio"
                aria-checked={previewBg === 'black'}
                aria-label="Black background"
                onClick={() => setPreviewBg('black')}
                className={cn(
                  'w-10 h-10 rounded-xl border-2 transition-colors',
                  previewBg === 'black'
                    ? 'border-primary ring-2 ring-primary/15 bg-black'
                    : 'border-[#d7d9ce] bg-black hover:border-primary/50',
                )}
              />
            </div>
          </div>
          <div
            className={cn(
              'flex-1 min-h-[320px] rounded-2xl border border-[#dfe1d6] flex items-center justify-center overflow-hidden relative transition-colors',
              previewBg === 'black' ? 'bg-black' : 'bg-white',
            )}
            aria-label="Processing preview"
          >
            {isProcessing && (
              <div
                className={cn(
                  'absolute inset-0 backdrop-blur-xs flex items-center justify-center z-10',
                  previewBg === 'black' ? 'bg-black/50' : 'bg-white/50',
                )}
              >
                <div className="scale-75">
                  <Loader size="md" />
                </div>
              </div>
            )}
            {previewSrc ? (
              <img
                src={previewSrc}
                alt="Processing preview"
                className="w-full max-h-[440px] object-contain p-6 sm:p-8"
              />
            ) : (
              <div
                className={cn(
                  'flex flex-col items-center gap-4 p-6 text-center',
                  previewBg === 'black' ? 'text-slate-400' : 'text-text-muted',
                )}
              >
                <ImageIcon size={40} />
                <span className="text-sm">{t('postprocess.selectImage')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="stage-actions">
        <Button
          variant="outline"
          onClick={onBack}
          aria-label="Go back"
          data-testid="back-btn"
          className="w-full sm:w-auto"
        >
          {t('strategy.back')}
        </Button>
        <Button
          onClick={onContinue}
          disabled={selectedIds.size === 0}
          size="lg"
          aria-label="Continue to metadata"
          data-testid="continue-btn"
          className="w-full sm:w-auto"
        >
          {t('strategy.next')}
        </Button>
      </div>
    </section>
  );
}

export { PostProcessStage };
export type { PostProcessStageProps };
