import type { groupHistory } from "./historySections";
import { hasRoomForColumns } from "@/shared/responsiveLayout";

export function getHistoryLayout(isIpad: boolean, width: number, height: number, fontScale: number) {
  const columns = isIpad && hasRoomForColumns(width, height, fontScale, {
    maxWidth: 1120, padding: 64, gap: 20, minColumnWidth: 340,
  }) ? 2 : 1;
  return { columns, maxWidth: columns === 2 ? 1120 : 820 };
}

// Pair only within each day, preserving chronological order and pagination.
export function historyRows(sections: ReturnType<typeof groupHistory>, columns: number) {
  const rowSize = columns === 2 ? 2 : 1;
  return sections.map((section) => {
    const data = [];
    for (let index = 0; index < section.data.length; index += rowSize) {
      data.push(section.data.slice(index, index + rowSize));
    }
    return { ...section, data };
  });
}
