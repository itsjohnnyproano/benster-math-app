import type { ResultOutcome } from "@/domain/results";

export const RESULT_PRESENTATION = {
  "no-attempts": {
    useEncouragementMascot: false,
    message: "Ready when you are—try another sprint!",
  },
  "short-practice": {
    useEncouragementMascot: false,
    message: "Every bit of practice counts!",
  },
  "needs-encouragement": {
    useEncouragementMascot: true,
    message: "Keep practicing—you’re building your skills!",
  },
  celebrate: {
    useEncouragementMascot: false,
    message: "Great practice. Keep it up!",
  },
} as const satisfies Record<ResultOutcome, { useEncouragementMascot: boolean; message: string }>;
