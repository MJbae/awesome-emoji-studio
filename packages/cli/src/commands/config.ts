import { platform } from '../platform/adapter.js';
import { validateApiKey } from '../services/gemini/index.js';
import { isJsonMode, emitJson, printInfo, printError } from '../io/output.js';

export async function configSetKey(key: string): Promise<void> {
  if (!validateApiKey(key)) {
    const err = { type: 'error' as const, code: 'VALIDATION', message: 'Invalid API key format. Key should start with "AIza" and be at least 30 characters.', retryable: false };
    if (isJsonMode()) {
      emitJson(err);
    } else {
      printError(err);
    }
    process.exit(1);
  }

  await platform.setApiKey(key);

  if (isJsonMode()) {
    emitJson({ type: 'result', success: true, session_id: '', output_dir: '', exports: {}, sticker_count: 0, elapsed_time: '0s' } as any);
  } else {
    printInfo('API key saved successfully.');
  }
}

export async function configGetKey(): Promise<void> {
  const key = await platform.getApiKey();

  if (isJsonMode()) {
    process.stdout.write(JSON.stringify({ type: 'result', has_key: !!key, key_preview: key ? `${key.substring(0, 8)}...` : null }) + '\n');
  } else {
    if (key) {
      printInfo(`API key: ${key.substring(0, 8)}...${key.substring(key.length - 4)}`);
    } else {
      printInfo('No API key configured. Set one with: emoji-cli config set-key <key>');
    }
  }
}

export async function configDeleteKey(): Promise<void> {
  await platform.deleteApiKey();

  if (isJsonMode()) {
    process.stdout.write(JSON.stringify({ type: 'result', success: true }) + '\n');
  } else {
    printInfo('API key deleted.');
  }
}
