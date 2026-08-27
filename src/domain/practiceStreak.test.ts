import { describe, expect, it } from "vitest";
import { calculatePracticeStreak } from "./practiceStreak";

const date = (day: number, month = 7, year = 2026, hour = 12) => new Date(year, month, day, hour);
const times = (...days: number[]) => days.map((day) => date(day).getTime());

describe("practice streak", () => {
  it("starts empty with a Monday–Sunday week", () => {
    const streak = calculatePracticeStreak([], date(27));
    expect(streak.currentStreak).toBe(0);
    expect(streak.totalPracticeDays).toBe(0);
    expect(streak.week.map((day) => day.date.getDay())).toEqual([1, 2, 3, 4, 5, 6, 0]);
    expect(streak.week.filter((day) => day.isToday)).toHaveLength(1);
    expect(streak.week.filter((day) => day.isFuture)).toHaveLength(3);
  });
  it("deduplicates days regardless of order and includes today", () => {
    const streak = calculatePracticeStreak(times(27, 25, 26, 26), date(27));
    expect(streak.currentStreak).toBe(3);
    expect(streak.longestStreak).toBe(3);
    expect(streak.totalPracticeDays).toBe(3);
    expect(streak.practicedToday).toBe(true);
  });
  it("anchors to yesterday but breaks after a missed full day", () => {
    expect(calculatePracticeStreak(times(25, 26), date(27)).currentStreak).toBe(2);
    const broken = calculatePracticeStreak(times(24, 25), date(27));
    expect(broken.currentStreak).toBe(0);
    expect(broken.longestStreak).toBe(2);
  });
  it("preserves the longest run after a fresh start", () => {
    const streak = calculatePracticeStreak(times(20, 21, 22, 27), date(27));
    expect(streak.currentStreak).toBe(1);
    expect(streak.longestStreak).toBe(3);
    expect(streak.totalPracticeDays).toBe(4);
  });
  it("handles year boundaries and leap days", () => {
    expect(calculatePracticeStreak([date(31, 11, 2025).getTime(), date(1, 0).getTime()], date(1, 0)).currentStreak).toBe(2);
    expect(calculatePracticeStreak([date(28, 1, 2024).getTime(), date(29, 1, 2024).getTime(), date(1, 2, 2024).getTime()], date(1, 2, 2024)).currentStreak).toBe(3);
  });
  it("uses local completion days at midnight", () => {
    const before = new Date(2026, 7, 26, 23, 59).getTime();
    const after = new Date(2026, 7, 27, 0, 1).getTime();
    expect(calculatePracticeStreak([before, after], date(27)).currentStreak).toBe(2);
  });
  it("handles spring and fall daylight-saving boundaries with calendar arithmetic", () => {
    for (const [month, days] of [[2, [7, 8, 9]], [9, [31, 32, 33]]] as const) {
      const streak = calculatePracticeStreak(days.map((day) => date(day, month).getTime()), date(days[2], month));
      expect(streak.currentStreak).toBe(3);
    }
  });
  it("counts long runs beyond a single history page", () => {
    const completions = Array.from({ length: 40 }, (_, index) => date(27 - index).getTime());
    expect(calculatePracticeStreak(completions, date(27)).currentStreak).toBe(40);
  });
  it("ignores future completions and rejects invalid timestamps", () => {
    expect(calculatePracticeStreak(times(28), date(27)).totalPracticeDays).toBe(0);
    for (const timestamp of [NaN, Infinity, -1, 9e15]) {
      expect(() => calculatePracticeStreak([timestamp], date(27))).toThrow("Invalid completion date");
    }
  });
});
