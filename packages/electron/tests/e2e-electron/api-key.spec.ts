import { test, expect, type Page } from '@playwright/test';
import { launchApp, cleanupApp, type AppContext } from './helpers';

let ctx: AppContext;
let page: Page;

test.afterEach(async () => {
  if (ctx) {
    await cleanupApp(ctx);
  }
});

test.describe('API Key flow', () => {
  test('modal appears when no API key is stored', async () => {
    ctx = await launchApp();
    page = await ctx.app.firstWindow();
    await page.waitForLoadState('domcontentloaded');

    const modal = page.getByTestId('api-key-modal');
    await expect(modal).toBeVisible({ timeout: 15_000 });
  });

  test('save key then modal disappears and key persists across restart', async () => {
    ctx = await launchApp();
    page = await ctx.app.firstWindow();
    await page.waitForLoadState('domcontentloaded');

    const modal = page.getByTestId('api-key-modal');
    await expect(modal).toBeVisible({ timeout: 15_000 });

    const input = page.getByTestId('api-key-input');
    const testKey = 'AIzaTestKey1234567890';

    await input.fill(testKey);
    await page.getByTestId('save-api-key-btn').click();

    await expect(modal).not.toBeVisible({ timeout: 5_000 });

    await ctx.app.close();

    ctx = await launchApp(ctx.userDataDir);
    page = await ctx.app.firstWindow();
    await page.waitForLoadState('domcontentloaded');

    await page.waitForFunction(() => document.querySelector('[data-testid="app-shell"]') !== null, {
      timeout: 10_000,
    });

    const modalAfterRestart = page.getByTestId('api-key-modal');
    const isModalVisible = await modalAfterRestart.isVisible().catch(() => false);
    expect(isModalVisible).toBe(false);
  });
});
