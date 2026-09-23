import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import type { BrowserWindow } from 'electron';

const mocks = vi.hoisted(() => ({
  checkForUpdates: vi.fn(), on: vi.fn(), handle: vi.fn(),
  buildFromTemplate: vi.fn(() => ({ menu: true })), setApplicationMenu: vi.fn(),
}));
vi.mock('electron-updater', () => ({ autoUpdater: { ...mocks } }));
vi.mock('electron', () => ({
  ipcMain: { handle: mocks.handle },
  Menu: { buildFromTemplate: mocks.buildFromTemplate, setApplicationMenu: mocks.setApplicationMenu },
}));

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  mocks.checkForUpdates.mockResolvedValue(null);
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe('Desktop update notifications', () => {
  async function initialize() {
    const { initAutoUpdater } = await import('../../../src/main/updater');
    const send = vi.fn();
    initAutoUpdater({ webContents: { send } } as unknown as BrowserWindow);
    return { send, check: mocks.handle.mock.calls[0]![1] as () => Promise<unknown> };
  }

  it('uses manual downloads and forwards update notifications', async () => {
    const { send } = await initialize();
    const { autoUpdater } = await import('electron-updater');
    expect(autoUpdater.autoDownload).toBe(false);
    expect(autoUpdater.autoInstallOnAppQuit).toBe(true);
    mocks.on.mock.calls.find(([name]) => name === 'update-available')![1]({ version: '2.0.0' });
    mocks.on.mock.calls.find(([name]) => name === 'update-downloaded')![1]();
    expect(send).toHaveBeenCalledWith('event:updater:available', { version: '2.0.0' });
    expect(send).toHaveBeenCalledWith('event:updater:downloaded');
  });

  it.each([
    [null, { available: false }],
    [{}, { available: false }],
    [{ updateInfo: { version: '2.0.0', releaseNotes: 'Changes' } }, { available: true, version: '2.0.0', notes: 'Changes' }],
    [{ updateInfo: { version: '2.0.0', releaseNotes: [] } }, { available: true, version: '2.0.0', notes: undefined }],
  ])('normalizes the updater response %#', async (response, expected) => {
    const { check } = await initialize();
    mocks.checkForUpdates.mockResolvedValue(response);
    expect(await check()).toEqual(expected);
  });

  it('handles offline checks and scheduled checks without uncaught rejection', async () => {
    const { check } = await initialize();
    mocks.checkForUpdates.mockRejectedValue(new Error('offline'));
    expect(await check()).toEqual({ available: false });
    await vi.advanceTimersByTimeAsync(3000);
    await vi.advanceTimersByTimeAsync(4 * 60 * 60 * 1000);
    expect(mocks.checkForUpdates).toHaveBeenCalledTimes(3);
  });
});

describe('Native menu', () => {
  it.each(['darwin', 'win32'])('creates the native application menu on %s', async (platform) => {
    vi.spyOn(process, 'platform', 'get').mockReturnValue(platform as NodeJS.Platform);
    const { createMenu } = await import('../../../src/main/menu');
    createMenu();
    const labels = mocks.buildFromTemplate.mock.calls[0]![0].map((entry: { label: string }) => entry.label);
    expect(labels).toEqual(platform === 'darwin' ? ['Awesome Emoji Studio', 'Edit', 'View'] : ['Edit', 'View']);
    expect(mocks.setApplicationMenu).toHaveBeenCalledWith({ menu: true });
  });
});
