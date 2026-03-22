import type { StateCreator } from 'zustand';
import type { JobSnapshot, JobStatus } from '@/types/jobs';

const MAX_JOBS = 10;
const CLEANUP_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes
const TERMINAL_STATUSES: readonly JobStatus[] = ['completed', 'failed', 'cancelled'] as const;
const CANCELLABLE_STATUSES: readonly JobStatus[] = ['idle', 'running'] as const;

export interface JobsSlice {
  jobs: Record<string, JobSnapshot>;
  activeJobId: string | null;
  createJob: () => string;
  updateJob: (jobId: string, update: Partial<JobSnapshot>) => void;
  getJob: (jobId: string) => JobSnapshot | undefined;
  cancelJob: (jobId: string) => void;
  cleanupJobs: () => void;
}

function makeEmptySnapshot(id: string): JobSnapshot {
  const now = Date.now();
  return {
    id,
    status: 'idle',
    currentStage: null,
    progress: null,
    error: null,
    createdAt: now,
    updatedAt: now,
    strategy: null,
    characterSpec: null,
    stickers: [],
    processedImages: [],
    metadata: [],
  };
}

function enforceMaxJobs(jobs: Record<string, JobSnapshot>): Record<string, JobSnapshot> {
  const entries = Object.entries(jobs);
  if (entries.length <= MAX_JOBS) return jobs;

  const sorted = entries.sort(([, a], [, b]) => a.updatedAt - b.updatedAt);
  const toRemove = sorted.slice(0, entries.length - MAX_JOBS);
  const result = { ...jobs };
  for (const [key] of toRemove) {
    delete result[key];
  }
  return result;
}

export const createJobsSlice: StateCreator<JobsSlice, [], [], JobsSlice> = (set, get) => ({
  jobs: {},
  activeJobId: null,

  createJob: () => {
    const id = crypto.randomUUID();
    const snapshot = makeEmptySnapshot(id);
    set((state) => ({
      jobs: enforceMaxJobs({ ...state.jobs, [id]: snapshot }),
      activeJobId: id,
    }));
    return id;
  },

  updateJob: (jobId: string, update: Partial<JobSnapshot>) => {
    set((state) => {
      const existing = state.jobs[jobId];
      if (!existing) return state;

      if (
        TERMINAL_STATUSES.includes(existing.status) &&
        update.status &&
        update.status !== existing.status
      ) {
        return state;
      }

      return {
        jobs: {
          ...state.jobs,
          [jobId]: { ...existing, ...update, updatedAt: Date.now() },
        },
      };
    });
  },

  getJob: (jobId: string) => {
    return get().jobs[jobId];
  },

  cancelJob: (jobId: string) => {
    set((state) => {
      const existing = state.jobs[jobId];
      if (!existing) return state;
      if (!CANCELLABLE_STATUSES.includes(existing.status)) return state;

      return {
        jobs: {
          ...state.jobs,
          [jobId]: { ...existing, status: 'cancelled', updatedAt: Date.now() },
        },
        activeJobId: state.activeJobId === jobId ? null : state.activeJobId,
      };
    });
  },

  cleanupJobs: () => {
    const now = Date.now();
    set((state) => {
      const cleaned: Record<string, JobSnapshot> = {};
      for (const [id, job] of Object.entries(state.jobs)) {
        const isTerminal = TERMINAL_STATUSES.includes(job.status);
        const isExpired = now - job.updatedAt > CLEANUP_THRESHOLD_MS;
        if (!(isTerminal && isExpired)) {
          cleaned[id] = job;
        }
      }
      return { jobs: cleaned };
    });
  },
});
