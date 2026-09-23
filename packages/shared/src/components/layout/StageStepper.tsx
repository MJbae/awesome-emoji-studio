import { useTranslation } from 'react-i18next';
import {
  Check,
  Lightbulb,
  WandSparkles,
  Palette,
  Grid2X2,
  SlidersHorizontal,
  Languages,
  PackageCheck,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { WorkflowStage, WorkflowMode } from '@/store/slices/workflowSlice';

interface StageStepperProps {
  currentStage: WorkflowStage;
  mode: WorkflowMode;
  completedStages: Set<WorkflowStage>;
  onStageClick: (stage: WorkflowStage) => void;
}

const STAGES = [
  { id: 'input', Icon: Lightbulb },
  { id: 'strategy', Icon: WandSparkles },
  { id: 'character', Icon: Palette },
  { id: 'stickers', Icon: Grid2X2 },
  { id: 'postprocess', Icon: SlidersHorizontal },
  { id: 'metadata', Icon: Languages },
  { id: 'export', Icon: PackageCheck },
] as const;

function StageStepper({ currentStage, mode, completedStages, onStageClick }: StageStepperProps) {
  const { t } = useTranslation();
  const steps =
    mode === 'full'
      ? STAGES
      : STAGES.filter((s) => ['postprocess', 'metadata', 'export'].includes(s.id));
  const currentIndex = steps.findIndex((s) => s.id === currentStage);

  return (
    <nav
      aria-label="Workflow stages"
      className="min-w-0 border-b border-slate-200 py-5 lg:sticky lg:top-0 lg:min-h-[calc(100vh-141px)] lg:border-b-0 lg:border-r lg:py-9 lg:pr-6"
      data-testid="stage-stepper"
    >
      <div className="mb-5 hidden items-center justify-between lg:flex">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
          {t('studio.workspace')}
        </span>
        <span className="rounded-md bg-slate-200/60 px-1.5 py-0.5 text-[10px] tabular-nums text-slate-600">
          {String(currentIndex + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
        </span>
      </div>
      <ol className="flex gap-1 lg:flex-col lg:gap-2">
        {steps.map(({ id, Icon }, index) => {
          const isCompleted = completedStages.has(id);
          const isCurrent = id === currentStage;
          return (
            <li key={id} className="min-w-0 flex-1">
              <button
                onClick={() => isCompleted && onStageClick(id)}
                disabled={!isCompleted}
                aria-label={`Stage ${index + 1}: ${t(`stepper.${id}`)}`}
                aria-current={isCurrent ? 'step' : undefined}
                data-stage={id}
                data-testid={`stage-step-${id}`}
                className={cn(
                  'relative flex w-full flex-col items-center gap-2 rounded-xl px-0.5 py-2.5 transition-colors lg:flex-row lg:gap-3 lg:px-3 lg:py-3.5',
                  isCurrent
                    ? 'bg-[#e9edda] text-[#3e4b28]'
                    : isCompleted
                      ? 'text-slate-700 hover:bg-slate-200/50'
                      : 'text-slate-500',
                  !isCompleted && 'cursor-default',
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg lg:h-6 lg:w-6',
                    isCurrent ? 'bg-white/70' : '',
                  )}
                >
                  {isCompleted && !isCurrent ? (
                    <Check size={16} className="text-success" />
                  ) : (
                    <Icon size={17} strokeWidth={1.7} />
                  )}
                </span>
                <span className="w-full break-words text-center text-[9px] font-medium leading-tight sm:text-[11px] lg:w-auto lg:text-left lg:text-xs">
                  <span className="hidden lg:inline">{t(`stepper.${id}`)}</span>
                  <span className="lg:hidden">{t(`stepper.${id}Short`)}</span>
                </span>
                {isCurrent && (
                  <span className="ml-auto hidden h-1.5 w-1.5 shrink-0 rounded-full bg-[#667b40] lg:block" />
                )}
              </button>
            </li>
          );
        })}
      </ol>
      <div className="mt-14 hidden rounded-2xl border border-slate-200 bg-white/65 p-4 lg:block">
        <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#f4e7d8] text-primary">
          <ArrowUpRight size={17} />
        </span>
        <p className="text-xs font-semibold">{t('studio.sidebarTitle')}</p>
        <p className="mt-2 text-[11px] leading-relaxed text-text-muted">
          {t('studio.sidebarDescription')}
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5 text-[9px] font-semibold text-slate-600">
          {['KakaoTalk', 'LINE', 'Telegram', 'OGQ'].map((name) => (
            <span key={name} className="rounded border border-slate-200 bg-white px-1.5 py-1">
              {name}
            </span>
          ))}
        </div>
      </div>
    </nav>
  );
}

export { StageStepper };
export type { StageStepperProps };
