import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, RefreshCw, Copy, Check, Hash, ArrowRight, Globe2 } from 'lucide-react';
import type { MetaResult, LanguageCode, LanguageEntry } from '@/types/domain';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { cn } from '@/utils/cn';

interface MetadataStageProps {
  results: MetaResult[];
  languages: LanguageEntry[];
  selectedLanguages: Set<LanguageCode>;
  onLanguageToggle: (lang: LanguageCode) => void;
  loading: boolean;
  onGenerate: () => void;
  onSelect: (result: MetaResult) => void;
  selectedMetaMap: Map<LanguageCode, MetaResult>;
  onRegenerate: () => void;
  onContinue: () => void;
  onBack: () => void;
}

function MetadataStage({
  results,
  languages,
  selectedLanguages,
  onLanguageToggle,
  loading,
  onGenerate,
  onSelect,
  selectedMetaMap,
  onRegenerate,
  onContinue,
  onBack,
}: MetadataStageProps) {
  const { t } = useTranslation();
  const hasResults = results.length > 0;

  const resultsByLang = results.reduce<Record<string, MetaResult[]>>((acc, res) => {
    const code = res.language;
    if (!acc[code]) acc[code] = [];
    acc[code]!.push(res);
    return acc;
  }, {});

  if (loading) {
    return (
      <section
        data-stage="metadata"
        data-phase="loading"
        className="flex flex-col items-center justify-center min-h-[50vh]"
      >
        <Loader title={t('metadata.generating')} text={t('metadata.generatingDesc')} size="xl" />
      </section>
    );
  }

  return (
    <section data-stage="metadata" className="max-w-6xl mx-auto space-y-8">
      {!hasResults && (
        <div className="bg-white p-5 sm:p-9 rounded-3xl border border-[#e4e5dd] space-y-8">
          <div className="stage-eyebrow">
            <Sparkles size={14} />
            {t('metadata.step6')}
          </div>
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 className="stage-heading">{t('metadata.title')}</h2>
              <p className="text-text-muted mt-3 max-w-2xl leading-relaxed">
                {t('metadata.subtitle')}
              </p>
            </div>
            <div className="hidden sm:flex shrink-0 h-20 w-20 items-center justify-center rounded-3xl bg-[#ece8f5] text-[#76628d]">
              <Globe2 size={36} strokeWidth={1.5} />
            </div>
          </div>

          <fieldset>
            <legend className="sr-only">{t('a11y.metadataLanguage')}</legend>
            <div
              className="grid grid-cols-2 lg:grid-cols-3 gap-3"
              role="group"
              aria-label={t('a11y.metadataLanguages')}
            >
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  role="checkbox"
                  aria-checked={selectedLanguages.has(lang.code)}
                  aria-label={t('a11y.language', { language: t(`language.names.${lang.code}`) })}
                  data-testid={`meta-lang-${lang.code}`}
                  onClick={() => onLanguageToggle(lang.code)}
                  className={cn(
                    'px-4 py-4 rounded-2xl border flex items-center justify-between gap-3 transition-colors text-sm text-left',
                    selectedLanguages.has(lang.code)
                      ? 'border-primary bg-primary-50 text-primary-800 font-semibold ring-1 ring-primary/10'
                      : 'border-[#e4e5dd] hover:border-primary-300 hover:bg-surface-dark text-text-muted',
                  )}
                >
                  <span className="min-w-0">
                    <span className="block">{t(`language.names.${lang.code}`)}</span>
                    <span className="block text-xs font-normal text-text-muted mt-1">
                      {lang.nativeName}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border',
                      selectedLanguages.has(lang.code)
                        ? 'bg-primary border-primary text-white'
                        : 'border-[#d4d7ca]',
                    )}
                    aria-hidden="true"
                  >
                    <Check
                      size={12}
                      className={cn(!selectedLanguages.has(lang.code) && 'opacity-0')}
                    />
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex justify-end border-t border-[#e4e5dd] pt-6">
            <Button
              onClick={onGenerate}
              disabled={selectedLanguages.size === 0}
              loading={loading}
              icon={<Sparkles size={16} />}
              size="lg"
              aria-label={t('a11y.generateMetadata')}
              data-testid="generate-metadata-btn"
              className="w-full sm:w-auto"
            >
              {t('metadata.generate')}
            </Button>
          </div>
        </div>
      )}

      {hasResults && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white/95 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-[#e4e5dd] sticky top-20 z-10 gap-4 shadow-[0_6px_24px_-18px_rgba(37,39,32,0.3)]">
            <h3 className="text-xl font-bold tracking-tight text-text flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-[#ece8f5] text-[#76628d]">
                <Sparkles size={20} />
              </span>
              {t('metadata.results')}
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerate}
                icon={<RefreshCw size={14} />}
                aria-label={t('a11y.regenerateMetadata')}
                data-testid="regenerate-metadata-btn"
              >
                {t('character.regenerate')}
              </Button>
              <Button
                onClick={onContinue}
                size="sm"
                icon={<ArrowRight size={14} />}
                aria-label={t('a11y.continueExport')}
                data-testid="continue-to-export-btn"
              >
                {t('strategy.next')}
              </Button>
            </div>
          </div>

          {Object.entries(resultsByLang).map(([code, options]) => {
            const langInfo = languages.find((l) => l.code === code);
            return (
              <div key={code} className="space-y-4 pt-3">
                <div className="flex items-center gap-2 text-lg font-semibold text-text border-b border-[#e4e5dd] pb-3">
                  <span>{t(`language.names.${code}`)}</span>
                  <span className="text-text-muted text-sm font-normal ml-auto">
                    {langInfo?.nativeName}
                  </span>
                </div>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {options.map((option, idx) => {
                    const selectedForLang = selectedMetaMap.get(option.language);
                    const isSelected = selectedForLang?.optionType === option.optionType;
                    return (
                      <MetaResultCard
                        key={`${code}-${idx}`}
                        result={option}
                        isSelected={isSelected}
                        onSelect={() => onSelect(option)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!hasResults && (
        <div className="stage-actions">
          <Button
            variant="outline"
            onClick={onBack}
            aria-label={t('a11y.back')}
            data-testid="back-btn"
          >
            {t('strategy.back')}
          </Button>
        </div>
      )}
    </section>
  );
}

function MetaResultCard({
  result,
  isSelected,
  onSelect,
}: {
  result: MetaResult;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  const [copiedTags, setCopiedTags] = useState(false);

  const scoreAvg =
    (result.evaluation.naturalness +
      result.evaluation.tone +
      result.evaluation.searchability +
      result.evaluation.creativity) /
    4;

  const scoreColor =
    scoreAvg >= 4.5 ? 'text-success' : scoreAvg >= 3.5 ? 'text-amber-600' : 'text-slate-500';

  const copyTags = () => {
    navigator.clipboard.writeText(result.tags.join(', ')).catch(() => {});
    setCopiedTags(true);
    setTimeout(() => setCopiedTags(false), 2000);
  };

  return (
    <Card
      className={cn(
        'flex flex-col h-full overflow-hidden',
        isSelected && 'ring-2 ring-primary/30 border-primary',
      )}
      hoverable
    >
      <div
        className={cn(
          'px-5 py-4 border-b flex justify-between items-center gap-2',
          isSelected ? 'bg-primary-50 border-primary-200' : 'bg-surface-dark border-[#e4e5dd]',
        )}
      >
        <span className="text-xs font-semibold capitalize text-text bg-white border border-[#e4e5dd] px-2.5 py-1 rounded-full">
          {t(`metadata.optionTypes.${result.optionType}`)}
        </span>
        <Button
          variant={isSelected ? 'primary' : 'ghost'}
          size="sm"
          onClick={onSelect}
          aria-pressed={isSelected}
          aria-label={t('a11y.selectMetadata', {
            option: t(`metadata.optionTypes.${result.optionType}`),
          })}
          data-testid={`select-meta-${result.optionType}`}
        >
          {isSelected ? (
            <span className="flex items-center gap-1">
              <Check size={12} /> {t('metadata.selected')}
            </span>
          ) : (
            t('metadata.select')
          )}
        </Button>
      </div>

      <div className="p-5 sm:p-6 flex-1 flex flex-col gap-5">
        <div>
          <p className="text-xs font-medium text-text-muted mb-2">{t('metadata.titleLabel')}</p>
          <p className="font-bold text-text text-xl leading-snug tracking-tight">{result.title}</p>
        </div>

        <div>
          <p className="text-xs font-medium text-text-muted mb-2">{t('metadata.descLabel')}</p>
          <p className="text-sm text-text-muted leading-relaxed">{result.description}</p>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <p className="text-xs font-medium text-text-muted flex items-center gap-1">
              <Hash size={12} /> {t('metadata.tags')} ({result.tags.length})
            </p>
            <button
              onClick={copyTags}
              aria-label={t('a11y.copyTags')}
              data-testid="copy-tags-btn"
              className={cn(
                'text-xs px-2 py-2 rounded-lg transition-colors flex items-center gap-1.5',
                copiedTags
                  ? 'text-success bg-success-light'
                  : 'text-text-muted hover:bg-surface-dark',
              )}
            >
              {copiedTags ? <Check size={10} /> : <Copy size={10} />}
              {copiedTags ? t('metadata.copied') : t('metadata.copy')}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {result.tags.map((tag, i) => (
              <span
                key={i}
                className="px-2.5 py-1 bg-surface-dark text-text-muted text-xs rounded-lg border border-[#e4e5dd]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-[#e4e5dd]">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-text-muted">
              {t('metadata.qualityScore')}
            </span>
            <span className={cn('text-2xl font-semibold tabular-nums', scoreColor)}>
              {scoreAvg.toFixed(1)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-text-muted tabular-nums">
            <div className="flex justify-between">
              <span>{t('metadata.naturalness')}</span> <b>{result.evaluation.naturalness}</b>
            </div>
            <div className="flex justify-between">
              <span>{t('metadata.tone')}</span> <b>{result.evaluation.tone}</b>
            </div>
            <div className="flex justify-between">
              <span>{t('metadata.seo')}</span> <b>{result.evaluation.searchability}</b>
            </div>
            <div className="flex justify-between">
              <span>{t('metadata.creativity')}</span> <b>{result.evaluation.creativity}</b>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export { MetadataStage };
export type { MetadataStageProps };
