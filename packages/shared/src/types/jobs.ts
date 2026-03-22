// ===================================================================
// Job Types — Snapshot & status tracking for pipeline jobs
// ===================================================================

import type { Stage, JobProgress, ServiceError } from './api';
import type {
  Sticker,
  ProcessedImage,
  MetaResult,
  LLMStrategy,
  CharacterSpec,
} from './domain';

// ---------------------------------------------------------------------------
// Job status
// ---------------------------------------------------------------------------

export type JobStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

// ---------------------------------------------------------------------------
// Job snapshot
// ---------------------------------------------------------------------------

export interface JobSnapshot {
  id: string;
  status: JobStatus;
  currentStage: Stage | null;
  progress: JobProgress | null;
  error: ServiceError | null;
  createdAt: number;
  updatedAt: number;

  // Artifacts produced by the pipeline
  strategy: LLMStrategy | null;
  characterSpec: CharacterSpec | null;
  stickers: Sticker[];
  processedImages: ProcessedImage[];
  metadata: MetaResult[];
}
