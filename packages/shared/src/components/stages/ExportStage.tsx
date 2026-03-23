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
  const availableSelected = selectedPlatforms.filter((p) => PLATFORM_SPECS[p].available);

  return (
    <section data-stage="export" className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
          <FileDown size={14} />
          {t('export.title')}
        </div>
        <h2 className="text-3xl font-bold text-text">{t('export.title')}</h2>
        <p className="text-text-muted">{t('export.subtitle')}</p>
      </div>

      {/* Select All / Deselect All */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-slate-800">{t('export.selectPlatforms')}</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onSelectAll}>
            {t('export.selectAll')}
          </Button>
          <Button variant="outline" size="sm" onClick={onDeselectAll}>
            {t('export.deselectAll')}
          </Button>
        </div>
      </div>

      {/* Platform selection grid by category */}
      {platformsByCategory.map((cat) => (
        <div key={cat.id} className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-600 border-b border-slate-200 pb-1">
            {t(cat.labelKey)}
          </h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cat.platforms.map((platformId) => {
              const spec = PLATFORM_SPECS[platformId];
              const isSelected = selectedPlatforms.includes(platformId);
              const isAvailable = spec.available;

              return (
                <button
                  key={platformId}
                  onClick={() => isAvailable && onTogglePlatform(platformId)}
                  disabled={!isAvailable}
                  className={cn(
                    'relative p-4 rounded-xl border-2 text-left transition-all',
                    isAvailable && isSelected && 'border-primary bg-primary/5',
                    isAvailable && !isSelected && 'border-slate-200 hover:border-slate-300 bg-white',
                    !isAvailable && 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed',
                  )}
                >
                  {!isAvailable && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 bg-slate-200 text-slate-500 text-[10px] font-bold rounded-full uppercase">
                      {t('export.comingSoon')}
                    </span>
                  )}
                  {isAvailable && isSelected && (
                    <span className="absolute top-2 right-2">
                      <CheckCircle2 size={18} className="text-primary" />
                    </span>
                  )}

                  <p className="font-bold text-slate-800 text-sm pr-8">{spec.label}</p>
                  <p className="text-xs text-text-muted mb-2">{spec.description}</p>

                  <div className="space-y-1 text-[10px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                    <div className="flex justify-between">
                      <span>{t('export.dimensions')}</span>
                      <span className="font-mono">{spec.content.width}×{spec.content.height}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('export.format')}</span>
                      <span className="font-mono uppercase">{spec.format}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('export.maxCount')}</span>
                      <span className="font-mono">{spec.count}</span>
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
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
        <div className="flex items-center gap-3">
          <Download className="text-primary" size={20} />
          <div>
            <p className="font-bold text-slate-800">
              {t('export.readyCount', { count: availableSelected.length })}
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
            aria-label="Export selected platforms"
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
            aria-label="Export combined ZIP"
            data-testid="export-combined-btn"
          >
            {t('export.exportCombined')}
          </Button>
        </div>
      </div>

      {/* Export progress */}
      {exportJobs.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
          <h4 className="text-sm font-bold text-slate-800">{t('export.exportProgress')}</h4>
          {exportJobs.map((job) => (
            <div key={job.platformId} className="flex items-center gap-3">
              <div className="w-5 shrink-0">
                {job.status === 'done' && <CheckCircle2 size={16} className="text-success" />}
                {job.status === 'error' && <XCircle size={16} className="text-red-500" />}
                {job.status === 'processing' && <Clock size={16} className="text-primary animate-spin" />}
                {job.status === 'pending' && <Clock size={16} className="text-slate-300" />}
              </div>
              <span className="text-sm text-slate-700 w-48 truncate">
                {PLATFORM_SPECS[job.platformId]?.label ?? job.platformId}
              </span>
              <div className="flex-1">
                <progress
                  value={job.progress}
                  max={100}
                  className="w-full h-2 overflow-hidden [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-slate-200 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary [&::-webkit-progress-value]:transition-all [&::-moz-progress-bar]:bg-primary [&::-moz-progress-bar]:rounded-full"
                />
              </div>
              <span className="text-xs text-text-muted w-10 text-right">
                {job.status === 'error' ? t('export.exportFailed') : `${job.progress}%`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Back button */}
      <div className="flex justify-start pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isExporting}
          aria-label="Go back"
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
