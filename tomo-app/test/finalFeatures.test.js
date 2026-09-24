import { describe, expect, it } from 'vitest';

import {
  buildStudyPlan,
  buildWeeklyReflection,
  calculateBalancedStreak,
  hasThreeDifficultDays,
} from '../src/services/planning/studyPlanner.js';

describe('FINAL.md feature logic', () => {
  it('detects exactly three consecutive difficult days', () => {
    const entries = [
      { mood: 'te', ts: '2026-09-20T08:00:00.000Z' },
      { mood: 'te', ts: '2026-09-21T08:00:00.000Z' },
      { mood: 'te', ts: '2026-09-22T08:00:00.000Z' },
    ];
    expect(hasThreeDifficultDays(entries)).toBe(true);
    expect(hasThreeDifficultDays(entries.slice(0, 2))).toBe(false);
  });

  it('prioritizes a difficult weak subject and avoids an occupied golden hour', () => {
    const plan = buildStudyPlan({
      subjects: [
        { id: 'math', name: 'Toán', currentScore: 7, targetScore: 9, isDifficult: true },
        { id: 'english', name: 'Anh', currentScore: 8, targetScore: 9, isDifficult: false },
      ],
      testResults: [{ subjectId: 'math', score: 4 }],
      commitments: [{ day: 0, startHour: 19, endHour: 20, title: 'Học thêm' }],
      energyWindow: 'evening',
      days: 2,
    });

    expect(plan[0]).toMatchObject({ subjectId: 'math', startHour: 20 });
    expect(plan[0].reason).toContain('4 điểm');
    expect(plan[1].subjectId).toBe('english');
  });

  it('creates an encouraging cross-layer weekly reflection', () => {
    const now = new Date().toISOString();
    const reflection = buildWeeklyReflection({
      moodEntries: [{ mood: 'lo', ts: now }],
      focusSessions: [{ minutes: 25, ts: now }],
      completedMicroActions: [`${now.slice(0, 10)}:water`],
      studyPlan: [{ durationMinutes: 40 }],
    });
    expect(reflection).toMatchObject({ focusMinutes: 25, selfCareCount: 1, plannedMinutes: 40 });
    expect(reflection.praise).toContain('bền bỉ');
  });

  it('only keeps a streak when learning and self-care happen on the same day', () => {
    const today = new Date().toISOString();
    expect(
      calculateBalancedStreak({
        focusSessions: [{ minutes: 25, ts: today }],
        completedMicroActions: [`${today.slice(0, 10)}:water`],
      }),
    ).toBe(1);
    expect(
      calculateBalancedStreak({
        focusSessions: [{ minutes: 25, ts: today }],
        completedMicroActions: [],
      }),
    ).toBe(0);
  });
});
