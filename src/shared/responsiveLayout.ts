export const TABLET_MIN_WIDTH = 700;

export type AdaptiveLayout = "phone" | "tablet-portrait" | "tablet-landscape";

export function getAdaptiveLayout(width: number, height: number): AdaptiveLayout {
  if (width < TABLET_MIN_WIDTH) return "phone";
  return width > height ? "tablet-landscape" : "tablet-portrait";
}

type ColumnFit = {
  maxWidth: number;
  padding: number;
  gap: number;
  minColumnWidth: number;
  narrowColumnShare?: number;
};

// Compare the narrowest pane with its reading-width budget at the user's text
// scale. A larger font is not, by itself, a reason to discard landscape layout.
export function hasRoomForColumns(width: number, height: number, fontScale: number, fit: ColumnFit) {
  const available = Math.min(width, fit.maxWidth) - fit.padding - fit.gap;
  const paneWidth = available * (fit.narrowColumnShare ?? 0.5);
  return width > height && paneWidth >= fit.minColumnWidth * Math.max(1, fontScale);
}
