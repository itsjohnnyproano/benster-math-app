import { localDayKey, shiftLocalDay } from "@/shared/localCalendar";
import { isValidTimestamp } from "@/shared/isValidTimestamp";

export function calculatePracticeStreak(completions: readonly number[], now = new Date()) {
  if (!Number.isFinite(now.getTime())) throw new Error("Invalid current date");
  const dates = new Map<string, Date>();
  for (const timestamp of completions) {
    if (!isValidTimestamp(timestamp)) {
      throw new Error("Invalid completion date");
    }
    // Device clock changes must not award practice for future completions.
    if (timestamp > now.getTime()) continue;
    const date = new Date(timestamp);
    dates.set(localDayKey(date), date);
  }
  const today = localDayKey(now);
  const practicedToday = dates.has(today);
  let cursor = practicedToday ? now : shiftLocalDay(now, -1);
  let currentStreak = 0;
  while (dates.has(localDayKey(cursor))) {
    currentStreak++;
    cursor = shiftLocalDay(cursor, -1);
  }
  let longestStreak = 0;
  let run = 0;
  let previous: Date | undefined;
  for (const date of [...dates.values()].sort((a, b) => a.getTime() - b.getTime())) {
    run = previous && localDayKey(shiftLocalDay(previous, 1)) === localDayKey(date) ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
    previous = date;
  }
  const monday = shiftLocalDay(now, -((now.getDay() + 6) % 7));
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = shiftLocalDay(monday, index);
    const key = localDayKey(date);
    return { key, date, practiced: dates.has(key), isToday: key === today, isFuture: key !== today && date > now };
  });
  return { currentStreak, longestStreak, totalPracticeDays: dates.size, practicedToday, week };
}

export type PracticeStreak = ReturnType<typeof calculatePracticeStreak>;
