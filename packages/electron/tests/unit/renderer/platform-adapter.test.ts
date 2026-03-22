import { describe, it, expect, vi, beforeEach } from 'vitest';

let isElectron: () => boolean;
let platform: {
  getApiKey(): Promise<string | null>;
  setApiKey(key: string): Promise<void>;
  deleteApiKey(): Promise<void>;
  saveFile(data: Uint8Array, defaultName: string): Promise<boolean>;
};

describe('Platform Adapter', () => {
  beforeEach(async () => {
    vi.resetModules();
    delete (window as unknown as Record<string, unknown>).desktop;
    const mod = await import('../../../../shared/src/platform/adapter');
    isElectron = mod.isElectron;
    platform = mod.platform;
  });

  it('isElectron() returns false when window.desktop is absent', () => {
    expect(isElectron()).toBe(false);
  });

  it('isElectron() returns true when window.desktop exists', () => {
    (window as unknown as Record<string, unknown>).desktop = {
      secure: {},
      file: {},
      app: {},
      updater: {},
      shell: {},
    };
    expect(isElectron()).toBe(true);
  });

  describe('web fallback', () => {
    it('getApiKey reads from localStorage', async () => {
      const spy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('test-key');
      const result = await platform.getApiKey();
      expect(result).toBe('test-key');
      expect(spy).toHaveBeenCalledWith('emoticon_studio_api_key');
      spy.mockRestore();
    });

    it('setApiKey writes to localStorage', async () => {
      const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
      await platform.setApiKey('my-key');
      expect(spy).toHaveBeenCalledWith('emoticon_studio_api_key', 'my-key');
      spy.mockRestore();
    });

    it('deleteApiKey removes from localStorage', async () => {
      const spy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {});
      await platform.deleteApiKey();
      expect(spy).toHaveBeenCalledWith('emoticon_studio_api_key');
      spy.mockRestore();
    });

    it('saveFile creates anchor element for download', async () => {
      const createObjectURLMock = vi.fn(() => 'blob:mock-url');
      const revokeObjectURLMock = vi.fn();
      globalThis.URL.createObjectURL = createObjectURLMock;
      globalThis.URL.revokeObjectURL = revokeObjectURLMock;

      const clickMock = vi.fn();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(document, 'createElement').mockReturnValue({
        href: '',
        download: '',
        click: clickMock,
      } as any);

      const result = await platform.saveFile(new Uint8Array([1, 2, 3]), 'test.zip');
      expect(result).toBe(true);
      expect(clickMock).toHaveBeenCalled();
      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  describe('electron mode', () => {
    it('getApiKey calls desktop.secure.getApiKey', async () => {
      const mockGetApiKey = vi.fn().mockResolvedValue('electron-key');
      (window as unknown as Record<string, unknown>).desktop = {
        secure: { getApiKey: mockGetApiKey, setApiKey: vi.fn(), deleteApiKey: vi.fn() },
        file: {},
        app: {},
        updater: {},
        shell: {},
      };

      const mod = await import('../../../../shared/src/platform/adapter');
      const result = await mod.platform.getApiKey();
      expect(result).toBe('electron-key');
      expect(mockGetApiKey).toHaveBeenCalled();
    });

    it('saveFile calls desktop.file.saveBinary', async () => {
      const mockSaveBinary = vi
        .fn()
        .mockResolvedValue({ canceled: false, path: '/saved/file.zip' });
      (window as unknown as Record<string, unknown>).desktop = {
        secure: {},
        file: { saveBinary: mockSaveBinary },
        app: {},
        updater: {},
        shell: {},
      };

      const mod = await import('../../../../shared/src/platform/adapter');
      const data = new Uint8Array([1, 2, 3]);
      const result = await mod.platform.saveFile(data, 'output.zip');
      expect(result).toBe(true);
      expect(mockSaveBinary).toHaveBeenCalledWith({
        data,
        defaultName: 'output.zip',
        mimeType: 'application/zip',
      });
    });
  });
});
