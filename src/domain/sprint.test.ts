import { describe, expect, it } from "vitest";

import { getPracticeSelectionKey, type SprintConfiguration } from "./sprint";

const CONFIGURATION: SprintConfiguration = {
  mode: "multiplication",
  durationSeconds: 30,
  inputStyle: "multiple-choice",
  cardLayout: "horizontal",
  levelUpEnabled: true,
};

describe("getPracticeSelectionKey", () => {
  it("uses one key for the same selected tables in any order", () => {
    expect(getPracticeSelectionKey({ ...CONFIGURATION, tables: [6, 9] }))
      .toBe(getPracticeSelectionKey({ ...CONFIGURATION, tables: [9, 6] }));
  });
});
