import type { SprintConfiguration } from "@/domain/sprint";

import { generateQuestion } from "./questionGenerator";
import type {
  ActiveSprintState,
  CompletedSprintState,
  DifficultyLevel,
  RandomSource,
  SprintResult,
  SprintState,
} from "./types";

export const LEVEL_UP_STREAK_THRESHOLD = 5;
const MAX_DIFFICULTY_LEVEL: DifficultyLevel = 4;

function createResult(state: ActiveSprintState, completedAtMs: number): SprintResult {
  return Object.freeze({
    configuration: state.configuration,
    attemptedCount: state.attemptedCount,
    correctCount: state.correctCount,
    accuracy:
      state.attemptedCount === 0
        ? 0
        : state.correctCount / state.attemptedCount,
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

  return Object.freeze({
    status: "active",
    configuration: frozenConfiguration,
    currentQuestion: generateQuestion({
      mode: frozenConfiguration.mode,
      levelUpEnabled: frozenConfiguration.levelUpEnabled,
      difficultyLevel: 1,
      questionId: 1,
      presentedAtMs: startedAtMs,
      random,
    }),
    answeredQuestions: Object.freeze([]),
    attemptedCount: 0,
    correctCount: 0,
    currentStreak: 0,
    bestStreak: 0,
    difficultyLevel: 1,
    startedAtMs,
    endsAtMs: startedAtMs + frozenConfiguration.durationSeconds * 1000,
    nextQuestionId: 2,
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

  return Object.freeze({
    ...state,
    currentQuestion: generateQuestion({
      mode: state.configuration.mode,
      levelUpEnabled: state.configuration.levelUpEnabled,
      difficultyLevel,
      questionId: state.nextQuestionId,
      presentedAtMs: answeredAtMs,
      random,
    }),
    answeredQuestions,
    attemptedCount: state.attemptedCount + 1,
    correctCount: state.correctCount + (isCorrect ? 1 : 0),
    currentStreak,
    bestStreak,
    difficultyLevel,
    nextQuestionId: state.nextQuestionId + 1,
  });
}
