import type { VisualStyle } from '@/types/domain';

export const VISUAL_STYLES: Omit<VisualStyle, 'imageUrl'>[] = [
  {
    id: 0,
    name: 'Chibi / Meme',
    description:
      'Exaggerated 2-head tall proportions, internet culture aesthetic, comedic feel.',
    promptPrefix:
      'Transform this character into a chibi meme-style emote. STRICT REQUIREMENT: GENERATE ONLY ONE SINGLE CHARACTER. Style: 2-head tall proportions, extremely exaggerated expression, meme-worthy.',
  },
  {
    id: 1,
    name: 'Clean Cartoon',
    description:
      'Balanced 3-head tall proportions, clear professional look, smooth lines.',
    promptPrefix:
      'Transform this character into a clean cartoon-style emote. STRICT REQUIREMENT: GENERATE ONLY ONE SINGLE CHARACTER. Style: Balanced proportions (3-head tall), clear professional look, smooth lines.',
  },
  {
    id: 2,
    name: 'Pixel / Retro',
    description:
      'Pixel art aesthetic, retro gaming feel, limited color palette.',
    promptPrefix:
      'Transform this character into a pixel art style emote. STRICT REQUIREMENT: GENERATE ONLY ONE SINGLE CHARACTER. Style: Pixel art aesthetic, retro gaming feel, limited color palette (8-16 colors).',
  },
  {
    id: 3,
    name: 'Expressive Anime',
    description:
      'Anime/manga influenced, dynamic, energetic, sparkles and effects.',
    promptPrefix:
      'Transform this character into an expressive anime-style emote. STRICT REQUIREMENT: GENERATE ONLY ONE SINGLE CHARACTER. Style: Anime/manga influenced, dynamic, energetic feel, vibrant colors.',
  },
  {
    id: 4,
    name: 'Original / Balanced',
    description:
      'Maintains the original vibe of your reference or creates a balanced, versatile look.',
    promptPrefix:
      'Refine this character into a high-quality sticker emote while maintaining its original identity and style. STRICT REQUIREMENT: GENERATE ONLY ONE SINGLE CHARACTER. Style: High fidelity to source, clear outlines, emote-ready.',
  },
];
