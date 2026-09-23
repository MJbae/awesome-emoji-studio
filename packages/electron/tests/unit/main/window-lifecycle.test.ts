import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type WindowMock = {
  options: Record<string, unknown>;
  listeners: Map<string, (...args: unknown[]) => void>;
  contentListeners: Map<string, (...args: unknown[]) => void>;
  webContents: { setWindowOpenHandler: ReturnType<typeof vi.fn>; on: ReturnType<typeof vi.fn> };
  loadURL: ReturnType<typeof vi.fn>;
  loadFile: ReturnType<typeof vi.fn>;
  getBounds: ReturnType<typeof vi.fn>;
  isMinimized: ReturnType<typeof vi.fn>;
  restore: ReturnType<typeof vi.fn>;
  focus: ReturnType<typeof vi.fn>;
};
const mocks = vi.hoisted(() => ({
  windows: [] as WindowMock[],
  listeners: new Map<string, (...args: unknown[]) => void>(),
  ready: undefined as undefined | (() => void),
  setPath: vi.fn(), requestSingleInstanceLock: vi.fn(), quit: vi.fn(), openExternal: vi.fn(),
  storeSet: vi.fn(), bounds: undefined as undefined | { width: number; height: number },
  is: { dev: false }, registerSecure: vi.fn(), registerFiles: vi.fn(), registerAppInfo: vi.fn(),
  createMenu: vi.fn(), initUpdater: vi.fn(),
}));
vi.mock('electron', () => ({
  app: {
    setPath: mocks.setPath, requestSingleInstanceLock: mocks.requestSingleInstanceLock, quit: mocks.quit,
    whenReady: () => ({ then: (callback: () => void) => { mocks.ready = callback; } }),
    on: (name: string, callback: (...args: unknown[]) => void) => mocks.listeners.set(name, callback),
  },
  shell: { openExternal: mocks.openExternal },
  BrowserWindow: class {
    static getAllWindows() { return mocks.windows; }
    options: Record<string, unknown>;
    listeners = new Map<string, (...args: unknown[]) => void>();
    contentListeners = new Map<string, (...args: unknown[]) => void>();
    webContents = {
      setWindowOpenHandler: vi.fn(),
      on: vi.fn((name: string, callback: (...args: unknown[]) => void) => this.contentListeners.set(name, callback)),
    };
    loadURL = vi.fn();
    loadFile = vi.fn();
    getBounds = vi.fn(() => ({ width: 1100, height: 720 }));
    isMinimized = vi.fn(() => false);
    restore = vi.fn();
    focus = vi.fn();
    on(name: string, callback: (...args: unknown[]) => void) { this.listeners.set(name, callback); }
    constructor(options: Record<string, unknown>) { this.options = options; mocks.windows.push(this); }
  },
}));
vi.mock('electron-store', () => ({ default: class {
  get(_name: string, fallback: unknown) { return mocks.bounds ?? fallback; }
  set = mocks.storeSet;
} }));
vi.mock('@electron-toolkit/utils', () => ({ is: mocks.is }));
vi.mock('../../../src/main/ipc/secureStore', () => ({ registerSecureStoreHandlers: mocks.registerSecure }));
vi.mock('../../../src/main/ipc/fileService', () => ({ registerFileServiceHandlers: mocks.registerFiles }));
vi.mock('../../../src/main/ipc/appInfo', () => ({ registerAppInfoHandlers: mocks.registerAppInfo }));
vi.mock('../../../src/main/menu', () => ({ createMenu: mocks.createMenu }));
vi.mock('../../../src/main/updater', () => ({ initAutoUpdater: mocks.initUpdater }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  mocks.windows.length = 0;
  mocks.listeners.clear();
  mocks.bounds = undefined;
  mocks.is.dev = false;
  mocks.requestSingleInstanceLock.mockReturnValue(true);
  vi.stubEnv('EMOTICON_STUDIO_E2E', '');
  vi.stubEnv('EMOTICON_STUDIO_USER_DATA_DIR', '');
  vi.stubEnv('ELECTRON_RENDERER_URL', '');
});
afterEach(() => vi.unstubAllEnvs());
async function start() {
  await import('../../../src/main');
  mocks.ready!();
  return mocks.windows[0]!;
}

describe('Desktop window lifecycle', () => {
  it('creates a secure default window and registers all desktop services', async () => {
    const window = await start();
    expect(window.options).toMatchObject({ width: 1280, height: 800, minWidth: 900, minHeight: 600,
      webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true } });
    expect(window.loadFile).toHaveBeenCalledWith(expect.stringContaining('renderer/index.html'));
    expect(mocks.registerSecure).toHaveBeenCalledOnce();
    expect(mocks.registerFiles).toHaveBeenCalledOnce();
    expect(mocks.registerAppInfo).toHaveBeenCalledOnce();
    expect(mocks.createMenu).toHaveBeenCalledOnce();
    expect(mocks.initUpdater).toHaveBeenCalledWith(window);
    expect(mocks.setPath).not.toHaveBeenCalled();
  });

  it('uses isolated E2E data and preserves stored bounds', async () => {
    vi.stubEnv('EMOTICON_STUDIO_E2E', '1');
    vi.stubEnv('EMOTICON_STUDIO_USER_DATA_DIR', '/temporary/profile');
    mocks.bounds = { width: 1050, height: 700 };
    const window = await start();
    expect(mocks.setPath).toHaveBeenCalledWith('userData', '/temporary/profile');
    expect(mocks.requestSingleInstanceLock).not.toHaveBeenCalled();
    expect(window.options).toMatchObject(mocks.bounds);
    window.listeners.get('close')!();
    expect(mocks.storeSet).toHaveBeenCalledWith('bounds', { width: 1100, height: 720 });
  });

  it('loads the development renderer only when both development flags are present', async () => {
    mocks.is.dev = true;
    vi.stubEnv('ELECTRON_RENDERER_URL', 'http://localhost:5173');
    const window = await start();
    expect(window.loadURL).toHaveBeenCalledWith('http://localhost:5173');
    expect(window.loadFile).not.toHaveBeenCalled();
  });

  it('falls back to packaged renderer during development without a URL', async () => {
    mocks.is.dev = true;
    const window = await start();
    expect(window.loadFile).toHaveBeenCalled();
    expect(window.loadURL).not.toHaveBeenCalled();
  });

  it('opens external windows in the system browser and blocks navigation', async () => {
    const window = await start();
    const handler = window.webContents.setWindowOpenHandler.mock.calls[0]![0];
    expect(handler({ url: 'https://example.com' })).toEqual({ action: 'deny' });
    expect(mocks.openExternal).toHaveBeenCalledWith('https://example.com');
    const event = { preventDefault: vi.fn() };
    window.contentListeners.get('will-navigate')!(event);
    expect(event.preventDefault).toHaveBeenCalledOnce();
  });

  it('quits a second process that cannot acquire the application lock', async () => {
    mocks.requestSingleInstanceLock.mockReturnValue(false);
    await import('../../../src/main');
    expect(mocks.quit).toHaveBeenCalledOnce();
    expect(mocks.listeners.has('second-instance')).toBe(false);
  });

  it('focuses an existing window and restores it only if minimized', async () => {
    await import('../../../src/main');
    const secondInstance = mocks.listeners.get('second-instance')!;
    secondInstance(); // The first instance can arrive before window creation.
    mocks.ready!();
    const window = mocks.windows[0]!;
    secondInstance();
    expect(window.restore).not.toHaveBeenCalled();
    window.isMinimized.mockReturnValue(true);
    secondInstance();
    expect(window.restore).toHaveBeenCalledOnce();
    expect(window.focus).toHaveBeenCalledTimes(2);
  });

  it.each(['darwin', 'win32'])('handles all windows closed on %s', async (platform) => {
    vi.spyOn(process, 'platform', 'get').mockReturnValue(platform as NodeJS.Platform);
    await start();
    mocks.listeners.get('window-all-closed')!();
    expect(mocks.quit).toHaveBeenCalledTimes(platform === 'darwin' ? 0 : 1);
  });

  it('creates a window on activation only when none exists', async () => {
    await start();
    mocks.listeners.get('activate')!();
    expect(mocks.windows).toHaveLength(1);
    mocks.windows.length = 0;
    mocks.listeners.get('activate')!();
    expect(mocks.windows).toHaveLength(1);
  });
});
