import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { WorkflowStage, WorkflowMode } from '@/store/slices/workflowSlice';

interface StageStepperProps {
  currentStage: WorkflowStage;
  mode: WorkflowMode;
  completedStages: Set<WorkflowStage>;
  onStageClick: (stage: WorkflowStage) => void;
}

interface StepDef {
  id: WorkflowStage;
  label: string;
  shortLabel: string;
}

const getFullSteps = (t: any): StepDef[] => [
  { id: 'input', label: t('stepper.input'), shortLabel: t('stepper.inputShort') },
  { id: 'strategy', label: t('stepper.strategy'), shortLabel: t('stepper.strategyShort') },
  { id: 'character', label: t('stepper.character'), shortLabel: t('stepper.characterShort') },
  { id: 'stickers', label: t('stepper.stickers'), shortLabel: t('stepper.stickersShort') },
  { id: 'postprocess', label: t('stepper.postprocess'), shortLabel: t('stepper.postprocessShort') },
  { id: 'metadata', label: t('stepper.metadata'), shortLabel: t('stepper.metadataShort') },
];

const getPostprocessSteps = (t: any): StepDef[] => [
  { id: 'postprocess', label: t('stepper.postprocess'), shortLabel: t('stepper.postprocessShort') },
  { id: 'metadata', label: t('stepper.metadata'), shortLabel: t('stepper.metadataShort') },
];

function StageStepper({ currentStage, mode, completedStages, onStageClick }: StageStepperProps) {
  const { t } = useTranslation();
  const steps = mode === 'full' ? getFullSteps(t) : getPostprocessSteps(t);
  const currentIndex = steps.findIndex((s) => s.id === currentStage);

  return (
    <nav aria-label="Workflow stages" className="w-full py-4" data-testid="stage-stepper">
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        <ol className="flex items-start w-full min-w-[320px] sm:min-w-0">
          {steps.map((step, index) => {
            const isCompleted = completedStages.has(step.id);
            const isCurrent = step.id === currentStage;
            const isClickable = isCompleted;

            return (
              <li key={step.id} className="relative flex-1 min-w-0">
                {/* Uniform connecting lines, attached half-way to previous step */}
                {index > 0 && (
                  <div
                    className={cn(
                      'absolute top-4 h-0.5 transition-colors z-0',
                      index <= currentIndex ? 'bg-primary' : 'bg-slate-200'
                    )}
                    style={{ left: 'calc(-50% + 16px)', right: 'calc(50% + 16px)' }}
                  />
                )}
                <button
                  onClick={() => isClickable && onStageClick(step.id)}
                  disabled={!isClickable}
                  aria-label={`Stage ${index + 1}: ${step.label}`}
                  aria-current={isCurrent ? 'step' : undefined}
                  data-stage={step.id}
                  data-testid={`stage-step-${step.id}`}
                  className={cn(
                    'w-full flex flex-col items-center gap-1.5 focus:outline-none relative z-10',
                    isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all',
                      isCompleted ? 'bg-primary text-white' : '',
                      isCurrent && !isCompleted ? 'bg-primary text-white ring-3 ring-primary/20' : '',
                      !isCurrent && !isCompleted ? 'bg-slate-200 text-slate-500' : ''
                    )}
                  >
                    {isCompleted ? <Check size={14} /> : index + 1}
                  </div>
                  <span
                    className={cn(
                      'text-[10px] sm:text-xs font-medium transition-colors leading-tight text-center',
                      isCurrent ? 'text-primary' : '',
                      isCompleted && !isCurrent ? 'text-slate-600' : '',
                      !isCurrent && !isCompleted ? 'text-slate-400' : ''
                    )}
                  >
                    <span className="hidden sm:inline">{step.label}</span>
                    <span className="sm:hidden">{step.shortLabel}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

export { StageStepper };
export type { StageStepperProps };
