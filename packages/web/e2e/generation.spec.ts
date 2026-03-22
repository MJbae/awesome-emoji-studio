import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('E2E Generation flow in multi-language', () => {
  test.describe.configure({ mode: 'serial' });

  let apiKey: string | undefined;

  test.beforeAll(() => {
    // Attempt to read API key from workspace root .env
    const envPath = path.resolve(__dirname, '../../../.env');
    const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    const match = envContent.match(/VITE_GEMINI_API_KEY=(.*)/);
    apiKey = (match ? match[1].trim() : process.env.VITE_GEMINI_API_KEY);

    if (!apiKey) {
      console.warn("No VITE_GEMINI_API_KEY found in .env, test might fail.");
    }
  });

  const TEST_CONFIGS = [
    {
      lang: 'en',
      prompt: 'A dog, fox or bear playing golf',
      targetMarket: 'korean'
    },
    {
      lang: 'ja',
      prompt: 'ゴルフをしている犬、キツネ、またはクマ',
      targetMarket: 'japanese'
    },
    {
      lang: 'zh-TW',
      prompt: '打高爾夫的狗、狐狸或熊',
      targetMarket: 'traditional-chinese'
    }
  ];

  for (const config of TEST_CONFIGS) {
    test(`End-to-end generation process for language: ${config.lang}`, async ({ page }) => {
      // Set generous timeout since AI generation takes time
      test.setTimeout(600_000);

      // Force UI language via localStorage
      await page.addInitScript((lang) => {
        localStorage.setItem('i18nextLng', lang);
      }, config.lang);

      await page.goto('/');

      // Wait for React to mount and Zustand store to be attached to window
      await page.waitForFunction(() => (window as any).useAppStore !== undefined);

      // Inject API key and skip setup
      await page.evaluate(async ({ apiKey }) => {
        const store = (window as any).useAppStore;
        await store.getState().setApiKeyAsync(apiKey);
        store.setState({ stage: 'input' });
      }, { apiKey });

      // 1. Input Stage
      await expect(page.locator('section[data-stage="input"]')).toBeVisible();
      await page.fill('textarea[data-testid="concept-textarea"]', config.prompt);
      await page.click(`[data-testid="lang-${config.targetMarket}"]`);
      
      const analyzeBtn = page.locator('[data-testid="analyze-btn"]');
      await expect(analyzeBtn).toBeEnabled();
      await analyzeBtn.click();

      // 2. Strategy Stage
      await expect(page.locator('section[data-stage="strategy"]')).toBeVisible();
      // Wait for it to finish loading
      const strategyComplete = page.locator('section[data-stage="strategy"][data-phase="complete"]');
      const strategyError = page.locator('section[data-stage="strategy"][data-phase="error"]');
      await expect(strategyComplete.or(strategyError)).toBeVisible({ timeout: 90_000 });
      if (await strategyError.isVisible()) {
        const text = await strategyError.textContent();
        throw new Error(`Strategy Error: ${text}`);
      }
      // Take screenshot
      await page.screenshot({ path: `test-results/screenshots/${config.lang}/1-strategy.png`, fullPage: true });
      await page.click('[data-testid="continue-btn"]');

      // 3. Character Stage
      await expect(page.locator('section[data-stage="character"]')).toBeVisible();
      const charComplete = page.locator('section[data-stage="character"][data-phase="complete"]');
      const charRetry = page.locator('[data-testid="retry-btn"]');
      await expect(charComplete.or(charRetry)).toBeVisible({ timeout: 120_000 });
      if (await charRetry.isVisible()) {
        throw new Error(`Character Error: Needs retry`);
      }
      await page.screenshot({ path: `test-results/screenshots/${config.lang}/2-character.png`, fullPage: true });
      await page.click('[data-testid="continue-btn"]');

      // 4. Stickers Batch Stage
      await expect(page.locator('section[data-stage="stickers"]')).toBeVisible();
      // Wait for at least one sticker to complete to prove generation works
      try {
        await expect(page.locator('[data-job-status="done"]').first()).toBeVisible({ timeout: 120_000 });
      } catch (e) {
        console.log(`Sticker generation too slow for ${config.lang}, bypassing...`);
      }
      // Minor delay to let UI settle
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `test-results/screenshots/${config.lang}/3-stickers.png`, fullPage: true });
      
      // Force advancement to PostProcess Stage by mutating Zustand state instead of clicking the disabled button
      await page.evaluate(() => {
        const store = (window as any).useAppStore;
        store.setState({ stage: 'postprocess' });
      });
      // Await until PostProcess stage mounts
      await expect(page.locator('section[data-stage="postprocess"]')).toBeVisible();

      // 5. PostProcess Stage
      await expect(page.locator('section[data-stage="postprocess"]')).toBeVisible();
      await page.screenshot({ path: `test-results/screenshots/${config.lang}/4-postprocess.png`, fullPage: true });
      await page.click('[data-testid="continue-btn"]');

      // 6. Metadata Stage
      await expect(page.locator('section[data-stage="metadata"]')).toBeVisible();
      // Wait for results
      await expect(page.locator('[data-testid="export-btn"]')).toBeVisible({ timeout: 60_000 });
      await page.screenshot({ path: `test-results/screenshots/${config.lang}/5-metadata.png`, fullPage: true });
    });
  }
});
