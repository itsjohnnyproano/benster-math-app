import { hasRoomForColumns } from "@/shared/responsiveLayout";

export const SETTINGS_COLUMN_GAP = 32;

export function getSettingsLayout(isIpad: boolean, width: number, height: number, fontScale: number) {
  const twoColumn = isIpad && hasRoomForColumns(width, height, fontScale, {
    maxWidth: 1120, padding: 64, gap: SETTINGS_COLUMN_GAP, minColumnWidth: 340,
  });
  return { twoColumn, maxWidth: twoColumn ? 1120 : 760 };
}
