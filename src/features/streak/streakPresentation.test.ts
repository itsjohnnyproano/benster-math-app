import { expect, it } from "vitest";
import { calculatePracticeStreak } from "@/domain/practiceStreak";
import { streakEncouragement } from "./streakPresentation";

it("encourages new, active, completed, and restarting practice", () => {
  const now = new Date(2026, 7, 27, 12);
  const message = (days: number[]) => streakEncouragement(calculatePracticeStreak(days.map((day) => new Date(2026, 7, day, 12).getTime()), now));
  expect(message([])).toBe("Your first sprint starts your streak.");
  expect(message([27])).toBe("You practiced today. Nice work!");
  expect(message([26])).toBe("A little practice today keeps it going.");
  expect(message([24])).toBe("A fresh start begins with one sprint.");
});
