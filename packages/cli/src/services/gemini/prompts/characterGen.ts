import type { CharacterSpec, EmoteIdea } from '../../../types/domain';
import { getCulturalContext } from './expertPanel';

export function buildBaseCharacterPrompt(
  concept: string,
  language: string,
  hasReferenceImage: boolean,
): string {
  const culturalContext = getCulturalContext(language);

  return `
Create a character design for LINE messenger emoji (180x180px display size).
Character concept: ${concept}
${hasReferenceImage ? 'Reference image provided. Use it as the primary visual reference for the character design.' : ''}

${culturalContext}

CRITICAL REQUIREMENTS:
1. OUTPUT EXACTLY ONE SINGLE CHARACTER. No character sheets, no multiple views.
2. Face/upper body focus, Large head-to-body ratio.
3. THICK, BOLD outlines. High contrast colors.
4. SOLID WHITE BACKGROUND. Do not use transparency.
5. Cute but expressive. Optimized for LINE emoji sales at 180x180px.
6. Design for TINY display: exaggerated proportions, minimal detail, maximum expression clarity.
DO NOT include any text.
`;
}

export function buildVisualVariationPrompt(promptPrefix: string, language: string): string {
  const culturalContext = getCulturalContext(language);

  return `
${promptPrefix}

${culturalContext}

CRITICAL GENERATION RULES:
1. GENERATE EXACTLY ONE SINGLE CHARACTER centered in the frame.
2. DO NOT create a character sheet, grid, or multiple poses.
3. SOLID WHITE BACKGROUND (No transparency, no patterns).
4. High contrast, clean edges, thick lines suitable for tiny LINE emoji (180x180px).
5. Design must be optimized for LINE messenger emoji sales appeal.

Expression: Excited/Happy (Representative Emote)
`;
}

export function buildExtractCharacterSpecPrompt(concept: string): string {
  return `
Analyze this character image and extract a PRECISE character specification for consistent reproduction.
The character concept is: ${concept}

This spec will be used to maintain IDENTICAL character appearance across 45 stickers. Be extremely specific.

Extract:
1. PHYSICAL DESCRIPTION: Body shape (round/slim/square), proportions (head-to-body ratio like 1:1 or 2:1), limb style (stubby/long/noodle), overall silhouette shape.
2. FACIAL FEATURES (CRITICAL FOR CONSISTENCY):
   - Eye shape (round/oval/dot/almond), eye size (large/medium/small relative to face), eye color, pupil style (dot/highlight/star), eye spacing
   - Nose shape (button/triangle/dot/absent)
   - Mouth style (simple curve/cat-mouth/W-shape/dot), default mouth size
   - Eyebrow style (thin/thick/absent/dot)
   - Ear shape and position (if applicable)
   - Cheek marks (blush circles/lines/none), their color
   - Any facial accessories (glasses, freckles, whiskers, etc.)
3. COLOR PALETTE: List EVERY color used with location (e.g., "#FFB6C1 pink - body, #FFFFFF white - belly, #FF69B4 hot pink - cheeks, #000000 black - outlines and eyes")
4. DISTINGUISHING FEATURES: Unique elements that define this character and MUST appear in every sticker (e.g., "red bow on left ear, striped tail, star-shaped belly mark")
5. ART STYLE: Line thickness (thin 1px/medium 2-3px/thick 4px+), outline color, shading style (flat/cel-shaded/gradient), detail level (minimal/moderate/detailed)

Be EXTREMELY specific about facial features - they are the #1 source of inconsistency.
`;
}

function getLanguageSpecificCategories(language: string): string {
  switch (language) {
    case 'Korean':
      return `
Popular Korean LINE emoji categories for high sales:
- Aegyo/Cute reactions
- Daily greetings
- Food & eating reactions
- Work/study life
- K-culture expressions`;
    case 'Japanese':
      return `
Popular Japanese LINE emoji categories for high sales:
- Polite responses & greetings
- Kawaii emotional reactions
- Seasonal & event greetings
- Workplace communication
- Trendy internet expressions`;
    case 'Traditional Chinese':
      return `
Popular Traditional Chinese LINE emoji categories for high sales:
- Festival & lucky greetings
- Humorous daily reactions
- Trendy slang expressions
- Food & lifestyle
- Emotional emphasis`;
    default:
      return '';
  }
}

export function buildEmoteIdeasPrompt(
  concept: string,
  language: string,
  visualStyleName: string,
  characterSpec: CharacterSpec,
  strategyContext: { salesReasoning: string; culturalNotes: string },
  targetCount: number = 45,
): string {
  const culturalContext = getCulturalContext(language);
  const languageSpecificCategories = getLanguageSpecificCategories(language);

  const c1 = Math.floor(targetCount * 0.22); // Core Theme Emotions
  const c2 = Math.floor(targetCount * 0.22); // Theme-Specific Actions
  const c3 = Math.floor(targetCount * 0.18); // Daily Life with Theme
  const c4 = Math.floor(targetCount * 0.16); // Social Reactions
  const c5 = Math.floor(targetCount * 0.13); // Special Moments
  const c6 = targetCount - c1 - c2 - c3 - c4 - c5; // Signature Poses

  return `
Generate ${targetCount} unique emoji ideas optimized for LINE messenger emoji sales.
These will display at 180x180px — prioritize clear, bold designs.
Character: ${concept}
Style: ${visualStyleName}
Language: ${language}

CHARACTER REFERENCE (use this to write accurate imagePrompt descriptions):
- Appearance: ${characterSpec.physicalDescription}
- Colors: ${characterSpec.colorPalette}
- Key Features: ${characterSpec.distinguishingFeatures}
- Art Style: ${characterSpec.artStyle}

${culturalContext}

${languageSpecificCategories}

Focus on expressions and scenarios that drive the highest engagement and purchases on LINE messenger.
Think about what makes users want to BUY and USE these stickers in daily conversations.

CORE THEME: "${concept}"
CRITICAL: Every emoji must naturally incorporate this theme's unique identity.
Do NOT generate generic emotions disconnected from the theme.

Categories to distribute (${targetCount} total):
1. Core Theme Emotions (${c1}) — feelings directly tied to the theme
2. Theme-Specific Actions (${c2}) — actions/situations unique to the theme
3. Daily Life with Theme (${c3}) — everyday moments filtered through the theme lens
4. Social Reactions (${c4}) — greetings and responses incorporating theme elements
5. Special Moments (${c5}) — celebrations and events related to the theme
6. Signature Poses (${c6}) — iconic poses that define this character's theme

STRATEGY DIRECTION (each imagePrompt MUST reflect this):
- Sales Strategy: ${strategyContext.salesReasoning}
- Cultural Optimization: ${strategyContext.culturalNotes}

imagePrompt rules:
- Maximum 10 words, action-focused keywords only
- Do NOT describe the character's appearance (reference image is provided separately)
- Focus on WHAT the character is doing and HOW they feel
- Example: "joyfully celebrating after hole-in-one"
- NOT: "A cute round character with glasses jumping with joy while holding a golf club"

CRITICAL RULES:
- DO NOT include any text on the emoji. Image only.
- Distinct silhouettes for each emote.
- Exaggerated expressions for visibility at small sizes.
- Prioritize emoji that users will send MOST OFTEN in LINE conversations.
`;
}

export function buildSingleEmotePrompt(idea: EmoteIdea, _characterSpec: CharacterSpec): string {
  return `LINE emoji sticker, 180x180px, square, solid white background.
Match the character in the reference image exactly.
Only change the expression and pose — not the character design.
Scene: ${idea.imagePrompt}
No text. Single character only. Bold lines, exaggerated expression.`;
}
