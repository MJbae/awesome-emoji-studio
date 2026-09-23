import type { Download, Page } from '@playwright/test';
import JSZip from 'jszip';
import { readFile } from 'node:fs/promises';
import { test, expect, openStudio, submitConcept, toMetadata, PNG } from './support/fixtures';

const API_URL = 'https://generativelanguage.googleapis.com/**';

async function waitForStrategy(page: Page) {
  await expect(page.locator('section[data-stage="strategy"][data-phase="complete"]')).toBeVisible();
}

async function waitForCharacter(page: Page) {
  await expect(page.locator('section[data-stage="character"][data-phase="complete"]')).toBeVisible();
}

test('empty strategy synthesis response presents retry and preserves the concept', async ({ page, api }) => {
  await openStudio(page);
  api.emptyNext('strategy');
  await submitConcept(page);
  await expect(page.getByRole('alert')).toContainText('No response from synthesis step');
  await page.getByTestId('retry-btn').click();
  await waitForStrategy(page);
  await page.getByTestId('back-btn').click();
  await expect(page.getByTestId('concept-textarea')).toHaveValue('A friendly blue bear celebrating everyday life');
});

test('empty base character image can be retried without losing the strategy', async ({ page, api }) => {
  await openStudio(page);
  await submitConcept(page);
  await waitForStrategy(page);
  api.emptyNext('character');
  await page.getByTestId('continue-btn').click();
  await expect(page.getByRole('alert')).toContainText('Failed to generate base image');
  await expect(page.getByTestId('continue-btn')).toBeDisabled();
  await page.getByTestId('retry-btn').click();
  await waitForCharacter(page);
  await expect(page.getByRole('img', { name: 'Generated character', exact: true })).toBeVisible();
  await page.getByTestId('back-btn').click();
  await waitForStrategy(page);
});

test('empty style variation image recovers through the existing retry action', async ({ page, api }) => {
  await openStudio(page);
  await submitConcept(page);
  await waitForStrategy(page);
  let imageRequests = 0;
  await page.route(API_URL, async (route) => {
    const body = route.request().postDataJSON();
    if (body?.generationConfig?.imageConfig && ++imageRequests === 2) {
      await route.fulfill({ json: { candidates: [{ content: { role: 'model', parts: [] }, finishReason: 'STOP' }] } });
      return;
    }
    await route.fallback();
  });
  await page.getByTestId('continue-btn').click();
  await expect(page.getByRole('alert')).toContainText('Failed to generate style');
  await page.getByTestId('retry-btn').click();
  await waitForCharacter(page);
  expect(api.calls.filter((call) => call.kind === 'character').length).toBeGreaterThanOrEqual(3);
});

test('empty character details retain the image and regeneration restores the details', async ({ page, api }) => {
  await openStudio(page);
  await submitConcept(page);
  await waitForStrategy(page);
  api.emptyNext('spec');
  await page.getByTestId('continue-btn').click();
  await waitForCharacter(page);
  await expect(page.getByRole('img', { name: 'Generated character', exact: true })).toBeVisible();
  await expect(page.getByTestId('toggle-spec-btn')).toHaveCount(0);
  await page.getByTestId('regenerate-btn').click();
  await waitForCharacter(page);
  await page.getByTestId('toggle-spec-btn').click();
  await expect(page.getByText('Round blue bear', { exact: true })).toBeVisible();
});

test('reference image guides normal generation while skip generation stays off', async ({ page, api }) => {
  await openStudio(page);
  await page.getByTestId('reference-image-input').setInputFiles({
    name: 'bear-reference.png', mimeType: 'image/png', buffer: Buffer.from(PNG, 'base64'),
  });
  await expect(page.getByRole('img', { name: 'Reference preview', exact: true })).toBeVisible();
  await expect(page.getByTestId('skip-chargen-toggle')).toHaveAttribute('aria-checked', 'false');
  await submitConcept(page, 'japanese');
  await waitForStrategy(page);
  await page.getByTestId('continue-btn').click();
  await waitForCharacter(page);
  const characterRequests = api.calls.filter((call) => call.kind === 'character');
  expect(characterRequests).toHaveLength(2);
  expect(JSON.stringify(characterRequests[0]?.body)).toContain(PNG);
});

test('pending and loading stickers disable forward and back navigation until all jobs settle', async ({ page, api }) => {
  api.ideaCount = 6;
  api.delayMs = 250;
  await page.clock.install();
  await openStudio(page);
  await submitConcept(page);
  await waitForStrategy(page);
  await page.getByTestId('continue-btn').click();
  await waitForCharacter(page);
  await page.getByTestId('continue-btn').click();
  await expect(page.locator('[data-job-status="pending"]')).toHaveCount(3);
  await expect(page.getByTestId('continue-btn')).toBeDisabled();
  await expect(page.getByTestId('back-btn')).toBeDisabled();
  await expect(page.locator('[data-job-status="done"]')).toHaveCount(3);
  await expect(page.getByRole('progressbar', { name: 'Emoji generation progress' })).toHaveAttribute('aria-valuenow', '3');
  await page.clock.fastForward(10_001);
  await expect(page.locator('[data-job-status="done"]')).toHaveCount(6);
  await expect(page.getByTestId('continue-btn')).toBeEnabled();
  await expect(page.getByTestId('back-btn')).toBeEnabled();
});

test('empty metadata response recovers and clipboard denial does not interrupt the workflow', async ({ page, api }) => {
  api.ideaCount = 3;
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new DOMException('Clipboard permission denied', 'NotAllowedError')) },
    });
  });
  await openStudio(page);
  await toMetadata(page);
  for (const language of ['ko', 'ja', 'zh-TW', 'zh-CN', 'th']) {
    await page.getByTestId(`meta-lang-${language}`).click();
  }
  api.emptyNext('metadata');
  await page.getByTestId('generate-metadata-btn').click();
  await expect(page.getByTestId('generate-metadata-btn')).toBeVisible();
  await expect(page.getByTestId('select-meta-creative')).toHaveCount(0);
  await page.getByTestId('generate-metadata-btn').click();
  await expect(page.getByTestId('select-meta-creative')).toHaveCount(1);
  await page.clock.install();
  await page.getByTestId('copy-tags-btn').first().click();
  await page.clock.fastForward(2_001);
  await expect(page.getByTestId('copy-tags-btn').first()).toContainText('Copy');
  await page.getByTestId('select-meta-utility').click();
  await expect(page.getByTestId('select-meta-utility')).toContainText('Selected');
  await page.getByTestId('continue-to-export-btn').click();
  await expect(page.getByTestId('export-selected-btn')).toBeEnabled();
});

test('every selected platform downloads a ZIP with the specified image dimensions and metadata', async ({ page, api }) => {
  api.ideaCount = 3;
  await openStudio(page);
  await toMetadata(page);
  for (const language of ['ko', 'ja', 'zh-TW', 'zh-CN', 'th']) {
    await page.getByTestId(`meta-lang-${language}`).click();
  }
  await page.getByTestId('generate-metadata-btn').click();
  await expect(page.getByTestId('select-meta-creative')).toHaveCount(1);
  await page.getByTestId('continue-to-export-btn').click();
  await page.getByRole('button', { name: 'Deselect All', exact: true }).click();
  await expect(page.getByTestId('export-combined-btn')).toBeDisabled();
  await page.getByRole('button', { name: 'Select All', exact: true }).click();
  const downloads: Download[] = [];
  page.on('download', (download) => downloads.push(download));
  await page.getByTestId('export-selected-btn').click();
  await expect.poll(() => downloads.length).toBe(6);
  await expect(page.getByTestId('export-selected-btn')).toBeEnabled();

  const dimensions: Record<string, [number, number]> = {
    ogq_sticker: [740, 640], line_sticker: [370, 320], line_emoji: [180, 180],
    kakaotalk_emoticon: [360, 360], kakaotalk_mini: [180, 180], telegram_static: [512, 512],
  };
  for (const download of downloads) {
    const platformId = download.suggestedFilename().replace(/_\d+\.zip$/, '');
    expect(dimensions[platformId]).toBeDefined();
    const zip = await JSZip.loadAsync(await readFile((await download.path())!));
    const stickerNames = Object.keys(zip.files).filter((name) => /^\d+\.png$/.test(name));
    expect(stickerNames).toHaveLength(3);
    for (const name of stickerNames) {
      const data = await zip.file(name)!.async('nodebuffer');
      expect([data.readUInt32BE(16), data.readUInt32BE(20)]).toEqual(dimensions[platformId]);
    }
    expect(zip.file('tab.png')).not.toBeNull();
    expect(Boolean(zip.file('main.png'))).toBe(['ogq_sticker', 'line_sticker'].includes(platformId));
    const metadata = JSON.parse(await zip.file('metadata.json')!.async('string'));
    expect(metadata).toHaveLength(1);
    expect(metadata[0]).toMatchObject({ language: 'en', optionType: 'creative' });
  }
});
