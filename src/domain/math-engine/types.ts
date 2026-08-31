import type { SprintConfiguration, SprintMode } from "@/domain/sprint";

export const OPERATIONS = ["addition", "subtraction", "multiplication", "division"] as const;
export type MathOperation = (typeof OPERATIONS)[number];
export type DifficultyLevel = 1 | 2 | 3 | 4;

export function isMathOperation(value: unknown): value is MathOperation {
  return OPERATIONS.includes(value as MathOperation);
}

export const MATH_OPERATORS = {
  addition: "+",
  subtraction: "−",
  multiplication: "×",
  division: "÷",
} as const satisfies Record<MathOperation, string>;

export type RandomSource = () => number;

export type MathQuestion = Readonly<{
  id: number;
  operation: MathOperation;
  leftOperand: number;
  rightOperand: number;
  operator: (typeof MATH_OPERATORS)[MathOperation];
  correctAnswer: number;
  choices: readonly number[];
  difficultyLevel: DifficultyLevel;
  presentedAtMs: number;
}>;

export type AnsweredQuestion = Readonly<{
  question: MathQuestion;
  submittedAnswer: number;
  isCorrect: boolean;
  answeredAtMs: number;
  elapsedMs: number;
}>;

export type SprintResult = Readonly<{
  configuration: SprintConfiguration;
  attemptedCount: number;
  correctCount: number;
  accuracy: number;
  averageResponseMs: number | null;
  bestStreak: number;
  finalLevel: DifficultyLevel;
  answeredQuestions: readonly AnsweredQuestion[];
  startedAtMs: number;
  completedAtMs: number;
}>;

export type ActiveSprintState = Readonly<{
  status: "active";
  configuration: SprintConfiguration;
  currentQuestion: MathQuestion;
  answeredQuestions: readonly AnsweredQuestion[];
  attemptedCount: number;
  correctCount: number;
  currentStreak: number;
  bestStreak: number;
  difficultyLevel: DifficultyLevel;
  startedAtMs: number;
  endsAtMs: number;
  nextQuestionId: number;
}>;

export type CompletedSprintState = Readonly<{
  status: "completed";
  configuration: SprintConfiguration;
  result: SprintResult;
}>;

export type SprintState = ActiveSprintState | CompletedSprintState;

export type QuestionGenerationInput = Readonly<{
  mode: SprintMode;
  levelUpEnabled: boolean;
  difficultyLevel: DifficultyLevel;
  questionId: number;
  presentedAtMs: number;
  random?: RandomSource;
}>;
