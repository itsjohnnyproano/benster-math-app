import type { SprintConfiguration } from "./sprint";

export const FULL_SPRINT_MIN_FACTS = 10;

export type PracticeSessionKind = "focused" | "varied" | "full";

export type PracticeEligibility = Readonly<{
  factCount: number;
  kind: PracticeSessionKind;
  qualifiesForCompetitiveRecognition: boolean;
}>;

function additionFactCount(maxSum: number) {
  const half = Math.floor(maxSum / 2);
  return maxSum % 2 === 0 ? (half + 1) ** 2 : (half + 1) * (half + 2);
}

function multiplicationFactCount(tables: readonly number[], otherFactorMax: number) {
  const facts = new Set<string>();
  for (const table of tables) {
    for (let otherFactor = 1; otherFactor <= otherFactorMax; otherFactor += 1) {
      facts.add([table, otherFactor].sort((left, right) => left - right).join("×"));
    }
  }
  return facts.size;
}

function getCustomFactCount(configuration: Pick<SprintConfiguration, "mode" | "range" | "tables" | "factNumberLimit">) {
  if (configuration.mode === "addition" && configuration.range !== undefined) {
    return additionFactCount(configuration.range);
  }
  if (configuration.mode === "subtraction" && configuration.range !== undefined) {
    return (configuration.range + 1) * (configuration.range + 2) / 2;
  }
  if (configuration.mode === "multiplication" || configuration.mode === "division") {
    const max = configuration.factNumberLimit;
    if (max === undefined) return null;
    if (!configuration.tables || configuration.tables.length === 0) {
      return configuration.mode === "multiplication"
        ? max * (max + 1) / 2
        : max * max;
    }
    return configuration.mode === "multiplication"
      ? multiplicationFactCount(configuration.tables, max)
      : configuration.tables.length * max;
  }
  return null;
}

/**
 * Normal sprints intentionally stay fully eligible. Custom settings are
 * classified by distinct mathematical facts, not by display order: 12 × 1
 * and 1 × 12 are one fact.
 */
export function getPracticeEligibility(
  configuration: Pick<SprintConfiguration, "mode" | "range" | "tables" | "factNumberLimit">,
): PracticeEligibility {
  const factCount = getCustomFactCount(configuration);
  if (factCount === null || factCount >= FULL_SPRINT_MIN_FACTS) {
    return { factCount: factCount ?? FULL_SPRINT_MIN_FACTS, kind: "full", qualifiesForCompetitiveRecognition: true };
  }
  return factCount < 5
    ? { factCount, kind: "focused", qualifiesForCompetitiveRecognition: false }
    : { factCount, kind: "varied", qualifiesForCompetitiveRecognition: false };
}
