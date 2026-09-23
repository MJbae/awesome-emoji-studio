import { test, expect, openStudio, toMetadata } from './support/fixtures';

declare global {
  interface Window {
    shareCalls?: string[];
    settleShare?: () => void;
  }
}

for (const outcome of ['complete', 'cancel'] as const) {
  test(`native share ${outcome} keeps exports busy until the browser dialog settles`, async ({ page, api }) => {
    api.ideaCount = 3;
    await page.addInitScript((outcome) => {
      window.shareCalls = [];
      Object.defineProperties(navigator, {
        canShare: { configurable: true, value: () => true },
        share: {
          configurable: true,
          value: ({ files }: { files: File[] }) => {
            window.shareCalls!.push(files[0]!.name);
            return new Promise<void>((resolve, reject) => {
              window.settleShare = () => outcome === 'complete'
                ? resolve()
                : reject(new DOMException('User cancelled share dialog', 'AbortError'));
            });
          },
        },
      });
    }, outcome);
    await openStudio(page);
    await toMetadata(page);
    await page.getByTestId('generate-metadata-btn').click();
    await expect(page.getByTestId('select-meta-creative')).toHaveCount(5);
    await page.getByTestId('continue-to-export-btn').click();
    await page.getByTestId('deselect-all-platforms-btn').click();
    await page.getByTestId('platform-line_emoji').click();
    let expectedCalls = 0;
    for (const button of ['export-selected-btn', 'export-combined-btn']) {
      const fallbackDownload = outcome === 'cancel' ? page.waitForEvent('download') : undefined;
      await page.getByTestId(button).click();
      expectedCalls++;
      await expect.poll(() => page.evaluate(() => window.shareCalls!.length)).toBe(expectedCalls);
      await expect(page.getByTestId('export-selected-btn')).toBeDisabled();
      await expect(page.getByTestId('export-combined-btn')).toBeDisabled();
      await expect(page.getByTestId('back-btn')).toBeDisabled();
      expect(await page.evaluate(() => window.shareCalls!.at(-1))).toMatch(/\.zip$/);
      await page.evaluate(() => window.settleShare!());
      if (fallbackDownload) expect((await fallbackDownload).suggestedFilename()).toMatch(/\.zip$/);
      await expect(page.getByTestId('export-selected-btn')).toBeEnabled();
      await expect(page.getByTestId('export-combined-btn')).toBeEnabled();
      await expect(page.getByTestId('back-btn')).toBeEnabled();
    }
  });
}
