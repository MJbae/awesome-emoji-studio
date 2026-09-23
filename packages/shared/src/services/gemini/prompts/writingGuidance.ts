import { isTargetLanguage } from '@/constants/languages';
import type { TargetLanguage } from '@/types/domain';

export function normalizeTargetLanguage(language: string): TargetLanguage {
  return isTargetLanguage(language) ? language : 'English';
}

const WRITING_GUIDANCE: Record<TargetLanguage, string> = {
  English: 'Use clear, conversational English, natural sentence case, and familiar everyday expressions. Avoid literal translations, inflated marketing language, and forced slang.',
  Korean: 'Use idiomatic contemporary Korean. Use friendly, polite 해요체 for explanations and short natural Korean labels for names and categories. Keep speech levels consistent. Avoid literal English word order, unnecessary loanwords, and forced slang.',
  Japanese: 'Use idiomatic contemporary Japanese. Use friendly です・ます prose for explanations and concise natural Japanese labels for names and categories. Avoid literal English word order, excessively formal business language, and forced slang. For LINE formats, distinguish スタンプ (stickers) from 絵文字 (emoji).',
  'Simplified Chinese': 'Use Simplified Chinese characters and natural mainland Chinese vocabulary, such as 表情包, 图片, 设置, and 导出 where relevant. Use concise, friendly contemporary wording. Avoid Traditional Chinese script, Taiwan-specific terminology, literal English sentence structures, and forced internet slang.',
  'Traditional Chinese': 'Use Traditional Chinese characters and natural Taiwan Mandarin vocabulary, such as 貼圖, 圖片, 設定, 儲存, and 匯出 where relevant. Use concise, friendly contemporary wording. Avoid Simplified Chinese script, mainland-specific terminology, literal English sentence structures, and forced internet slang. For LINE formats, distinguish 貼圖 (stickers) from 表情貼 (emoji).',
};

/** Regional language guidance for generated copy, separate from the interface locale. */
export function buildWritingGuidance(
  language: string,
  fields: string = 'all user-visible text',
): string {
  const targetLanguage = normalizeTargetLanguage(language);
  return `OUTPUT LANGUAGE: Write ${fields} in natural ${targetLanguage}.
${WRITING_GUIDANCE[targetLanguage]}
Preserve proper names, brand names, numeric values, color codes, and technical identifiers when needed. Keep JSON field names and enum values exactly as specified.
Before responding, check every user-visible sentence for idiomatic wording, consistent tone, and the requested language and script. Rewrite awkward phrases before returning the result.`;
}
