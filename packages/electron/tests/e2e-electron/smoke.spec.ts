import { test, expect, type Page } from '@playwright/test';
import { launchApp, cleanupApp, type AppContext } from './helpers';

let ctx: AppContext;
let page: Page;

test.afterEach(async () => {
  if (ctx) {
    await cleanupApp(ctx);
  }
});

test('app launches and renders the main window', async () => {
  ctx = await launchApp();
  page = await ctx.app.firstWindow();

  const title = await page.title();
  expect(title).toContain('LINE Emoji Studio');
});

test('app shell is visible after launch', async () => {
  ctx = await launchApp();
  page = await ctx.app.firstWindow();
  await page.waitForLoadState('domcontentloaded');

  const appShell = page.getByTestId('app-shell');
  await expect(appShell).toBeVisible({ timeout: 10_000 });
});

test('API key modal or input stage is rendered on first launch', async () => {
  ctx = await launchApp();
  page = await ctx.app.firstWindow();
  await page.waitForLoadState('domcontentloaded');

  const modal = page.getByTestId('api-key-modal');
  const appShell = page.getByTestId('app-shell');

  const modalVisible = await modal.isVisible().catch(() => false);
  const shellVisible = await appShell.isVisible().catch(() => false);

  expect(modalVisible || shellVisible).toBe(true);
});
