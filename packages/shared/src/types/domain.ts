// ===================================================================
// Domain Types — Unified from emoticon_generator + emoticon_post_processing
// ===================================================================

// ---------------------------------------------------------------------------
// Platform
// ---------------------------------------------------------------------------

/** Unified platform identifier (generator's PlatformType + post-processor's ExportPlatform) */
export type PlatformId = 'ogq_sticker' | 'line_sticker' | 'line_emoji' | 'kakaotalk_emoticon' | 'kakaotalk_mini';

export interface PlatformSize {
  width: number;
  height: number;
}

export interface PlatformSpec {
  label: string;
  description: string;
  count: number;
  content: PlatformSize;
  main: PlatformSize | null;
  tab: PlatformSize;
  fileNameFormat: (index: number) => string;
}

// ---------------------------------------------------------------------------
// Generation Pipeline (from emoticon_generator)
// ---------------------------------------------------------------------------

export interface UserInput {
  concept: string;
  referenceImage: string | null; // Base64
  language: 'Korean' | 'Japanese' | 'Traditional Chinese';
  skipCharacterGen?: boolean;
}

export interface CharacterSpec {
  physicalDescription: string;
  facialFeatures: string;
  colorPalette: string;
  distinguishingFeatures: string;
  artStyle: string;
}

export interface PersonaInsight {
  persona: string;
  analysis: string;
}

export interface LLMStrategy {
  selectedVisualStyleIndex: number;
  culturalNotes: string;
  salesReasoning: string;
  personaInsights: PersonaInsight[];
}

export interface EmoteIdea {
  id: number;
  expression: string;
  action: string;
  category: string;
  useCase: string;
  imagePrompt: string;
}

export interface VisualStyle {
  id: number;
  name: string;
  description: string;
  imageUrl: string | null;
  promptPrefix: string;
}

/** Sticker in the generation pipeline */
export interface Sticker {
  id: number;
  idea: EmoteIdea;
  imageUrl: string | null;
  status: 'pending' | 'loading' | 'done' | 'error';
}

// ---------------------------------------------------------------------------
// Post-Processing Pipeline (from emoticon_post_processing)
// ---------------------------------------------------------------------------

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/** String union replacing post-processor's OutlineStyle enum */
export type OutlineStyle = 'none' | 'white' | 'black';

/** String union replacing post-processor's BackgroundType enum */
export type BackgroundType = 'light' | 'dark' | 'transparent';

/** String union replacing post-processor's AppPhase enum */
export type AppPhase = 'upload' | 'process' | 'select' | 'metadata' | 'export';

/** String union replacing post-processor's ProcessingStatus enum */
export type ProcessingStatus =
  | 'idle'
  | 'loading'
  | 'processing'
  | 'generating'
  | 'completed'
  | 'error';

export interface ProcessingOptions {
  isBgRemovalEnabled: boolean;
  isOutlineEnabled: boolean;
  outlineStyle: OutlineStyle;
  outlineThickness: number;
  outlineOpacity: number;
}

/** Language codes supported by the metadata generator */
export type LanguageCode = 'en' | 'ja' | 'zh-TW' | 'zh-CN' | 'ko';

export interface EvaluationScores {
  naturalness: number;
  tone: number;
  searchability: number;
  creativity: number;
}

export interface MetaResult {
  language: LanguageCode;
  optionType: 'personality' | 'utility' | 'creative';
  title: string;
  description: string;
  tags: string[];
  evaluation: EvaluationScores;
  reasoning: string;
}

/** Image in the post-processing pipeline */
export interface ProcessedImage {
  id: string;
  name: string;
  data: string; // Base64 Data URL
}

/** Language entry for the metadata language selector */
export interface LanguageEntry {
  code: LanguageCode;
  label: string;
  required: boolean;
  nativeName: string;
}
