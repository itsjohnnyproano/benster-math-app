import { getAdaptiveLayout, hasRoomForColumns } from "@/shared/responsiveLayout";

export function getSetupLayout(width: number, height: number, platform: string, fontScale: number) {
  const tablet = platform === "ios" && getAdaptiveLayout(width, height) !== "phone";
  const twoColumn = tablet && hasRoomForColumns(width, height, fontScale, {
    maxWidth: 1100, padding: 64, gap: 36, narrowColumnShare: 0.38, minColumnWidth: 270,
  });
  return { tablet, twoColumn, maxWidth: twoColumn ? 1100 : 760 };
}
