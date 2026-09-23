import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Clock, AlertCircle, Pencil, Layers } from 'lucide-react';
import type { Sticker } from '@/types/domain';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AnimatedInputWrapper } from '@/components/ui/AnimatedInputWrapper';
import { Loader } from '@/components/ui/Loader';

interface StickerBatchStageProps {
  stickers: Sticker[];
  totalCount: number;
  isGenerating: boolean;
  onRegenerate: (id: number) => void;
  onContinue: () => void;
  onBack: () => void;
  onEditIdea: (id: number, updates: { imagePrompt?: string }) => void;
}

function StickerBatchStage({
  stickers,
  totalCount,
  isGenerating,
  onRegenerate,
  onContinue,
  onBack,
  onEditIdea,
}: StickerBatchStageProps) {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPrompt, setEditPrompt] = useState('');

  const startEdit = (sticker: Sticker) => {
    setEditingId(sticker.id);
    setEditPrompt(sticker.idea.imagePrompt);
  };
  const cancelEdit = () => setEditingId(null);
  const saveEdit = (id: number) => {
    onEditIdea(id, { imagePrompt: editPrompt });
    setEditingId(null);
  };

  const doneCount = stickers.filter((s) => s.status === 'done').length;
  const errorCount = stickers.filter((s) => s.status === 'error').length;
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const isComplete =
    stickers.length > 0 &&
    stickers.every((s) => s.status === 'done' || s.status === 'error') &&
    !isGenerating;

  if (stickers.length === 0) {
    return (
      <section
        data-stage="stickers"
        data-phase="idle"
        className="flex flex-col items-center justify-center min-h-[50vh]"
      >
        <Loader
          title={t('stickers.generating')}
          text={t('stickers.generatingDesc', { count: totalCount })}
          size="xl"
        />
      </section>
    );
  }

  return (
    <section
      data-stage="stickers"
      data-phase={isGenerating ? 'generating' : 'complete'}
      className="max-w-7xl mx-auto space-y-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between bg-white/95 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-[#e4e5dd] sticky top-20 z-30 gap-5 shadow-[0_6px_24px_-18px_rgba(37,39,32,0.3)]">
        <div className="flex items-center gap-4 min-w-0">
          <div className="shrink-0 p-3 rounded-2xl bg-[#edf0ce] text-[#656c35]">
            <Layers size={24} />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text">
              {t('stickers.generatingTitle')}
            </h2>
            <div role="status" aria-live="polite" className="text-sm text-text-muted">
              {isGenerating
                ? t('stickers.processing', { done: doneCount, total: totalCount })
                : t('stickers.completed', { done: doneCount, error: errorCount })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5 w-full lg:w-auto">
          <div className="flex-1 min-w-0 lg:w-44">
            <div
              role="progressbar"
              aria-valuenow={doneCount}
              aria-valuemin={0}
              aria-valuemax={totalCount}
              aria-label="Emoji generation progress"
              className="w-full h-2 bg-[#eeeee7] rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs font-semibold text-text-muted mt-2 tabular-nums">
              {progressPct}%
            </p>
          </div>
          <Button
            onClick={onContinue}
            disabled={!isComplete}
            size="md"
            aria-label="Continue to post-processing"
            data-testid="continue-btn"
          >
            {t('strategy.next')}
          </Button>
        </div>
      </div>

      <div
        className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4"
        role="list"
        aria-label="Emoji grid"
      >
        {stickers.map((sticker) => (
          <React.Fragment key={sticker.id}>
            <Card className="p-2.5 sm:p-3 flex flex-col items-center min-h-[200px]">
              <div
                className="studio-preview w-full aspect-square rounded-2xl mb-3 flex items-center justify-center overflow-hidden border border-[#eaeae3] relative group"
                role="listitem"
                aria-label={`Emoji ${sticker.id}: ${sticker.idea.label}`}
                data-job-status={sticker.status}
              >
                {sticker.status === 'done' && sticker.imageUrl ? (
                  <>
                    <img
                      src={`data:image/png;base64,${sticker.imageUrl}`}
                      alt={sticker.idea.label}
                      className="w-full h-full object-contain p-3 pb-12"
                    />
                    <div className="absolute bottom-1.5 inset-x-1.5 flex items-center justify-center gap-1">
                      <button
                        onClick={() => onRegenerate(sticker.id)}
                        aria-label={`Regenerate emoji ${sticker.id}`}
                        data-testid={`regen-${sticker.id}`}
                        className="p-2.5 bg-white rounded-xl border border-[#e4e5dd] hover:bg-primary-50 hover:border-primary-200 text-primary transition-colors shadow-xs"
                      >
                        <RefreshCw size={18} />
                      </button>
                      <button
                        onClick={() => startEdit(sticker)}
                        aria-label={`Edit emoji ${sticker.id} prompt`}
                        data-testid={`edit-${sticker.id}`}
                        className="p-2.5 bg-white rounded-xl border border-[#e4e5dd] hover:bg-surface-dark text-text-muted transition-colors shadow-xs"
                      >
                        <Pencil size={18} />
                      </button>
                    </div>
                  </>
                ) : sticker.status === 'loading' ? (
                  <div className="scale-75">
                    <Loader size="sm" />
                  </div>
                ) : sticker.status === 'error' ? (
                  <div className="text-center space-y-1.5">
                    <AlertCircle className="w-7 h-7 text-danger mx-auto" />
                    <button
                      onClick={() => onRegenerate(sticker.id)}
                      aria-label={`Retry emoji ${sticker.id}`}
                      data-testid={`retry-${sticker.id}`}
                      className="text-sm text-primary font-semibold underline underline-offset-4 px-3 py-2"
                    >
                      {t('character.retry')}
                    </button>
                  </div>
                ) : (
                  <Clock className="w-7 h-7 text-[#b9bcae]" />
                )}
              </div>

              <div className="w-full space-y-1 px-1 pb-1">
                <p className="text-sm font-semibold text-text leading-snug line-clamp-2">
                  {sticker.idea.label}
                </p>
                <div className="flex justify-between items-center gap-2 text-xs text-text-muted pt-1.5">
                  <span className="tabular-nums">#{sticker.id}</span>
                  <span className="truncate">{sticker.idea.category}</span>
                </div>
              </div>
            </Card>
            {editingId === sticker.id && (
              <div className="col-span-full bg-white border border-primary/30 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
                <div>
                  <label
                    htmlFor={`sticker-prompt-${sticker.id}`}
                    className="block text-sm font-semibold text-text mb-2"
                  >
                    {t('stickers.regenPrompt')}
                  </label>
                  <AnimatedInputWrapper>
                    <textarea
                      id={`sticker-prompt-${sticker.id}`}
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      rows={3}
                      className="w-full bg-transparent px-4 py-3 text-sm leading-relaxed resize-y outline-none"
                      aria-label="Edit generation prompt"
                      data-testid={`edit-prompt-${sticker.id}`}
                    />
                  </AnimatedInputWrapper>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={cancelEdit}>
                    {t('stickers.cancel')}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => saveEdit(sticker.id)}
                    aria-label="Save and regenerate"
                  >
                    {t('stickers.saveAndRegen')}
                  </Button>
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="stage-actions">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isGenerating}
          aria-label="Go back"
          data-testid="back-btn"
        >
          {t('strategy.back')}
        </Button>
      </div>
    </section>
  );
}

export { StickerBatchStage };
export type { StickerBatchStageProps };
