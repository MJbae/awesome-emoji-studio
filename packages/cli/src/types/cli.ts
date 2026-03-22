import type {
  PlatformId,
  UserInput,
  LLMStrategy,
  CharacterSpec,
  Sticker,
  ProcessedImage,
  MetaResult,
  ProcessingOptions,
  OutlineStyle,
} from '@/types/domain';
import type { Stage, JobProgress } from '@/types/api';

// ---------------------------------------------------------------------------
// CLI Options
// ---------------------------------------------------------------------------

export interface GenerateOptions {
  concept: string;
  language: UserInput['language'];
  referenceImage: string | null;
  apiKey: string | null;
  platforms: PlatformId[];
  bgRemoval: boolean;
  outline: OutlineStyle;
  outlineThickness: number;
  outlineOpacity: number;
  auto: boolean;
  json: boolean;
  output: string;
  verbose: boolean;
}

export interface PostProcessOptions {
  session: string;
  bgRemoval: boolean;
  outline: OutlineStyle;
  outlineThickness: number;
  outlineOpacity: number;
  auto: boolean;
  json: boolean;
  output: string;
}

export interface ExportOptions {
  session: string;
  platforms: PlatformId[];
  json: boolean;
  output: string;
}

export interface ConfigOptions {
  action: 'set-key' | 'get-key' | 'delete-key' | 'show';
  value?: string;
  json: boolean;
}

// ---------------------------------------------------------------------------
// Output Protocol (NDJSON)
// ---------------------------------------------------------------------------

export type OutputEvent =
  | ProgressEvent
  | ConfirmEvent
  | ConfirmResponseEvent
  | ResultEvent
  | ErrorEvent;

export interface ProgressEvent {
  type: 'progress';
  stage: Stage | string;
  status: 'started' | 'running' | 'complete';
  current?: number;
  total?: number;
  message: string;
  data?: unknown;
}

export interface ConfirmEvent {
  type: 'confirm';
  checkpoint: ConfirmCheckpoint;
  message: string;
  preview: ConfirmPreview;
  options: string[];
  awaiting_input: boolean;
  auto_approved?: boolean;
}

export type ConfirmCheckpoint = 'key_visual' | 'post_process' | 'metadata';

export interface ConfirmPreview {
  mainImage?: string;
  mainImageBase64?: string;
  characterSpec?: CharacterSpec;
  strategy?: LLMStrategy;
  stickers?: Array<{ id: number; expression: string; path: string }>;
  processedImages?: Array<{ id: string; path: string }>;
  processingOptions?: ProcessingOptions;
  metadataOptions?: MetaResult[];
}

export interface ConfirmResponseEvent {
  type: 'confirm_response';
  checkpoint: ConfirmCheckpoint;
  action: ConfirmAction;
  selectedOption?: number;
  reason?: string;
}

export type ConfirmAction = 'approve' | 'reject' | 'regenerate' | 'reprocess';

export interface ResultEvent {
  type: 'result';
  success: boolean;
  session_id: string;
  output_dir: string;
  exports: Record<PlatformId, string>;
  sticker_count: number;
  metadata?: MetaResult;
  elapsed_time: string;
}

export interface ErrorEvent {
  type: 'error';
  code: string;
  message: string;
  stage?: string;
  retryable: boolean;
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export interface SessionData {
  id: string;
  createdAt: number;
  updatedAt: number;
  status: 'running' | 'paused' | 'completed' | 'failed';
  currentStage: string | null;
  input: UserInput | null;
  strategy: LLMStrategy | null;
  characterSpec: CharacterSpec | null;
  mainImage: string | null;
  stickers: Sticker[];
  processedImages: ProcessedImage[];
  metadata: MetaResult[];
  processingOptions: ProcessingOptions | null;
  selectedMetadataIndex: number | null;
  outputDir: string;
}
