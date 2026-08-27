import { describe, expect, it, vi } from "vitest";

import { createSprint, getRemainingMs, submitAnswer, tickSprint } from "@/domain/math-engine";
import { assertSprintResult } from "@/domain/results";
import type { SprintConfiguration } from "@/domain/sprint";
import { createSprintClock } from "./sprintClock";

const configuration: SprintConfiguration = {
  mode: "addition", durationSeconds: 30, inputStyle: "typed",
  cardLayout: "horizontal", levelUpEnabled: false,
};

function setup() {
  let monotonicMs = 50.25;
  const wallNow = vi.fn(() => 100_000);
  const clock = createSprintClock(wallNow, () => monotonicMs);
  const state = createSprint(configuration, clock.startedAtMs, () => 0.2);
  return { clock, state, wallNow, advance: (ms: number) => { monotonicMs += ms; } };
}

describe("sprint clock", () => {
  it.each([-3_600_000, 3_600_000])("ignores a wall-clock jump of %i ms and produces a savable result", (jump) => {
    const { clock, state, wallNow, advance } = setup();
    wallNow.mockReturnValue(100_000 + jump);
    advance(1200);
    const answeredAtMs = clock.now();
    advance(650);
    const next = submitAnswer(state, state.currentQuestion.correctAnswer, answeredAtMs, () => 0.2, clock.now());
    expect(getRemainingMs(next, clock.now())).toBe(28_150);
    advance(28_150);
    const completed = tickSprint(next, clock.now());
    expect(completed.status).toBe("completed");
    if (completed.status !== "completed") throw new Error("Expected completion");
    expect(completed.result.averageResponseMs).toBe(1200);
    expect(completed.result.startedAtMs).toBe(100_000);
    expect(completed.result.completedAtMs).toBe(130_000);
    expect(() => assertSprintResult(completed.result)).not.toThrow();
    expect(wallNow).toHaveBeenCalledTimes(1);
  });

  it("finishes on the next callback after suspension without counting the unanswered question", () => {
    const { clock, state, advance } = setup();
    // No interval callbacks run while suspended; elapsed time still advances.
    advance(45_000);
    const completed = tickSprint(state, clock.now());
    expect(getRemainingMs(completed, clock.now())).toBe(0);
    expect(completed.status).toBe("completed");
    if (completed.status !== "completed") throw new Error("Expected completion");
    expect(completed.result.attemptedCount).toBe(0);
    expect(() => assertSprintResult(completed.result)).not.toThrow();
  });

  it("keeps an accepted answer when feedback resumes after expiry", () => {
    const { clock, state, advance } = setup();
    advance(29_500);
    const answeredAtMs = clock.now();
    advance(10_000);
    const completed = submitAnswer(state, state.currentQuestion.correctAnswer, answeredAtMs, () => 0.2, clock.now());
    expect(completed.status).toBe("completed");
    if (completed.status !== "completed") throw new Error("Expected completion");
    expect(completed.result.attemptedCount).toBe(1);
    expect(completed.result.averageResponseMs).toBe(29_500);
    expect(() => assertSprintResult(completed.result)).not.toThrow();
  });

  it("stores integer milliseconds from fractional performance readings", () => {
    const { clock, advance } = setup();
    advance(12.75);
    expect(clock.now()).toBe(100_012);
    advance(0.5);
    expect(clock.now()).toBe(100_013);
  });
});
