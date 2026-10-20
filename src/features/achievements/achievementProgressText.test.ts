import { describe, expect, it } from "vitest";
import type { AchievementProgress } from "@/domain/achievements";
import { formatAchievementProgress } from "./achievementProgressText";

function progress(metric: AchievementProgress["metric"], current: number, target: number): AchievementProgress {
  return {
    id: "first-step", group: "consistency", title: "Test", description: "Test",
    metric, current, target, earnedAtMs: null, earnedCount: 0,
  };
}

describe("formatAchievementProgress", () => {
  it("uses sprints for same-day achievements", () => {
    expect(formatAchievementProgress(progress("daily-sprints", 2, 3))).toBe("2 of 3 sprints");
  });

  it("uses weekend rather than day progress for Weekend Warrior", () => {
    expect(formatAchievementProgress(progress("weekends", 0, 1))).toBe("0 of 1 weekend");
  });
});
