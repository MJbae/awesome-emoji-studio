import type { StateCreator } from 'zustand';
import type {
  UserInput,
  LLMStrategy,
  CharacterSpec,
  Sticker,
  ProcessedImage,
  MetaResult,
} from '@/types/domain';

export interface AssetsSlice {
  userInput: UserInput | null;
  strategy: LLMStrategy | null;
  mainImage: string | null;
  characterSpec: CharacterSpec | null;
  stickers: Sticker[];
  processedImages: ProcessedImage[];
  metadata: MetaResult[];

  setUserInput: (input: UserInput) => void;
  setStrategy: (strategy: LLMStrategy) => void;
  setMainImage: (image: string) => void;
  setCharacterSpec: (spec: CharacterSpec) => void;
  setStickers: (stickers: Sticker[]) => void;
  updateSticker: (id: number, update: Partial<Sticker>) => void;
  setProcessedImages: (images: ProcessedImage[]) => void;
  setMetadata: (metadata: MetaResult[]) => void;
  resetAssets: () => void;
}

const INITIAL_ASSETS = {
  userInput: null,
  strategy: null,
  mainImage: null,
  characterSpec: null,
  stickers: [] as Sticker[],
  processedImages: [] as ProcessedImage[],
  metadata: [] as MetaResult[],
} as const;

export const createAssetsSlice: StateCreator<AssetsSlice, [], [], AssetsSlice> = (set) => ({
  ...INITIAL_ASSETS,

  setUserInput: (input: UserInput) => {
    set({ userInput: input });
  },

  setStrategy: (strategy: LLMStrategy) => {
    set({ strategy });
  },

  setMainImage: (image: string) => {
    set({ mainImage: image });
  },

  setCharacterSpec: (spec: CharacterSpec) => {
    set({ characterSpec: spec });
  },

  setStickers: (stickers: Sticker[]) => {
    set({ stickers });
  },

  updateSticker: (id: number, update: Partial<Sticker>) => {
    set((state) => ({
      stickers: state.stickers.map((s) =>
        s.id === id ? { ...s, ...update } : s,
      ),
    }));
  },

  setProcessedImages: (images: ProcessedImage[]) => {
    set({ processedImages: images });
  },

  setMetadata: (metadata: MetaResult[]) => {
    set({ metadata });
  },

  resetAssets: () => {
    set({ ...INITIAL_ASSETS });
  },
});
