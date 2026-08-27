import type { SavedSprint } from "@/domain/results";

export function localDayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function groupHistory(records: readonly SavedSprint[], now = new Date()) {
  const today = localDayKey(now);
  const yesterdayDate = new Date(now);
  // Calendar arithmetic rather than 24 hours: daylight-saving days can differ.
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = localDayKey(yesterdayDate);
  const sections = new Map<string, { key: string; title: string; data: SavedSprint[] }>();
  for (const record of records) {
    const date = new Date(record.result.completedAtMs);
    const key = localDayKey(date);
    let section = sections.get(key);
    if (!section) {
      const title = key === today ? "Today" : key === yesterday ? "Yesterday"
        : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
      section = { key, title, data: [] };
      sections.set(key, section);
    }
    section.data.push(record);
  }
  return [...sections.values()];
}
