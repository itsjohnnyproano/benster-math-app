import { describe, expect, it } from "vitest";
import { getHistoryLayout } from "@/features/history/historyLayout";
import { getSettingsLayout } from "@/features/settings/settingsLayout";
import { getResultsLayout } from "@/features/sprint-results/resultsLayout";
import { getSetupLayout } from "@/features/sprint-setup/setupLayout";
import { getStreakLayout } from "@/features/streak/streakLayout";
import { hasRoomForColumns } from "./responsiveLayout";

function landscapeChoices(width: number, height: number, fontScale: number) {
  return [
    getHistoryLayout(true, width, height, fontScale).columns === 2,
    getSettingsLayout(true, width, height, fontScale).twoColumn,
    getResultsLayout(width, height, "ios", fontScale).isTwoColumn,
    getSetupLayout(width, height, "ios", fontScale).twoColumn,
    getStreakLayout(width, height, "ios", fontScale).twoColumn,
  ];
}

describe("iPad screen layout regressions", () => {
  it.each([
    [1180, 820, 1.35], // Physical A16 iPad: previously fell back on every screen.
    [1210, 834, 1], // M4 simulator from the same diagnostic session.
    [1024, 768, 1],
    [1133, 744, 1],
    [1366, 1024, 1.35],
  ])("keeps landscape panes at %i × %i and text scale %s", (width, height, scale) => {
    expect(landscapeChoices(width, height, scale)).toEqual([true, true, true, true, true]);
  });

  it.each([[820, 1180, 1.35], [740, 700, 1], [1180, 820, 2]])(
    "stacks panes when portrait or the reading budget does not fit (%i × %i, %s)",
    (width, height, scale) => {
      expect(landscapeChoices(width, height, scale)).toEqual([false, false, false, false, false]);
    },
  );

  it("uses constrained pane width, not just the physical screen width", () => {
    const fit = { maxWidth: 1120, padding: 48, gap: 20, minColumnWidth: 340 };
    expect(hasRoomForColumns(1180, 820, 1.35, fit)).toBe(true);
    expect(hasRoomForColumns(1800, 1024, 2, fit)).toBe(false);
    expect(hasRoomForColumns(820, 1180, 1, fit)).toBe(false);
  });
});
