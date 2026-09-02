import { getAdaptiveLayout, hasRoomForColumns } from "@/shared/responsiveLayout";

export function getStreakLayout(width: number, height: number, platform: string, fontScale: number) {
  const tablet = platform === "ios" && getAdaptiveLayout(width, height) !== "phone";
  const twoColumn = tablet && hasRoomForColumns(width, height, fontScale, {
    maxWidth: 1120, padding: 64, gap: 32, narrowColumnShare: 0.4, minColumnWidth: 300,
  });
  return { tablet, twoColumn, maxWidth: tablet ? twoColumn ? 1120 : 760 : 520 };
}
