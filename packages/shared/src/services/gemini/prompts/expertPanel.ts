import type { VisualStyle } from '@/types/domain';

export function getCulturalContext(language: string): string {
  switch (language) {
    case 'Korean':
      return 'Optimize for Korean LINE emoji market. Korean users prefer cute, expressive characters with warm colors. Popular categories include aegyo expressions, food reactions, daily life situations, and K-culture references. Korean buyers value emotional warmth and relatability.';
    case 'Japanese':
      return 'Optimize for Japanese LINE emoji market. Japanese users appreciate detailed, polished art with clean aesthetics. Popular categories include kawaii expressions, seasonal greetings, polite responses, and workplace communication. Japanese buyers value quality, politeness variations, and aesthetic refinement.';
    case 'Traditional Chinese':
      return 'Optimize for Traditional Chinese LINE emoji market. Users prefer vibrant, lucky-themed designs with bold expressions. Popular categories include festive greetings, humorous reactions, trendy slang, and auspicious imagery. Buyers value expressive humor, cultural symbolism, and vibrant energy.';
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

Cover these points in 3-5 short paragraphs:
1. Current market trends relevant to this concept in the ${language} LINE emoji store.
2. Target demographics and their purchasing patterns for this category.
3. Competition level — how saturated is this concept category?
4. Recommended pricing tier (low/mid/premium) and pack positioning strategy.

Be specific and data-informed. No generic advice.
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

Cover these points concisely:
1. Which visual style index (0-4) best fits this concept AND market? Why?
2. Color palette strategy for maximum shelf appeal at tiny emoji sizes (180x180px).
3. How does this concept translate visually for the ${language} audience?

Be decisive — give clear recommendations, not options.
`;
}

export function buildCulturalExpertPrompt(concept: string, language: string): string {
  return `
You are a Cultural Marketing Expert for East Asian digital markets, specializing in the ${language} region.

Analyze cultural considerations for this LINE emoji concept.

Concept: ${concept}
Target Market: ${language}

Cover these points concisely:
1. Deep cultural nuances for the ${language} market that affect emoji purchasing.
2. Taboo topics, gestures, colors, or symbols to AVOID for this concept.
3. Current cultural trends in the ${language} market that could boost sales.
4. Localization recommendations for text expressions and emotional tone.

Be specific to ${language} — no generic East Asian generalizations.
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

YOUR TASK: Make the definitive creative and commercial decisions by integrating all expert inputs.

1. SELECT the single best visual style index (0-4).
2. EXPLAIN cultural considerations that shaped your decisions.
3. PROVIDE the commercial reasoning behind your final strategy.

Be decisive. This is the final call — no hedging.
`;
}
