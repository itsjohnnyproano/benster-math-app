import { describe, expect, it } from "vitest";
import { groupHistory, localDayKey } from "./historySections";
import { makeResult } from "@/test/resultFixture";
import type { SavedSprint } from "@/domain/results";

function record(id: string, date: Date): SavedSprint {
  return { id, schemaVersion: 1, personalBest: { previous: null, updated: null, status: "ineligible" },
    result: { ...makeResult(0, 0), completedAtMs: date.getTime() } };
}

describe("history day grouping", () => {
  it("groups by local calendar day across midnight and year boundaries", () => {
    const now = new Date(2026, 0, 1, 0, 5);
    const sections = groupHistory([
      record("a", new Date(2026, 0, 1, 0, 1)),
      record("b", new Date(2025, 11, 31, 23, 59)),
      record("c", new Date(2025, 11, 31, 12)),
      record("d", new Date(2025, 11, 29, 12)),
    ], now);
    expect(sections.map((section) => section.data.map((item) => item.id))).toEqual([["a"], ["b", "c"], ["d"]]);
    expect(sections[0].title).toBe("Today");
    expect(sections[1].title).toBe("Yesterday");
    expect(sections[2].key).toBe("2025-12-29");
  });

  it("uses local date components rather than UTC date strings", () => {
    const date = new Date(2026, 7, 27, 0, 1);
    expect(localDayKey(date)).toBe("2026-8-27");
    expect(groupHistory([record("a", date)], date)[0].title).toBe("Today");
    expect(groupHistory([], date)).toEqual([]);
  });

  it("recognizes yesterday across a daylight-saving boundary", () => {
    const now = new Date(2026, 2, 9, 0, 5);
    expect(groupHistory([record("a", new Date(2026, 2, 8, 0, 5))], now)[0].title).toBe("Yesterday");
  });
});
