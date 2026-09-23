import { test, expect, openStudio } from './support/fixtures';
import type { EmoticonAPI } from '../../shared/src/types/api';

declare global { interface Window { emoticon?: EmoticonAPI } }

const cases = [
  ['API key missing', 'GEMINI', false],
  ['unauthorized request', 'GEMINI', false],
  ['401 credentials rejected', 'GEMINI', false],
  ['429 exhausted', 'GEMINI', true],
  ['rate limit exceeded', 'GEMINI', true],
  ['quota exceeded', 'GEMINI', true],
  ['500 server failure', 'GEMINI', true],
  ['503 internal error', 'GEMINI', true],
  ['network disconnected', 'GEMINI', true],
  ['fetch failed', 'GEMINI', true],
  ['timeout waiting for provider', 'GEMINI', true],
  ['validation rejected', 'VALIDATION', false],
  ['invalid image request', 'VALIDATION', false],
] as const;

for (const [message, code, retryable] of cases) {
  test(`provider error "${message}" preserves actionable public job error`, async ({ page, api }) => {
    await openStudio(page);
    api.failureMessage = message;
    api.failNext('analysis');
    const jobId = await page.evaluate(() => window.emoticon!.runFullPipeline({ concept: 'Friendly bear', referenceImage: null, language: 'Korean' }, 'line_emoji'));
    await expect.poll(() => page.evaluate((id) => window.emoticon!.getJob(id).status, jobId)).toBe('failed');
    const error = await page.evaluate((id) => window.emoticon!.getJob(id).error, jobId);
    expect(error).toMatchObject({ code, retryable, stage: 'concept-analysis' });
    expect(api.calls.filter((call) => call.kind === 'analysis')).toHaveLength(2);
  });
}

test('empty provider response becomes an unknown error and absent credentials fail before network', async ({ page, api }) => {
  await openStudio(page);
  api.emptyNext('analysis');
  const failed = await page.evaluate(() => window.emoticon!.runFullPipeline({ concept: 'Friendly bear', referenceImage: null, language: 'Korean' }, 'line_emoji'));
  await expect.poll(() => page.evaluate((id) => window.emoticon!.getJob(id).status, failed)).toBe('failed');
  expect(await page.evaluate((id) => window.emoticon!.getJob(id).error?.code, failed)).toBe('UNKNOWN');
  const before = api.calls.length;
  const missing = await page.evaluate(async () => {
    await window.emoticon!.setApiKey('');
    return window.emoticon!.runFullPipeline({ concept: 'Friendly bear', referenceImage: null, language: 'Korean' }, 'line_emoji');
  });
  await expect.poll(() => page.evaluate((id) => window.emoticon!.getJob(id).status, missing)).toBe('failed');
  expect(await page.evaluate((id) => window.emoticon!.getJob(id).error, missing)).toMatchObject({ code: 'GEMINI', retryable: false });
  expect(api.calls).toHaveLength(before);
});
