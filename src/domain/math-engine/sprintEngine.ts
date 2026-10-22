import type { SprintConfiguration } from "@/domain/sprint";

import { generateQuestion, getQuestionFactKey } from "./questionGenerator";
import { getPracticeEligibility } from "@/domain/practiceEligibility";
import type {
  ActiveSprintState,
  CompletedSprintState,
  DifficultyLevel,
  RandomSource,
  SprintResult,
  SprintState,
} from "./types";

export const LEVEL_UP_STREAK_THRESHOLD = 5;
export const MAX_DIFFICULTY_LEVEL: DifficultyLevel = 4;
export const ON_FIRE_STREAK_THRESHOLD = 20;
export const MATH_MASTER_STREAK_THRESHOLD = 30;

export type SprintMilestone =
  | Readonly<{ kind: "level-up"; level: DifficultyLevel }>
  | Readonly<{ kind: "on-fire" }>
  | Readonly<{ kind: "math-master" }>;

export function getSprintMilestone(
  previousDifficultyLevel: DifficultyLevel,
  difficultyLevel: DifficultyLevel,
  currentStreak: number,
): SprintMilestone | null {
  if (difficultyLevel > previousDifficultyLevel) {
    return Object.freeze({ kind: "level-up", level: difficultyLevel });
  }
  if (difficultyLevel !== MAX_DIFFICULTY_LEVEL) return null;
  if (currentStreak === ON_FIRE_STREAK_THRESHOLD) return Object.freeze({ kind: "on-fire" });
  if (currentStreak === MATH_MASTER_STREAK_THRESHOLD) return Object.freeze({ kind: "math-master" });

  return null;
}

function createResult(state: ActiveSprintState, completedAtMs: number): SprintResult {
  return Object.freeze({
    configuration: state.configuration,
    attemptedCount: state.attemptedCount,
    correctCount: state.correctCount,
    accuracy:
      state.attemptedCount === 0
        ? 0
        : state.correctCount / state.attemptedCount,
    averageResponseMs: state.attemptedCount === 0
      ? null
      : state.answeredQuestions.reduce((total, answer) => total + answer.elapsedMs, 0)
        / state.attemptedCount,
    bestStreak: state.bestStreak,
    finalLevel: state.difficultyLevel,
    answeredQuestions: state.answeredQuestions,
    startedAtMs: state.startedAtMs,
    completedAtMs,
  });
}

function completeSprint(
  state: ActiveSprintState,
  completedAtMs: number,
): CompletedSprintState {
  return Object.freeze({
    status: "completed",
    configuration: state.configuration,
    result: createResult(state, completedAtMs),
  });
}

export function createSprint(
  configuration: SprintConfiguration,
  startedAtMs: number,
  random: RandomSource = Math.random,
): ActiveSprintState {
  const frozenConfiguration = Object.freeze({ ...configuration });
  const currentQuestion = generateQuestion({
    mode: frozenConfiguration.mode,
    levelUpEnabled: frozenConfiguration.levelUpEnabled,
    difficultyLevel: 1,
    questionId: 1,
    presentedAtMs: startedAtMs,
    range: frozenConfiguration.range,
    tables: frozenConfiguration.tables,
    factNumberLimit: frozenConfiguration.factNumberLimit,
    random,
  });

  return Object.freeze({
    status: "active",
    configuration: frozenConfiguration,
    currentQuestion,
    answeredQuestions: Object.freeze([]),
    attemptedCount: 0,
    correctCount: 0,
    currentStreak: 0,
    bestStreak: 0,
    difficultyLevel: 1,
    startedAtMs,
    endsAtMs: startedAtMs + frozenConfiguration.durationSeconds * 1000,
    nextQuestionId: 2,
    factKeysInCurrentCycle: Object.freeze([
      getQuestionFactKey(currentQuestion.operation, currentQuestion.leftOperand, currentQuestion.rightOperand),
    ]),
  });
}

export function getRemainingMs(state: SprintState, nowMs: number) {
  if (state.status === "completed") return 0;
  return Math.max(0, state.endsAtMs - nowMs);
}

export function tickSprint(state: SprintState, nowMs: number): SprintState {
  if (state.status === "completed" || nowMs < state.endsAtMs) return state;
  return completeSprint(state, state.endsAtMs);
}

export function submitAnswer(
  state: SprintState,
  submittedAnswer: number,
  answeredAtMs: number,
  random: RandomSource = Math.random,
  nextQuestionPresentedAtMs: number = answeredAtMs,
): SprintState {
  if (state.status === "completed") return state;
  if (answeredAtMs >= state.endsAtMs) {
    return completeSprint(state, state.endsAtMs);
  }

  const isCorrect = submittedAnswer === state.currentQuestion.correctAnswer;
  const currentStreak = isCorrect ? state.currentStreak + 1 : 0;
  const bestStreak = Math.max(state.bestStreak, currentStreak);
  const shouldLevelUp =
    state.configuration.levelUpEnabled &&
    isCorrect &&
    currentStreak % LEVEL_UP_STREAK_THRESHOLD === 0;
  const difficultyLevel = shouldLevelUp
    ? (Math.min(
        MAX_DIFFICULTY_LEVEL,
        state.difficultyLevel + 1,
      ) as DifficultyLevel)
    : state.difficultyLevel;
  const answeredQuestion = Object.freeze({
    question: state.currentQuestion,
    submittedAnswer,
    isCorrect,
    answeredAtMs,
    elapsedMs: Math.max(0, answeredAtMs - state.currentQuestion.presentedAtMs),
  });
  const answeredQuestions = Object.freeze([
    ...state.answeredQuestions,
    answeredQuestion,
  ]);

  const updatedState = {
    ...state,
    answeredQuestions,
    attemptedCount: state.attemptedCount + 1,
    correctCount: state.correctCount + (isCorrect ? 1 : 0),
    currentStreak,
    bestStreak,
    difficultyLevel,
    nextQuestionId: state.nextQuestionId + 1,
  };

  // An answer accepted before the deadline still counts when its feedback
  // finishes after expiry. Do not create an unseen next question.
  if (nextQuestionPresentedAtMs >= state.endsAtMs) {
    return completeSprint(updatedState, state.endsAtMs);
  }

  const hasCustomFactPool = state.configuration.range !== undefined
    || state.configuration.tables !== undefined
    || state.configuration.factNumberLimit !== undefined;
  const poolSize = getPracticeEligibility(state.configuration).factCount;
  const excludedFactKeys = hasCustomFactPool && state.factKeysInCurrentCycle.length < poolSize
    ? state.factKeysInCurrentCycle
    : [];
  const currentQuestion = generateQuestion({
    mode: state.configuration.mode,
    levelUpEnabled: state.configuration.levelUpEnabled,
    difficultyLevel,
    questionId: state.nextQuestionId,
    presentedAtMs: Math.max(answeredAtMs, nextQuestionPresentedAtMs),
    range: state.configuration.range,
    tables: state.configuration.tables,
    factNumberLimit: state.configuration.factNumberLimit,
    excludedFactKeys,
    random,
  });
  const nextFactKey = getQuestionFactKey(currentQuestion.operation, currentQuestion.leftOperand, currentQuestion.rightOperand);

  return Object.freeze({
    ...updatedState,
    currentQuestion,
    factKeysInCurrentCycle: Object.freeze([...excludedFactKeys, nextFactKey]),
  });
}
