import { test, expect, type Page } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { cleanupApp, launchApp, type AppContext } from './helpers';

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

async function saveDialog(canceled: boolean, filePath?: string) {
  await ctx.app.evaluate(({ dialog }, result) => {
    dialog.showSaveDialog = async () => result as Awaited<ReturnType<typeof dialog.showSaveDialog>>;
  }, { canceled, filePath });
}

test('saves exact binary content through preload, IPC, and filesystem', async () => {
  const filePath = join(ctx.userDataDir, 'exports', 'stickers.zip');
  await saveDialog(false, filePath);
  const result = await page.evaluate(() => window.desktop!.file.saveBinary({
    data: new Uint8Array([99, 80, 75, 3, 4, 88]).subarray(1, 5), defaultName: 'stickers.zip',
  }));
  expect(result).toEqual({ canceled: false, path: filePath });
  expect([...await readFile(filePath)]).toEqual([80, 75, 3, 4]);
  const bytes = await page.evaluate(async (path) => Array.from(await window.desktop!.file.readBinary(path) as Uint8Array), filePath);
  expect(bytes).toEqual([80, 75, 3, 4]);
});

test('canceling save or returning no path never creates a file', async () => {
  for (const canceled of [true, false]) {
    await saveDialog(canceled);
    const result = await page.evaluate(() => window.desktop!.file.saveBinary({
      data: new Uint8Array([1]), defaultName: 'canceled.zip',
    }));
    expect(result).toEqual({ canceled: true, path: null });
  }
});

test('save and open chooser results preserve selection and cancellation', async () => {
  const path = join(ctx.userDataDir, 'source.png');
  await writeFile(path, Buffer.from([1, 2, 3]));
  await saveDialog(false, path);
  expect(await page.evaluate(() => window.desktop!.file.showSaveDialog({ defaultPath: 'source.png' })))
    .toEqual({ canceled: false, path });
  await saveDialog(true);
  expect(await page.evaluate(() => window.desktop!.file.showSaveDialog({})))
    .toEqual({ canceled: true, path: null });

  for (const canceled of [false, true]) {
    const paths = canceled ? [] : [path];
    await ctx.app.evaluate(({ dialog }, result) => {
      dialog.showOpenDialog = async () => result;
    }, { canceled, filePaths: paths });
    expect(await page.evaluate(() => window.desktop!.file.showOpenDialog())).toEqual({ canceled, paths });
  }
});

test('read errors propagate back to the renderer', async () => {
  const result = await page.evaluate(async (path) => {
    try { await window.desktop!.file.readBinary(path); }
    catch (error) { return String(error); }
  }, join(ctx.userDataDir, 'missing.png'));
  expect(result).toContain('ENOENT');
});
