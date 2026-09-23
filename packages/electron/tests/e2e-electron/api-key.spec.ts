import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { launchApp, cleanupApp, type AppContext } from './helpers';

let ctx: AppContext;
let page: Page;

test.beforeEach(async () => {
  ctx = await launchApp();
  page = await ctx.app.firstWindow();
  await page.route('https://generativelanguage.googleapis.com/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ models: [{ name: 'models/gemini-test' }] }),
  }));
  await expect(page.getByTestId('app-shell')).toBeVisible();
});

test.afterEach(async () => {
  if (ctx) await cleanupApp(ctx);
});

test.describe('Desktop API key setup and persistence', () => {
  test('first launch requires a key and supports concealed/revealed input', async () => {
    const modal = page.getByTestId('api-key-modal');
    await expect(modal).toBeVisible();
    await page.getByTestId('save-api-key-btn').click();
    await expect(modal.getByRole('alert')).toBeVisible();
    await expect(page.getByTestId('close-modal-btn')).toHaveCount(0);
    const input = page.getByTestId('api-key-input');
    await expect(input).toHaveAttribute('type', 'password');
    await input.fill('test-key-12345');
    await page.getByTestId('toggle-key-visibility').click();
    await expect(input).toHaveAttribute('type', 'text');
    await page.getByTestId('toggle-key-visibility').click();
    await expect(input).toHaveAttribute('type', 'password');
  });

  test('UI save encrypts the key and restores it after restarting', async () => {
    const testKey = 'AIzaTestKey1234567890';
    await page.getByTestId('api-key-input').fill(testKey);
    await page.getByTestId('save-api-key-btn').click();
    await expect(page.getByTestId('api-key-modal')).toBeHidden();
    await expect(page.getByTestId('concept-textarea')).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.desktop!.secure.getApiKey())).toBe(testKey);
    const stored = await readFile(join(ctx.userDataDir, 'secure-config.json'), 'utf8');
    expect(stored).not.toContain(testKey);
    expect(JSON.parse(stored).geminiApiKey).toBeTruthy();
    expect(await page.evaluate(() => localStorage.getItem('emoticon_studio_api_key'))).toBeNull();

    await ctx.app.close();
    ctx = await launchApp(ctx.userDataDir);
    page = await ctx.app.firstWindow();
    await expect(page.getByTestId('concept-textarea')).toBeVisible();
    await expect(page.getByTestId('api-key-modal')).toBeHidden();
    expect(await page.evaluate(() => window.desktop!.secure.getApiKey())).toBe(testKey);

    await page.getByTestId('settings-btn').click();
    await expect(page.getByTestId('api-key-modal')).toBeVisible();
    await page.getByTestId('close-modal-btn').click();
    await expect(page.getByTestId('api-key-modal')).toBeHidden();
  });

  test('deleted credentials return to setup after restarting', async () => {
    await page.evaluate(async () => {
      await window.desktop!.secure.setApiKey({ key: 'delete-me-key' });
      await window.desktop!.secure.deleteApiKey();
    });
    expect(await page.evaluate(() => window.desktop!.secure.getApiKey())).toBeNull();
    await ctx.app.close();
    ctx = await launchApp(ctx.userDataDir);
    page = await ctx.app.firstWindow();
    await expect(page.getByTestId('api-key-modal')).toBeVisible();
  });

  test('invalid remote credentials show an error and can be retried', async () => {
    await page.route('https://generativelanguage.googleapis.com/**', (route) => route.fulfill({
      status: 400, contentType: 'application/json',
      body: JSON.stringify({ error: { message: 'API key not valid', code: 400, status: 'INVALID_ARGUMENT' } }),
    }));
    await page.getByTestId('api-key-input').fill('invalid-api-key');
    await page.getByTestId('save-api-key-btn').click();
    await expect(page.getByTestId('api-key-modal').getByRole('alert')).toBeVisible();
    expect(await page.evaluate(() => window.desktop!.secure.getApiKey())).toBeNull();
    await page.unroute('https://generativelanguage.googleapis.com/**');
    await page.route('https://generativelanguage.googleapis.com/**', (route) => route.fulfill({
      status: 200, contentType: 'application/json', body: JSON.stringify({ models: [] }),
    }));
    await page.getByTestId('api-key-input').fill('corrected-api-key');
    await page.getByTestId('api-key-input').press('Enter');
    await expect(page.getByTestId('concept-textarea')).toBeVisible();
  });
});
