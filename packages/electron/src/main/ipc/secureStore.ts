import { safeStorage, ipcMain } from 'electron';
import Store from 'electron-store';
import { IPC } from '../../shared/ipc';

// electron-store@^8.2.0 (CJS compatible)
const store = new Store({ name: 'secure-config' });

function encrypt(value: string): string {
  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.encryptString(value).toString('hex');
  }
  throw new Error(
    'OS encryption unavailable. API key will only be stored in memory for this session.',
  );
}

function decrypt(hex: string): string {
  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.decryptString(Buffer.from(hex, 'hex'));
  }
  throw new Error('OS encryption unavailable. Cannot decrypt stored key.');
}

// Must be called after app.whenReady()
export function registerSecureStoreHandlers(): void {
  ipcMain.handle(IPC.secureGetApiKey, async () => {
    const encrypted = store.get('geminiApiKey') as string | undefined;
    if (!encrypted) return null;
    try {
      return decrypt(encrypted);
    } catch {
      store.delete('geminiApiKey');
      return null;
    }
  });

  ipcMain.handle(IPC.secureSetApiKey, async (_, req: { key: string }) => {
    store.set('geminiApiKey', encrypt(req.key));
  });

  ipcMain.handle(IPC.secureDeleteApiKey, async () => {
    store.delete('geminiApiKey');
  });
}
