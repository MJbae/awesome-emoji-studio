import type { StateCreator } from 'zustand';
import type { PlatformId } from '@/types/domain';
import {
  setApiKey as setStoredApiKey,
  clearApiKey as clearStoredApiKey,
} from '@/services/config/apiKeyManager';
import { platform } from '@/platform/adapter';

export type SupportedLanguage = 'Korean' | 'Japanese' | 'Traditional Chinese';

export type KeyHydrationState = 'unknown' | 'present' | 'absent';

export interface ConfigSlice {
  apiKey: string | null;
  keyHydrated: KeyHydrationState;
  language: SupportedLanguage;
  defaultPlatform: PlatformId;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  setLanguage: (lang: SupportedLanguage) => void;
  setDefaultPlatform: (platform: PlatformId) => void;
  loadApiKeyAsync: () => Promise<void>;
  setApiKeyAsync: (key: string) => Promise<void>;
  clearApiKeyAsync: () => Promise<void>;
}

export const createConfigSlice: StateCreator<ConfigSlice, [], [], ConfigSlice> = (set) => ({
  apiKey: null,
  keyHydrated: 'unknown',
  language: 'Korean',
  defaultPlatform: 'line_emoji',

  setApiKey: (key: string) => {
    try {
      setStoredApiKey(key);
    } catch {
      /* in-memory only */
    }
    set({ apiKey: key, keyHydrated: 'present' });
  },

  clearApiKey: () => {
    try {
      clearStoredApiKey();
    } catch {
      /* in-memory only */
    }
    set({ apiKey: null, keyHydrated: 'absent' });
  },

  setLanguage: (lang: SupportedLanguage) => {
    set({ language: lang });
  },

  setDefaultPlatform: (platform: PlatformId) => {
    set({ defaultPlatform: platform });
  },

  loadApiKeyAsync: async () => {
    const key = await platform.getApiKey();
    if (key) {
      setStoredApiKey(key);
    } else {
      clearStoredApiKey();
    }
    set({
      apiKey: key,
      keyHydrated: key ? 'present' : 'absent',
    });
  },

  setApiKeyAsync: async (key: string) => {
    await platform.setApiKey(key);
    setStoredApiKey(key);
    set({ apiKey: key, keyHydrated: 'present' });
  },

  clearApiKeyAsync: async () => {
    await platform.deleteApiKey();
    clearStoredApiKey();
    set({ apiKey: null, keyHydrated: 'absent' });
  },
});
