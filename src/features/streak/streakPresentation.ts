import type { PracticeStreak } from "@/domain/practiceStreak";

export function streakEncouragement(streak: PracticeStreak) {
  if (streak.totalPracticeDays === 0) return "Your first sprint starts your streak.";
  if (streak.practicedToday) return "You practiced today. Nice work!";
  if (streak.currentStreak > 0) return "A little practice today keeps it going.";
  return "A fresh start begins with one sprint.";
}

export function streakMascotState(streak: PracticeStreak) {
  return streak.practicedToday ? "celebrating" : "sleeping";
}
