import { describe, expect, it } from "vitest";

import { makeResult } from "@/test/resultFixture";
import { assertSprintResult, calculatePersonalBest, getResultOutcome } from "./results";

describe("results", () => {
  it("averages all answered questions, excluding feedback and the final unanswered question", () => {
    const result = makeResult(1, 3);
    expect(result.answeredQuestions.map((answer) => answer.elapsedMs)).toEqual([1000, 900, 900]);
    expect(result.averageResponseMs).toBe(2800 / 3);
    expect(() => assertSprintResult(result)).not.toThrow();
  });

  it("uses null average for zero attempts", () => {
    const result = makeResult(0, 0);
    expect(result.averageResponseMs).toBeNull();
    expect(calculatePersonalBest(result, null)).toEqual({ previous: null, updated: null, status: "ineligible" });
    expect(calculatePersonalBest(result, 10).updated).toBe(10);
  });

  it("handles first, improved, tied and lower personal bests", () => {
    const result = makeResult(3);
    expect(calculatePersonalBest(result, null).status).toBe("first");
    expect(calculatePersonalBest(result, 2)).toEqual({ previous: 2, updated: 3, status: "new" });
    expect(calculatePersonalBest(result, 3).status).toBe("matched");
    expect(calculatePersonalBest(result, 4)).toEqual({ previous: 4, updated: 4, status: "unchanged" });
    expect(calculatePersonalBest(makeResult(0, 5), null).status).toBe("first");
  });

  it("selects encouragement below 60%, only after five attempts", () => {
    expect(getResultOutcome(makeResult(2, 5))).toBe("needs-encouragement");
    expect(getResultOutcome(makeResult(3, 5))).toBe("celebrate");
    expect(getResultOutcome(makeResult(0, 4))).toBe("short-practice");
    expect(getResultOutcome(makeResult(0, 0))).toBe("no-attempts");
    // Do not round 59.5% up to the celebratory side of the threshold.
    expect(getResultOutcome({ ...makeResult(), accuracy: 0.595 })).toBe("needs-encouragement");
  });

  it("rejects malformed or inconsistent saved data", () => {
    const result = makeResult();
    for (const value of [null, {}, { ...result, accuracy: 1 }, { ...result, averageResponseMs: NaN },
      { ...result, attemptedCount: 9 }, { ...result, bestStreak: 0 },
      { ...result, configuration: { ...result.configuration, durationSeconds: 17 } }]) {
      expect(() => assertSprintResult(value)).toThrow();
    }
  });
});
