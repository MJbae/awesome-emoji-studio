import { app, BrowserWindow, shell } from 'electron';
import { join } from 'path';
import { is } from '@electron-toolkit/utils';
import Store from 'electron-store';
import { registerSecureStoreHandlers } from './ipc/secureStore';
import { registerFileServiceHandlers } from './ipc/fileService';
import { registerAppInfoHandlers } from './ipc/appInfo';
import { createMenu } from './menu';
import { initAutoUpdater } from './updater';

const isE2E = !!process.env['EMOTICON_STUDIO_E2E'];
const e2eUserDataDir = process.env['EMOTICON_STUDIO_USER_DATA_DIR'];

if (e2eUserDataDir) {
  app.setPath('userData', e2eUserDataDir);
}

const windowStore = new Store({ name: 'window-state' });

let mainWindow: BrowserWindow | null = null;

if (!isE2E) {
  const gotLock = app.requestSingleInstanceLock();
  if (!gotLock) {
    app.quit();
  } else {
    app.on('second-instance', () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });
  }
}

function createWindow(): void {
  const bounds = windowStore.get('bounds', { width: 1280, height: 800 }) as {
    width: number;
    height: number;
    x?: number;
    y?: number;
  };

  mainWindow = new BrowserWindow({
    ...bounds,
    minWidth: 900,
    minHeight: 600,
    title: 'LINE Emoji Studio',
    icon: join(__dirname, '../../resources/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  mainWindow.on('close', () => {
    if (mainWindow) {
      windowStore.set('bounds', mainWindow.getBounds());
    }
  });

  // 외부 링크는 시스템 브라우저에서 열기
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // 네비게이션 차단 (보안)
  mainWindow.webContents.on('will-navigate', (event) => {
    event.preventDefault();
  });

  // 개발/프로덕션 분기
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  registerSecureStoreHandlers();
  registerFileServiceHandlers();
  registerAppInfoHandlers();
  createMenu();

  createWindow();

  if (mainWindow) {
    initAutoUpdater(mainWindow);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
