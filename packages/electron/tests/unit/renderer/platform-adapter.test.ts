// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isElectron, platform } from '../../../../shared/src/platform/adapter';

function desktopMock() {
  return {
    secure: {
      getApiKey: vi.fn().mockResolvedValue('electron-key'),
      setApiKey: vi.fn().mockResolvedValue(undefined),
      deleteApiKey: vi.fn().mockResolvedValue(undefined),
    },
    file: { saveBinary: vi.fn().mockResolvedValue({ canceled: false, path: '/saved/file.zip' }) },
    app: {}, updater: {}, shell: {},
  };
}

function installDesktop(mock = desktopMock()) {
  Object.defineProperty(window, 'desktop', { configurable: true, value: mock });
  return mock;
}

function installShare(share: unknown, canShare: unknown) {
  Object.defineProperty(navigator, 'share', { configurable: true, value: share });
  Object.defineProperty(navigator, 'canShare', { configurable: true, value: canShare });
}

describe('Platform adapter', () => {
  const data = new Uint8Array([1, 2, 3]);
  let click: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    delete window.desktop;
    localStorage.clear();
    installShare(undefined, undefined);
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:export') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    delete window.desktop;
    document.body.replaceChildren();
  });

  it('detects browser and desktop environments', () => {
    expect(isElectron()).toBe(false);
    installDesktop();
    expect(isElectron()).toBe(true);
  });

  it('reads, saves, and deletes the browser API key', async () => {
    expect(await platform.getApiKey()).toBeNull();
    await platform.setApiKey('browser-key');
    expect(localStorage.getItem('emoticon_studio_api_key')).toBe('browser-key');
    expect(await platform.getApiKey()).toBe('browser-key');
    await platform.deleteApiKey();
    expect(await platform.getApiKey()).toBeNull();
  });

  it('delegates all key operations to the desktop secure store', async () => {
    const desktop = installDesktop();
    expect(await platform.getApiKey()).toBe('electron-key');
    await platform.setApiKey('new-key');
    await platform.deleteApiKey();
    expect(desktop.secure.getApiKey).toHaveBeenCalledOnce();
    expect(desktop.secure.setApiKey).toHaveBeenCalledWith({ key: 'new-key' });
    expect(desktop.secure.deleteApiKey).toHaveBeenCalledOnce();
    expect(localStorage.getItem('emoticon_studio_api_key')).toBeNull();
  });

  it.each([false, true])('preserves desktop save cancellation = %s', async (canceled) => {
    const desktop = installDesktop();
    desktop.file.saveBinary.mockResolvedValue({ canceled, path: '/saved/file.zip' });
    expect(await platform.saveFile(data, 'output.zip')).toBe(!canceled);
    expect(desktop.file.saveBinary).toHaveBeenCalledWith({ data, defaultName: 'output.zip', mimeType: 'application/zip' });
    expect(click).not.toHaveBeenCalled();
  });

  it('propagates desktop save errors', async () => {
    const desktop = installDesktop();
    desktop.file.saveBinary.mockRejectedValue(new Error('DISK_FULL'));
    await expect(platform.saveFile(data, 'output.zip')).rejects.toThrow('DISK_FULL');
  });

  it('keeps the browser download in the DOM until its cleanup delay', async () => {
    expect(await platform.saveFile(data, 'output.zip')).toBe(true);
    const anchor = document.querySelector('a')!;
    expect(anchor.download).toBe('output.zip');
    expect(anchor.href).toBe('blob:export');
    expect(anchor.style.display).toBe('none');
    expect(click).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(3000);
    expect(document.querySelector('a')).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:export');
  });

  it('uses native sharing when file sharing is supported', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const canShare = vi.fn(() => true);
    installShare(share, canShare);
    expect(await platform.saveFile(data, 'mobile.zip')).toBe(true);
    const request = share.mock.calls[0]![0];
    expect(request.title).toBe('mobile.zip');
    expect(request.files[0].name).toBe('mobile.zip');
    expect(request.files[0].type).toBe('application/zip');
    expect(click).not.toHaveBeenCalled();
  });

  it.each(['unsupported', 'missing-capability', 'canceled'])('downloads if native sharing is %s', async (reason) => {
    const share = reason === 'canceled'
      ? vi.fn().mockRejectedValue(new DOMException('Canceled', 'AbortError'))
      : vi.fn();
    installShare(share, reason === 'missing-capability' ? undefined : () => reason === 'canceled');
    expect(await platform.saveFile(data, 'fallback.zip')).toBe(true);
    expect(click).toHaveBeenCalledOnce();
    expect(document.querySelector('a')?.download).toBe('fallback.zip');
  });
});
