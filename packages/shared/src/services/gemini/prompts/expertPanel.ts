import type { VisualStyle } from '@/types/domain';

export function getCulturalContext(language: string): string {
  switch (language) {
    case 'English':
      return 'Optimize for global English-speaking LINE emoji market. English-speaking users appreciate universal humor, relatable everyday expressions, and clean modern designs. Popular categories include sarcastic reactions, workplace humor, relationship expressions, and pop-culture references. Buyers value versatility, wit, and broad relatability across cultures.';
    case 'Korean':
      return 'Optimize for Korean LINE emoji market. Korean users prefer cute, expressive characters with warm colors. Popular categories include aegyo expressions, food reactions, daily life situations, and K-culture references. Korean buyers value emotional warmth and relatability.';
    case 'Japanese':
      return 'Optimize for Japanese LINE emoji market. Japanese users appreciate detailed, polished art with clean aesthetics. Popular categories include kawaii expressions, seasonal greetings, polite responses, and workplace communication. Japanese buyers value quality, politeness variations, and aesthetic refinement.';
    case 'Traditional Chinese':
      return 'Optimize for Traditional Chinese LINE emoji market. Users prefer vibrant, lucky-themed designs with bold expressions. Popular categories include festive greetings, humorous reactions, trendy slang, and auspicious imagery. Buyers value expressive humor, cultural symbolism, and vibrant energy.';
    case 'Simplified Chinese':
      return 'Optimize for Simplified Chinese emoji market. Mainland Chinese users enjoy humorous, meme-style expressions with bold, trendy designs. Popular categories include internet slang reactions, work-life balance humor, food culture, and social media expressions. Buyers value humor, trendiness, and relatable modern lifestyle content.';
    case 'Thai':
      return 'Optimize for Thai LINE emoji market. Thailand is LINE\'s largest market. Thai users love playful, colorful, and humorous characters with exaggerated expressions. Popular categories include sanuk (fun) reactions, polite greetings (wai), food expressions, and playful teasing. Thai buyers value cuteness, humor, bright colors, and characters that express the Thai concept of "mai pen rai" (easygoing attitude).';
    default:
      return 'Optimize for LINE emoji market with broad appeal.';
  }
}

export function buildMarketAnalystPrompt(concept: string, language: string): string {
  const culturalContext = getCulturalContext(language);
  return `
You are a Senior LINE Emoji Market Analyst with 10+ years of experience in the ${language} digital goods market.

Analyze this emoji concept and provide a concise market assessment.

Concept: ${concept}
Target Market: ${language}

${culturalContext}

Respond in 3-4 sentences total covering: market trends, target demographics, competition level, and pricing tier for this concept. Be specific. No generic advice.
`;
}

export function buildArtDirectorPrompt(
  concept: string,
  language: string,
  marketInsight: string,
  visualStyles: Omit<VisualStyle, 'imageUrl'>[],
): string {
  const visualStyleDescriptions = visualStyles
    .map((style, index) => `[${index}] "${style.name}": ${style.description}`)
    .join('\n');

  return `
You are a Creative Art Director specializing in LINE emoji design for the ${language} market.

A market analyst has provided this insight:
---
${marketInsight}
---

Based on that market context, advise on creative direction for this emoji concept.

Concept: ${concept}
Target Market: ${language}

AVAILABLE VISUAL STYLES (recommend ONE by index):
${visualStyleDescriptions}

Respond in 3-4 sentences total: recommend ONE visual style index (0-4) with reason, color palette strategy, and visual translation for the ${language} audience. Be decisive.
`;
}

export function buildCulturalExpertPrompt(concept: string, language: string): string {
  return `
You are a Cultural Marketing Expert for East Asian digital markets, specializing in the ${language} region.

Analyze cultural considerations for this LINE emoji concept.

Concept: ${concept}
Target Market: ${language}

Respond in 3-4 sentences total: key cultural nuances, taboos to avoid, and current trends for this concept in the ${language} market. Be specific to ${language}.
`;
}

export function buildSynthesisPrompt(
  concept: string,
  language: string,
  insightsSummary: string,
  visualStyles: Omit<VisualStyle, 'imageUrl'>[],
): string {
  const visualStyleDescriptions = visualStyles
    .map((style, index) => `[${index}] "${style.name}": ${style.description}`)
    .join('\n');

  return `
You are the Chief Creative Director making the FINAL strategic decision for a LINE emoji pack.

Three expert advisors have provided their analyses:

${insightsSummary}

AVAILABLE VISUAL STYLES:
${visualStyleDescriptions}

Concept: ${concept}
Target Market: ${language}

YOUR TASK: Integrate all expert inputs into a final decision.

1. SELECT the single best visual style index (0-4).
2. culturalNotes: 2-3 sentences on cultural considerations.
3. salesReasoning: 2-3 sentences on commercial strategy.

Be decisive. Keep each field under 3 sentences.
`;
}
