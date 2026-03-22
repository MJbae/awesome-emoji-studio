import { contextBridge, ipcRenderer } from 'electron';
import { IPC, type DesktopAPI } from '../shared/ipc';

const updaterCallbacks = {
  available: new Set<(info: { version: string }) => void>(),
  downloaded: new Set<() => void>(),
};

ipcRenderer.on('event:updater:available', (_event, info) => {
  updaterCallbacks.available.forEach((cb) => cb(info));
});
ipcRenderer.on('event:updater:downloaded', () => {
  updaterCallbacks.downloaded.forEach((cb) => cb());
});

const api: DesktopAPI = {
  secure: {
    getApiKey: () => ipcRenderer.invoke(IPC.secureGetApiKey),
    setApiKey: (req) => ipcRenderer.invoke(IPC.secureSetApiKey, req),
    deleteApiKey: () => ipcRenderer.invoke(IPC.secureDeleteApiKey),
  },
  file: {
    showSaveDialog: (req) => ipcRenderer.invoke(IPC.fileShowSaveDialog, req),
    saveBinary: (req) => ipcRenderer.invoke(IPC.fileSaveBinary, req),
    showOpenDialog: () => ipcRenderer.invoke(IPC.fileShowOpenDialog),
    readBinary: (path) => ipcRenderer.invoke(IPC.fileReadBinary, path),
  },
  app: {
    getVersion: () => ipcRenderer.invoke(IPC.appGetVersion),
    getPaths: () => ipcRenderer.invoke(IPC.appGetPaths),
  },
  updater: {
    check: () => ipcRenderer.invoke(IPC.updaterCheck),
    onAvailable: (cb) => {
      updaterCallbacks.available.add(cb);
      return () => {
        updaterCallbacks.available.delete(cb);
      };
    },
    onDownloaded: (cb) => {
      updaterCallbacks.downloaded.add(cb);
      return () => {
        updaterCallbacks.downloaded.delete(cb);
      };
    },
  },
  shell: {
    openExternal: (url) => ipcRenderer.invoke(IPC.shellOpenExternal, url),
  },
};

contextBridge.exposeInMainWorld('desktop', api);
