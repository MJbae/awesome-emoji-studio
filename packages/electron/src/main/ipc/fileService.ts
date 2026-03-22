import { ipcMain, dialog, app } from 'electron';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { IPC, type ShowSaveDialogReq, type SaveBinaryReq } from '../../shared/ipc';

export function registerFileServiceHandlers(): void {
  ipcMain.handle(IPC.fileShowSaveDialog, async (_event, req: ShowSaveDialogReq) => {
    const result = await dialog.showSaveDialog({
      defaultPath: req.defaultPath,
      filters: req.filters,
    });
    return { canceled: result.canceled, path: result.filePath ?? null };
  });

  ipcMain.handle(IPC.fileSaveBinary, async (_event, req: SaveBinaryReq) => {
    const defaultDir = req.defaultDirectory ?? join(app.getPath('documents'), 'EmoticonStudio');
    const defaultPath = join(defaultDir, req.defaultName);

    const result = await dialog.showSaveDialog({
      defaultPath,
      filters: [
        { name: 'ZIP Archive', extensions: ['zip'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (result.canceled || !result.filePath) {
      return { canceled: true, path: null };
    }

    try {
      await mkdir(dirname(result.filePath), { recursive: true });
      const buffer = Buffer.from(req.data.buffer, req.data.byteOffset, req.data.byteLength);
      await writeFile(result.filePath, buffer);
      return { canceled: false, path: result.filePath };
    } catch (error: unknown) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOSPC') {
        throw new Error('DISK_FULL: Not enough disk space to save the file.');
      }
      if (err.code === 'EACCES') {
        throw new Error('PERMISSION_DENIED: Cannot write to the selected location.');
      }
      throw error;
    }
  });

  ipcMain.handle(IPC.fileShowOpenDialog, async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg'] },
        { name: 'ZIP Archive', extensions: ['zip'] },
      ],
    });
    return { canceled: result.canceled, paths: result.filePaths };
  });

  ipcMain.handle(IPC.fileReadBinary, async (_event, filePath: string) => {
    const { readFile } = await import('fs/promises');
    const buffer = await readFile(filePath);
    return new Uint8Array(buffer);
  });
}
