import { createStore } from 'zustand/vanilla';
import type {
  UserInput,
  LLMStrategy,
  CharacterSpec,
  Sticker,
  ProcessedImage,
  MetaResult,
  PlatformId,
} from '@/types/domain';
import type { JobSnapshot, JobStatus } from '@/types/jobs';
import type { JobProgress } from '@/types/api';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

export interface CliState {
  // Config
  apiKey: string | null;
  language: UserInput['language'];
  defaultPlatform: PlatformId;

  // Assets
  userInput: UserInput | null;
  strategy: LLMStrategy | null;
  mainImage: string | null;
  characterSpec: CharacterSpec | null;
  stickers: Sticker[];
  processedImages: ProcessedImage[];
  metadata: MetaResult[];

  // Jobs
  jobs: Record<string, JobSnapshot>;
  activeJobId: string | null;
}

export interface CliActions {
  // Config
  setApiKey: (key: string) => void;
  clearApiKey: () => void;

  // Assets
  setUserInput: (input: UserInput) => void;
  setStrategy: (strategy: LLMStrategy) => void;
  setMainImage: (image: string) => void;
  setCharacterSpec: (spec: CharacterSpec) => void;
  setStickers: (stickers: Sticker[]) => void;
  updateSticker: (id: number, update: Partial<Sticker>) => void;
  setProcessedImages: (images: ProcessedImage[]) => void;
  setMetadata: (metadata: MetaResult[]) => void;
  resetAssets: () => void;

  // Jobs
  createJob: () => string;
  updateJob: (jobId: string, update: Partial<JobSnapshot>) => void;
  getJob: (jobId: string) => JobSnapshot | undefined;
  cancelJob: (jobId: string) => void;
}

export type CliStore = CliState & CliActions;

const TERMINAL_STATUSES: readonly JobStatus[] = ['completed', 'failed', 'cancelled'];
const CANCELLABLE_STATUSES: readonly JobStatus[] = ['idle', 'running'];

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

// ---------------------------------------------------------------------------
// Vanilla Zustand store (no React, no persist)
// ---------------------------------------------------------------------------

export const cliStore = createStore<CliStore>()((set, get) => ({
  // Config
  apiKey: null,
  language: 'Korean',
  defaultPlatform: 'ogq_sticker',

  // Assets
  userInput: null,
  strategy: null,
  mainImage: null,
  characterSpec: null,
  stickers: [],
  processedImages: [],
  metadata: [],

  // Jobs
  jobs: {},
  activeJobId: null,

  // Config actions
  setApiKey: (key: string) => set({ apiKey: key }),
  clearApiKey: () => set({ apiKey: null }),

  // Asset actions
  setUserInput: (input: UserInput) => set({ userInput: input }),
  setStrategy: (strategy: LLMStrategy) => set({ strategy }),
  setMainImage: (image: string) => set({ mainImage: image }),
  setCharacterSpec: (spec: CharacterSpec) => set({ characterSpec: spec }),
  setStickers: (stickers: Sticker[]) => set({ stickers }),
  updateSticker: (id: number, update: Partial<Sticker>) =>
    set((state) => ({
      stickers: state.stickers.map((s) => (s.id === id ? { ...s, ...update } : s)),
    })),
  setProcessedImages: (images: ProcessedImage[]) => set({ processedImages: images }),
  setMetadata: (metadata: MetaResult[]) => set({ metadata }),
  resetAssets: () =>
    set({
      userInput: null,
      strategy: null,
      mainImage: null,
      characterSpec: null,
      stickers: [],
      processedImages: [],
      metadata: [],
    }),

  // Job actions
  createJob: () => {
    const id = crypto.randomUUID();
    const snapshot = makeEmptySnapshot(id);
    set((state) => ({
      jobs: { ...state.jobs, [id]: snapshot },
      activeJobId: id,
    }));
    return id;
  },
  updateJob: (jobId: string, update: Partial<JobSnapshot>) =>
    set((state) => {
      const existing = state.jobs[jobId];
      if (!existing) return state;
      if (TERMINAL_STATUSES.includes(existing.status) && update.status && update.status !== existing.status) {
        return state;
      }
      return {
        jobs: {
          ...state.jobs,
          [jobId]: { ...existing, ...update, updatedAt: Date.now() },
        },
      };
    }),
  getJob: (jobId: string) => get().jobs[jobId],
  cancelJob: (jobId: string) =>
    set((state) => {
      const existing = state.jobs[jobId];
      if (!existing || !CANCELLABLE_STATUSES.includes(existing.status)) return state;
      return {
        jobs: {
          ...state.jobs,
          [jobId]: { ...existing, status: 'cancelled', updatedAt: Date.now() },
        },
        activeJobId: state.activeJobId === jobId ? null : state.activeJobId,
      };
    }),
}));

export function getAppState(): CliStore {
  return cliStore.getState();
}
