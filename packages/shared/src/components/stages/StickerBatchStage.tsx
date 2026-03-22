import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Clock, AlertCircle, Pencil } from 'lucide-react';
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white/90 backdrop-blur-sm p-5 rounded-2xl border border-slate-200/60 sticky top-16 z-30 gap-4 shadow-md transition-all">
        <div className="space-y-1 w-full sm:w-auto text-center sm:text-left">
          <h2 className="text-lg font-bold text-text">{t('stickers.generatingTitle')}</h2>
          <div role="status" aria-live="polite" className="text-sm text-text-muted">
            {isGenerating
              ? t('stickers.processing', { done: doneCount, total: totalCount })
              : t('stickers.completed', { done: doneCount, error: errorCount })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <div className="flex-1 w-full sm:w-56">
            <div
              role="progressbar"
              aria-valuenow={doneCount}
              aria-valuemin={0}
              aria-valuemax={totalCount}
              aria-label="Emoji generation progress"
              className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner"
            >
              <div
                className="h-full bg-gradient-to-r from-[#06C755] to-[#45e888] rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(6,199,85,0.4)]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs font-semibold text-text-muted mt-1.5 text-right">{progressPct}%</p>
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
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        role="list"
        aria-label="Emoji grid"
      >
        {stickers.map((sticker) => (
          <React.Fragment key={sticker.id}>
            <Card className="p-3 flex flex-col items-center min-h-[200px]">
              <div
                className="w-full aspect-square bg-slate-50 rounded-xl mb-2 flex items-center justify-center overflow-hidden border border-slate-100 relative group"
                role="listitem"
                aria-label={`Emoji ${sticker.id}: ${sticker.idea.expression}`}
                data-job-status={sticker.status}
              >
                {sticker.status === 'done' && sticker.imageUrl ? (
                  <>
                    <img
                      src={`data:image/png;base64,${sticker.imageUrl}`}
                      alt={sticker.idea.expression}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => onRegenerate(sticker.id)}
                        aria-label={`Regenerate emoji ${sticker.id}`}
                        data-testid={`regen-${sticker.id}`}
                        className="p-2 bg-white rounded-full hover:bg-slate-100 text-primary"
                      >
                        <RefreshCw size={18} />
                      </button>
                      <button
                        onClick={() => startEdit(sticker)}
                        aria-label={`Edit emoji ${sticker.id} prompt`}
                        data-testid={`edit-${sticker.id}`}
                        className="p-2 bg-white rounded-full hover:bg-slate-100 text-slate-600"
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
                      className="text-xs text-primary font-semibold underline"
                    >
                      {t('character.retry')}
                    </button>
                  </div>
                ) : (
                  <Clock className="w-7 h-7 text-slate-200" />
                )}
              </div>

              <div className="w-full text-center space-y-0.5">
                <p className="text-xs font-bold text-slate-900 leading-tight line-clamp-2">
                  {sticker.idea.expression}
                </p>
                <div className="flex justify-between items-center text-[10px] text-text-muted border-t border-slate-100 pt-1 mt-1">
                  <span>#{sticker.id}</span>
                  <span>{sticker.idea.category}</span>
                </div>
              </div>
            </Card>
            {editingId === sticker.id && (
              <div className="col-span-full bg-white border border-primary/30 rounded-xl p-4 space-y-3 -mt-2 shadow-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {t('stickers.regenPrompt')}
                  </label>
                  <AnimatedInputWrapper>
                    <textarea
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      rows={3}
                      className="w-full bg-transparent px-3 py-2 text-sm resize-none outline-none"
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

      <div className="text-center pt-6 pb-8">
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
