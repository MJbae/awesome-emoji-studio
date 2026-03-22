import { useCallback, useMemo } from 'react';
import { useAppStore } from '@/store/appStore';
import type { WorkflowStage } from '@/store/slices/workflowSlice';
import type { UserInput, ProcessedImage } from '@/types/domain';
import type { JobProgress, ServiceError } from '@/types/api';

interface UsePipelineReturn {
  activeJobId: string | null;
  currentStage: WorkflowStage;
  progress: JobProgress | null;
  isRunning: boolean;
  error: ServiceError | null;
  startFullPipeline: (input: UserInput) => Promise<string>;
  startPostProcessOnly: (images: ProcessedImage[]) => Promise<string>;
  cancel: () => void;
}

export function usePipeline(): UsePipelineReturn {
  const activeJobId = useAppStore((s) => s.activeJobId);
  const currentStage = useAppStore((s) => s.stage);
  const jobs = useAppStore((s) => s.jobs);
  const createJob = useAppStore((s) => s.createJob);
  const updateJob = useAppStore((s) => s.updateJob);
  const cancelJob = useAppStore((s) => s.cancelJob);
  const setMode = useAppStore((s) => s.setMode);
  const setUserInput = useAppStore((s) => s.setUserInput);
  const setProcessedImages = useAppStore((s) => s.setProcessedImages);

  const activeJob = useMemo(() => {
    if (!activeJobId) return null;
    return jobs[activeJobId] ?? null;
  }, [activeJobId, jobs]);

  const progress = activeJob?.progress ?? null;
  const isRunning = activeJob?.status === 'running';
  const error = activeJob?.error ?? null;

  const startFullPipeline = useCallback(
    async (input: UserInput): Promise<string> => {
      setMode('full');
      setUserInput(input);
      const jobId = createJob();
      updateJob(jobId, { status: 'running' });
      return jobId;
    },
    [setMode, setUserInput, createJob, updateJob],
  );

  const startPostProcessOnly = useCallback(
    async (images: ProcessedImage[]): Promise<string> => {
      setMode('postprocess-only');
      setProcessedImages(images);
      const jobId = createJob();
      updateJob(jobId, { status: 'running' });
      return jobId;
    },
    [setMode, setProcessedImages, createJob, updateJob],
  );

  const cancel = useCallback(() => {
    if (activeJobId) {
      cancelJob(activeJobId);
    }
  }, [activeJobId, cancelJob]);

  return {
    activeJobId,
    currentStage,
    progress,
    isRunning,
    error,
    startFullPipeline,
    startPostProcessOnly,
    cancel,
  };
}
