import { useTranslation } from 'react-i18next';
import { Download, FileDown, CheckCircle2, XCircle, Clock, Package } from 'lucide-react';
import type { PlatformId, ExportJob } from '@/types/domain';
import { PLATFORM_SPECS, PLATFORM_CATEGORIES } from '@/constants/platforms';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

interface ExportStageProps {
  selectedPlatforms: PlatformId[];
  onTogglePlatform: (platform: PlatformId) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  exportJobs: ExportJob[];
  isExporting: boolean;
  onExportSelected: () => void;
  onExportCombined: () => void;
  onBack: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  return `${Math.round(bytes / 1024)}KB`;
}

function ExportStage({
  selectedPlatforms,
  onTogglePlatform,
  onSelectAll,
  onDeselectAll,
  exportJobs,
  isExporting,
  onExportSelected,
  onExportCombined,
  onBack,
}: ExportStageProps) {
  const { t } = useTranslation();

  const allPlatformIds = Object.keys(PLATFORM_SPECS) as PlatformId[];
  const platformsByCategory = PLATFORM_CATEGORIES.map((cat) => ({
    ...cat,
    platforms: allPlatformIds.filter((id) => PLATFORM_SPECS[id].category === cat.id),
  }));

  const selectedCount = selectedPlatforms.length;

  return (
    <section data-stage="export" className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-4">
          <div className="stage-eyebrow">
            <FileDown size={14} />
            {t('export.title')}
          </div>
          <h2 className="stage-heading">{t('export.title')}</h2>
          <p className="text-text-muted leading-relaxed">{t('export.subtitle')}</p>
        </div>
        <div className="hidden sm:flex h-24 w-24 shrink-0 items-center justify-center bg-[#edf0ce] text-[#656c35] rounded-3xl rotate-3">
          <Package size={42} strokeWidth={1.5} />
        </div>
      </div>

      {/* Select All / Deselect All */}
      <div className="flex flex-wrap justify-between items-center gap-3 border-b border-[#e4e5dd] pb-5">
        <h3 className="text-base font-semibold text-text">{t('export.selectPlatforms')}</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSelectAll}
            data-testid="select-all-platforms-btn"
          >
            {t('export.selectAll')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDeselectAll}
            data-testid="deselect-all-platforms-btn"
          >
            {t('export.deselectAll')}
          </Button>
        </div>
      </div>

      {/* Platform selection grid by category */}
      {platformsByCategory.map((cat) => (
        <div key={cat.id} className="space-y-4">
          <h4 className="text-sm font-semibold text-text-muted flex items-center gap-3">
            {t(cat.labelKey)}
            <span className="h-px flex-1 bg-[#e4e5dd]" aria-hidden="true" />
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {cat.platforms.map((platformId) => {
              const spec = PLATFORM_SPECS[platformId];
              const isSelected = selectedPlatforms.includes(platformId);

              return (
                <button
                  key={platformId}
                  onClick={() => onTogglePlatform(platformId)}
                  aria-pressed={isSelected}
                  data-testid={`platform-${platformId}`}
                  className={cn(
                    'relative p-5 rounded-2xl border text-left transition-colors',
                    isSelected && 'border-primary bg-primary-50 ring-1 ring-primary/20',
                    !isSelected && 'border-[#e4e5dd] hover:border-[#b8bcae] bg-white',
                  )}
                >
                  {isSelected && (
                    <span className="absolute top-5 right-5">
                      <CheckCircle2 size={18} className="text-primary" />
                    </span>
                  )}

                  <p className="font-semibold text-text text-base pr-7">
                    {t(`platforms.${platformId}.label`)}
                  </p>
                  <p className="text-xs text-text-muted leading-relaxed mt-1 mb-4">
                    {t(`platforms.${platformId}.description`)}
                  </p>

                  <div className="space-y-2 text-xs text-text-muted bg-white/65 p-3.5 rounded-xl border border-[#e4e5dd]/70">
                    <div className="flex justify-between">
                      <span>{t('export.dimensions')}</span>
                      <span className="font-mono">
                        {spec.content.width}×{spec.content.height}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('export.format')}</span>
                      <span className="font-mono uppercase">{spec.format}</span>
                    </div>
                    {spec.main && (
                      <div className="flex justify-between">
                        <span>{t('export.mainImage')}</span>
                        <span className="font-mono">
                          {spec.main.width}×{spec.main.height}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>{t('export.tabImage')}</span>
                      <span className="font-mono">
                        {spec.tab.width}×{spec.tab.height}
                      </span>
                    </div>
                    {spec.maxFileSize && (
                      <div className="flex justify-between">
                        <span>{t('export.maxSize')}</span>
                        <span className="font-mono">{formatFileSize(spec.maxFileSize)}</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Export actions */}
      <div className="bg-[#edf0ce] p-5 sm:p-7 rounded-3xl border border-[#dce2b6] space-y-6">
        <div className="flex items-center gap-4">
          <span className="p-3 rounded-2xl bg-white/70 text-[#656c35]">
            <Download size={22} />
          </span>
          <div>
            <p className="font-semibold text-text text-lg">
              {t('export.readyCount', { count: selectedCount })}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onExportSelected}
            disabled={selectedCount === 0 || isExporting}
            icon={<Download size={16} />}
            size="lg"
            className="flex-1"
            aria-label={t('a11y.exportSelected')}
            data-testid="export-selected-btn"
          >
            {t('export.exportSelected')}
          </Button>
          <Button
            onClick={onExportCombined}
            disabled={selectedCount === 0 || isExporting}
            variant="outline"
            icon={<Package size={16} />}
            size="lg"
            className="flex-1"
            aria-label={t('a11y.exportCombined')}
            data-testid="export-combined-btn"
          >
            {t('export.exportCombined')}
          </Button>
        </div>
      </div>

      {/* Export progress */}
      {exportJobs.length > 0 && (
        <div
          className="bg-white p-5 sm:p-6 rounded-3xl border border-[#e4e5dd] space-y-5"
          aria-live="polite"
        >
          <h4 className="text-sm font-semibold text-text">{t('export.exportProgress')}</h4>
          {exportJobs.map((job) => (
            <div key={job.platformId} className="flex items-center gap-2 sm:gap-3">
              <div className="w-5 shrink-0">
                {job.status === 'done' && <CheckCircle2 size={16} className="text-success" />}
                {job.status === 'error' && <XCircle size={16} className="text-red-500" />}
                {job.status === 'processing' && (
                  <Clock size={16} className="text-primary animate-spin" />
                )}
                {job.status === 'pending' && <Clock size={16} className="text-slate-300" />}
              </div>
              <span className="text-xs sm:text-sm text-text w-24 sm:w-48 truncate">
                {t(`platforms.${job.platformId}.label`, { defaultValue: job.platformId })}
              </span>
              <div className="flex-1 min-w-0">
                <progress
                  value={job.progress}
                  max={100}
                  aria-label={t('a11y.exportProgress', {
                    platform: t(`platforms.${job.platformId}.label`, {
                      defaultValue: job.platformId,
                    }),
                  })}
                  data-testid={`export-progress-${job.platformId}`}
                  className="w-full h-2 overflow-hidden [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-[#eeeee7] [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary [&::-webkit-progress-value]:transition-all [&::-moz-progress-bar]:bg-primary [&::-moz-progress-bar]:rounded-full"
                />
              </div>
              <span className="text-xs text-text-muted w-10 text-right tabular-nums">
                {job.status === 'error' ? t('export.exportFailed') : `${job.progress}%`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Back button */}
      <div className="stage-actions">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isExporting}
          aria-label={t('a11y.back')}
          data-testid="back-btn"
        >
          {t('strategy.back')}
        </Button>
      </div>
    </section>
  );
}

export { ExportStage };
export type { ExportStageProps };
