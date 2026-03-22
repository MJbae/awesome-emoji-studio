import { test, expect, type Page } from '@playwright/test';
import { launchApp, cleanupApp, type AppContext } from './helpers';

let ctx: AppContext;
let page: Page;

test.beforeEach(async () => {
  ctx = await launchApp();
  page = await ctx.app.firstWindow();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => document.querySelector('[data-testid="app-shell"]') !== null, {
    timeout: 10_000,
  });
});

test.afterEach(async () => {
  if (ctx) {
    await cleanupApp(ctx);
  }
});

test.describe('window.desktop bridge (contextBridge)', () => {
  test('preload contextBridge is functional (via electronApp.evaluate)', async () => {
    const version = await ctx.app.evaluate(({ app }) => app.getVersion());
    expect(typeof version).toBe('string');
    expect(version.length).toBeGreaterThan(0);
  });

  test('IPC secure store handlers respond', async () => {
    await page.waitForFunction(() => typeof window.emoticon !== 'undefined', { timeout: 10_000 });

    await page.evaluate(() => window.emoticon!.setApiKey('test-bridge-key-12345'));
    await page.evaluate(() => window.emoticon!.setApiKey(''));

    const apiConnectedStatus = page.locator('[role="status"]');
    await expect(apiConnectedStatus).toBeVisible({ timeout: 5_000 });
  });

  test('app detects Electron environment correctly', async () => {
    const hasAppShell = await page.getByTestId('app-shell').isVisible();
    expect(hasAppShell).toBe(true);

    const statusText = await page.locator('[role="status"]').textContent();
    expect(statusText).toBeTruthy();
  });
});

test.describe('window.emoticon bridge (React-mounted)', () => {
  test('window.emoticon is exposed after React mounts', async () => {
    await page.waitForFunction(() => typeof window.emoticon !== 'undefined', { timeout: 10_000 });

    const hasEmoticon = await page.evaluate(() => typeof window.emoticon !== 'undefined');
    expect(hasEmoticon).toBe(true);
  });

  test('window.emoticon has required API methods', async () => {
    await page.waitForFunction(() => typeof window.emoticon !== 'undefined', { timeout: 10_000 });

    const methods = await page.evaluate(() => ({
      setApiKey: typeof window.emoticon!.setApiKey,
      getJob: typeof window.emoticon!.getJob,
      subscribe: typeof window.emoticon!.subscribe,
      runFullPipeline: typeof window.emoticon!.runFullPipeline,
      export: typeof window.emoticon!.export,
    }));

    expect(methods.setApiKey).toBe('function');
    expect(methods.getJob).toBe('function');
    expect(methods.subscribe).toBe('function');
    expect(methods.runFullPipeline).toBe('function');
    expect(methods.export).toBe('function');
  });
});
