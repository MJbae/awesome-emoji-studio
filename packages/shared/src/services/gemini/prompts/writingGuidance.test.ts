import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LANGUAGE_OPTIONS, METADATA_LANGUAGES } from '@/constants/languages';
import { VISUAL_STYLES } from '@/constants/styles';
import type { CharacterSpec, LanguageCode } from '@/types/domain';
import { generateWithFlash } from '../client';
import { extractCharacterSpec, generateEmoteIdeas, generateMetadata } from '../orchestrator';
import {
  buildArtDirectorPrompt,
  buildCulturalExpertPrompt,
  buildMarketAnalystPrompt,
  buildSynthesisPrompt,
  getCulturalContext,
} from './expertPanel';
import { buildEmoteIdeasPrompt, buildExtractCharacterSpecPrompt } from './characterGen';
import { buildMetadataSystemInstruction, metadataResponseSchema } from './metadata';

vi.mock('../client', () => ({
  generateImage: vi.fn(),
  generateWithFlash: vi.fn(),
}));

const characterSpec: CharacterSpec = {
  physicalDescription: 'Round hamster with short arms',
  facialFeatures: 'Two dark dot eyes',
  colorPalette: '#FFDDAA body, #000000 eyes',
  distinguishingFeatures: 'Small sunflower badge',
  artStyle: 'Bold outline',
};

const strategyContext = { salesReasoning: 'Daily reactions', culturalNotes: 'Friendly tone' };

describe('generated-content language contracts', () => {
  beforeEach(() => vi.resetAllMocks());

  it.each(LANGUAGE_OPTIONS)('localizes all analysis outputs for $label', ({ market }) => {
    const prompts = [
      buildMarketAnalystPrompt('hamster', market),
      buildArtDirectorPrompt('hamster', market, 'Market insight', VISUAL_STYLES),
      buildCulturalExpertPrompt('hamster', market),
      buildSynthesisPrompt('hamster', market, 'Expert advice', VISUAL_STYLES),
    ];
    for (const prompt of prompts) {
      expect(prompt).toMatch(new RegExp(`OUTPUT LANGUAGE: Write .+ in natural ${market}\\.`));
      expect(prompt).toContain('Before responding, check every user-visible sentence');
    }
    expect(prompts[3]).toContain('culturalNotes and salesReasoning');
  });

  it.each(LANGUAGE_OPTIONS)('routes $label through character extraction and preserves its schema', async ({ market }) => {
    vi.mocked(generateWithFlash).mockResolvedValue({ text: JSON.stringify(characterSpec) } as never);
    await expect(extractCharacterSpec('image-base64', 'hamster', market)).resolves.toEqual(characterSpec);
    const request = vi.mocked(generateWithFlash).mock.calls[0]![0];
    expect(JSON.stringify(request.contents)).toContain(`in natural ${market}.`);
    expect(JSON.stringify(request.contents)).toContain('image-base64');
    expect(request.config?.responseSchema?.required).toEqual(Object.keys(characterSpec));
  });

  it.each(LANGUAGE_OPTIONS)('localizes emoji labels but keeps technical prompts separate for $label', async ({ market }) => {
    const ideas = [{ id: 1, label: 'Hello', category: 'Greeting', imagePrompt: 'waving happily' }];
    vi.mocked(generateWithFlash).mockResolvedValue({ text: JSON.stringify({ ideas }) } as never);
    await expect(generateEmoteIdeas(
      { concept: 'hamster', language: market, referenceImage: null },
      'Bold', characterSpec, strategyContext, 1,
    )).resolves.toEqual(ideas);
    const prompt = vi.mocked(generateWithFlash).mock.calls[0]![0].contents;
    expect(prompt).toContain(`Write every idea label and category in natural ${market}.`);
    expect(prompt).toContain('Write imagePrompt in English for the image generator');
    expect(prompt).toContain('Generate 1 unique emoji ideas');
  });

  it.each(LANGUAGE_OPTIONS)('localizes metadata prose without translating enum values for $label', async ({ code, market }) => {
    vi.mocked(generateWithFlash).mockResolvedValue({ text: JSON.stringify({ options: [] }) } as never);
    await generateMetadata(['image-base64'], code, METADATA_LANGUAGES);
    const config = vi.mocked(generateWithFlash).mock.calls[0]![0].config;
    expect(config?.systemInstruction).toContain(`Write every title, description, tag, and reasoning explanation in natural ${market}.`);
    expect(config?.systemInstruction).toContain('Keep optionType values personality, utility, and creative unchanged');
    expect(config?.responseSchema).toBe(metadataResponseSchema);
  });

  it('keeps omitted character-language arguments backward-compatible with English', async () => {
    expect(buildExtractCharacterSpecPrompt('hamster')).toContain('in natural English.');
    vi.mocked(generateWithFlash).mockResolvedValue({ text: JSON.stringify(characterSpec) } as never);
    await extractCharacterSpec('image-base64', 'hamster');
    expect(JSON.stringify(vi.mocked(generateWithFlash).mock.calls[0]![0].contents)).toContain('in natural English.');
  });

  it('falls back to English when an older saved job uses an unsupported language', () => {
    const prompt = buildMarketAnalystPrompt('hamster', 'Thai');
    expect(prompt).toContain('Target Market: English');
    expect(prompt).toContain('in natural English.');
    expect(prompt).not.toContain('Thai');
    expect(getCulturalContext('Thai')).toEqual(getCulturalContext('English'));
    expect(buildEmoteIdeasPrompt('hamster', 'Thai', 'Bold', characterSpec, strategyContext)).toContain('Language: English');
    expect(buildMetadataSystemInstruction('th' as LanguageCode, [])).toContain('in natural English.');
  });

  it('uses the requested Chinese script and regional vocabulary even without language option entries', () => {
    const simplified = buildMetadataSystemInstruction('zh-CN', []);
    const traditional = buildMetadataSystemInstruction('zh-TW', []);
    expect(simplified).toContain('Use Simplified Chinese characters and natural mainland Chinese vocabulary');
    expect(simplified).toContain('表情包, 图片, 设置, and 导出');
    expect(traditional).toContain('Use Traditional Chinese characters and natural Taiwan Mandarin vocabulary');
    expect(traditional).toContain('貼圖, 圖片, 設定, 儲存, and 匯出');
    expect(traditional).toContain('distinguish 貼圖 (stickers) from 表情貼 (emoji)');
  });
});
