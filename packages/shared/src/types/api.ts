// ===================================================================
// API Types — Public service interface for Emoticon Studio
// ===================================================================

import type {
  PlatformId,
  UserInput,
  LLMStrategy,
  Sticker,
  ProcessedImage,
  ProcessingOptions,
  MetaResult,
} from './domain';
import type { JobSnapshot } from './jobs';

// ---------------------------------------------------------------------------
// Pipeline stages
// ---------------------------------------------------------------------------

export type Stage =
  | 'concept-analysis'
  | 'character-generation'
  | 'style-selection'
  | 'emote-ideation'
  | 'sticker-generation'
  | 'post-processing'
  | 'metadata-generation'
  | 'export';

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export interface ServiceError {
  code: 'VALIDATION' | 'GEMINI' | 'IMAGE_PROCESSING' | 'EXPORT' | 'CANCELLED' | 'UNKNOWN';
  message: string;
  stage?: Stage;
  retryable: boolean;
  details?: unknown;
}

// ---------------------------------------------------------------------------
// Job progress
// ---------------------------------------------------------------------------

export interface JobProgress {
  stage: Stage;
  current: number;
  total: number;
  message: string;
}

// ---------------------------------------------------------------------------
// Public API contract
// ---------------------------------------------------------------------------

export interface EmoticonAPI {
  // Config
  setApiKey(key: string): Promise<void>;

  // Full pipeline
  describe(input: UserInput): Promise<LLMStrategy>;
  runFullPipeline(input: UserInput, platform: PlatformId): Promise<string>; // returns jobId

  // Post-processing only
  runPostProcessOnly(
    images: ProcessedImage[],
    options: ProcessingOptions,
    platform: PlatformId,
  ): Promise<string>; // returns jobId

  // Granular stage execution
  runStage(jobId: string, stage: Stage, payload: unknown): Promise<void>;

  // Job management
  getJob(jobId: string): JobSnapshot;
  subscribe(jobId: string, listener: (progress: JobProgress) => void): () => void;
  cancelJob(jobId: string): void;

  // Artifact access
  getStickers(jobId: string): Sticker[];
  getProcessedImages(jobId: string): ProcessedImage[];
  getMetadata(jobId: string): MetaResult[];

  // Export
  export(jobId: string, platform: PlatformId, metadata?: MetaResult[]): Promise<Blob>;
}
