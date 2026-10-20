import type { SprintResult } from "@/domain/math-engine";
import { getResultOutcome, type ResultOutcome } from "@/domain/results";

type ResultMascot = "gentle-reminder" | "thumbs-up" | "fallen" | "celebrate" | "perfect";

type ResultPresentation = Readonly<{
  mascot: ResultMascot;
  title: string;
  message: (result: Pick<SprintResult, "correctCount" | "attemptedCount">) => string;
}>;

const RESULT_PRESENTATION: Record<ResultOutcome, ResultPresentation> = {
  "no-attempts": {
    mascot: "gentle-reminder",
    title: "Your Sprint Awaits",
    message: () => "Whenever you’re ready, choose a sprint and give it a try.",
  },
  "short-practice": {
    mascot: "thumbs-up",
    title: "Nice Start!",
    message: () => "Every question helps your math brain grow. Try five questions to see your accuracy result.",
  },
  "needs-encouragement": {
    mascot: "fallen",
    title: "Keep Growing!",
    message: ({ correctCount, attemptedCount }) => `You got ${correctCount} of ${attemptedCount} correct. Keep practicing—every sprint builds your skills!`,
  },
  "good-start": {
    mascot: "thumbs-up",
    title: "Nice Work!",
    message: ({ correctCount, attemptedCount }) => `You got ${correctCount} of ${attemptedCount} correct. Keep going and aim for 10 questions!`,
  },
  "perfect-start": {
    mascot: "thumbs-up",
    title: "Perfect Start!",
    message: ({ correctCount, attemptedCount }) => `${correctCount} for ${attemptedCount} correct! Answer ${10 - attemptedCount} more to earn a Perfect Sprint.`,
  },
  "solid-work": {
    mascot: "thumbs-up",
    title: "Solid Work!",
    message: ({ correctCount, attemptedCount }) => `${correctCount} of ${attemptedCount} correct—keep building and aim for 90%!`,
  },
  celebrate: {
    mascot: "celebrate",
    title: "Amazing Focus!",
    message: ({ correctCount, attemptedCount }) => `${correctCount} of ${attemptedCount} correct—your accuracy is shining!`,
  },
  "perfect-sprint": {
    mascot: "perfect",
    title: "Perfect Sprint!",
    message: ({ correctCount, attemptedCount }) => `${correctCount} for ${attemptedCount} correct—awesome focus and effort!`,
  },
  "math-superstar": {
    mascot: "perfect",
    title: "Math Superstar!",
    message: ({ correctCount, attemptedCount }) => `${correctCount} for ${attemptedCount} correct—an incredible perfect sprint!`,
  },
};

export function getResultPresentation(result: SprintResult) {
  const presentation = RESULT_PRESENTATION[getResultOutcome(result)];
  return {
    mascot: presentation.mascot,
    title: presentation.title,
    message: presentation.message(result),
  };
}
