import { describe, expect, it } from "vitest";

import type { SprintConfiguration } from "./sprint";
import { getPracticeEligibility } from "./practiceEligibility";

const configuration: SprintConfiguration = {
  mode: "multiplication", durationSeconds: 60, inputStyle: "multiple-choice",
  cardLayout: "horizontal", levelUpEnabled: true,
};

describe("practice eligibility", () => {
  it("keeps normal sprints fully eligible", () => {
    expect(getPracticeEligibility(configuration)).toMatchObject({ kind: "full", qualifiesForCompetitiveRecognition: true });
  });

  it("classifies a selected table by distinct facts rather than operand order", () => {
    expect(getPracticeEligibility({ ...configuration, tables: [12], factNumberLimit: 3 }))
      .toEqual({ factCount: 3, kind: "focused", qualifiesForCompetitiveRecognition: false });
    expect(getPracticeEligibility({ ...configuration, tables: [12], factNumberLimit: 5 }))
      .toEqual({ factCount: 5, kind: "varied", qualifiesForCompetitiveRecognition: false });
    expect(getPracticeEligibility({ ...configuration, tables: [12], factNumberLimit: 12 }))
      .toEqual({ factCount: 12, kind: "full", qualifiesForCompetitiveRecognition: true });
  });

  it("keeps broad addition and subtraction ranges fully eligible", () => {
    expect(getPracticeEligibility({ ...configuration, mode: "addition", range: 10 }))
      .toMatchObject({ factCount: 36, kind: "full" });
    expect(getPracticeEligibility({ ...configuration, mode: "subtraction", range: 10 }))
      .toMatchObject({ factCount: 66, kind: "full" });
  });

  it("recognizes genuinely narrow addition, subtraction, and division pools", () => {
    expect(getPracticeEligibility({ ...configuration, mode: "addition", range: 2 })).toMatchObject({ factCount: 4, kind: "focused" });
    expect(getPracticeEligibility({ ...configuration, mode: "subtraction", range: 2 })).toMatchObject({ factCount: 6, kind: "varied" });
    expect(getPracticeEligibility({ ...configuration, mode: "division", tables: [12], factNumberLimit: 3 })).toMatchObject({ factCount: 3, kind: "focused" });
  });
});
