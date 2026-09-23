import type { Page, TestInfo } from '@playwright/test';
import { test, expect, openStudio, submitConcept, PNG } from './support/fixtures';

test('mandatory setup keeps keyboard focus inside the dialog and settings restores focus on Escape', async ({ page, api }) => {
  await page.addInitScript(() => localStorage.setItem('i18nextLng', 'en'));
  await page.goto('/');
  const input = page.getByTestId('api-key-input');
  const save = page.getByTestId('save-api-key-btn');
  const modal = page.getByTestId('api-key-modal');
  await expect(input).toBeFocused();
  await input.press('Escape');
  await expect(modal).toBeVisible();
  await expect(input).toBeFocused();
  await input.press('Shift+Tab');
  await expect(save).toBeFocused();
  await save.press('Tab');
  await expect(input).toBeFocused();
  await input.fill('AIza-accessibility-fake-key-no-real-service');
  await input.press('Enter');
  await expect(page.getByTestId('concept-textarea')).toBeVisible();
  expect(api.calls.filter((call) => call.kind === 'validate')).toHaveLength(1);

  const settings = page.getByTestId('settings-btn');
  await settings.click();
  await expect(input).toBeFocused();
  await input.press('Shift+Tab');
  const close = page.getByTestId('close-modal-btn');
  await expect(close).toBeFocused();
  await close.press('Shift+Tab');
  await expect(save).toBeFocused();
  await save.press('Tab');
  await expect(close).toBeFocused();
  await close.press('Escape');
  await expect(modal).toHaveCount(0);
  await expect(settings).toBeFocused();
  expect(await page.locator('body').evaluate((body) => body.style.overflow)).toBe('');
});

test('keyboard skip link moves focus directly to the workspace', async ({ page, api }) => {
  await openStudio(page);
  await page.reload();
  await expect(page.getByTestId('concept-textarea')).toBeVisible();
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to workspace', exact: true });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await skip.press('Enter');
  await expect(page.locator('#studio-content')).toBeFocused();
  expect(api.calls.filter((call) => call.kind === 'validate')).toHaveLength(1);
});

test('keyboard focus remains in the modal while the focused Save action becomes disabled', async ({ page, api }) => {
  api.delayMs = 2_000;
  await page.addInitScript(() => localStorage.setItem('i18nextLng', 'en'));
  await page.goto('/');
  const modal = page.getByTestId('api-key-modal');
  const input = page.getByTestId('api-key-input');
  const save = page.getByTestId('save-api-key-btn');
  await expect(input).toBeFocused();
  await input.fill('AIza-delayed-keyboard-validation-test-key');
  await input.press('Shift+Tab');
  await expect(save).toBeFocused();
  await save.press('Space');
  await expect(save).toBeDisabled();
  await expect(input).toBeFocused();
  for (const key of ['Tab', 'Tab', 'Tab', 'Shift+Tab', 'Shift+Tab', 'Shift+Tab']) {
    await page.keyboard.press(key);
    expect(await modal.evaluate((dialog) => dialog.contains(document.activeElement))).toBe(true);
    await expect(save).toBeDisabled();
  }
  await expect(page.getByTestId('concept-textarea')).toBeVisible();
  expect(api.calls.filter((call) => call.kind === 'validate')).toHaveLength(1);
});

test('short 320 by 260 viewport keeps the modal header and close action reachable', async ({ page, api }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 260 });
  await page.addInitScript(() => localStorage.setItem('i18nextLng', 'en'));
  await page.goto('/');
  const modal = page.getByTestId('api-key-modal');
  const heading = modal.getByRole('heading');
  const input = page.getByTestId('api-key-input');
  const save = page.getByTestId('save-api-key-btn');
  await expect(input).toBeFocused();
  await expect(heading).toBeInViewport({ ratio: 1 });
  await input.fill('AIza-short-viewport-test-key');
  await save.scrollIntoViewIfNeeded();
  await expect(save).toBeInViewport({ ratio: 1 });
  await save.click();
  await expect(page.getByTestId('concept-textarea')).toBeVisible();
  await page.getByTestId('settings-btn').click();
  await expect(heading).toBeInViewport({ ratio: 1 });
  const close = page.getByTestId('close-modal-btn');
  await expect(close).toBeInViewport({ ratio: 1 });
  await page.screenshot({ path: testInfo.outputPath('short-viewport-settings.png') });
  await save.scrollIntoViewIfNeeded();
  await expect(save).toBeInViewport({ ratio: 1 });
  await close.scrollIntoViewIfNeeded();
  await close.click();
  await expect(modal).toHaveCount(0);
  await expect(page.getByTestId('settings-btn')).toBeFocused();
  expect(api.calls.filter((call) => call.kind === 'validate')).toHaveLength(1);
});

test('reduced motion preference suppresses decorative transitions and loading animation', async ({ page, api }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openStudio(page);
  const duration = await page.getByTestId('analyze-btn').evaluate((button) => getComputedStyle(button).transitionDuration);
  expect(parseFloat(duration)).toBeLessThanOrEqual(0.00001);
  api.delayMs = 250;
  await submitConcept(page);
  const loading = page.locator('section[data-stage="strategy"][data-phase="loading"]');
  await expect(loading).toBeVisible();
  const animationDurations = await loading.locator('*').evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).animationDuration));
  expect(animationDurations.length).toBeGreaterThan(0);
  for (const value of animationDurations) expect(parseFloat(value)).toBeLessThanOrEqual(0.00001);
  await expect(page.locator('section[data-stage="strategy"][data-phase="complete"]')).toBeVisible();
});

test('completed input retains the uploaded reference preview and market on return', async ({ page, api }) => {
  await openStudio(page);
  await page.getByTestId('reference-image-input').setInputFiles({
    name: 'saved-reference.png', mimeType: 'image/png', buffer: Buffer.from(PNG, 'base64'),
  });
  await submitConcept(page, 'japanese');
  await expect(page.locator('section[data-stage="strategy"][data-phase="complete"]')).toBeVisible();
  await page.getByTestId('stage-step-input').click();
  await expect(page.getByTestId('reference-preview')).toBeVisible();
  await expect(page.getByTestId('lang-japanese')).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByTestId('concept-textarea')).toHaveValue('A friendly blue bear celebrating everyday life');
  expect(api.calls.filter((call) => call.kind === 'strategy')).toHaveLength(1);
});

function contrastRatio(foreground: string, background: string) {
  const luminance = (color: string) => {
    const [r, g, b] = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map((value) => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  };
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0]! + 0.05) / (values[1]! + 0.05);
}

test('primary action and explanatory text meet normal text contrast requirements', async ({ page, api }) => {
  await openStudio(page);
  await page.getByTestId('concept-textarea').fill('A friendly blue bear');
  const primary = await page.getByTestId('analyze-btn').evaluate((button) => {
    const style = getComputedStyle(button);
    return { color: style.color, background: style.backgroundColor };
  });
  const description = await page.locator('section[data-stage="input"] > div').first().locator('p').evaluate((paragraph) => ({
    color: getComputedStyle(paragraph).color,
    background: getComputedStyle(document.body).backgroundColor,
  }));
  expect(contrastRatio(primary.color, primary.background)).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(description.color, description.background)).toBeGreaterThanOrEqual(4.5);
  expect(api.calls.filter((call) => call.kind === 'validate')).toHaveLength(1);
});

async function verifyResponsiveStage(page: Page, stage: string, language: string, testInfo: TestInfo) {
  for (const width of [320, 390, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator(`section[data-stage="${stage}"]`)).toBeVisible();
    const geometry = await page.evaluate(() => ({ width: window.innerWidth, content: document.documentElement.scrollWidth }));
    expect(geometry.content, `${language}, ${stage}, ${width}px horizontal overflow`).toBeLessThanOrEqual(geometry.width);
    const text = await page.locator('body').innerText();
    const labels = await page.locator('[aria-label], img[alt]').evaluateAll((elements) => elements.map((element) => element.getAttribute('aria-label') ?? element.getAttribute('alt')).join('\n'));
    expect(`${text}\n${labels}`).not.toMatch(/\b(?:app|stepper|studio|input|strategy|character|stickers|postprocess|metadata|export|setup|language|a11y|personas|platforms)\.[A-Za-z]\w*/);
    expect(`${text}\n${labels}`).not.toMatch(/{{\s*\w+\s*}}/);
    await expect(page.locator('html')).toHaveAttribute('lang', language.replace(/-results$/, ''));
    if (width === 390 || width === 1024) {
      await page.screenshot({ path: testInfo.outputPath(`${language}-${width}-${stage}.png`), fullPage: true });
    }
  }
}

for (const [language, market] of [
  ['en', 'english'], ['ko', 'korean'], ['ja', 'japanese'],
  ['zh-TW', 'traditional-chinese'], ['zh-CN', 'simplified-chinese'],
] as const) {
  test(`redesigned ${language} workflow fits 320, 390, 768 and 1024 pixel viewports`, async ({ page, api }, testInfo) => {
    api.ideaCount = 3;
    await openStudio(page, language);
    await verifyResponsiveStage(page, 'input', language, testInfo);
    await submitConcept(page, market);
    await expect(page.locator('section[data-stage="strategy"][data-phase="complete"]')).toBeVisible();
    await verifyResponsiveStage(page, 'strategy', language, testInfo);
    await page.getByTestId('continue-btn').click();
    await expect(page.locator('section[data-stage="character"][data-phase="complete"]')).toBeVisible();
    await page.getByTestId('toggle-spec-btn').click();
    await verifyResponsiveStage(page, 'character', language, testInfo);
    await page.getByTestId('continue-btn').click();
    await expect(page.locator('section[data-stage="stickers"][data-phase="complete"]')).toBeVisible();
    await verifyResponsiveStage(page, 'stickers', language, testInfo);
    await page.getByTestId('edit-1').click();
    await page.setViewportSize({ width: 320, height: 900 });
    await expect(page.getByTestId('edit-prompt-1')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    await page.getByTestId('continue-btn').click();
    await expect(page.getByTestId('processing-preview')).toBeVisible();
    await page.locator('section[data-stage="postprocess"]').getByRole('switch').nth(1).click();
    await verifyResponsiveStage(page, 'postprocess', language, testInfo);
    await page.getByTestId('continue-btn').click();
    await expect(page.getByTestId('generate-metadata-btn')).toBeVisible();
    await verifyResponsiveStage(page, 'metadata', language, testInfo);
    await page.getByTestId('generate-metadata-btn').click();
    await expect(page.getByTestId('select-meta-creative')).toHaveCount(5);
    await verifyResponsiveStage(page, 'metadata', `${language}-results`, testInfo);
    await page.getByTestId('continue-to-export-btn').click();
    await verifyResponsiveStage(page, 'export', language, testInfo);
  });
}
