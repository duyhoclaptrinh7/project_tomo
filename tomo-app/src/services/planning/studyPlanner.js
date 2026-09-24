const SLOT_START_HOURS = Object.freeze({
  morning: [5, 6],
  afternoon: [16, 17],
  evening: [19, 20],
});

function scoreSubject(subject, latestResult) {
  const currentScore = latestResult?.score ?? subject.currentScore ?? 0;
  const gap = Math.max(0, Number(subject.targetScore) - Number(currentScore));
  return gap + (subject.isDifficult ? 3 : 0);
}

function overlapsCommitment(day, startHour, commitments) {
  return commitments.some(
    (item) => item.day === day && startHour < item.endHour && startHour + 1 > item.startHour,
  );
}

/**
 * Tạo lịch tự học bảy ngày từ mục tiêu, môn khó và các khung giờ đã bận.
 * @param {object} input
 * @returns {Array<object>} Các phiên học một giờ, ưu tiên môn khó vào giờ năng lượng cao.
 */
export function buildStudyPlan({
  subjects = [],
  commitments = [],
  testResults = [],
  energyWindow = 'evening',
  days = 7,
}) {
  if (!subjects.length) return [];

  const latestResults = new Map();
  for (const result of testResults) {
    latestResults.set(result.subjectId, result);
  }
  const rankedSubjects = [...subjects].sort(
    (a, b) => scoreSubject(b, latestResults.get(b.id)) - scoreSubject(a, latestResults.get(a.id)),
  );
  const preferredHours = SLOT_START_HOURS[energyWindow] ?? SLOT_START_HOURS.evening;
  const fallbackHours = [17, 19, 20, 6];
  const hours = [...new Set([...preferredHours, ...fallbackHours])];
  const plan = [];

  for (let day = 0; day < days; day += 1) {
    const subject = rankedSubjects[day % rankedSubjects.length];
    const startHour = hours.find((hour) => !overlapsCommitment(day, hour, commitments));
    if (startHour === undefined) continue;
    const latestResult = latestResults.get(subject.id);
    plan.push({
      id: `${day}-${subject.id}-${startHour}`,
      day,
      subjectId: subject.id,
      subjectName: subject.name,
      startHour,
      durationMinutes: subject.isDifficult && preferredHours.includes(startHour) ? 50 : 40,
      priority: scoreSubject(subject, latestResult),
      reason:
        latestResult && latestResult.score < subject.targetScore
          ? `Củng cố sau bài kiểm tra ${latestResult.score} điểm`
          : subject.isDifficult
            ? 'Đặt môn dễ nản vào giờ năng lượng tốt nhất'
            : 'Tiến một bước nhỏ tới mục tiêu',
    });
  }
  return plan;
}

/**
 * Phát hiện ba ngày liên tiếp người dùng check-in ở trạng thái tệ.
 * @param {Array<object>} entries
 * @returns {boolean}
 */
export function hasThreeDifficultDays(entries) {
  const days = [
    ...new Set(
      entries.filter((entry) => entry.mood === 'te').map((entry) => entry.ts.slice(0, 10)),
    ),
  ].sort();
  if (days.length < 3) return false;
  const lastThree = days.slice(-3).map((day) => new Date(`${day}T00:00:00Z`).getTime());
  return lastThree.every((day, index) => index === 0 || day - lastThree[index - 1] === 86400000);
}

/**
 * Tổng hợp dữ liệu bảy ngày để tạo báo cáo mang tính khích lệ, không chấm điểm.
 * @param {object} input
 * @returns {object}
 */
export function buildWeeklyReflection({
  moodEntries = [],
  focusSessions = [],
  completedMicroActions = [],
  studyPlan = [],
}) {
  const cutoff = Date.now() - 7 * 86400000;
  const recentMoods = moodEntries.filter((entry) => Date.parse(entry.ts) >= cutoff);
  const recentFocus = focusSessions.filter((entry) => Date.parse(entry.ts) >= cutoff);
  const focusMinutes = recentFocus.reduce((total, entry) => total + entry.minutes, 0);
  const selfCareCount = completedMicroActions.filter(
    (item) => Date.parse(`${item.slice(0, 10)}T00:00:00Z`) >= cutoff,
  ).length;
  const plannedMinutes = studyPlan.reduce((total, item) => total + item.durationMinutes, 0);
  const difficultCheckIns = recentMoods.filter((entry) =>
    ['lo', 'te', 'met'].includes(entry.mood),
  ).length;
  const balancedStreak = calculateBalancedStreak({ focusSessions, completedMicroActions });

  let praise = 'Bạn vẫn đang quay lại và lắng nghe chính mình — đó đã là một bước đáng quý.';
  if (focusMinutes > 0 && difficultCheckIns > 0) {
    praise = `Dù có ${difficultCheckIns} lần thấy nặng lòng, bạn vẫn dành ${focusMinutes} phút tập trung. Tomo thấy sự bền bỉ đó.`;
  } else if (selfCareCount > 0) {
    praise = `Bạn đã chọn chăm sóc bản thân ${selfCareCount} lần trong tuần này. Những việc nhỏ ấy thật sự có ý nghĩa.`;
  } else if (focusMinutes > 0) {
    praise = `Bạn đã dành ${focusMinutes} phút tập trung. Mình ghi nhận nhịp học vừa sức mà bạn đang xây.`;
  }

  return { recentMoods, focusMinutes, selfCareCount, plannedMinutes, balancedStreak, praise };
}

/**
 * Chuỗi cân bằng chỉ tăng ở ngày có cả phiên tập trung và một hành động tự chăm sóc.
 * @param {object} input
 * @returns {number}
 */
export function calculateBalancedStreak({ focusSessions = [], completedMicroActions = [] }) {
  const focusDays = new Set(focusSessions.map((entry) => entry.ts.slice(0, 10)));
  const careDays = new Set(completedMicroActions.map((item) => item.slice(0, 10)));
  const balancedDays = new Set([...focusDays].filter((day) => careDays.has(day)));
  const cursor = new Date();
  const today = cursor.toISOString().slice(0, 10);
  if (!balancedDays.has(today)) cursor.setUTCDate(cursor.getUTCDate() - 1);

  let streak = 0;
  while (balancedDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
