import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const CONFIG_DIR = path.join(os.homedir(), '.emoji-master');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

interface CliConfig {
  apiKey?: string;
  language?: string;
  defaultPlatform?: string;
}

function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function readConfig(): CliConfig {
  ensureConfigDir();
  if (!fs.existsSync(CONFIG_FILE)) {
    return {};
  }
  const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
  return JSON.parse(raw) as CliConfig;
}

function writeConfig(config: CliConfig): void {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

export const platform = {
  async getApiKey(): Promise<string | null> {
    // Priority: env var > config file
    const envKey = process.env['GEMINI_API_KEY'];
    if (envKey) return envKey;

    const config = readConfig();
    return config.apiKey ?? null;
  },

  async setApiKey(key: string): Promise<void> {
    const config = readConfig();
    config.apiKey = key;
    writeConfig(config);
  },

  async deleteApiKey(): Promise<void> {
    const config = readConfig();
    delete config.apiKey;
    writeConfig(config);
  },

  async saveFile(data: Uint8Array, outputPath: string): Promise<boolean> {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, data);
    return true;
  },
};

export function getConfigDir(): string {
  return CONFIG_DIR;
}

export function getSessionsDir(): string {
  const dir = path.join(CONFIG_DIR, 'sessions');
  ensureConfigDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function getSessionDir(sessionId: string): string {
  const dir = path.join(getSessionsDir(), sessionId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}
