import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, RefreshCw, Copy, Check, Hash, Download } from 'lucide-react';
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
  onExport: () => void;
  isExporting: boolean;
  exportProgress: number;
  exportError: string | null;
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
  onExport,
  isExporting,
  exportProgress,
  exportError,
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
      <section data-stage="metadata" data-phase="loading" className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader title={t('metadata.generating')} text={t('metadata.generatingDesc')} size="xl" />
      </section>
    );
  }

  return (
    <section data-stage="metadata" className="max-w-6xl mx-auto space-y-8">
      {!hasResults && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
            <Sparkles size={14} />
            {t('metadata.step6')}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text">{t('metadata.title')}</h2>
            <p className="text-text-muted mt-2 max-w-lg mx-auto">
              {t('metadata.subtitle')}
            </p>
          </div>

          <fieldset>
            <legend className="sr-only">Select metadata language</legend>
            <div
              className="flex flex-wrap justify-center gap-3"
              role="group"
              aria-label="Metadata languages"
            >
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  role="checkbox"
                  aria-checked={selectedLanguages.has(lang.code)}
                  aria-label={`Language: ${lang.label}`}
                  data-testid={`meta-lang-${lang.code}`}
                  onClick={() => onLanguageToggle(lang.code)}
                  className={cn(
                    'px-4 py-2 rounded-xl border flex items-center gap-2 transition-all text-sm',
                    selectedLanguages.has(lang.code)
                      ? 'border-primary bg-primary-50 text-primary-700 font-medium'
                      : 'border-slate-200 hover:border-primary-300 text-slate-600',
                  )}
                >
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <Button
            onClick={onGenerate}
            disabled={selectedLanguages.size === 0}
            loading={loading}
            icon={<Sparkles size={16} />}
            size="lg"
            aria-label="Generate metadata"
            data-testid="generate-metadata-btn"
          >
            {t('metadata.generate')}
          </Button>
        </div>
      )}

      {hasResults && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/60 sticky top-16 z-10 gap-3 shadow-md transition-all">
            <h3 className="text-lg font-bold text-text flex items-center gap-2">
              <Sparkles className="text-primary" size={18} />
              {t('metadata.results')}
            </h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerate}
                icon={<RefreshCw size={14} />}
                aria-label="Regenerate metadata"
                data-testid="regenerate-metadata-btn"
              >
                {t('character.regenerate')}
              </Button>
              <Button
                onClick={onExport}
                size="sm"
                disabled={isExporting}
                icon={<Download size={14} />}
                aria-label="Export emoji ZIP"
                data-testid="export-btn"
              >
                {t('metadata.exportZip')}
              </Button>
            </div>
          </div>

          {isExporting && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-3">
                <Download className="text-primary animate-bounce" size={20} />
                <span className="text-sm font-medium text-text">{t('metadata.exporting')}</span>
              </div>
              <progress
                value={exportProgress}
                max={100}
                className="w-full h-3 overflow-hidden [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-slate-200 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary [&::-webkit-progress-value]:transition-all [&::-moz-progress-bar]:bg-primary [&::-moz-progress-bar]:rounded-full"
              />
              <p className="text-xs text-text-muted text-right">{exportProgress}%</p>
            </div>
          )}

          {exportError && !isExporting && (
            <div className="bg-red-50 p-4 rounded-2xl border border-red-200 flex items-start gap-3">
              <span className="text-red-500 shrink-0 mt-0.5">⚠</span>
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-800">{t('metadata.exportFailed')}</p>
                <p className="text-xs text-red-600">{exportError}</p>
                <p className="text-xs text-text-muted">
                  {t('metadata.exportFailedDesc')}
                </p>
              </div>
            </div>
          )}

          {Object.entries(resultsByLang).map(([code, options]) => {
            const langInfo = languages.find((l) => l.code === code);
            return (
              <div key={code} className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-bold text-slate-700 border-b border-slate-200 pb-2">
                  <span>{langInfo?.label}</span>
                  <span className="text-text-muted text-sm font-normal ml-auto">
                    {langInfo?.nativeName}
                  </span>
                </div>
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
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
        <div className="flex justify-start pt-4">
          <Button variant="outline" onClick={onBack} aria-label="Go back" data-testid="back-btn">
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
    scoreAvg >= 4.5 ? 'text-emerald-600' : scoreAvg >= 3.5 ? 'text-amber-600' : 'text-slate-500';

  const copyTags = () => {
    navigator.clipboard.writeText(result.tags.join(', ')).catch(() => { });
    setCopiedTags(true);
    setTimeout(() => setCopiedTags(false), 2000);
  };

  return (
    <Card
      className={cn(
        'flex flex-col h-full hover:shadow-xs',
        isSelected && 'ring-2 ring-primary border-primary',
      )}
      hoverable
    >
      <div
        className={cn(
          'px-5 py-3 border-b flex justify-between items-center',
          isSelected ? 'bg-primary-50 border-primary-200' : 'bg-slate-50/50 border-slate-100',
        )}
      >
        <span className="text-xs font-bold uppercase tracking-wider text-primary-700 bg-primary-100 px-2 py-0.5 rounded">
          {result.optionType}
        </span>
        <Button
          variant={isSelected ? 'primary' : 'ghost'}
          size="sm"
          onClick={onSelect}
          aria-label={`Select ${result.optionType} metadata option`}
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

      <div className="p-5 flex-1 flex flex-col gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">
            {t('metadata.titleLabel')}
          </p>
          <p className="font-bold text-slate-800 text-base leading-tight">{result.title}</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">
            {t('metadata.descLabel')}
          </p>
          <p className="text-sm text-text-muted leading-relaxed">{result.description}</p>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1">
              <Hash size={10} /> {t('metadata.tags')} ({result.tags.length})
            </p>
            <button
              onClick={copyTags}
              aria-label="Copy tags to clipboard"
              data-testid="copy-tags-btn"
              className={cn(
                'text-xs px-2 py-0.5 rounded transition-colors flex items-center gap-1',
                copiedTags ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 hover:bg-slate-100',
              )}
            >
              {copiedTags ? <Check size={10} /> : <Copy size={10} />}
              {copiedTags ? t('metadata.copied') : t('metadata.copy')}
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {result.tags.map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded-full border border-slate-200"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-3 border-t border-slate-100">
          <div className="flex justify-between items-end mb-1.5">
            <span className="text-xs font-bold text-slate-400">{t('metadata.qualityScore')}</span>
            <span className={cn('text-lg font-bold', scoreColor)}>{scoreAvg.toFixed(1)}</span>
          </div>
          <div className="grid grid-cols-2 gap-y-0.5 gap-x-4 text-xs text-text-muted">
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
