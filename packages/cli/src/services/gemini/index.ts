/**
 * Gemini service wrapper for CLI.
 *
 * Re-exports shared Gemini orchestrator functions.
 * The shared services use @google/genai which is Node.js compatible.
 * API key is set via the in-memory apiKeyManager before calling these.
 */

// Re-export orchestrator functions
export {
  analyzeConcept,
  generateBaseCharacter,
  generateVisualVariation,
  extractCharacterSpec,
  generateEmoteIdeas,
  generateSingleEmote,
  generateMetadata,
} from '@/services/gemini/orchestrator';

// Re-export client functions
export {
  generateText,
  generateImage,
  generateWithFlash,
} from '@/services/gemini/client';

// Re-export API key management
export {
  getApiKey,
  setApiKey,
  clearApiKey,
  validateApiKey,
} from '@/services/config/apiKeyManager';
