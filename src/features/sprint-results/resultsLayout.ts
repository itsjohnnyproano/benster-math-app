import { getAdaptiveLayout, hasRoomForColumns } from "@/shared/responsiveLayout";

export function getResultsLayout(width: number, height: number, platform: string, fontScale: number) {
  const adaptive = platform === "ios" ? getAdaptiveLayout(width, height) : "phone";
  const isTablet = adaptive !== "phone";
  const isTwoColumn = isTablet && hasRoomForColumns(width, height, fontScale, {
    maxWidth: 1080, padding: 64, gap: 32, narrowColumnShare: 1 / 2.2, minColumnWidth: 320,
  });
  return { isTablet, isTwoColumn, contentMaxWidth: isTwoColumn ? 1080 : 720 };
}
