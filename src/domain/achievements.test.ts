import { describe, expect, it } from "vitest";
import { makeResult } from "@/test/resultFixture";
import type { AchievementSprint } from "./results";
import { calculateAchievements, MIN_ATTEMPTS_FOR_PERSONAL_BEST_ACHIEVEMENT } from "./achievements";

function saved(id: string, completedAtMs: number, correct = 3, attempted = 5, overrides = {}): AchievementSprint {
  const result = makeResult(correct, attempted, overrides);
  return {
    id,
    completedAtMs,
    mode: result.configuration.mode,
    durationSeconds: result.configuration.durationSeconds,
    correctCount: result.correctCount,
    attemptedCount: result.attemptedCount,
    personalBest: { previous: null, updated: correct, status: "first" },
  };
}

describe("calculateAchievements", () => {
  it("unlocks badges at the completion that crosses each local threshold", () => {
    const records = [
      saved("one", Date.UTC(2026, 0, 1), 10, 10),
      saved("two", Date.UTC(2026, 0, 2), 10, 10),
      saved("three", Date.UTC(2026, 0, 3), 3, 5),
    ];
    const badges = calculateAchievements(records);
    expect(badges.find((badge) => badge.id === "triple-threat")).toMatchObject({ group: "consistency", current: 3, earnedAtMs: records[2].completedAtMs });
    expect(badges.find((badge) => badge.id === "perfect-pair")).toMatchObject({ current: 2, earnedAtMs: records[1].completedAtMs });
    expect(badges.find((badge) => badge.id === "hundred-correct")).toMatchObject({ current: 23, earnedAtMs: null });
  });

  it("keeps repeatable comeback and personal-best counts while awarding the first instance", () => {
    const first = saved("first", Date.UTC(2026, 0, 1));
    const returnOne = { ...saved("return-one", Date.UTC(2026, 0, 5), 4, MIN_ATTEMPTS_FOR_PERSONAL_BEST_ACHIEVEMENT), personalBest: { previous: 3, updated: 4, status: "new" as const } };
    const returnTwo = { ...saved("return-two", Date.UTC(2026, 0, 10), 5, MIN_ATTEMPTS_FOR_PERSONAL_BEST_ACHIEVEMENT), personalBest: { previous: 4, updated: 5, status: "new" as const } };
    const badges = calculateAchievements([first, returnOne, returnTwo]);
    expect(badges.find((badge) => badge.id === "comeback-kid")).toMatchObject({ earnedCount: 2, earnedAtMs: returnOne.completedAtMs });
    expect(badges.find((badge) => badge.id === "personal-best")).toMatchObject({ earnedCount: 2, earnedAtMs: returnOne.completedAtMs });
  });

  it("does not award Personal Best for a small sprint", () => {
    const early = { ...saved("early", Date.UTC(2026, 0, 1), 2, MIN_ATTEMPTS_FOR_PERSONAL_BEST_ACHIEVEMENT - 1), personalBest: { previous: 1, updated: 2, status: "new" as const } };
    const qualifying = { ...saved("qualifying", Date.UTC(2026, 0, 2), 3, MIN_ATTEMPTS_FOR_PERSONAL_BEST_ACHIEVEMENT), personalBest: { previous: 2, updated: 3, status: "new" as const } };
    const badges = calculateAchievements([early, qualifying]);

    expect(badges.find((badge) => badge.id === "personal-best")).toMatchObject({ current: 1, earnedCount: 1, earnedAtMs: qualifying.completedAtMs });
  });

  it("tracks the added consistency milestones from local calendar days", () => {
    const firstDay = new Date(2026, 0, 3, 12).getTime(); // Saturday, safely away from local midnight
    const records = Array.from({ length: 10 }, (_, index) =>
      saved(`day-${index}`, firstDay + index * 86_400_000, 3, 5));
    records.splice(1, 0, saved("daily-double", firstDay, 3, 5));
    const badges = calculateAchievements(records);

    expect(badges.find((badge) => badge.id === "ten-day-trail")).toMatchObject({ earnedAtMs: records.at(-1)?.completedAtMs });
    expect(badges.find((badge) => badge.id === "weekend-warrior")).toMatchObject({ current: 1, earnedAtMs: records[2].completedAtMs });
    expect(badges.find((badge) => badge.id === "daily-double")).toMatchObject({ current: 2, earnedAtMs: records[1].completedAtMs });
    expect(badges.find((badge) => badge.id === "steady-starter")).toMatchObject({ current: 10, earnedAtMs: records.at(-1)?.completedAtMs });
  });
});
