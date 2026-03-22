import { _electron as electron, type ElectronApplication } from '@playwright/test';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

export interface AppContext {
  app: ElectronApplication;
  userDataDir: string;
}

export async function launchApp(existingUserDataDir?: string): Promise<AppContext> {
  const userDataDir = existingUserDataDir ?? (await mkdtemp(join(tmpdir(), 'emoticon-e2e-')));

  const app = await electron.launch({
    args: ['./out/main/index.js'],
    env: {
      ...process.env,
      EMOTICON_STUDIO_E2E: '1',
      EMOTICON_STUDIO_USER_DATA_DIR: userDataDir,
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
