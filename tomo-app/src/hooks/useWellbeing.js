import { useMemo } from 'react';

import { buildWeeklyReflection, hasThreeDifficultDays } from '../services/planning/studyPlanner.js';
import { useAppStore } from '../store/useAppStore.js';

/** Tổng hợp dữ liệu chăm sóc bản thân và các action local. */
export function useWellbeing() {
  const moodEntries = useAppStore((state) => state.moodEntries);
  const stressEntries = useAppStore((state) => state.stressEntries);
  const focusSessions = useAppStore((state) => state.focusSessions);
  const completedMicroActions = useAppStore((state) => state.completedMicroActions);
  const studyPlan = useAppStore((state) => state.studyPlan);
  const checkInMood = useAppStore((state) => state.checkInMood);
  const saveStressEntry = useAppStore((state) => state.saveStressEntry);
  const saveStressVoice = useAppStore((state) => state.saveStressVoice);
  const deleteStressEntry = useAppStore((state) => state.deleteStressEntry);
  const completeMicroAction = useAppStore((state) => state.completeMicroAction);

  const today = new Date().toISOString().slice(0, 10);
  const todayMood = [...moodEntries]
    .reverse()
    .find((entry) => entry.ts.slice(0, 10) === today)?.mood;
  const todayActions = useMemo(
    () => new Set(completedMicroActions.filter((item) => item.startsWith(`${today}:`))),
    [completedMicroActions, today],
  );
  const reflection = useMemo(
    () =>
      buildWeeklyReflection({
        moodEntries,
        focusSessions,
        completedMicroActions,
        studyPlan,
      }),
    [completedMicroActions, focusSessions, moodEntries, studyPlan],
  );

  return {
    moodEntries,
    stressEntries,
    today,
    todayMood,
    todayActions,
    reflection,
    needsGentleCheckIn: hasThreeDifficultDays(moodEntries),
    checkInMood,
    saveStressEntry,
    saveStressVoice,
    deleteStressEntry,
    completeMicroAction,
  };
}
