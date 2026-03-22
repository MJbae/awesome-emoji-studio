import { ipcMain, app } from 'electron';
import { IPC } from '../../shared/ipc';

export function registerAppInfoHandlers(): void {
  ipcMain.handle(IPC.appGetVersion, async () => {
    return app.getVersion();
  });

  ipcMain.handle(IPC.appGetPaths, async () => {
    return {
      documents: app.getPath('documents'),
      userData: app.getPath('userData'),
    };
  });

  ipcMain.handle(IPC.shellOpenExternal, async (_event, url: string) => {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') {
      throw new Error('Only HTTPS URLs are allowed');
    }
    const { shell } = await import('electron');
    await shell.openExternal(url);
  });
}
