import { test, expect, openStudio, submitConcept, toMetadata } from './support/fixtures';
import { readFile } from 'node:fs/promises';
import JSZip from 'jszip';

test('settings can validate and persist a replacement key without resetting the active concept', async ({ page, api }) => {
  await openStudio(page);
  await page.getByTestId('concept-textarea').fill('Keep this blue bear concept');
  await page.getByTestId('settings-btn').click();
  await page.getByTestId('api-key-input').fill('AIza-replacement-from-settings');
  await page.getByTestId('save-api-key-btn').click();
  await expect(page.getByTestId('api-key-modal')).toHaveCount(0);
  await expect(page.getByTestId('concept-textarea')).toHaveValue('Keep this blue bear concept');
  expect(await page.evaluate(() => localStorage.getItem('emoticon_studio_api_key'))).toBe('AIza-replacement-from-settings');
  expect(api.calls.filter((call) => call.kind === 'validate')).toHaveLength(2);
});

test('empty metadata options can be regenerated and unselected metadata is omitted from both exports', async ({ page, api }) => {
  api.ideaCount = 3;
  await openStudio(page);
  await toMetadata(page);
  for (const language of ['ko', 'ja', 'zh-TW', 'zh-CN']) await page.getByTestId(`meta-lang-${language}`).click();
  api.metadataOptions = 0;
  await page.getByTestId('generate-metadata-btn').click();
  await expect(page.getByTestId('generate-metadata-btn')).toBeVisible();
  await expect(page.getByTestId('select-meta-creative')).toHaveCount(0);
  api.metadataOptions = 3;
  await page.getByTestId('generate-metadata-btn').click();
  await expect(page.getByTestId('select-meta-creative')).toHaveCount(1);
  await page.getByTestId('select-meta-creative').click();
  await expect(page.getByTestId('select-meta-creative')).toHaveText('Select');
  await page.getByTestId('continue-to-export-btn').click();
  await page.getByTestId('deselect-all-platforms-btn').click();
  await page.getByTestId('platform-line_emoji').click();
  for (const button of ['export-selected-btn', 'export-combined-btn']) {
    const pendingDownload = page.waitForEvent('download');
    await page.getByTestId(button).click();
    const zip = await JSZip.loadAsync(await readFile((await (await pendingDownload).path())!));
    expect(Object.keys(zip.files).some((name) => name.endsWith('.png'))).toBe(true);
    expect(Object.keys(zip.files).some((name) => name.endsWith('metadata.json'))).toBe(false);
  }
});

test('corrupt generated images surface platform export failures and leave retry actions available', async ({ page, api }) => {
  api.ideaCount = 3;
  await openStudio(page);
  await submitConcept(page);
  await expect(page.locator('section[data-stage="strategy"][data-phase="complete"]')).toBeVisible();
  await page.getByTestId('continue-btn').click();
  await expect(page.locator('section[data-stage="character"][data-phase="complete"]')).toBeVisible();
  api.imageData = 'aW52YWxpZCBQTkc=';
  await page.getByTestId('continue-btn').click();
  await expect(page.locator('[data-job-status="done"]')).toHaveCount(3);
  await page.getByTestId('continue-btn').click();
  await expect(page.getByTestId('processing-preview')).toHaveCount(0);
  await page.locator('section[data-stage="postprocess"]').getByRole('switch').first().click();
  await page.getByTestId('continue-btn').click();
  for (const language of ['ko', 'ja', 'zh-TW', 'zh-CN']) await page.getByTestId(`meta-lang-${language}`).click();
  await page.getByTestId('generate-metadata-btn').click();
  await expect(page.getByTestId('select-meta-creative')).toHaveCount(1);
  await page.getByTestId('continue-to-export-btn').click();
  await page.getByTestId('deselect-all-platforms-btn').click();
  await page.getByTestId('platform-line_emoji').click();
  await page.getByTestId('export-selected-btn').click();
  await expect(page.getByText('Failed', { exact: true })).toBeVisible();
  await expect(page.getByTestId('export-selected-btn')).toBeEnabled();
  // The original combined-export behavior emits an empty ZIP when every platform fails.
  const pendingDownload = page.waitForEvent('download');
  await page.getByTestId('export-combined-btn').click();
  const zip = await JSZip.loadAsync(await readFile((await (await pendingDownload).path())!));
  expect(Object.keys(zip.files)).toHaveLength(0);
  await expect(page.getByText('Failed', { exact: true })).toBeVisible();
  await expect(page.getByTestId('back-btn')).toBeEnabled();
  await page.getByTestId('back-btn').click();
  await expect(page.locator('section[data-stage="metadata"]')).toBeVisible();
});
