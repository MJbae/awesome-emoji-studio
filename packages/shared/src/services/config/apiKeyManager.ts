import { platform } from '@/platform/adapter';

let inMemoryKey: string | null = null;

export function getApiKey(): string | null {
  return inMemoryKey;
}

export function setApiKey(key: string): void {
  inMemoryKey = key;
}

export function clearApiKey(): void {
  inMemoryKey = null;
}

export async function getApiKeyAsync(): Promise<string | null> {
  const key = await platform.getApiKey();
  inMemoryKey = key;
  return key;
}

export async function setApiKeyAsync(key: string): Promise<void> {
  await platform.setApiKey(key);
  inMemoryKey = key;
}

export async function clearApiKeyAsync(): Promise<void> {
  await platform.deleteApiKey();
  inMemoryKey = null;
}

export function validateApiKey(key: string): boolean {
  if (!key || key.trim().length === 0) return false;
  if (key === 'your_gemini_api_key_here' || key === 'PLACEHOLDER_API_KEY') return false;
  return key.startsWith('AIza') && key.length >= 30;
}
