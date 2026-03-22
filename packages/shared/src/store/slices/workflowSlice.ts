import type { StateCreator } from 'zustand';

export type WorkflowStage =
  | 'setup'
  | 'input'
  | 'strategy'
  | 'character'
  | 'stickers'
  | 'postprocess'
  | 'metadata';

export type WorkflowMode = 'full' | 'postprocess-only';

export interface WorkflowSlice {
  stage: WorkflowStage;
  mode: WorkflowMode;
  setStage: (stage: WorkflowStage) => void;
  setMode: (mode: WorkflowMode) => void;
  nextStage: () => void;
  prevStage: () => void;
  canGoNext: () => boolean;
  canGoPrev: () => boolean;
  resetWorkflow: () => void;
}

const FULL_STAGES: readonly WorkflowStage[] = [
  'setup',
  'input',
  'strategy',
  'character',
  'stickers',
  'postprocess',
  'metadata',
] as const;

const POSTPROCESS_STAGES: readonly WorkflowStage[] = ['setup', 'postprocess', 'metadata'] as const;

function getStagesForMode(mode: WorkflowMode): readonly WorkflowStage[] {
  return mode === 'full' ? FULL_STAGES : POSTPROCESS_STAGES;
}

export const createWorkflowSlice: StateCreator<WorkflowSlice, [], [], WorkflowSlice> = (
  set,
  get,
) => ({
  stage: 'setup',
  mode: 'full',

  setStage: (stage: WorkflowStage) => {
    set({ stage });
  },

  setMode: (mode: WorkflowMode) => {
    set({ mode, stage: 'setup' });
  },

  nextStage: () => {
    const { stage, mode } = get();
    const stages = getStagesForMode(mode);
    const currentIndex = stages.indexOf(stage);
    if (currentIndex < 0 || currentIndex >= stages.length - 1) return;
    const next = stages[currentIndex + 1];
    if (next) set({ stage: next });
  },

  prevStage: () => {
    const { stage, mode } = get();
    const stages = getStagesForMode(mode);
    const currentIndex = stages.indexOf(stage);
    if (currentIndex <= 0) return;
    const prev = stages[currentIndex - 1];
    if (prev) set({ stage: prev });
  },

  canGoNext: () => {
    const { stage, mode } = get();
    const stages = getStagesForMode(mode);
    const currentIndex = stages.indexOf(stage);
    return currentIndex >= 0 && currentIndex < stages.length - 1;
  },

  canGoPrev: () => {
    const { stage, mode } = get();
    const stages = getStagesForMode(mode);
    const currentIndex = stages.indexOf(stage);
    return currentIndex > 0;
  },

  resetWorkflow: () => {
    set({ stage: 'setup', mode: 'full' });
  },
});
