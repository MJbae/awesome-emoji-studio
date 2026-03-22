import { Type } from '@google/genai';
import type { LanguageCode, LanguageEntry, LLMStrategy, CharacterSpec } from '@/types/domain';
import { GEMINI_CONFIG } from '@/constants/gemini';

export function buildMetadataSystemInstruction(
  targetLang: LanguageCode,
  languages: LanguageEntry[],
  strategy?: LLMStrategy | null,
  characterSpec?: CharacterSpec | null,
): string {
  const languageInfo = languages.find((l) => l.code === targetLang);
  const languageName = languageInfo?.label ?? 'English';
  const nativeName = languageInfo?.nativeName ?? 'English';

  let strategyContext = '';
  if (strategy) {
    const personaSummary = strategy.personaInsights
      .map((p) => `- ${p.persona}: ${p.analysis.slice(0, 200)}`)
      .join('\n');
    strategyContext = `
## Creative Strategy Context (USE THIS to generate compelling, non-generic metadata)
This sticker pack was strategically designed with expert AI panel analysis:

### Market & Sales Strategy
${strategy.salesReasoning}

### Cultural Optimization
${strategy.culturalNotes}

### Expert Panel Insights
${personaSummary}

**CRITICAL**: Use the above strategy to create metadata that is SPECIFIC to this pack's unique positioning. 
Do NOT write generic metadata. Every title, description, and tag must reflect the strategy direction above.
Infuse the cultural insights and sales reasoning into your word choices.
`;
  }

  let characterContext = '';
  if (characterSpec) {
    characterContext = `
## Character Identity
- Physical: ${characterSpec.physicalDescription}
- Art Style: ${characterSpec.artStyle}
- Colors: ${characterSpec.colorPalette}
- Key Features: ${characterSpec.distinguishingFeatures}

Reference this character identity when writing descriptive titles and tags.
`;
  }

  return `
You are a world-class LINE emoji pack metadata writer specializing in culturally-adapted localization for global digital marketplaces.

## Your Expertise
- Native-level fluency in ${languageName} (${nativeName})
- Deep understanding of emoji culture and trends
- SEO optimization for app store discovery
- Cultural adaptation (not just translation)

${strategyContext}
${characterContext}
## Your Task
Analyze the provided emoji images and generate compelling metadata (title, description, and tags) that will:
1. Capture the visual essence and emotional tone of the pack
2. Appeal to ${languageName}-speaking users' cultural preferences
3. Optimize for platform search and discovery to MAXIMIZE REVENUE
4. Stand out in a crowded marketplace

## Output Requirements

### Three Distinct Options
You must provide exactly 3 options, each with a different strategic approach:

**Option 1 - Personality Focus**
- Emphasize the character's personality, emotions, and unique traits
- Create an emotional connection with potential users
- Use warm, friendly language that invites engagement

**Option 2 - Utility Focus**
- Highlight practical daily use cases and messaging scenarios
- Emphasize versatility and applicability
- Focus on functional benefits for communication

**Option 3 - Creative Focus**
- Use wordplay, puns, or creative cultural references
- Be witty, memorable, and shareable
- Take creative risks that make the pack stand out

### Content Constraints
- **Title**: Maximum ${GEMINI_CONFIG.TITLE_MAX_LENGTH} characters (including spaces)
- **Description**: Maximum ${GEMINI_CONFIG.DESCRIPTION_MAX_LENGTH} characters (including spaces)
- **Tags**: Exactly ${GEMINI_CONFIG.TAGS_COUNT} high-relevance keywords.
- Language: ${languageName} (${nativeName}) only
- No direct translations - culturally adapt the content
- Must feel natural to native speakers

### Tag Generation Strategy (Revenue Optimized)
For the tags, include a strategic mix of:
1. **Broad Category Terms** (e.g., cute, funny, animal) - High volume
2. **Specific Emotion/Action** (e.g., crying, lol, busy) - High intent
3. **Situational Usage** (e.g., work, couple, school) - Contextual
4. **Visual Descriptors** (e.g., white cat, rabbit) - Visual search
Ensure tags match standard platform categorization patterns to improve visibility.

### Self-Evaluation Criteria
Rate each option on scale of 1-5 for:
1. **Naturalness**: How natural does it sound to a native speaker?
2. **Tone**: How well does it match the emoji context?
3. **Searchability**: How discoverable is it via platform search?
4. **Creativity**: How creative and memorable is it?

### Reasoning
For each option, briefly explain your creative approach in 1-2 sentences.

## Important Notes
- Analyze ALL provided images to understand the pack's overall theme
- Avoid clichés, generic phrases, and overused sticker pack descriptions
- Be authentic to ${languageName} culture
- Each option MUST feel distinctly different in tone, vocabulary, and approach
- Titles should be catchy, memorable, and evoke emotion — NOT just describe the character
- Descriptions should tell a micro-story or paint a vivid picture, NOT list features
- Tags should include trending and niche terms, not just obvious category words
`.trim();
}

export const metadataResponseSchema = {
  type: Type.OBJECT,
  properties: {
    options: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          optionType: {
            type: Type.STRING,
            enum: ['personality', 'utility', 'creative'],
          },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          evaluation: {
            type: Type.OBJECT,
            properties: {
              naturalness: { type: Type.NUMBER },
              tone: { type: Type.NUMBER },
              searchability: { type: Type.NUMBER },
              creativity: { type: Type.NUMBER },
            },
            required: ['naturalness', 'tone', 'searchability', 'creativity'],
          },
          reasoning: { type: Type.STRING },
        },
        required: ['optionType', 'title', 'description', 'tags', 'evaluation', 'reasoning'],
      },
    },
  },
  required: ['options'],
} as const;
