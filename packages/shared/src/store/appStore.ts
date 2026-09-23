import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createConfigSlice, type ConfigSlice } from './slices/configSlice';
import { createWorkflowSlice, type WorkflowSlice } from './slices/workflowSlice';
import { createAssetsSlice, type AssetsSlice } from './slices/assetsSlice';
import { createJobsSlice, type JobsSlice } from './slices/jobsSlice';
import { createExportSlice, type ExportSlice } from './slices/exportSlice';

export type AppState = ConfigSlice & WorkflowSlice & AssetsSlice & JobsSlice & ExportSlice;

import { isTargetLanguage } from '@/constants/languages';

export const useAppStore = create<AppState>()(
  persist(
    (...args) => ({
      ...createConfigSlice(...args),
      ...createWorkflowSlice(...args),
      ...createAssetsSlice(...args),
      ...createJobsSlice(...args),
      ...createExportSlice(...args),
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
          ...(isTargetLanguage(stored?.language) ? { language: stored.language } : {}),
        };
      },
    },
  ),
);

export function getAppState(): AppState {
  return useAppStore.getState();
}

if (typeof window !== 'undefined') {
  (window as Window & { useAppStore?: typeof useAppStore }).useAppStore = useAppStore;
}
