import { test, expect } from '@playwright/test';
import { launchApp, cleanupApp, type AppContext } from './helpers';

let context: AppContext;
test.afterEach(async () => { if (context) await cleanupApp(context); });

test('five interface languages are available before API setup and the choice survives a desktop restart', async () => {
  context = await launchApp();
  let page = await context.app.firstWindow();
  const selector = page.getByTestId('setup-language-select');
  await expect(selector).toBeVisible();
  expect(await selector.locator('option').evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value))).toEqual(['en', 'ko', 'ja', 'zh-CN', 'zh-TW']);
  for (const locale of ['en', 'ko', 'ja', 'zh-CN', 'zh-TW']) {
    await selector.selectOption(locale);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(selector).toHaveValue(locale);
    expect(await page.evaluate(() => localStorage.getItem('i18nextLng'))).toBe(locale);
  }
  await context.app.close();
  context = await launchApp(context.userDataDir);
  page = await context.app.firstWindow();
  await expect(page.getByTestId('setup-language-select')).toHaveValue('zh-TW');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-TW');
  await expect(page.getByTestId('api-key-modal')).toBeVisible();
});
