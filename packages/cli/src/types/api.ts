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
