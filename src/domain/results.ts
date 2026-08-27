import type { SprintResult } from "./math-engine";
import { isCardLayout, isInputStyle, isSprintDuration, isSprintMode } from "./sprint";

export const RESULT_SCHEMA_VERSION = 1;
export const ENCOURAGEMENT_ACCURACY_THRESHOLD = 0.6;
export const MIN_ATTEMPTS_FOR_ACCURACY_MESSAGE = 5;

export type PersonalBestStatus = "first" | "new" | "matched" | "unchanged" | "ineligible";
export type PersonalBestChange = Readonly<{
  previous: number | null;
  updated: number | null;
  status: PersonalBestStatus;
}>;
export type SavedSprint = Readonly<{
  id: string;
  schemaVersion: typeof RESULT_SCHEMA_VERSION;
  result: SprintResult;
  personalBest: PersonalBestChange;
}>;

export function calculatePersonalBest(result: SprintResult, previous: number | null): PersonalBestChange {
  if (result.attemptedCount === 0) return { previous, updated: previous, status: "ineligible" };
  if (previous === null) return { previous, updated: result.correctCount, status: "first" };
  return {
    previous,
    updated: Math.max(previous, result.correctCount),
    status: result.correctCount > previous ? "new" : result.correctCount === previous ? "matched" : "unchanged",
  };
}

export type ResultOutcome = "no-attempts" | "short-practice" | "needs-encouragement" | "celebrate";

export function getResultOutcome(result: SprintResult): ResultOutcome {
  if (result.attemptedCount === 0) {
    return "no-attempts";
  }
  if (result.attemptedCount < MIN_ATTEMPTS_FOR_ACCURACY_MESSAGE) {
    return "short-practice";
  }
  if (result.accuracy < ENCOURAGEMENT_ACCURACY_THRESHOLD) {
    return "needs-encouragement";
  }
  return "celebrate";
}

// Local record identity only, not a password, token, or security boundary.
export function createLocalSprintId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

const isCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const isLevel = (value: unknown): value is number =>
  isCount(value) && value >= 1 && value <= 4;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

// Validate the persistence boundary instead of trusting JSON casts from disk.
export function assertSprintResult(value: unknown): asserts value is SprintResult {
  const fail = (): never => { throw new Error("Invalid sprint result"); };
  if (!isRecord(value) || !isRecord(value.configuration)) return fail();
  const config = value.configuration;
  if (!isSprintMode(config.mode) || !isSprintDuration(config.durationSeconds)
    || !isInputStyle(config.inputStyle) || !isCardLayout(config.cardLayout)
    || typeof config.levelUpEnabled !== "boolean") return fail();
  if (!isCount(value.attemptedCount) || !isCount(value.correctCount)
    || value.correctCount > value.attemptedCount || !isCount(value.bestStreak)
    || value.bestStreak > value.correctCount || !isLevel(value.finalLevel)
    || !isCount(value.startedAtMs) || !isCount(value.completedAtMs)
    || value.completedAtMs - value.startedAtMs !== config.durationSeconds * 1000
    || !Array.isArray(value.answeredQuestions)
    || value.answeredQuestions.length !== value.attemptedCount) return fail();

  let totalMs = 0;
  let correctCount = 0;
  let previousAnswerMs = value.startedAtMs;
  let streak = 0;
  let bestStreak = 0;
  for (const [index, answer] of value.answeredQuestions.entries()) {
    if (!isRecord(answer) || !isRecord(answer.question)) return fail();
    const question = answer.question;
    if (!isCount(question.leftOperand) || !isCount(question.rightOperand)
      || !isCount(question.correctAnswer) || question.id !== index + 1
      || !isLevel(question.difficultyLevel) || !isCount(question.presentedAtMs)
      || !isCount(answer.answeredAtMs) || !isCount(answer.elapsedMs)
      || !isCount(answer.submittedAnswer) || typeof answer.isCorrect !== "boolean"
      || question.presentedAtMs < previousAnswerMs
      || answer.answeredAtMs < question.presentedAtMs
      || answer.answeredAtMs >= value.completedAtMs
      || answer.elapsedMs !== answer.answeredAtMs - question.presentedAtMs) return fail();
    const expected = question.operation === "addition" ? question.leftOperand + question.rightOperand
      : question.operation === "subtraction" ? question.leftOperand - question.rightOperand
        : question.operation === "multiplication" ? question.leftOperand * question.rightOperand : null;
    const operator = question.operation === "addition" ? "+" : question.operation === "subtraction" ? "−" : "×";
    if (expected === null || expected !== question.correctAnswer || question.operator !== operator
      || (config.mode !== "mixed" && config.mode !== question.operation)
      || answer.isCorrect !== (answer.submittedAnswer === expected)
      || !Array.isArray(question.choices) || question.choices.length !== 4
      || !question.choices.every(isCount) || new Set(question.choices).size !== 4
      || !question.choices.includes(expected)) return fail();
    correctCount += Number(answer.isCorrect);
    streak = answer.isCorrect ? streak + 1 : 0;
    bestStreak = Math.max(bestStreak, streak);
    totalMs += answer.elapsedMs;
    previousAnswerMs = answer.answeredAtMs;
  }
  const accuracy = value.attemptedCount === 0 ? 0 : correctCount / value.attemptedCount;
  const average = value.attemptedCount === 0 ? null : totalMs / value.attemptedCount;
  if (value.correctCount !== correctCount || value.accuracy !== accuracy
    || value.averageResponseMs !== average || value.bestStreak !== bestStreak) return fail();
}
