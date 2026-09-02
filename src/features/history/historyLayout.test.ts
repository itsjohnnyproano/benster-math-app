import { describe, expect, it } from "vitest";
import type { SavedSprint } from "@/domain/results";
import { makeResult } from "@/test/resultFixture";
import { getHistoryLayout, historyRows } from "./historyLayout";
import { groupHistory } from "./historySections";

function record(id: string, day: number): SavedSprint {
  return {
    id, schemaVersion: 1,
    personalBest: { previous: null, updated: null, status: "ineligible" },
    result: { ...makeResult(0, 0), completedAtMs: new Date(2026, 8, day).getTime() },
  };
}

describe("iPad History layout", () => {
  it("preserves a single column on phones and portrait tablets", () => {
    expect(getHistoryLayout(false, 393, 852, 1).columns).toBe(1);
    expect(getHistoryLayout(true, 768, 1024, 1)).toEqual({ columns: 1, maxWidth: 820 });
    expect(getHistoryLayout(false, 1366, 1024, 1).columns).toBe(1);
  });

  it("uses two columns only with sufficient landscape space and readable text", () => {
    expect(getHistoryLayout(true, 1024, 768, 1)).toEqual({ columns: 2, maxWidth: 1120 });
    expect(getHistoryLayout(true, 740, 700, 1).columns).toBe(1);
    expect(getHistoryLayout(true, 1366, 1024, 2).columns).toBe(1);
  });

  it("preserves day boundaries, order, and unpaired final records", () => {
    const records = [record("a", 2), record("b", 2), record("c", 2), record("d", 1)];
    const sections = groupHistory(records, new Date(2026, 8, 2));
    const rows = historyRows(sections, 2);
    expect(rows.map((section) => section.title)).toEqual(["Today", "Yesterday"]);
    expect(rows.map((section) => section.data.map((row) => row.map((entry) => entry.id))))
      .toEqual([[["a", "b"], ["c"]], [["d"]]]);
    expect(rows.flatMap((section) => section.data.flat())).toEqual(records);
    expect(sections[0].data).toHaveLength(3);
  });

  it("handles empty lists, phone rows, and appended pagination without dropping records", () => {
    expect(historyRows([], 2)).toEqual([]);
    const records = [record("a", 2), record("b", 2), record("c", 2)];
    expect(historyRows(groupHistory(records), 1)[0].data.map((row) => row.length)).toEqual([1, 1, 1]);
    const firstPage = historyRows(groupHistory(records), 2)[0].data;
    const nextPage = historyRows(groupHistory([...records, record("d", 2)]), 2)[0].data;
    expect(firstPage.map((row) => row[0].id)).toEqual(nextPage.map((row) => row[0].id));
    expect(nextPage.flat().map((entry) => entry.id)).toEqual(["a", "b", "c", "d"]);
  });
});
