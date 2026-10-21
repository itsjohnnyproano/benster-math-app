import type { AchievementSprint } from "./results";
import { SPRINT_MODES } from "./sprint";

export const ACHIEVEMENT_IDS = [
  "first-step", "back-again", "triple-threat", "high-five", "perfect-week",
  "first-sprint", "getting-started", "sprint-explorer", "sprint-star", "sprint-champion",
  "first-perfect", "perfect-pair", "triple-perfect", "sharp-shooter", "math-lightning",
  "addition-ace", "subtraction-star", "multiplication-master", "mix-it-up", "math-explorer",
  "five-minute-hero", "ten-minute-thinker", "comeback-kid", "personal-best", "hundred-correct",
  "ten-day-trail", "two-week-rhythm", "three-week-focus", "monthly-momentum", "weekend-warrior",
  "daily-double", "daily-triple", "five-a-day", "steady-starter", "habit-builder",
  "sprint-veteran", "century-sprinter", "sprint-legend", "sprint-elite", "sprint-hall-of-fame",
] as const;

export type AchievementId = (typeof ACHIEVEMENT_IDS)[number];
export type AchievementMetric = "practice-days" | "sprints" | "perfect-sprints" | "single-sprint" | "mode-sprints" | "modes" | "minutes" | "comebacks" | "personal-bests" | "correct-answers" | "daily-sprints" | "weekends" | "practice-days-total";
export type AchievementGroupId = "consistency" | "sprints" | "accuracy" | "math-modes" | "progress";

export const ACHIEVEMENT_GROUPS: readonly Readonly<{ id: AchievementGroupId; title: string; subtitle: string }>[] = [
  { id: "consistency", title: "Keep going", subtitle: "Build your practice rhythm." },
  { id: "sprints", title: "Sprint milestones", subtitle: "Every finished sprint counts." },
  { id: "accuracy", title: "Accuracy & speed", subtitle: "Careful thinking and quick answers." },
  { id: "math-modes", title: "Math modes", subtitle: "Explore every kind of problem." },
  { id: "progress", title: "Practice & progress", subtitle: "Celebrate the work you put in." },
];

export type AchievementDefinition = Readonly<{
  id: AchievementId;
  group: AchievementGroupId;
  title: string;
  description: string;
  metric: AchievementMetric;
  target: number;
  /** Recurring challenges show how many distinct times they were completed. */
  repeatable?: boolean;
}>;

export type AchievementProgress = AchievementDefinition & Readonly<{
  current: number;
  earnedAtMs: number | null;
  earnedCount: number;
}>;

// Matches the approachable first-perfect threshold and prevents a tiny early
// score from earning the personal-best badge.
export const MIN_ATTEMPTS_FOR_PERSONAL_BEST_ACHIEVEMENT = 10;

export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  { id: "first-step", group: "consistency", title: "First Step", description: "Practice on your first day.", metric: "practice-days", target: 1 },
  { id: "back-again", group: "consistency", title: "Back Again", description: "Practice two days in a row.", metric: "practice-days", target: 2, repeatable: true },
  { id: "triple-threat", group: "consistency", title: "Triple Threat", description: "Practice three days in a row.", metric: "practice-days", target: 3, repeatable: true },
  { id: "high-five", group: "consistency", title: "High Five", description: "Practice five days in a row.", metric: "practice-days", target: 5, repeatable: true },
  { id: "perfect-week", group: "consistency", title: "Perfect Week", description: "Practice seven days in a row.", metric: "practice-days", target: 7, repeatable: true },
  { id: "first-sprint", group: "sprints", title: "First Sprint", description: "Finish your first sprint.", metric: "sprints", target: 1 },
  { id: "getting-started", group: "sprints", title: "Getting Started", description: "Finish five sprints.", metric: "sprints", target: 5 },
  { id: "sprint-explorer", group: "sprints", title: "Sprint Explorer", description: "Finish ten sprints.", metric: "sprints", target: 10 },
  { id: "sprint-star", group: "sprints", title: "Sprint Star", description: "Finish 25 sprints.", metric: "sprints", target: 25 },
  { id: "sprint-champion", group: "sprints", title: "Sprint Champion", description: "Finish 50 sprints.", metric: "sprints", target: 50 },
  { id: "first-perfect", group: "accuracy", title: "First Perfect", description: "Get every answer right in a sprint with at least ten answers.", metric: "perfect-sprints", target: 1 },
  { id: "perfect-pair", group: "accuracy", title: "Perfect Pair", description: "Finish two perfect sprints with at least ten answers each.", metric: "perfect-sprints", target: 2 },
  { id: "triple-perfect", group: "accuracy", title: "Triple Perfect", description: "Finish three perfect sprints with at least ten answers each.", metric: "perfect-sprints", target: 3 },
  { id: "sharp-shooter", group: "accuracy", title: "Sharp Shooter", description: "Get 90% accuracy with at least 20 answers in one sprint.", metric: "single-sprint", target: 1, repeatable: true },
  { id: "math-lightning", group: "accuracy", title: "Math Lightning", description: "Get 40 correct answers in one 60-second sprint.", metric: "single-sprint", target: 1, repeatable: true },
  { id: "addition-ace", group: "math-modes", title: "Addition Ace", description: "Finish ten addition sprints.", metric: "mode-sprints", target: 10 },
  { id: "subtraction-star", group: "math-modes", title: "Subtraction Star", description: "Finish ten subtraction sprints.", metric: "mode-sprints", target: 10 },
  { id: "multiplication-master", group: "math-modes", title: "Multiplication Master", description: "Finish ten multiplication sprints.", metric: "mode-sprints", target: 10 },
  { id: "mix-it-up", group: "math-modes", title: "Mix It Up", description: "Finish ten mixed sprints.", metric: "mode-sprints", target: 10 },
  { id: "math-explorer", group: "math-modes", title: "Math Explorer", description: "Try every math mode.", metric: "modes", target: SPRINT_MODES.length },
  { id: "five-minute-hero", group: "progress", title: "Five-Minute Hero", description: "Complete five total minutes of practice.", metric: "minutes", target: 5 },
  { id: "ten-minute-thinker", group: "progress", title: "Ten-Minute Thinker", description: "Complete ten total minutes of practice.", metric: "minutes", target: 10 },
  { id: "comeback-kid", group: "progress", title: "Comeback Kid", description: "Return after taking at least three full days away.", metric: "comebacks", target: 1, repeatable: true },
  { id: "personal-best", group: "progress", title: "Personal Best", description: "Beat a previous correct-answer record in a sprint with at least ten answers.", metric: "personal-bests", target: 1, repeatable: true },
  { id: "hundred-correct", group: "progress", title: "Hundred Correct", description: "Answer 100 questions correctly across completed sprints.", metric: "correct-answers", target: 100 },
  { id: "ten-day-trail", group: "consistency", title: "Ten-Day Trail", description: "Practice ten days in a row.", metric: "practice-days", target: 10 },
  { id: "two-week-rhythm", group: "consistency", title: "Two-Week Rhythm", description: "Practice 14 days in a row.", metric: "practice-days", target: 14 },
  { id: "three-week-focus", group: "consistency", title: "Three-Week Focus", description: "Practice 21 days in a row.", metric: "practice-days", target: 21 },
  { id: "monthly-momentum", group: "consistency", title: "Monthly Momentum", description: "Practice 30 days in a row.", metric: "practice-days", target: 30 },
  { id: "weekend-warrior", group: "consistency", title: "Weekend Warrior", description: "Practice on Saturday and Sunday in the same weekend.", metric: "weekends", target: 1, repeatable: true },
  { id: "daily-double", group: "consistency", title: "Daily Double", description: "Finish two sprints in one day.", metric: "daily-sprints", target: 2, repeatable: true },
  { id: "daily-triple", group: "consistency", title: "Daily Triple", description: "Finish three sprints in one day.", metric: "daily-sprints", target: 3, repeatable: true },
  { id: "five-a-day", group: "consistency", title: "Five-a-Day", description: "Finish five sprints in one day.", metric: "daily-sprints", target: 5, repeatable: true },
  { id: "steady-starter", group: "consistency", title: "Steady Starter", description: "Practice on ten different days.", metric: "practice-days-total", target: 10 },
  { id: "habit-builder", group: "consistency", title: "Habit Builder", description: "Practice on 25 different days.", metric: "practice-days-total", target: 25 },
  { id: "sprint-veteran", group: "sprints", title: "Sprint Veteran", description: "Finish 75 sprints.", metric: "sprints", target: 75 },
  { id: "century-sprinter", group: "sprints", title: "Century Sprinter", description: "Finish 100 sprints.", metric: "sprints", target: 100 },
  { id: "sprint-legend", group: "sprints", title: "Sprint Legend", description: "Finish 250 sprints.", metric: "sprints", target: 250 },
  { id: "sprint-elite", group: "sprints", title: "Sprint Elite", description: "Finish 500 sprints.", metric: "sprints", target: 500 },
  { id: "sprint-hall-of-fame", group: "sprints", title: "Sprint Hall of Fame", description: "Finish 1,000 sprints.", metric: "sprints", target: 1000 },
];

type MutableProgress = { current: number; earnedAtMs: number | null; earnedCount: number };

function localDayOrdinal(timestamp: number) {
  const date = new Date(timestamp);
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

function progressMetric(id: AchievementId, values: {
  longestStreak: number;
  sprintCount: number;
  perfectCount: number;
  sharpShooterCount: number;
  lightningCount: number;
  modeCounts: Record<string, number>;
  modesPlayed: number;
  practiceSeconds: number;
  comebacks: number;
  personalBests: number;
  correctAnswers: number;
  highestDailySprintCount: number;
  weekendWarriorCount: number;
  totalPracticeDays: number;
}) {
  switch (id) {
    case "first-step": case "back-again": case "triple-threat": case "high-five": case "perfect-week":
    case "ten-day-trail": case "two-week-rhythm": case "three-week-focus": case "monthly-momentum": return values.longestStreak;
    case "first-sprint": case "getting-started": case "sprint-explorer": case "sprint-star": case "sprint-champion":
    case "sprint-veteran": case "century-sprinter": case "sprint-legend": case "sprint-elite": case "sprint-hall-of-fame": return values.sprintCount;
    case "first-perfect": case "perfect-pair": case "triple-perfect": return values.perfectCount;
    case "sharp-shooter": return values.sharpShooterCount;
    case "math-lightning": return values.lightningCount;
    case "addition-ace": return values.modeCounts.addition;
    case "subtraction-star": return values.modeCounts.subtraction;
    case "multiplication-master": return values.modeCounts.multiplication;
    case "mix-it-up": return values.modeCounts.mixed;
    case "math-explorer": return values.modesPlayed;
    case "five-minute-hero": case "ten-minute-thinker": return Math.floor(values.practiceSeconds / 60);
    case "comeback-kid": return values.comebacks;
    case "personal-best": return values.personalBests;
    case "hundred-correct": return values.correctAnswers;
    case "daily-double": case "daily-triple": case "five-a-day": return values.highestDailySprintCount;
    case "weekend-warrior": return values.weekendWarriorCount;
    case "steady-starter": case "habit-builder": return values.totalPracticeDays;
  }
}

/** Builds local, deterministic badge state from validated saved sprint receipts. */
export function calculateAchievements(records: readonly AchievementSprint[]): AchievementProgress[] {
  const state = new Map<AchievementId, MutableProgress>(ACHIEVEMENTS.map((achievement) => [
    achievement.id, { current: 0, earnedAtMs: null, earnedCount: 0 },
  ]));
  const values = {
    longestStreak: 0, sprintCount: 0, perfectCount: 0, sharpShooterCount: 0, lightningCount: 0,
    modeCounts: Object.fromEntries(SPRINT_MODES.map((mode) => [mode, 0])) as Record<string, number>,
    modesPlayed: 0, practiceSeconds: 0, comebacks: 0, personalBests: 0, correctAnswers: 0,
    highestDailySprintCount: 0, weekendWarriorCount: 0, totalPracticeDays: 0,
  };
  const modesSeen = new Set<string>();
  const practicedDays = new Set<number>();
  const sprintsByDay = new Map<number, number>();
  const weekendDays = new Map<number, Set<number>>();
  let lastPracticeDay: number | null = null;
  let currentStreak = 0;

  const chronological = [...records].sort((left, right) =>
    left.completedAtMs - right.completedAtMs || left.id.localeCompare(right.id));

  for (const record of chronological) {
    const repeatableAwards = new Set<AchievementId>();
    values.sprintCount++;
    values.correctAnswers += record.correctCount;
    values.practiceSeconds += record.durationSeconds;
    values.modeCounts[record.mode]++;
    modesSeen.add(record.mode);
    values.modesPlayed = modesSeen.size;
    if (record.attemptedCount >= 10 && record.correctCount === record.attemptedCount) values.perfectCount++;
    if (record.attemptedCount >= 20 && record.correctCount / record.attemptedCount >= 0.9) {
      values.sharpShooterCount++;
      repeatableAwards.add("sharp-shooter");
    }
    if (record.durationSeconds === 60 && record.correctCount >= 40) {
      values.lightningCount++;
      repeatableAwards.add("math-lightning");
    }
    if (record.personalBest.status === "new" && record.attemptedCount >= MIN_ATTEMPTS_FOR_PERSONAL_BEST_ACHIEVEMENT) {
      values.personalBests++;
      repeatableAwards.add("personal-best");
    }

    const day = localDayOrdinal(record.completedAtMs);
    const daySprintCount = (sprintsByDay.get(day) ?? 0) + 1;
    sprintsByDay.set(day, daySprintCount);
    values.highestDailySprintCount = Math.max(values.highestDailySprintCount, daySprintCount);
    if (daySprintCount === 2) repeatableAwards.add("daily-double");
    if (daySprintCount === 3) repeatableAwards.add("daily-triple");
    if (daySprintCount === 5) repeatableAwards.add("five-a-day");
    if (day !== lastPracticeDay) {
      if (lastPracticeDay !== null && day - lastPracticeDay >= 4) {
        values.comebacks++;
        repeatableAwards.add("comeback-kid");
      }
      currentStreak = lastPracticeDay !== null && day === lastPracticeDay + 1 ? currentStreak + 1 : 1;
      values.longestStreak = Math.max(values.longestStreak, currentStreak);
      for (const achievement of ACHIEVEMENTS) {
        if (achievement.repeatable && achievement.metric === "practice-days" && currentStreak === achievement.target) {
          repeatableAwards.add(achievement.id);
        }
      }
      lastPracticeDay = day;
    }
    if (!practicedDays.has(day)) {
      practicedDays.add(day);
      values.totalPracticeDays = practicedDays.size;
      const date = new Date(record.completedAtMs);
      const weekday = date.getDay();
      if (weekday === 0 || weekday === 6) {
        const weekendStart = weekday === 6 ? day : day - 1;
        const days = weekendDays.get(weekendStart) ?? new Set<number>();
        days.add(weekday);
        weekendDays.set(weekendStart, days);
        if (days.size === 2) {
          values.weekendWarriorCount++;
          repeatableAwards.add("weekend-warrior");
        }
      }
    }

    for (const achievement of ACHIEVEMENTS) {
      const item = state.get(achievement.id)!;
      const current = progressMetric(achievement.id, values);
      item.current = current;
      if (current >= achievement.target) {
        if (item.earnedAtMs === null) item.earnedAtMs = record.completedAtMs;
        if (achievement.repeatable) {
          if (repeatableAwards.has(achievement.id)) item.earnedCount++;
        } else item.earnedCount = 1;
      }
    }
  }

  return ACHIEVEMENTS.map((achievement) => ({ ...achievement, ...state.get(achievement.id)! }));
}
