import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createConfigSlice, type ConfigSlice, type SupportedLanguage } from './slices/configSlice';
import { createWorkflowSlice, type WorkflowSlice } from './slices/workflowSlice';
import { createAssetsSlice, type AssetsSlice } from './slices/assetsSlice';
import { createJobsSlice, type JobsSlice } from './slices/jobsSlice';

export type AppState = ConfigSlice & WorkflowSlice & AssetsSlice & JobsSlice;

const VALID_LANGUAGES: readonly SupportedLanguage[] = [
  'Korean',
  'Japanese',
  'Traditional Chinese',
] as const;

function isValidLanguage(value: unknown): value is SupportedLanguage {
  return typeof value === 'string' && VALID_LANGUAGES.includes(value as SupportedLanguage);
}

export const useAppStore = create<AppState>()(
  persist(
    (...args) => ({
      ...createConfigSlice(...args),
      ...createWorkflowSlice(...args),
      ...createAssetsSlice(...args),
      ...createJobsSlice(...args),
    }),
    {
      name: 'emoticon-studio-config',
      version: 1,
      partialize: (state) => ({
        language: state.language,
      }),
      merge: (persisted, current) => {
        const stored = persisted as Record<string, unknown> | undefined;
        return {
          ...current,
          ...(isValidLanguage(stored?.language) ? { language: stored.language } : {}),
        };
      },
    },
  ),
);

export function getAppState(): AppState {
  return useAppStore.getState();
}

if (typeof window !== 'undefined') {
  (window as any).useAppStore = useAppStore;
}
