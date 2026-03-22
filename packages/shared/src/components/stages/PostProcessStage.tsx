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
    <section data-stage="postprocess" className="max-w-7xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
          <Wand2 size={14} />
          {t('postprocess.step5')}
        </div>
        <h2 className="text-3xl font-bold text-text">{t('postprocess.title')}</h2>
        <p className="text-text-muted">
          {t('postprocess.subtitle')}
        </p>
      </div>

      <p className="text-sm text-text-muted text-center">
        {t('postprocess.applyCount', { count: selectedIds.size })}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <ProcessingOptions options={processingOptions} onChange={onOptionsChange} />
        </div>

        <div className="lg:col-span-2 bg-slate-100 rounded-2xl p-6 flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text-muted text-sm">{t('postprocess.livePreview')}</h3>
            <div
              className="flex items-center gap-1 bg-slate-200 rounded-lg p-0.5"
              role="radiogroup"
              aria-label="Preview background color"
            >
              <button
                role="radio"
                aria-checked={previewBg === 'white'}
                aria-label="White background"
                onClick={() => setPreviewBg('white')}
                className={cn(
                  'w-7 h-7 rounded-lg border-2 transition-all',
                  previewBg === 'white'
                    ? 'border-primary ring-2 ring-primary/30 bg-white'
                    : 'border-slate-300 bg-white hover:border-slate-400',
                )}
              />
              <button
                role="radio"
                aria-checked={previewBg === 'black'}
                aria-label="Black background"
                onClick={() => setPreviewBg('black')}
                className={cn(
                  'w-7 h-7 rounded-lg border-2 transition-all',
                  previewBg === 'black'
                    ? 'border-primary ring-2 ring-primary/30 bg-black'
                    : 'border-slate-300 bg-black hover:border-slate-400',
                )}
              />
            </div>
          </div>
          <div
            className={cn(
              'flex-1 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden relative transition-colors',
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
                className="max-h-[400px] object-contain"
              />
            ) : (
              <div
                className={cn(
                  'flex flex-col items-center gap-2',
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

      <div className="flex flex-col-reverse sm:flex-row justify-between pt-4 gap-3 sm:gap-0">
        <Button variant="outline" onClick={onBack} aria-label="Go back" data-testid="back-btn" className="w-full sm:w-auto">
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
