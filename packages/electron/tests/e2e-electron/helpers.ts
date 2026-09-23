import { _electron as electron, type ElectronApplication } from '@playwright/test';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { pathToFileURL } from 'url';

export interface AppContext {
  app: ElectronApplication;
  userDataDir: string;
}

export async function launchApp(existingUserDataDir?: string): Promise<AppContext> {
  const userDataDir = existingUserDataDir ?? (await mkdtemp(join(tmpdir(), 'emoticon-e2e-')));
  // Imported main modules create electron-store instances synchronously. Set the
  // profile before importing the real app so tests never touch a user's profile.
  const bootstrap = join(userDataDir, 'e2e-bootstrap.cjs');
  await writeFile(bootstrap, [
    "const { app } = require('electron');",
    "app.setPath('userData', process.env.EMOTICON_STUDIO_USER_DATA_DIR);",
    `import(${JSON.stringify(pathToFileURL(resolve('out/main/index.js')).href)});`,
  ].join('\n'));
  const environment = { ...process.env };
  delete environment.ELECTRON_RUN_AS_NODE;

  const app = await electron.launch({
    args: [bootstrap],
    timeout: 30_000,
    env: {
      ...environment,
      EMOTICON_STUDIO_E2E: '1',
      EMOTICON_STUDIO_USER_DATA_DIR: userDataDir,
      ELECTRON_RENDERER_URL: '',
    },
  });

  return { app, userDataDir };
}

export async function cleanupApp(ctx: AppContext): Promise<void> {
  try {
    await ctx.app.close();
  } catch {
    // app may already be closed
  }
  try {
    await rm(ctx.userDataDir, { recursive: true, force: true });
  } catch {
    // best effort cleanup
  }
}
