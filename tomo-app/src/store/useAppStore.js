import { create } from 'zustand';

import { readAppState, writeAppState } from '../services/storage/appStateStorage.js';
import { appendFacts } from '../services/storage/memoryStorage.js';

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
  isFocusRemindersEnabled: false,
  onboarded: false,
  isHydrated: false,
  moodEntries: [],
  stressEntries: [],
  focusSessions: [],
  completedMicroActions: [],
  studySubjects: [],
  studyCommitments: [],
  studyPlan: [],
  testResults: [],
  coworkingSessions: [],
  encouragementCount: 0,
  effortBalance: 0,
  ownedCosmetics: ['basic-shirt'],
  equippedCosmetic: 'basic-shirt',
  evolutionMilestones: [],

  /** Nạp state đã persist khi app khởi động. */
  async hydrate() {
    const state = await readAppState();
    set({
      ...state,
      evolutionStage: resolveEvolutionStage(state.evolutionPoints),
      isHydrated: true,
    });
  },

  /** Cộng một điểm kết nối và persist ngay để không mất state khi app bị đóng. */
  async addConnectionPoint() {
    const previousStage = get().evolutionStage;
    const evolutionPoints = get().evolutionPoints + 1;
    const evolutionStage = resolveEvolutionStage(evolutionPoints);
    const effortBalance = (Number(get().effortBalance) || 0) + 1;
    const evolutionMilestones =
      evolutionStage > previousStage
        ? [
            ...(get().evolutionMilestones ?? []),
            { stage: evolutionStage, ts: new Date().toISOString() },
          ]
        : get().evolutionMilestones;
    set({ evolutionPoints, evolutionStage, effortBalance, evolutionMilestones });
    await writeAppState({
      evolutionPoints,
      evolutionStage,
      effortBalance,
      evolutionMilestones,
    });
    if (evolutionStage > previousStage) {
      await appendFacts([
        `Kỷ niệm tiến hóa: Tomo đã lớn lên giai đoạn ${evolutionStage} nhờ những nỗ lực thật của bạn.`,
      ]);
    }
    return { evolutionPoints, evolutionStage };
  },

  /** Cập nhật một phần state và đồng bộ xuống app_state.json. */
  async patchState(patch) {
    set(patch);
    return writeAppState(patch);
  },

  async checkInMood(mood) {
    const entry = { mood, ts: new Date().toISOString() };
    const today = entry.ts.slice(0, 10);
    const moodEntries = [
      ...get().moodEntries.filter((item) => item.ts.slice(0, 10) !== today),
      entry,
    ].slice(-30);
    await get().patchState({ moodEntries });
    return entry;
  },

  async saveStressEntry(text) {
    const trimmed = text.trim();
    if (!trimmed) return null;
    const entry = { text: trimmed, ts: new Date().toISOString() };
    const stressEntries = [...get().stressEntries, entry].slice(-30);
    await get().patchState({ stressEntries });
    return entry;
  },

  async saveStressVoice(uri) {
    if (!uri) return null;
    const entry = { type: 'voice', uri, ts: new Date().toISOString() };
    const stressEntries = [...get().stressEntries, entry].slice(-30);
    await get().patchState({ stressEntries });
    return entry;
  },

  async deleteStressEntry(timestamp) {
    const stressEntries = get().stressEntries.filter((entry) => entry.ts !== timestamp);
    await get().patchState({ stressEntries });
  },

  async completeMicroAction(action) {
    const today = new Date().toISOString().slice(0, 10);
    const key = `${today}:${action}`;
    if (get().completedMicroActions.includes(key)) return false;
    const completedMicroActions = [...get().completedMicroActions, key].slice(-90);
    await get().patchState({ completedMicroActions });
    await get().addConnectionPoint();
    return true;
  },

  async recordFocusSession(minutes) {
    const duration = Math.max(1, Math.round(Number(minutes) || 0));
    const focusSessions = [
      ...get().focusSessions,
      { minutes: duration, ts: new Date().toISOString() },
    ].slice(-30);
    await get().patchState({ focusSessions });
    await get().addConnectionPoint();
  },

  async saveStudySubject(subject) {
    const normalized = {
      id: subject.id ?? `${Date.now()}`,
      name: String(subject.name ?? '').trim(),
      currentScore: Number(subject.currentScore) || 0,
      targetScore: Number(subject.targetScore) || 0,
      isDifficult: Boolean(subject.isDifficult),
    };
    if (!normalized.name) return null;
    const studySubjects = [
      ...get().studySubjects.filter((item) => item.id !== normalized.id),
      normalized,
    ];
    await get().patchState({ studySubjects });
    return normalized;
  },

  async addStudyCommitment(commitment) {
    const normalized = {
      id: commitment.id ?? `${Date.now()}`,
      day: Number(commitment.day),
      startHour: Number(commitment.startHour),
      endHour: Number(commitment.endHour),
      title: String(commitment.title ?? '').trim(),
    };
    if (!normalized.title) return null;
    const studyCommitments = [...get().studyCommitments, normalized].slice(-50);
    await get().patchState({ studyCommitments });
    return normalized;
  },

  async saveStudyPlan(studyPlan) {
    await get().patchState({ studyPlan: Array.isArray(studyPlan) ? studyPlan : [] });
  },

  async recordTestResult(result) {
    const entry = {
      id: `${Date.now()}`,
      subjectId: result.subjectId,
      score: Number(result.score),
      ts: new Date().toISOString(),
    };
    const testResults = [...get().testResults, entry].slice(-50);
    await get().patchState({ testResults });
    return entry;
  },

  async recordCoworkingSession(session) {
    const entry = {
      id: `${Date.now()}`,
      subject: String(session.subject ?? '').trim() || 'Học tự do',
      minutes: Math.max(1, Math.round(Number(session.minutes) || 1)),
      ts: new Date().toISOString(),
    };
    const coworkingSessions = [...get().coworkingSessions, entry].slice(-30);
    await get().patchState({ coworkingSessions });
    await get().addConnectionPoint();
    return entry;
  },

  async sendEncouragement() {
    const encouragementCount = get().encouragementCount + 1;
    await get().patchState({ encouragementCount });
    return encouragementCount;
  },

  async buyCosmetic(cosmetic) {
    if (!cosmetic?.id || get().ownedCosmetics.includes(cosmetic.id)) return false;
    const price = Math.max(0, Number(cosmetic.price) || 0);
    if (get().effortBalance < price) return false;
    const effortBalance = get().effortBalance - price;
    const ownedCosmetics = [...get().ownedCosmetics, cosmetic.id];
    await get().patchState({ effortBalance, ownedCosmetics });
    return true;
  },

  async equipCosmetic(cosmeticId) {
    if (!get().ownedCosmetics.includes(cosmeticId)) return false;
    await get().patchState({ equippedCosmetic: cosmeticId });
    return true;
  },
}));
