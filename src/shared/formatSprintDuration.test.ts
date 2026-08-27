import { expect, it } from "vitest";

import { formatDurationLabel, formatDurationSubtitle } from "./formatSprintDuration";

it.each([
  [30, "30 sec", "30-second sprint"],
  [60, "1 min", "1-minute sprint"],
  [90, "1 min 30 sec", "1-minute 30-second sprint"],
  [120, "2 min", "2-minute sprint"],
] as const)("preserves labels for %i seconds", (duration, label, subtitle) => {
  expect(formatDurationLabel(duration)).toBe(label);
  expect(formatDurationSubtitle(duration)).toBe(subtitle);
});
