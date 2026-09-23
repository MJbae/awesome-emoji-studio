import type { Page } from '@playwright/test';
import { test, expect, submitConcept, PNG } from './support/fixtures';
import en from '../../shared/src/i18n/locales/en.json' with { type: 'json' };
import ko from '../../shared/src/i18n/locales/ko.json' with { type: 'json' };
import ja from '../../shared/src/i18n/locales/ja.json' with { type: 'json' };
import zhCN from '../../shared/src/i18n/locales/zh-CN.json' with { type: 'json' };
import zhTW from '../../shared/src/i18n/locales/zh-TW.json' with { type: 'json' };

const locales = ['en', 'ko', 'ja', 'zh-CN', 'zh-TW'] as const;
const translations = { en, ko, ja, 'zh-CN': zhCN, 'zh-TW': zhTW };
const markets = { en: 'english', ko: 'korean', ja: 'japanese', 'zh-CN': 'simplified-chinese', 'zh-TW': 'traditional-chinese' };
const missingKey = /\b(?:app|stepper|input|strategy|character|stickers|postprocess|fileUpload|selectionGrid|metadata|export|setup|studio|language|a11y|personas|platforms)\.[A-Za-z][\w.-]*/;

async function browserPreferences(page: Page, preferences: string[], saved?: string, fallback = 'en-US') {
  await page.addInitScript(({ preferences, saved, fallback }) => {
    Object.defineProperties(navigator, {
      languages: { configurable: true, get: () => preferences },
      language: { configurable: true, get: () => fallback },
    });
    if (saved !== undefined) localStorage.setItem('i18nextLng', saved);
  }, { preferences, saved, fallback });
}

const detectionCases = [
  { name: 'English regional preference', preferences: ['en-GB'], expected: 'en' },
  { name: 'Korean regional preference', preferences: ['ko-KR', 'en-US'], expected: 'ko' },
  { name: 'Japanese regional preference', preferences: ['ja-JP', 'ko-KR'], expected: 'ja' },
  { name: 'mainland Chinese region', preferences: ['zh-CN'], expected: 'zh-CN' },
  { name: 'Singapore Chinese region', preferences: ['zh-SG'], expected: 'zh-CN' },
  { name: 'bare Chinese preference', preferences: ['zh'], expected: 'zh-CN' },
  { name: 'Taiwan Chinese region', preferences: ['zh-TW'], expected: 'zh-TW' },
  { name: 'Hong Kong Chinese region', preferences: ['zh-HK'], expected: 'zh-TW' },
  { name: 'Macao Chinese region', preferences: ['zh-MO'], expected: 'zh-TW' },
  { name: 'traditional script overrides mainland region', preferences: ['zh-Hant-CN'], expected: 'zh-TW' },
  { name: 'simplified script overrides Taiwan region', preferences: ['zh-Hans-TW'], expected: 'zh-CN' },
  { name: 'first supported browser preference', preferences: ['fr-FR', 'ja-JP', 'ko-KR'], expected: 'ja' },
  { name: 'unsupported languages fall back to English', preferences: ['fr-FR', 'de-DE', 'th-TH'], expected: 'en' },
  { name: 'invalid browser preference is skipped', preferences: ['not a locale', 'ko_KR'], expected: 'ko' },
  { name: 'empty languages uses navigator.language', preferences: [], fallback: 'ja-JP', expected: 'ja' },
  { name: 'saved manual choice wins over browser preference', preferences: ['ko-KR'], saved: 'ja', expected: 'ja' },
  { name: 'saved regional locale is normalized', preferences: ['en-US'], saved: 'zh_HK', expected: 'zh-TW' },
  { name: 'legacy Thai setting falls back to browser preference', preferences: ['ko-KR'], saved: 'th', expected: 'ko' },
  { name: 'unsupported saved setting falls back to English', preferences: ['fr-FR'], saved: 'xx', expected: 'en' },
] as const;

for (const scenario of detectionCases) {
  test(`language detection: ${scenario.name}`, async ({ page, api }) => {
    const saved = 'saved' in scenario ? scenario.saved : undefined;
    const fallback = 'fallback' in scenario ? scenario.fallback : undefined;
    await browserPreferences(page, [...scenario.preferences], saved, fallback);
    await page.goto('/');
    await expect(page.getByTestId('api-key-modal')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', scenario.expected);
    await expect(page.getByTestId('setup-language-select')).toHaveValue(scenario.expected);
    await expect(page.getByTestId('language-select')).toHaveValue(scenario.expected);
    await expect(page.getByTestId('setup-language-select').locator('option')).toHaveCount(5);
    expect(await page.getByTestId('setup-language-select').locator('option').evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value))).toEqual(locales);
    if (saved === undefined) expect(await page.evaluate(() => localStorage.getItem('i18nextLng'))).toBeNull();
    expect(api.calls).toHaveLength(0);
  });
}

for (const locale of locales) {
  test(`${locale} setup and input have translated visible and accessible labels`, async ({ page, api }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await browserPreferences(page, [locale]);
    await page.goto('/');
    const copy = translations[locale];
    await expect(page.getByTestId('api-key-modal')).toHaveAccessibleName(copy.setup.apiTitle);
    await expect(page.getByTestId('setup-language-select')).toHaveAccessibleName(copy.language.interface);
    await expect(page.getByTestId('api-key-input')).toHaveAccessibleName(copy.setup.apiKeyLabel);
    await expect(page.getByTestId('toggle-key-visibility')).toHaveAccessibleName(copy.setup.showKey);
    await page.getByTestId('toggle-key-visibility').click();
    await expect(page.getByTestId('toggle-key-visibility')).toHaveAccessibleName(copy.setup.hideKey);
    await page.getByTestId('save-api-key-btn').click();
    await expect(page.getByRole('alert')).toHaveText(copy.setup.minError);
    await page.getByTestId('api-key-input').fill('AIza-locale-mock-api-key');
    await page.getByTestId('save-api-key-btn').click();
    await expect(page.getByTestId('api-key-modal')).toHaveCount(0);
    await expect(page.getByTestId(`lang-${markets[locale]}`)).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('[data-stage="input"] h2')).toHaveText(copy.input.title);
    await expect(page.getByTestId('concept-textarea')).toHaveAccessibleName(copy.a11y.concept);
    await expect(page.getByTestId('analyze-btn')).toHaveAccessibleName(copy.a11y.analyze);
    await expect(page.getByTestId('settings-btn')).toHaveAccessibleName(copy.a11y.settings);
    await expect(page.getByTestId('language-select')).toHaveAccessibleName(copy.language.interface);
    const text = await page.locator('body').innerText();
    const labels = await page.locator('[aria-label], img[alt]').evaluateAll((elements) => elements.map((element) => element.getAttribute('aria-label') ?? element.getAttribute('alt')).join('\n'));
    expect(`${text}\n${labels}`).not.toMatch(missingKey);
    expect(`${text}\n${labels}`).not.toMatch(/{{\s*\w+\s*}}/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await page.screenshot({ path: testInfo.outputPath(`${locale}-mobile-input.png`), fullPage: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({ path: testInfo.outputPath(`${locale}-desktop-input.png`), fullPage: true });
    expect(api.calls.filter((call) => call.kind === 'validate')).toHaveLength(1);
  });
}

test('language can be selected before API setup and remains selected after a reload', async ({ page, api }) => {
  await browserPreferences(page, ['en-US']);
  await page.goto('/');
  await page.getByTestId('api-key-input').fill('unfinished-secret-value');
  for (const locale of locales) {
    await page.getByTestId('setup-language-select').selectOption(locale);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.getByTestId('api-key-input')).toHaveValue('unfinished-secret-value');
    await expect(page.getByTestId('language-select')).toHaveValue(locale);
    expect(await page.evaluate(() => localStorage.getItem('i18nextLng'))).toBe(locale);
  }
  await page.reload();
  await expect(page.getByTestId('setup-language-select')).toHaveValue('zh-TW');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-TW');
  expect(api.calls).toHaveLength(0);
});

test('an existing API validation error immediately follows the selected interface language', async ({ page, api }) => {
  await browserPreferences(page, ['en-US']);
  await page.goto('/');
  await page.getByTestId('save-api-key-btn').click();
  await expect(page.getByRole('alert')).toHaveText(en.setup.minError);
  await page.getByTestId('setup-language-select').selectOption('ko');
  await expect(page.getByRole('alert')).toHaveText(ko.setup.minError);
  await page.getByTestId('api-key-input').fill('AIza-invalid-mocked-api-key');
  api.failNext('validate', 1);
  await page.getByTestId('save-api-key-btn').click();
  await expect(page.getByRole('alert')).toHaveText(ko.setup.invalidError);
  for (const locale of locales) {
    await page.getByTestId('setup-language-select').selectOption(locale);
    await expect(page.getByRole('alert')).toHaveText(translations[locale].setup.invalidError);
    await expect(page.getByTestId('api-key-input')).toHaveValue('AIza-invalid-mocked-api-key');
  }
  expect(api.calls.filter((call) => call.kind === 'validate')).toHaveLength(1);
});

test('manual language switching preserves the concept, upload, chosen market and active stage', async ({ page, api }) => {
  api.ideaCount = 3;
  await browserPreferences(page, ['en-US']);
  await page.goto('/');
  await page.getByTestId('api-key-input').fill('AIza-language-persistence-mock-key');
  await page.getByTestId('save-api-key-btn').click();
  const concept = 'Keep this exact blue bear concept';
  await page.getByTestId('concept-textarea').fill(concept);
  await page.getByTestId('lang-japanese').click();
  await page.getByTestId('reference-image-input').setInputFiles({ name: 'bear.png', mimeType: 'image/png', buffer: Buffer.from(PNG, 'base64') });
  await page.getByTestId('skip-chargen-toggle').click();
  let reloads = 0;
  page.on('framenavigated', (frame) => { if (frame === page.mainFrame()) reloads++; });
  for (const locale of locales) {
    await page.getByTestId('language-select').selectOption(locale);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.getByTestId('concept-textarea')).toHaveValue(concept);
    await expect(page.getByTestId('lang-japanese')).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByTestId('skip-chargen-toggle')).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByTestId('reference-preview')).toHaveAttribute('src', `data:image/png;base64,${PNG}`);
  }
  await page.getByTestId('skip-chargen-toggle').click();
  await page.getByTestId('analyze-btn').click();
  await expect(page.locator('[data-stage="strategy"][data-phase="complete"]')).toBeVisible();
  const analysisCalls = api.calls.length;
  await page.getByTestId('language-select').selectOption('ko');
  await expect(page.locator('[data-stage="strategy"][data-phase="complete"]')).toBeVisible();
  await expect(page.getByTestId('persona-0')).toContainText(ko.personas.market);
  expect(api.calls).toHaveLength(analysisCalls);
  await page.getByTestId('continue-btn').click();
  await expect(page.getByTestId('generated-character')).toBeVisible();
  const characterSrc = await page.getByTestId('generated-character').getAttribute('src');
  await page.getByTestId('language-select').selectOption('ja');
  await expect(page.getByTestId('generated-character')).toHaveAttribute('src', characterSrc!);
  await page.getByTestId('stage-step-input').click();
  await expect(page.getByTestId('concept-textarea')).toHaveValue(concept);
  await expect(page.getByTestId('lang-japanese')).toHaveAttribute('aria-checked', 'true');
  expect(reloads).toBe(0);
  await page.reload();
  await expect(page.getByTestId('language-select')).toHaveValue('ja');
  await expect(page.getByTestId('api-key-modal')).toHaveCount(0);
});

test('browser language changes update automatic selection until a manual language is saved', async ({ page, api }) => {
  await browserPreferences(page, ['en-US']);
  await page.goto('/');
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'languages', { configurable: true, value: ['ja-JP'] });
    window.dispatchEvent(new Event('languagechange'));
  });
  await expect(page.getByTestId('setup-language-select')).toHaveValue('ja');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  await page.getByTestId('setup-language-select').selectOption('ko');
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'languages', { configurable: true, value: ['zh-TW'] });
    window.dispatchEvent(new Event('languagechange'));
  });
  await expect(page.getByTestId('setup-language-select')).toHaveValue('ko');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  expect(api.calls).toHaveLength(0);
});

test('restricted locale storage preserves a manual session language after browser language changes', async ({ page, api }) => {
  await browserPreferences(page, ['ko-KR']);
  await page.addInitScript(() => {
    const getItem = Storage.prototype.getItem;
    const setItem = Storage.prototype.setItem;
    Storage.prototype.getItem = function (key) {
      if (key === 'i18nextLng') throw new DOMException('Storage denied', 'SecurityError');
      return getItem.call(this, key);
    };
    Storage.prototype.setItem = function (key, value) {
      if (key === 'i18nextLng') throw new DOMException('Storage denied', 'SecurityError');
      return setItem.call(this, key, value);
    };
  });
  await page.goto('/');
  await expect(page.getByTestId('setup-language-select')).toHaveValue('ko');
  await page.getByTestId('setup-language-select').selectOption('ja');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  await page.getByTestId('api-key-input').fill('short');
  await page.getByTestId('save-api-key-btn').click();
  await expect(page.getByRole('alert')).toHaveText(ja.setup.minError);
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'languages', { configurable: true, value: ['ko-KR'] });
    window.dispatchEvent(new Event('languagechange'));
  });
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  await expect(page.getByTestId('setup-language-select')).toHaveValue('ja');
  await expect(page.getByTestId('language-select')).toHaveValue('ja');
  await expect(page.getByRole('alert')).toHaveText(ja.setup.minError);
  await expect(page.getByTestId('api-key-input')).toHaveValue('short');
  await expect(page.getByTestId('api-key-modal')).toBeVisible();
  expect(api.calls).toHaveLength(0);
});

test('English count messages use singular and plural forms in the live workflow', async ({ page, api }) => {
  api.ideaCount = 1;
  await browserPreferences(page, ['en-US']);
  await page.goto('/');
  await page.getByTestId('api-key-input').fill('AIza-plurals-mock-key');
  await page.getByTestId('save-api-key-btn').click();
  await page.getByTestId('concept-textarea').fill('x');
  await expect(page.getByText('Add 2 more characters', { exact: true })).toBeVisible();
  await page.getByTestId('concept-textarea').fill('xy');
  await expect(page.getByText('Add 1 more character', { exact: true })).toBeVisible();
  await submitConcept(page, 'english');
  await expect(page.locator('[data-stage="strategy"][data-phase="complete"]')).toBeVisible();
  await page.getByTestId('continue-btn').click();
  await expect(page.getByTestId('generated-character')).toBeVisible();
  await page.getByTestId('continue-btn').click();
  await expect(page.locator('[data-job-status="done"]')).toHaveCount(1);
  await page.getByTestId('continue-btn').click();
  await expect(page.getByText('Changes will apply to 1 image.', { exact: true })).toBeVisible();
  await page.locator('[data-stage="postprocess"]').getByRole('switch').nth(1).click();
  await page.getByTestId('outline-thickness').fill('1');
  await expect(page.getByTestId('outline-thickness')).toHaveAccessibleName('Outline thickness: 1 pixel');
  await page.getByTestId('outline-thickness').fill('2');
  await expect(page.getByTestId('outline-thickness')).toHaveAccessibleName('Outline thickness: 2 pixels');
  await page.getByTestId('continue-btn').click();
  await page.getByTestId('generate-metadata-btn').click();
  await expect(page.getByTestId('select-meta-creative')).toHaveCount(5);
  await page.getByTestId('continue-to-export-btn').click();
  await page.getByTestId('deselect-all-platforms-btn').click();
  await page.getByTestId('platform-line_emoji').click();
  await expect(page.getByText('1 platform selected', { exact: true })).toBeVisible();
  await page.getByTestId('platform-line_sticker').click();
  await expect(page.getByText('2 platforms selected', { exact: true })).toBeVisible();
});
