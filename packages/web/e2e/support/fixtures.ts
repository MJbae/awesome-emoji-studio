import { test as base, expect, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PNG } from './image';

export type RequestKind = 'validate' | 'analysis' | 'strategy' | 'character' | 'spec' | 'ideas' | 'sticker' | 'metadata';
export interface MockAPI {
  calls: { kind: RequestKind; body: Record<string, unknown> }[];
  failNext: (kind: RequestKind, count?: number) => void;
  emptyNext: (kind: RequestKind, count?: number) => void;
  delayMs: number;
  ideaCount: number;
  failureMessage: string;
  imageData: string;
  metadataOptions: number;
  imageText: boolean;
  emptyResponseShape: 'parts' | 'candidates';
  emptyAtCall: (kind: RequestKind, callNumber: number) => void;
}

export const test = base.extend<{ api: MockAPI; coverage: void }>({
  coverage: [async ({ page }, runFixture, testInfo) => {
    const saveCoverage = async (coverage: unknown) => {
      if (!coverage) return;
      await mkdir('coverage/e2e/raw', { recursive: true });
      await writeFile(`coverage/e2e/raw/${testInfo.testId.replace(/[^\w-]/g, '_')}-${randomUUID()}.json`, JSON.stringify(coverage));
    };
    await page.exposeFunction('__e2eSaveCoverage', saveCoverage);
    await page.addInitScript(() => {
      window.addEventListener('beforeunload', () => {
        const target = window as unknown as { __coverage__?: unknown; __e2eSaveCoverage: (value: unknown) => Promise<void> };
        void target.__e2eSaveCoverage(target.__coverage__);
      });
    });
    await runFixture();
    const coverage = await page.evaluate(() => (window as unknown as { __coverage__?: unknown }).__coverage__).catch(() => undefined);
    if (!coverage) throw new Error('Istanbul instrumentation is missing; E2E coverage must be collected.');
    await saveCoverage(coverage);
  }, { auto: true }],
  api: async ({ page }, runFixture) => {
    const failures = new Map<RequestKind, number>();
    const empties = new Map<RequestKind, number>();
    const emptyCalls = new Map<RequestKind, number>();
    const api: MockAPI = {
      calls: [], delayMs: 35, ideaCount: 5, failureMessage: '', imageData: PNG, metadataOptions: 3, imageText: true, emptyResponseShape: 'parts',
      emptyAtCall: (kind, callNumber) => emptyCalls.set(kind, callNumber),
      failNext: (kind, count = 2) => failures.set(kind, count),
      emptyNext: (kind, count = 1) => empties.set(kind, count),
    };
    await page.route('https://generativelanguage.googleapis.com/**', async (route) => {
      const body = route.request().postDataJSON() ?? {};
      const schema = body.generationConfig?.responseSchema?.properties ?? {};
      const text = JSON.stringify(body.contents ?? '');
      let kind: RequestKind = 'analysis';
      if (route.request().method() === 'GET') kind = 'validate';
      else if (schema.selectedVisualStyleIndex) kind = 'strategy';
      else if (schema.physicalDescription) kind = 'spec';
      else if (schema.ideas) kind = 'ideas';
      else if (schema.options) kind = 'metadata';
      else if (body.generationConfig?.imageConfig) kind = /LINE emoji sticker/.test(text) ? 'sticker' : 'character';
      api.calls.push({ kind, body });
      const kindCallNumber = api.calls.filter((call) => call.kind === kind).length;
      await new Promise((resolve) => setTimeout(resolve, api.delayMs));
      if ((failures.get(kind) ?? 0) > 0) {
        failures.set(kind, failures.get(kind)! - 1);
        await route.fulfill({ status: 400, json: { error: { code: 400, message: api.failureMessage || `Fixture ${kind} failure`, status: 'INVALID_ARGUMENT' } } });
        return;
      }
      if (kind === 'validate') {
        await route.fulfill({ json: { models: [{ name: 'models/gemini-2.5-flash', displayName: 'Gemini test model' }] } });
        return;
      }
      let value: unknown = 'Market research: an expressive blue bear appeals to everyday conversations.';
      if (kind === 'strategy') value = { selectedVisualStyleIndex: 0, culturalNotes: 'Friendly everyday expressions.', salesReasoning: 'Clear silhouettes and useful reactions.' };
      if (kind === 'spec') value = { physicalDescription: 'Round blue bear', facialFeatures: 'Dark round eyes', colorPalette: 'Blue and white', distinguishingFeatures: 'Small round ears', artStyle: 'Bold outlines' };
      if (kind === 'ideas') value = { ideas: Array.from({ length: api.ideaCount }, (_, index) => ({ id: index + 1, label: `Bear expression ${index + 1}`, category: index % 2 ? 'Greeting' : 'Emotion', imagePrompt: `Test sticker ${index + 1}: a blue bear waving happily` })) };
      if (kind === 'metadata') value = { options: ['personality', 'utility', 'creative'].slice(0, api.metadataOptions).map((optionType, index) => ({ optionType, title: `Blue Bear ${optionType}`, description: 'A friendly blue bear for daily conversations.', tags: ['bear', 'hello', 'cute'], evaluation: { naturalness: 3 + index, tone: 3 + index, searchability: 3 + index, creativity: 3 + index }, reasoning: 'Memorable and easy to discover.' })) };
      let parts: unknown[] = kind === 'character' || kind === 'sticker'
        ? [...(api.imageText ? [{ text: 'Generated image follows.' }] : []), { inlineData: { mimeType: 'image/png', data: api.imageData } }]
        : [{ text: typeof value === 'string' ? value : JSON.stringify(value) }];
      const empty = (empties.get(kind) ?? 0) > 0 || emptyCalls.get(kind) === kindCallNumber;
      if (empty) { empties.set(kind, Math.max(0, (empties.get(kind) ?? 0) - 1)); parts = []; }
      await route.fulfill({ json: { candidates: empty && api.emptyResponseShape === 'candidates' ? [] : [{ content: { role: 'model', parts }, finishReason: 'STOP' }], usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 } } });
    });
    await runFixture(api);
  },
});
export { expect, PNG };

export async function openStudio(page: Page, language = 'en') {
  await page.addInitScript((language) => localStorage.setItem('i18nextLng', language), language);
  await page.goto('/');
  await expect(page.getByTestId('api-key-modal')).toBeVisible();
  await page.getByTestId('api-key-input').fill('AIza-e2e-public-fake-key-no-real-service');
  await page.getByTestId('save-api-key-btn').click();
  await expect(page.locator('section[data-stage="input"]')).toBeVisible();
}
export async function submitConcept(page: Page, market = 'korean') {
  await page.getByTestId('concept-textarea').fill('A friendly blue bear celebrating everyday life');
  await page.getByTestId(`lang-${market}`).click();
  await page.getByTestId('analyze-btn').click();
}
export async function toStickers(page: Page) {
  await submitConcept(page);
  await expect(page.locator('section[data-stage="strategy"][data-phase="complete"]')).toBeVisible();
  await page.getByTestId('continue-btn').click();
  await expect(page.locator('section[data-stage="character"][data-phase="complete"]')).toBeVisible();
  await page.getByTestId('continue-btn').click();
  await expect(page.locator('section[data-stage="stickers"][data-phase="complete"]')).toBeVisible();
}
export async function toMetadata(page: Page) {
  await toStickers(page);
  await page.getByTestId('continue-btn').click();
  await expect(page.getByRole('img', { name: 'Processing preview', exact: true })).toBeVisible();
  await page.getByTestId('continue-btn').click();
  await expect(page.locator('section[data-stage="metadata"]')).toBeVisible();
}
