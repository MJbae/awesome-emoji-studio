import { autoUpdater } from 'electron-updater';
import { BrowserWindow, ipcMain } from 'electron';
import { IPC, type UpdateInfo } from '../shared/ipc';

export function initAutoUpdater(mainWindow: BrowserWindow): void {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('event:updater:available', {
      version: info.version,
    });
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('event:updater:downloaded');
  });

  ipcMain.handle(IPC.updaterCheck, async (): Promise<UpdateInfo> => {
    try {
      const result = await autoUpdater.checkForUpdates();
      if (result && result.updateInfo) {
        return {
          available: true,
          version: result.updateInfo.version,
          notes:
            typeof result.updateInfo.releaseNotes === 'string'
              ? result.updateInfo.releaseNotes
              : undefined,
        };
      }
      return { available: false };
    } catch {
      return { available: false };
    }
  });

  setTimeout(() => autoUpdater.checkForUpdates().catch(() => {}), 3000);

  setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 4 * 60 * 60 * 1000);
}
