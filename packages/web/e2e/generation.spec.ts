import { test, expect, openStudio, submitConcept, toStickers, PNG } from './support/fixtures';
import JSZip from 'jszip';
import { readFile } from 'node:fs/promises';

test('complete generation, editing, processing, metadata and downloadable ZIP', async ({ page, api }, testInfo) => {
  api.ideaCount = 45;
  await page.clock.install();
  await openStudio(page);
  await expect(page.getByTestId('stage-step-export')).toBeDisabled();
  await submitConcept(page);
  await expect(page.locator('[data-stage="strategy"][data-phase="complete"]')).toBeVisible();
  for (let index = 0; index < 3; index++) {
    const insight = page.getByTestId(`persona-${index}`);
    await insight.click();
    await expect(insight).toHaveAttribute('aria-expanded', 'true');
    await insight.click();
  }
  const accordions = page.locator('section[data-stage="strategy"] button[aria-expanded]').filter({ hasNot: page.locator('[data-testid^="persona-"]') });
  for (const accordion of await accordions.all()) { await accordion.click(); await accordion.click(); }
  await page.screenshot({ path: testInfo.outputPath('strategy.png'), fullPage: true });
  await page.getByTestId('continue-btn').click();
  await expect(page.locator('[data-stage="character"][data-phase="complete"]')).toBeVisible();
  await page.getByTestId('toggle-spec-btn').click();
  await expect(page.getByText('Round blue bear', { exact: true })).toBeVisible();
  await page.getByTestId('toggle-spec-btn').click();
  const beforeRegenerate = api.calls.filter((call) => call.kind === 'character').length;
  await page.getByTestId('regenerate-btn').click();
  await expect(page.locator('[data-stage="character"][data-phase="complete"]')).toBeVisible();
  expect(api.calls.filter((call) => call.kind === 'character').length).toBeGreaterThan(beforeRegenerate);
  await page.getByTestId('continue-btn').click();
  for (let completed = 3; completed <= 45; completed += 3) {
    await expect(page.locator('[data-job-status="done"]')).toHaveCount(completed);
    if (completed < 45) await page.clock.fastForward(10_001);
  }
  await expect(page.getByTestId('continue-btn')).toBeEnabled();
  await expect(page.getByRole('progressbar', { name: 'Emoji generation progress' })).toHaveAttribute('aria-valuenow', '45');
  await page.getByTestId('edit-1').click();
  await page.getByTestId('edit-prompt-1').fill('A blue bear jumping with a party hat');
  await page.getByRole('button', { name: 'Save and regenerate', exact: true }).click();
  await expect(page.locator('[data-job-status="done"]')).toHaveCount(45);
  expect(JSON.stringify(api.calls.at(-1)?.body)).toContain('party hat');
  await page.getByTestId('edit-1').click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByTestId('edit-prompt-1')).toHaveCount(0);
  await page.getByTestId('regen-2').click();
  await expect(page.locator('[data-job-status="done"]')).toHaveCount(45);
  await page.getByTestId('continue-btn').click();
  await expect(page.getByRole('img', { name: 'Processing preview', exact: true })).toBeVisible();
  await page.getByRole('radio', { name: 'Black background', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Black background', exact: true })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('radio', { name: 'White background', exact: true }).click();
  const switches = page.locator('section[data-stage="postprocess"]').getByRole('switch');
  await switches.nth(0).click(); // Background removal off
  await switches.nth(1).click(); // Outline on
  await page.getByTestId('outline-style-black').click();
  await page.getByRole('slider', { name: /Outline thickness/ }).fill('7');
  await page.getByRole('slider', { name: /Outline opacity/ }).fill('60');
  await expect(page.getByRole('slider', { name: /Outline thickness/ })).toHaveValue('7');
  await page.getByTestId('outline-style-white').click();
  await page.getByTestId('continue-btn').click();
  await expect(page.locator('section[data-stage="metadata"]')).toBeVisible();
  await page.getByTestId('generate-metadata-btn').click();
  await expect(page.getByTestId('select-meta-creative')).toHaveCount(6);
  await page.getByTestId('select-meta-creative').first().click();
  await page.getByTestId('select-meta-personality').first().click();
  await page.getByTestId('copy-tags-btn').first().click();
  await expect(page.getByTestId('copy-tags-btn').first()).toContainText('Copied');
  await page.getByTestId('regenerate-metadata-btn').click();
  await expect(page.getByTestId('select-meta-creative')).toHaveCount(6);
  await page.getByTestId('continue-to-export-btn').click();
  await expect(page.locator('section[data-stage="export"]')).toBeVisible();
  await page.getByRole('button', { name: 'Deselect All', exact: true }).click();
  await expect(page.getByTestId('export-selected-btn')).toBeDisabled();
  await page.getByRole('button', { name: 'Select All', exact: true }).click();
  await page.getByRole('button', { name: 'Deselect All', exact: true }).click();
  await page.getByRole('button', { name: /^LINE Emoji/ }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('export-selected-btn').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.zip$/);
  const zip = await JSZip.loadAsync(await readFile((await download.path())!));
  expect(Object.keys(zip.files).some((name) => name.endsWith('.png'))).toBe(true);
  expect(Object.keys(zip.files).some((name) => /metadata/i.test(name))).toBe(true);
  await expect(page.getByTestId('export-selected-btn')).toBeEnabled();
  const combinedPromise = page.waitForEvent('download');
  await page.getByTestId('export-combined-btn').click();
  const combined = await combinedPromise;
  expect(combined.suggestedFilename()).toMatch(/^emoji_studio_combined_\d+\.zip$/);
  const combinedZip = await JSZip.loadAsync(await readFile((await combined.path())!));
  expect(Object.keys(combinedZip.files).some((name) => name.startsWith('line_emoji/') && name.endsWith('.png'))).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('export.png'), fullPage: true });
  await page.getByTestId('back-btn').click();
  await expect(page.locator('section[data-stage="metadata"]')).toBeVisible();
  await page.getByTestId('stage-step-input').click();
  await expect(page.getByTestId('concept-textarea')).toHaveValue('A friendly blue bear celebrating everyday life');
});

test('API setup validates, hides secrets, retries and persists settings', async ({ page, api }) => {
  await page.addInitScript(() => localStorage.setItem('i18nextLng', 'en'));
  await page.goto('/');
  await expect(page.getByTestId('api-key-modal')).toBeVisible();
  await expect(page.getByTestId('close-modal-btn')).toHaveCount(0);
  await page.getByTestId('save-api-key-btn').click();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByTestId('api-key-input').fill('short');
  await page.getByTestId('api-key-input').press('Enter');
  expect(api.calls).toHaveLength(0);
  await page.getByTestId('toggle-key-visibility').click();
  await expect(page.getByTestId('api-key-input')).toHaveAttribute('type', 'text');
  await page.getByTestId('toggle-key-visibility').click();
  await expect(page.getByTestId('api-key-input')).toHaveAttribute('type', 'password');
  api.failNext('validate', 1);
  await page.getByTestId('api-key-input').fill('invalid-example-api-key');
  await page.getByTestId('save-api-key-btn').click();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByTestId('api-key-input').fill('AIza-e2e-public-fake-key-no-real-service');
  await page.getByTestId('api-key-input').press('Enter');
  await expect(page.locator('section[data-stage="input"]')).toBeVisible();
  await page.getByTestId('settings-btn').click();
  await expect(page.getByTestId('close-modal-btn')).toBeVisible();
  await page.getByTestId('close-modal-btn').click();
  await page.reload();
  await expect(page.locator('section[data-stage="input"]')).toBeVisible();
  await expect(page.getByTestId('api-key-modal')).toHaveCount(0);
});

test('concept constraints, all markets, reference upload and direct base character', async ({ page, api }) => {
  await openStudio(page);
  await expect(page.getByTestId('analyze-btn')).toBeDisabled();
  await page.getByTestId('concept-textarea').fill('  ');
  await expect(page.getByTestId('analyze-btn')).toBeDisabled();
  await page.getByTestId('concept-textarea').fill('Blue bear');
  for (const market of ['japanese', 'traditional-chinese', 'simplified-chinese', 'thai', 'korean']) {
    await page.getByTestId(`lang-${market}`).click();
    await expect(page.getByTestId(`lang-${market}`)).toHaveAttribute('aria-checked', 'true');
  }
  await expect(page.getByTestId('skip-chargen-toggle')).toBeDisabled();
  await page.getByTestId('reference-image-input').setInputFiles({ name: 'reference.png', mimeType: 'image/png', buffer: Buffer.from(PNG, 'base64') });
  await expect(page.getByRole('img', { name: 'Reference preview' })).toBeVisible();
  await page.getByTestId('skip-chargen-toggle').click();
  await expect(page.getByTestId('skip-chargen-toggle')).toHaveAttribute('aria-checked', 'true');
  await page.getByTestId('skip-chargen-toggle').click();
  await page.getByTestId('skip-chargen-toggle').click();
  await page.getByTestId('analyze-btn').click();
  await expect(page.locator('[data-stage="strategy"][data-phase="complete"]')).toBeVisible();
  await page.getByTestId('continue-btn').click();
  await expect(page.locator('[data-stage="stickers"][data-phase="complete"]')).toBeVisible();
  expect(api.calls.filter((call) => call.kind === 'character')).toHaveLength(0);
  expect(api.calls.filter((call) => call.kind === 'spec')).toHaveLength(1);
});

test('analysis transport error and empty response recover through retry and back', async ({ page, api }) => {
  await openStudio(page);
  api.failNext('analysis');
  await submitConcept(page);
  await expect(page.locator('[data-stage="strategy"][data-phase="error"]')).toBeVisible();
  await page.getByTestId('back-btn').click();
  await expect(page.getByTestId('concept-textarea')).toHaveValue(/blue bear/);
  await page.getByTestId('analyze-btn').click();
  api.emptyNext('analysis');
  await page.getByTestId('retry-btn').click();
  await expect(page.getByRole('alert')).toContainText('No response');
  await page.getByTestId('retry-btn').click();
  await expect(page.locator('[data-stage="strategy"][data-phase="complete"]')).toBeVisible();
});

test('character service failure retries and image fallback succeeds', async ({ page, api }) => {
  await openStudio(page);
  await submitConcept(page);
  await expect(page.locator('[data-stage="strategy"][data-phase="complete"]')).toBeVisible();
  api.failNext('character');
  await page.getByTestId('continue-btn').click();
  await expect(page.getByTestId('retry-btn')).toBeVisible();
  await expect(page.getByTestId('continue-btn')).toBeDisabled();
  api.failNext('character', 1);
  await page.getByTestId('retry-btn').click();
  await expect(page.locator('[data-stage="character"][data-phase="complete"]')).toBeVisible();
  await page.getByTestId('back-btn').click();
  await expect(page.locator('[data-stage="strategy"][data-phase="complete"]')).toBeVisible();
});

test('failed stickers can be retried, regenerated and edited after an error', async ({ page, api }) => {
  await openStudio(page);
  api.failNext('sticker', 10);
  await toStickers(page);
  await expect(page.locator('[data-job-status="error"]')).toHaveCount(5);
  await page.getByTestId('retry-1').click();
  await expect(page.getByTestId('regen-1')).toBeVisible();
  api.failNext('sticker');
  await page.getByTestId('regen-1').click();
  await expect(page.getByTestId('retry-1')).toBeVisible();
  await page.getByTestId('retry-1').click();
  await expect(page.getByTestId('edit-1')).toBeVisible();
  await page.getByTestId('edit-1').click();
  api.failNext('sticker');
  await page.getByRole('button', { name: 'Save and regenerate', exact: true }).click();
  await expect(page.getByTestId('retry-1')).toBeVisible();
  await page.getByTestId('retry-1').click();
  await expect(page.getByTestId('regen-1')).toBeVisible();
  await page.getByTestId('continue-btn').click();
  await expect(page.locator('section[data-stage="postprocess"]')).toBeVisible();
  await page.getByTestId('back-btn').click();
  await expect(page.locator('section[data-stage="stickers"]')).toBeVisible();
});

test('metadata language selection, service recovery, back navigation and no processing effects', async ({ page, api }) => {
  await openStudio(page);
  await toStickers(page);
  await page.getByTestId('continue-btn').click();
  await page.locator('section[data-stage="postprocess"]').getByRole('switch').nth(0).click();
  await page.getByTestId('continue-btn').click();
  for (const language of ['en', 'ko', 'ja', 'zh-TW', 'zh-CN', 'th']) await page.getByTestId(`meta-lang-${language}`).click();
  await expect(page.getByTestId('generate-metadata-btn')).toBeDisabled();
  await page.getByTestId('meta-lang-en').click();
  api.failNext('metadata');
  await page.getByTestId('generate-metadata-btn').click();
  await expect(page.getByTestId('generate-metadata-btn')).toBeVisible();
  await page.getByTestId('back-btn').click();
  await expect(page.locator('section[data-stage="postprocess"]')).toBeVisible();
  await page.getByTestId('continue-btn').click();
  await page.getByTestId('generate-metadata-btn').click();
  await expect(page.getByTestId('select-meta-creative')).toHaveCount(1);
});
