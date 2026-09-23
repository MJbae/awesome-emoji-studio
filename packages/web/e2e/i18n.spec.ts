import { test, expect, openStudio, submitConcept } from './support/fixtures';

for (const [language, market] of [['en', 'korean'], ['ko', 'korean'], ['ja', 'japanese'], ['zh-TW', 'traditional-chinese'], ['zh-CN', 'simplified-chinese'], ['th', 'thai']]) {
  test(`localized ${language} journey reaches metadata without untranslated keys`, async ({ page, api }, testInfo) => {
    if (language === 'ko' || language === 'th') await page.setViewportSize({ width: 390, height: 844 });
    await openStudio(page, language);
    await page.screenshot({ path: testInfo.outputPath('input.png'), fullPage: true });
    await submitConcept(page, market);
    await expect(page.locator('[data-stage="strategy"][data-phase="complete"]')).toBeVisible();
    await page.getByTestId('continue-btn').click();
    await expect(page.locator('[data-stage="character"][data-phase="complete"]')).toBeVisible();
    await page.getByTestId('continue-btn').click();
    await expect(page.locator('[data-stage="stickers"][data-phase="complete"]')).toBeVisible();
    await page.getByTestId('continue-btn').click();
    await expect(page.getByRole('img', { name: 'Processing preview', exact: true })).toBeVisible();
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/postprocess\.(cleanup|removeBg|removeBgDesc|outlineEffect|enableOutline)/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('postprocess.png'), fullPage: true });
    await page.getByTestId('continue-btn').click();
    await expect(page.getByTestId('generate-metadata-btn')).toBeVisible();
    expect(api.calls.filter((call) => call.kind === 'sticker')).toHaveLength(5);
  });
}
