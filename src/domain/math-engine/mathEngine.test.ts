import { describe, expect, it } from "vitest";

import type { SprintConfiguration } from "@/domain/sprint";

import { generateQuestion } from "./questionGenerator";
import {
  createSprint,
  LEVEL_UP_STREAK_THRESHOLD,
  submitAnswer,
  tickSprint,
} from "./sprintEngine";

const CONFIGURATION: SprintConfiguration = Object.freeze({
  mode: "addition",
  durationSeconds: 30,
  inputStyle: "multiple-choice",
  cardLayout: "horizontal",
  levelUpEnabled: true,
});

function sequenceRandom(values: number[]) {
  let index = 0;
  return () => values[index++ % values.length];
}

describe("question generation", () => {
  it("never generates a negative subtraction answer", () => {
    for (let index = 0; index < 200; index += 1) {
      const question = generateQuestion({
        mode: "subtraction",
        difficultyLevel: 4,
        questionId: index,
        presentedAtMs: 0,
      });
      expect(question.correctAnswer).toBeGreaterThanOrEqual(0);
      expect(question.leftOperand).toBeGreaterThanOrEqual(question.rightOperand);
    }
  });

  it("supports multiplication operands through 12", () => {
    const question = generateQuestion({
      mode: "multiplication",
      difficultyLevel: 4,
      questionId: 1,
      presentedAtMs: 0,
      random: () => 0.999999,
    });
    expect(question.leftOperand).toBe(12);
    expect(question.rightOperand).toBe(12);
    expect(question.correctAnswer).toBe(144);
  });

  it("selects every operation in mixed mode", () => {
    const operations = [0, 0.4, 0.8].map(
      (operationChoice, index) =>
        generateQuestion({
          mode: "mixed",
          difficultyLevel: 1,
          questionId: index,
          presentedAtMs: 0,
          random: sequenceRandom([operationChoice, 0.2, 0.4, 0.6]),
        }).operation,
    );
    expect(operations).toEqual(["addition", "subtraction", "multiplication"]);
  });

  it("creates four unique choices containing the answer exactly once", () => {
    for (let index = 0; index < 100; index += 1) {
      const question = generateQuestion({
        mode: "mixed",
        difficultyLevel: 4,
        questionId: index,
        presentedAtMs: 0,
      });
      expect(question.choices).toHaveLength(4);
      expect(new Set(question.choices).size).toBe(4);
      expect(
        question.choices.filter((choice) => choice === question.correctAnswer),
      ).toHaveLength(1);
    }
  });
});

describe("sprint state", () => {
  it("tracks correct answers, attempts, streaks, and elapsed time", () => {
    const initial = createSprint(CONFIGURATION, 1_000, () => 0.2);
    const answered = submitAnswer(
      initial,
      initial.currentQuestion.correctAnswer,
      2_250,
      () => 0.3,
    );
    expect(answered.status).toBe("active");
    if (answered.status !== "active") return;
    expect(answered.attemptedCount).toBe(1);
    expect(answered.correctCount).toBe(1);
    expect(answered.currentStreak).toBe(1);
    expect(answered.bestStreak).toBe(1);
    expect(answered.answeredQuestions[0].elapsedMs).toBe(1_250);
  });

  it("resets the streak after a wrong answer without lowering difficulty", () => {
    let state = createSprint(CONFIGURATION, 0, () => 0.2);
    for (let index = 0; index < LEVEL_UP_STREAK_THRESHOLD; index += 1) {
      state = submitAnswer(
        state,
        state.currentQuestion.correctAnswer,
        index + 1,
        () => 0.2,
      ) as typeof state;
    }
    expect(state.difficultyLevel).toBe(2);
    state = submitAnswer(
      state,
      state.currentQuestion.correctAnswer + 999,
      10,
      () => 0.2,
    ) as typeof state;
    expect(state.currentStreak).toBe(0);
    expect(state.difficultyLevel).toBe(2);
  });

  it("does not level up when Level Up mode is disabled", () => {
    let state = createSprint(
      { ...CONFIGURATION, levelUpEnabled: false },
      0,
      () => 0.2,
    );
    for (let index = 0; index < 10; index += 1) {
      state = submitAnswer(
        state,
        state.currentQuestion.correctAnswer,
        index + 1,
        () => 0.2,
      ) as typeof state;
    }
    expect(state.difficultyLevel).toBe(1);
  });

  it("does not count the visible unanswered question when time expires", () => {
    const initial = createSprint(CONFIGURATION, 1_000, () => 0.2);
    const completed = tickSprint(initial, 31_000);
    expect(completed.status).toBe("completed");
    if (completed.status !== "completed") return;
    expect(completed.result.attemptedCount).toBe(0);
    expect(completed.result.correctCount).toBe(0);
    expect(completed.result.answeredQuestions).toHaveLength(0);
  });

  it("rejects an answer submitted at or after the deadline", () => {
    const initial = createSprint(CONFIGURATION, 1_000, () => 0.2);
    const completed = submitAnswer(
      initial,
      initial.currentQuestion.correctAnswer,
      31_000,
      () => 0.2,
    );
    expect(completed.status).toBe("completed");
    if (completed.status !== "completed") return;
    expect(completed.result.attemptedCount).toBe(0);
  });
});
