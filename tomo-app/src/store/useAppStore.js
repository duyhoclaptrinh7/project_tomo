import { create } from 'zustand';

import { readAppState, writeAppState } from '../services/storage/appStateStorage.js';

/** Tính stage từ điểm tiến hoá; mốc MVP đã chốt là 10 và 30. */
export function resolveEvolutionStage(points) {
  if (points >= 30) return 3;
  if (points >= 10) return 2;
  return 1;
}

export const useAppStore = create((set, get) => ({
  evolutionPoints: 0,
  evolutionStage: 1,
  isOverlayEnabled: false,
  isFocusSessionActive: false,
  onboarded: false,

  /** Nạp state đã persist khi app khởi động. */
  async hydrate() {
    const state = await readAppState();
    set({
      ...state,
      evolutionStage: resolveEvolutionStage(state.evolutionPoints),
    });
  },

  /** Cộng một điểm kết nối và persist ngay để không mất state khi app bị đóng. */
  async addConnectionPoint() {
    const evolutionPoints = get().evolutionPoints + 1;
    const evolutionStage = resolveEvolutionStage(evolutionPoints);
    set({ evolutionPoints, evolutionStage });
    await writeAppState({ evolutionPoints, evolutionStage });
    return { evolutionPoints, evolutionStage };
  },

  /** Cập nhật một phần state và đồng bộ xuống app_state.json. */
  async patchState(patch) {
    set(patch);
    return writeAppState(patch);
  },
}));
