import { test, expect } from '@playwright/test';

test.describe('i18n translations in PostProcessStage', () => {
  test('should not display raw translation keys for postprocess', async ({ page }) => {
    // Navigate to local server
    await page.goto('/');

    // Wait until React and Zustand initialize
    await page.waitForFunction(() => (window as any).useAppStore !== undefined);

    // Manipulate Zustand state to jump directly to the postprocess stage
    await page.evaluate(() => {
      const store = (window as any).useAppStore;
      store.setState({
        apiKey: 'fake-key',
        keyHydrated: true,
        stage: 'postprocess',
        stickers: [
          {
            id: 1,
            status: 'done',
            // 1x1 transparent png
            imageUrl: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
            idea: { expression: 'test' }
          }
        ]
      });
    });

    // We wait for some postprocess specific UI structure to appear
    await page.waitForSelector('text=1'); // "1" could match applied count, but let's wait more generally
    await page.waitForTimeout(1000); // Give it a second to render the stage

    // Check that the body does NOT contain the raw keys
    const bodyText = await page.textContent('body') || '';
    
    expect(bodyText).not.toContain('postprocess.cleanup');
    expect(bodyText).not.toContain('postprocess.removeBg');
    expect(bodyText).not.toContain('postprocess.removeBgDesc');
    expect(bodyText).not.toContain('postprocess.outlineEffect');
    expect(bodyText).not.toContain('postprocess.enableOutline');
    
    // Verify it rendered the actual fallback text (like Auto Cleanup or 이미지 정리)
    const hasAnyValidTranslation = bodyText.includes('이미지') || bodyText.includes('Cleanup') || bodyText.includes('クリーンアップ') || bodyText.includes('清理');
    expect(hasAnyValidTranslation).toBe(true);
  });
});
