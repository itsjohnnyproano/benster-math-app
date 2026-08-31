export const TABLET_MIN_WIDTH = 700;

export type AdaptiveLayout = "phone" | "tablet-portrait" | "tablet-landscape";

export function getAdaptiveLayout(width: number, height: number): AdaptiveLayout {
  if (width < TABLET_MIN_WIDTH) return "phone";
  return width > height ? "tablet-landscape" : "tablet-portrait";
}
