import { createSprint, submitAnswer, tickSprint, type SprintResult } from "@/domain/math-engine";
import type { SprintConfiguration } from "@/domain/sprint";

export function makeResult(correct = 3, attempts = 5, configuration: Partial<SprintConfiguration> = {}): SprintResult {
  let state = createSprint({
    mode: "addition", durationSeconds: 30, inputStyle: "typed", cardLayout: "horizontal",
    levelUpEnabled: false, ...configuration,
  }, 1000, () => 0.2);
  for (let index = 0; index < attempts; index++) {
    const next = submitAnswer(state, state.currentQuestion.correctAnswer + (index < correct ? 0 : 1),
      2000 + index * 1000, () => 0.2, 2100 + index * 1000);
    if (next.status !== "active") throw new Error("Fixture exceeded sprint time");
    state = next;
  }
  const completed = tickSprint(state, state.endsAtMs);
  if (completed.status !== "completed") throw new Error("Expected completed fixture");
  return completed.result;
}
