import { getAdaptiveLayout, hasRoomForColumns } from "@/shared/responsiveLayout";

export const SUBSCRIPTION_COLUMN_GAP = 48;

export function getSubscriptionLayout(isIos: boolean, width: number, height: number, fontScale: number) {
  const tablet = isIos && getAdaptiveLayout(width, height) !== "phone";
  const twoColumn = tablet && hasRoomForColumns(width, height, fontScale, {
    maxWidth: 1120,
    padding: 64,
    gap: SUBSCRIPTION_COLUMN_GAP,
    minColumnWidth: 320,
  });

  return {
    tablet,
    twoColumn,
    maxWidth: twoColumn ? 1120 : 600,
  };
}
