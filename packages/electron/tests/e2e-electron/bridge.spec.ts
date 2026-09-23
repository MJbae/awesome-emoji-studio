import { test, expect, type Page } from '@playwright/test';
import { launchApp, cleanupApp, type AppContext } from './helpers';

let ctx: AppContext;
let page: Page;

test.beforeEach(async () => {
  ctx = await launchApp();
  page = await ctx.app.firstWindow();
  await expect(page.getByTestId('app-shell')).toBeVisible();
});

test.afterEach(async () => {
  if (ctx) await cleanupApp(ctx);
});

test('contextBridge exposes desktop methods while Node APIs remain isolated', async () => {
  const state = await page.evaluate(async () => ({
    version: await window.desktop!.app.getVersion(),
    paths: await window.desktop!.app.getPaths(),
    require: typeof (window as unknown as Record<string, unknown>).require,
    process: typeof (window as unknown as Record<string, unknown>).process,
  }));
  expect(state.version).toBe(await ctx.app.evaluate(({ app }) => app.getVersion()));
  expect(state.paths.userData).toBe(ctx.userDataDir);
  expect(state.paths.documents.length).toBeGreaterThan(0);
  expect(state.require).toBe('undefined');
  expect(state.process).toBe('undefined');
});

test('renderer API securely saves credentials through the real desktop bridge', async () => {
  await page.waitForFunction(() => !!window.emoticon);
  await page.evaluate(() => window.emoticon!.setApiKey('test-bridge-key-12345'));
  expect(await page.evaluate(() => window.desktop!.secure.getApiKey())).toBe('test-bridge-key-12345');
  expect(await page.evaluate(() => localStorage.getItem('emoticon_studio_api_key'))).toBeNull();
  await page.evaluate(() => window.desktop!.secure.deleteApiKey());
  expect(await page.evaluate(() => window.desktop!.secure.getApiKey())).toBeNull();
});

test('renderer automation bridge exposes every supported pipeline operation', async () => {
  await page.waitForFunction(() => !!window.emoticon);
  const methods = await page.evaluate(() => Object.entries(window.emoticon!)
    .filter(([, value]) => typeof value === 'function').map(([key]) => key));
  expect(methods).toEqual(expect.arrayContaining([
    'setApiKey', 'getJob', 'subscribe', 'runFullPipeline', 'export', 'describe',
    'runPostProcessOnly', 'runStage', 'cancelJob', 'getStickers', 'getProcessedImages', 'getMetadata',
  ]));
});

test('external browser links use the HTTPS bridge and reject invalid protocols', async () => {
  await ctx.app.evaluate(({ shell }) => {
    (globalThis as unknown as Record<string, unknown>).__openedUrls = [];
    shell.openExternal = async (url: string) => {
      ((globalThis as unknown as Record<string, unknown>).__openedUrls as string[]).push(url);
    };
  });
  await page.evaluate(() => window.desktop!.shell.openExternal('https://example.com/help'));
  expect(await ctx.app.evaluate(() => (globalThis as unknown as Record<string, unknown>).__openedUrls))
    .toEqual(['https://example.com/help']);
  const error = await page.evaluate(async () => {
    try { await window.desktop!.shell.openExternal('http://example.com'); }
    catch (error) { return String(error); }
  });
  expect(error).toContain('Only HTTPS URLs are allowed');
});

test('updater subscriptions receive events and unsubscribe cleanly', async () => {
  await page.evaluate(() => {
    const state = window as unknown as Record<string, unknown>;
    state.__updates = [];
    state.__stopAvailable = window.desktop!.updater.onAvailable((info: unknown) => (state.__updates as unknown[]).push(info));
    state.__stopDownloaded = window.desktop!.updater.onDownloaded(() => (state.__updates as unknown[]).push('downloaded'));
  });
  await ctx.app.evaluate(({ BrowserWindow }) => {
    const contents = BrowserWindow.getAllWindows()[0]!.webContents;
    contents.send('event:updater:available', { version: '2.0.0' });
    contents.send('event:updater:downloaded');
  });
  await expect.poll(() => page.evaluate(() => (window as unknown as Record<string, unknown>).__updates))
    .toEqual([{ version: '2.0.0' }, 'downloaded']);
  await page.evaluate(() => {
    const state = window as unknown as Record<string, () => void>;
    state.__stopAvailable!();
    state.__stopDownloaded!();
  });
  await ctx.app.evaluate(({ BrowserWindow }) => {
    BrowserWindow.getAllWindows()[0]!.webContents.send('event:updater:available', { version: '3.0.0' });
    BrowserWindow.getAllWindows()[0]!.webContents.send('event:updater:downloaded');
  });
  // A round trip through IPC makes the assertion independent of timer delays.
  await page.evaluate(() => window.desktop!.app.getVersion());
  expect(await page.evaluate(() => (window as unknown as Record<string, unknown>).__updates))
    .toEqual([{ version: '2.0.0' }, 'downloaded']);
});
