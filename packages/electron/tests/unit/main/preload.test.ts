import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DesktopAPI } from '../../../src/shared/ipc';

const mocks = vi.hoisted(() => ({
  exposeInMainWorld: vi.fn(), invoke: vi.fn(), on: vi.fn(),
}));
vi.mock('electron', () => ({
  contextBridge: { exposeInMainWorld: mocks.exposeInMainWorld },
  ipcRenderer: { invoke: mocks.invoke, on: mocks.on },
}));

let api: DesktopAPI;
beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  await import('../../../src/preload');
  expect(mocks.exposeInMainWorld).toHaveBeenCalledWith('desktop', expect.any(Object));
  api = mocks.exposeInMainWorld.mock.calls[0]![1];
});

describe('Isolated preload bridge', () => {
  it('forwards every desktop operation and returns its IPC result', async () => {
    const bytes = new Uint8Array([1, 2]);
    const operations: Array<[() => Promise<unknown>, string, unknown[]]> = [
      [() => api.secure.getApiKey(), 'secure:getApiKey', []],
      [() => api.secure.setApiKey({ key: 'secret' }), 'secure:setApiKey', [{ key: 'secret' }]],
      [() => api.secure.deleteApiKey(), 'secure:deleteApiKey', []],
      [() => api.file.showSaveDialog({ defaultPath: 'a.zip' }), 'file:showSaveDialog', [{ defaultPath: 'a.zip' }]],
      [() => api.file.saveBinary({ data: bytes, defaultName: 'a.zip' }), 'file:saveBinary', [{ data: bytes, defaultName: 'a.zip' }]],
      [() => api.file.showOpenDialog(), 'file:showOpenDialog', []],
      [() => api.file.readBinary('/a.zip'), 'file:readBinary', ['/a.zip']],
      [() => api.app.getVersion(), 'app:getVersion', []],
      [() => api.app.getPaths(), 'app:getPaths', []],
      [() => api.updater.check(), 'updater:check', []],
      [() => api.shell.openExternal('https://example.com'), 'shell:openExternal', ['https://example.com']],
    ];
    for (const [operation, channel, args] of operations) {
      mocks.invoke.mockResolvedValueOnce(`result:${channel}`);
      expect(await operation()).toBe(`result:${channel}`);
      expect(mocks.invoke).toHaveBeenLastCalledWith(channel, ...args);
    }
  });

  it('delivers update events and removes unsubscribed callbacks', () => {
    const available = mocks.on.mock.calls.find(([channel]) => channel === 'event:updater:available')![1];
    const downloaded = mocks.on.mock.calls.find(([channel]) => channel === 'event:updater:downloaded')![1];
    const onAvailable = vi.fn();
    const onDownloaded = vi.fn();
    const stopAvailable = api.updater.onAvailable(onAvailable);
    const stopDownloaded = api.updater.onDownloaded(onDownloaded);
    available({}, { version: '2.0.0' });
    downloaded({});
    expect(onAvailable).toHaveBeenCalledWith({ version: '2.0.0' });
    expect(onDownloaded).toHaveBeenCalledOnce();
    stopAvailable();
    stopDownloaded();
    available({}, { version: '3.0.0' });
    downloaded({});
    expect(onAvailable).toHaveBeenCalledOnce();
    expect(onDownloaded).toHaveBeenCalledOnce();
  });
});
