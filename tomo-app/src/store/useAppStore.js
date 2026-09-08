import { create } from 'zustand';

export const useAppStore = create(() => ({
  evolutionPoints: 0,
  evolutionStage: 1,
  isOverlayEnabled: false,
  isFocusSessionActive: false,
  onboarded: false,
}));
