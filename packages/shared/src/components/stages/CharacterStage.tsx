import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Sparkles, RefreshCw, ChevronDown, ChevronUp, Fingerprint } from 'lucide-react';
import type { CharacterSpec } from '@/types/domain';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';

interface CharacterStageProps {
  characterImage: string | null;
  characterSpec: CharacterSpec | null;
  loading: boolean;
  error: string | null;
  onRegenerate: () => void;
  onContinue: () => void;
  onBack: () => void;
}

const getSpecFields = (t: any): { key: keyof CharacterSpec; label: string }[] => [
  { key: 'physicalDescription', label: t('character.physicalDesc') },
  { key: 'facialFeatures', label: t('character.facialFeatures') },
  { key: 'colorPalette', label: t('character.colorPalette') },
  { key: 'distinguishingFeatures', label: t('character.distinguishingFeatures') },
  { key: 'artStyle', label: t('character.artStyle') },
];

function CharacterStage({
  characterImage,
  characterSpec,
  loading,
  error,
  onRegenerate,
  onContinue,
  onBack,
}: CharacterStageProps) {
  const { t } = useTranslation();
  const SPEC_FIELDS = getSpecFields(t);
  const [specExpanded, setSpecExpanded] = useState(false);

  if (loading) {
    return (
      <section data-stage="character" data-phase="loading" className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader title={t('character.designing')} text={t('character.designingDesc')} size="xl" />
      </section>
    );
  }

  return (
    <section
      data-stage="character"
      data-phase={characterImage ? 'complete' : 'idle'}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
          <Sparkles size={14} />
          {t('character.step3')}
        </div>
        <h2 className="text-3xl font-bold text-text">{t('character.title')}</h2>
        <p className="text-text-muted">{t('character.subtitle')}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <Sparkles size={16} className="text-primary" />
              {t('character.generatedChar')}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRegenerate}
              loading={loading}
              icon={<RefreshCw size={14} />}
              aria-label="Regenerate character"
              data-testid="regenerate-btn"
            >
              {t('character.regenerate')}
            </Button>
          </div>

          <div className="aspect-square rounded-xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center">
            {characterImage ? (
              <img
                src={`data:image/png;base64,${characterImage}`}
                alt="Generated character"
                className="w-full h-full object-contain"
              />
            ) : error ? (
              <div className="text-center p-6 space-y-3">
                <p role="alert" className="text-danger text-sm">
                  {error}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRegenerate}
                  aria-label="Retry character generation"
                  data-testid="retry-btn"
                >
                  {t('character.retry')}
                </Button>
              </div>
            ) : (
              <p className="text-text-muted text-sm">{t('character.notGeneratedYet')}</p>
            )}
          </div>
        </Card>

        {characterSpec && (
          <Card className="p-5 space-y-4">
            <button
              onClick={() => setSpecExpanded((e) => !e)}
              aria-expanded={specExpanded}
              aria-label="Toggle character spec details"
              data-testid="toggle-spec-btn"
              className="w-full flex items-center justify-between"
            >
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                <Fingerprint size={16} className="text-primary-700" />
                {t('character.charInfo')}
              </h3>
              {specExpanded ? (
                <ChevronUp size={16} className="text-slate-400" />
              ) : (
                <ChevronDown size={16} className="text-slate-400" />
              )}
            </button>

            {specExpanded && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                {SPEC_FIELDS.map(({ key, label }) => (
                  <div key={key}>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-0.5">
                      {label}
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">{characterSpec[key]}</p>
                  </div>
                ))}
              </div>
            )}

            {!specExpanded && <p className="text-xs text-text-muted">{t('character.expandDetails')}</p>}
          </Card>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} aria-label="Go back" data-testid="back-btn">
          {t('strategy.back')}
        </Button>
        <Button
          onClick={onContinue}
          disabled={!characterImage}
          size="lg"
          aria-label="Continue to emoji generation"
          data-testid="continue-btn"
        >
          {t('character.toEmojiGen')}
        </Button>
      </div>
    </section>
  );
}

export { CharacterStage };
export type { CharacterStageProps };
