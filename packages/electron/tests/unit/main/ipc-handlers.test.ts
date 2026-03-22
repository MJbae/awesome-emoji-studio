import { vi, describe, it, expect, beforeEach } from 'vitest';

const handlers = new Map<string, Function>();

const mockStoreData = new Map<string, unknown>();

const mockDialogShowSaveDialog = vi.fn();
const mockDialogShowOpenDialog = vi.fn();
const mockWriteFile = vi.fn();
const mockMkdir = vi.fn();
const mockReadFile = vi.fn();

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((channel: string, handler: Function) => {
      handlers.set(channel, handler);
    }),
  },
  safeStorage: {
    isEncryptionAvailable: vi.fn(() => true),
    encryptString: vi.fn((value: string) => Buffer.from(`enc:${value}`)),
    decryptString: vi.fn((buffer: Buffer) => {
      const str = buffer.toString();
      if (str.startsWith('enc:')) return str.slice(4);
      throw new Error('Decryption failed');
    }),
  },
  app: {
    getVersion: vi.fn(() => '1.0.0'),
    getPath: vi.fn((name: string) => `/mock/${name}`),
  },
  dialog: {
    showSaveDialog: (...args: unknown[]) => mockDialogShowSaveDialog(...args),
    showOpenDialog: (...args: unknown[]) => mockDialogShowOpenDialog(...args),
  },
  shell: { openExternal: vi.fn() },
}));

vi.mock('fs/promises', () => ({
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
  mkdir: (...args: unknown[]) => mockMkdir(...args),
  readFile: (...args: unknown[]) => mockReadFile(...args),
}));

vi.mock('electron-store', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      get: vi.fn((key: string) => mockStoreData.get(key)),
      set: vi.fn((key: string, value: unknown) => mockStoreData.set(key, value)),
      delete: vi.fn((key: string) => mockStoreData.delete(key)),
    })),
  };
});

describe('IPC Handlers', () => {
  beforeEach(() => {
    handlers.clear();
    mockStoreData.clear();
    mockDialogShowSaveDialog.mockReset();
    mockDialogShowOpenDialog.mockReset();
    mockWriteFile.mockReset();
    mockMkdir.mockReset();
    mockReadFile.mockReset();
    vi.resetModules();
  });

  it('registers all expected channels', async () => {
    const { registerSecureStoreHandlers } = await import('../../../src/main/ipc/secureStore');
    const { registerFileServiceHandlers } = await import('../../../src/main/ipc/fileService');
    const { registerAppInfoHandlers } = await import('../../../src/main/ipc/appInfo');

    registerSecureStoreHandlers();
    registerFileServiceHandlers();
    registerAppInfoHandlers();

    expect(handlers.has('secure:getApiKey')).toBe(true);
    expect(handlers.has('secure:setApiKey')).toBe(true);
    expect(handlers.has('secure:deleteApiKey')).toBe(true);
    expect(handlers.has('file:showSaveDialog')).toBe(true);
    expect(handlers.has('file:saveBinary')).toBe(true);
    expect(handlers.has('file:showOpenDialog')).toBe(true);
    expect(handlers.has('file:readBinary')).toBe(true);
    expect(handlers.has('app:getVersion')).toBe(true);
    expect(handlers.has('app:getPaths')).toBe(true);
    expect(handlers.has('shell:openExternal')).toBe(true);
  });

  it('appGetVersion returns app version', async () => {
    const { registerAppInfoHandlers } = await import('../../../src/main/ipc/appInfo');
    registerAppInfoHandlers();

    const handler = handlers.get('app:getVersion')!;
    const version = await handler();
    expect(version).toBe('1.0.0');
  });

  it('appGetPaths returns documents and userData paths', async () => {
    const { registerAppInfoHandlers } = await import('../../../src/main/ipc/appInfo');
    registerAppInfoHandlers();

    const handler = handlers.get('app:getPaths')!;
    const paths = await handler();
    expect(paths).toEqual({
      documents: '/mock/documents',
      userData: '/mock/userData',
    });
  });

  it('shellOpenExternal rejects non-HTTPS URLs', async () => {
    const { registerAppInfoHandlers } = await import('../../../src/main/ipc/appInfo');
    registerAppInfoHandlers();

    const handler = handlers.get('shell:openExternal')!;
    await expect(handler({}, 'http://example.com')).rejects.toThrow('Only HTTPS URLs are allowed');
  });

  it('secureGetApiKey returns null when no key stored', async () => {
    const { registerSecureStoreHandlers } = await import('../../../src/main/ipc/secureStore');
    registerSecureStoreHandlers();

    const handler = handlers.get('secure:getApiKey')!;
    const result = await handler();
    expect(result).toBeNull();
  });

  it('secureSetApiKey stores encrypted key and secureGetApiKey decrypts it', async () => {
    const { registerSecureStoreHandlers } = await import('../../../src/main/ipc/secureStore');
    registerSecureStoreHandlers();

    const setHandler = handlers.get('secure:setApiKey')!;
    await setHandler({}, { key: 'AIzaTestKey12345' });

    expect(mockStoreData.has('geminiApiKey')).toBe(true);
    const encrypted = mockStoreData.get('geminiApiKey') as string;
    expect(encrypted).not.toBe('AIzaTestKey12345');

    const getHandler = handlers.get('secure:getApiKey')!;
    const result = await getHandler();
    expect(result).toBe('AIzaTestKey12345');
  });

  it('secureDeleteApiKey removes stored key', async () => {
    const { registerSecureStoreHandlers } = await import('../../../src/main/ipc/secureStore');
    registerSecureStoreHandlers();

    const setHandler = handlers.get('secure:setApiKey')!;
    await setHandler({}, { key: 'AIzaTestKey12345' });
    expect(mockStoreData.has('geminiApiKey')).toBe(true);

    const deleteHandler = handlers.get('secure:deleteApiKey')!;
    await deleteHandler();
    expect(mockStoreData.has('geminiApiKey')).toBe(false);

    const getHandler = handlers.get('secure:getApiKey')!;
    const result = await getHandler();
    expect(result).toBeNull();
  });

  it('secureGetApiKey deletes corrupt data and returns null', async () => {
    const { registerSecureStoreHandlers } = await import('../../../src/main/ipc/secureStore');
    registerSecureStoreHandlers();

    mockStoreData.set('geminiApiKey', 'not-valid-hex-data');

    const handler = handlers.get('secure:getApiKey')!;
    const result = await handler();
    expect(result).toBeNull();
    expect(mockStoreData.has('geminiApiKey')).toBe(false);
  });

  it('fileShowSaveDialog returns selected path', async () => {
    mockDialogShowSaveDialog.mockResolvedValue({ canceled: false, filePath: '/mock/test.zip' });

    const { registerFileServiceHandlers } = await import('../../../src/main/ipc/fileService');
    registerFileServiceHandlers();

    const handler = handlers.get('file:showSaveDialog')!;
    const result = await handler({}, { defaultPath: '/mock/test.zip', filters: [] });
    expect(result).toEqual({ canceled: false, path: '/mock/test.zip' });
  });

  it('fileShowSaveDialog returns canceled when user cancels', async () => {
    mockDialogShowSaveDialog.mockResolvedValue({ canceled: true, filePath: undefined });

    const { registerFileServiceHandlers } = await import('../../../src/main/ipc/fileService');
    registerFileServiceHandlers();

    const handler = handlers.get('file:showSaveDialog')!;
    const result = await handler({}, {});
    expect(result).toEqual({ canceled: true, path: null });
  });

  it('fileSaveBinary writes file after dialog selection', async () => {
    mockDialogShowSaveDialog.mockResolvedValue({ canceled: false, filePath: '/mock/output.zip' });
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);

    const { registerFileServiceHandlers } = await import('../../../src/main/ipc/fileService');
    registerFileServiceHandlers();

    const testData = new Uint8Array([1, 2, 3, 4]);
    const handler = handlers.get('file:saveBinary')!;
    const result = await handler({}, { data: testData, defaultName: 'test.zip' });

    expect(result).toEqual({ canceled: false, path: '/mock/output.zip' });
    expect(mockMkdir).toHaveBeenCalledWith('/mock', { recursive: true });
    expect(mockWriteFile).toHaveBeenCalled();
  });

  it('fileSaveBinary returns canceled when user cancels dialog', async () => {
    mockDialogShowSaveDialog.mockResolvedValue({ canceled: true, filePath: undefined });

    const { registerFileServiceHandlers } = await import('../../../src/main/ipc/fileService');
    registerFileServiceHandlers();

    const handler = handlers.get('file:saveBinary')!;
    const result = await handler({}, { data: new Uint8Array([1]), defaultName: 'test.zip' });
    expect(result).toEqual({ canceled: true, path: null });
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it('fileSaveBinary throws DISK_FULL on ENOSPC', async () => {
    mockDialogShowSaveDialog.mockResolvedValue({ canceled: false, filePath: '/mock/out.zip' });
    mockMkdir.mockResolvedValue(undefined);
    const enospc = Object.assign(new Error('no space'), { code: 'ENOSPC' });
    mockWriteFile.mockRejectedValue(enospc);

    const { registerFileServiceHandlers } = await import('../../../src/main/ipc/fileService');
    registerFileServiceHandlers();

    const handler = handlers.get('file:saveBinary')!;
    await expect(
      handler({}, { data: new Uint8Array([1]), defaultName: 'test.zip' }),
    ).rejects.toThrow('DISK_FULL');
  });

  it('fileSaveBinary throws PERMISSION_DENIED on EACCES', async () => {
    mockDialogShowSaveDialog.mockResolvedValue({ canceled: false, filePath: '/mock/out.zip' });
    mockMkdir.mockResolvedValue(undefined);
    const eacces = Object.assign(new Error('permission denied'), { code: 'EACCES' });
    mockWriteFile.mockRejectedValue(eacces);

    const { registerFileServiceHandlers } = await import('../../../src/main/ipc/fileService');
    registerFileServiceHandlers();

    const handler = handlers.get('file:saveBinary')!;
    await expect(
      handler({}, { data: new Uint8Array([1]), defaultName: 'test.zip' }),
    ).rejects.toThrow('PERMISSION_DENIED');
  });

  it('fileShowOpenDialog returns selected paths', async () => {
    mockDialogShowOpenDialog.mockResolvedValue({
      canceled: false,
      filePaths: ['/mock/img1.png', '/mock/img2.jpg'],
    });

    const { registerFileServiceHandlers } = await import('../../../src/main/ipc/fileService');
    registerFileServiceHandlers();

    const handler = handlers.get('file:showOpenDialog')!;
    const result = await handler({});
    expect(result).toEqual({
      canceled: false,
      paths: ['/mock/img1.png', '/mock/img2.jpg'],
    });
  });

  it('fileReadBinary returns file contents as Uint8Array', async () => {
    const fileContents = Buffer.from([10, 20, 30, 40]);
    mockReadFile.mockResolvedValue(fileContents);

    const { registerFileServiceHandlers } = await import('../../../src/main/ipc/fileService');
    registerFileServiceHandlers();

    const handler = handlers.get('file:readBinary')!;
    const result = await handler({}, '/mock/file.png');
    expect(result).toEqual(new Uint8Array([10, 20, 30, 40]));
    expect(mockReadFile).toHaveBeenCalledWith('/mock/file.png');
  });
});
