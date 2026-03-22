import type { StateCreator } from 'zustand';
import type { PlatformId, ExportJob } from '@/types/domain';
import { AVAILABLE_PLATFORMS } from '@/constants/platforms';

export interface ExportSlice {
  selectedExportPlatforms: PlatformId[];
  exportJobs: ExportJob[];
  isExporting: boolean;
  setSelectedExportPlatforms: (platforms: PlatformId[]) => void;
  toggleExportPlatform: (platform: PlatformId) => void;
  selectAllPlatforms: () => void;
  deselectAllPlatforms: () => void;
  updateExportJob: (platformId: PlatformId, update: Partial<ExportJob>) => void;
  resetExport: () => void;
}

export const createExportSlice: StateCreator<ExportSlice, [], [], ExportSlice> = (set, get) => ({
  selectedExportPlatforms: [...AVAILABLE_PLATFORMS],
  exportJobs: [],
  isExporting: false,

  setSelectedExportPlatforms: (platforms: PlatformId[]) => {
    set({ selectedExportPlatforms: platforms });
  },

  toggleExportPlatform: (platform: PlatformId) => {
    const { selectedExportPlatforms } = get();
    const exists = selectedExportPlatforms.includes(platform);
    set({
      selectedExportPlatforms: exists
        ? selectedExportPlatforms.filter((p) => p !== platform)
        : [...selectedExportPlatforms, platform],
    });
  },

  selectAllPlatforms: () => {
    set({ selectedExportPlatforms: [...AVAILABLE_PLATFORMS] });
  },

  deselectAllPlatforms: () => {
    set({ selectedExportPlatforms: [] });
  },

  updateExportJob: (platformId: PlatformId, update: Partial<ExportJob>) => {
    const { exportJobs } = get();
    const idx = exportJobs.findIndex((j) => j.platformId === platformId);
    if (idx >= 0) {
      const updated = [...exportJobs];
      updated[idx] = { ...updated[idx]!, ...update };
      set({ exportJobs: updated });
    } else {
      set({
        exportJobs: [
          ...exportJobs,
          { platformId, status: 'pending', progress: 0, ...update },
        ],
      });
    }
  },

  resetExport: () => {
    set({ exportJobs: [], isExporting: false });
  },
});
