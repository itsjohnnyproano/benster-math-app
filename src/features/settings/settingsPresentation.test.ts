import { describe, expect, it } from "vitest";
import { formatResetPracticeMessage } from "./settingsPresentation";

describe("reset practice confirmation", () => {
  it("describes the current defaults and preserved data", () => {
    expect(formatResetPracticeMessage()).toBe(
      "Restore 1 min, Multiple Choice, Horizontal cards, and Level Up on. Your nickname and saved sprints won’t change.",
    );
  });

  it("reflects every configurable default instead of hardcoding choices", () => {
    expect(formatResetPracticeMessage({
      durationSeconds: 90,
      inputStyle: "typed",
      cardLayout: "vertical",
      levelUpEnabled: false,
    })).toBe(
      "Restore 1 min 30 sec, Typed, Vertical cards, and Level Up off. Your nickname and saved sprints won’t change.",
    );
  });
});
