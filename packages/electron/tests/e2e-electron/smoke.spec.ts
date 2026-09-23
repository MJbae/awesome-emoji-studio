import { test, expect } from '@playwright/test';
import { launchApp, cleanupApp, type AppContext } from './helpers';

let ctx: AppContext;
test.afterEach(async () => {
  if (ctx) await cleanupApp(ctx);
});

test('packaged app launches with the complete setup UI and supported minimum size', async () => {
  ctx = await launchApp();
  const page = await ctx.app.firstWindow();
  await expect(page).toHaveTitle(/Awesome Emoji Studio/);
  await expect(page.getByTestId('app-shell')).toBeVisible();
  await expect(page.getByTestId('api-key-modal')).toBeVisible();
  expect(ctx.app.windows()).toHaveLength(1);
  const minimumSize = await ctx.app.evaluate(({ BrowserWindow }) => {
    const window = BrowserWindow.getAllWindows()[0]!;
    return window.getMinimumSize();
  });
  expect(minimumSize).toEqual([900, 600]);
});

test('window size survives a desktop restart', async () => {
  ctx = await launchApp();
  const page = await ctx.app.firstWindow();
  await expect(page.getByTestId('app-shell')).toBeVisible();
  await ctx.app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]!.setSize(1050, 700));
  await ctx.app.close();
  ctx = await launchApp(ctx.userDataDir);
  await ctx.app.firstWindow();
  const size = await ctx.app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]!.getSize());
  expect(size).toEqual([1050, 700]);
});
