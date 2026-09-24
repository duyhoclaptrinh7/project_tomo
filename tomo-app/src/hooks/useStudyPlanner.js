import { useCallback, useMemo, useState } from 'react';

import { buildStudyPlan } from '../services/planning/studyPlanner.js';
import { useAppStore } from '../store/useAppStore.js';

/** Quản lý thiết lập và sinh lịch học local-first. */
export function useStudyPlanner() {
  const studySubjects = useAppStore((state) => state.studySubjects);
  const studyCommitments = useAppStore((state) => state.studyCommitments);
  const studyPlan = useAppStore((state) => state.studyPlan);
  const testResults = useAppStore((state) => state.testResults);
  const saveStudySubject = useAppStore((state) => state.saveStudySubject);
  const addStudyCommitment = useAppStore((state) => state.addStudyCommitment);
  const saveStudyPlan = useAppStore((state) => state.saveStudyPlan);
  const recordTestResult = useAppStore((state) => state.recordTestResult);
  const [energyWindow, setEnergyWindow] = useState('evening');

  const generatePlan = useCallback(async () => {
    const next = buildStudyPlan({
      subjects: studySubjects,
      commitments: studyCommitments,
      testResults,
      energyWindow,
    });
    await saveStudyPlan(next);
    return next;
  }, [energyWindow, saveStudyPlan, studyCommitments, studySubjects, testResults]);

  const subjectsById = useMemo(
    () => new Map(studySubjects.map((subject) => [subject.id, subject])),
    [studySubjects],
  );

  return {
    studySubjects,
    studyCommitments,
    studyPlan,
    testResults,
    subjectsById,
    energyWindow,
    setEnergyWindow,
    saveStudySubject,
    addStudyCommitment,
    recordTestResult,
    generatePlan,
  };
}
