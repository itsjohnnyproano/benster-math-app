import { getAdaptiveLayout, hasRoomForColumns } from "@/shared/responsiveLayout";

export const ONBOARDING_COLUMN_GAP = 48;

export function getOnboardingLayout(isIos: boolean, width: number, height: number, fontScale: number) {
  const tablet = isIos && getAdaptiveLayout(width, height) !== "phone";
  const twoColumn = tablet && hasRoomForColumns(width, height, fontScale, {
    maxWidth: 1184, padding: 64, gap: ONBOARDING_COLUMN_GAP, minColumnWidth: 300,
  });
  const maxWidth = tablet ? (twoColumn ? 1120 : 640) : 480;
  return {
    tablet,
    twoColumn,
    maxWidth,
    introSize: tablet ? Math.min(560, width - 64, height - 128) : undefined,
    footerWidth: twoColumn ? (Math.min(width - 64, maxWidth) - ONBOARDING_COLUMN_GAP) / 2 : undefined,
  };
}
