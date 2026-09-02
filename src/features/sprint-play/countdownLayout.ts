export function getTabletCountdownLayout(width: number, availableHeight: number, fontScale: number) {
  const compact = availableHeight < 600;
  const padding = compact ? 20 : 32;
  const mascot = compact ? 48 : 112;
  // Reserve two lines for the note, the headings, margins, and mascot.
  const reserved = padding * 2 + 136 * Math.min(fontScale, 1.2) + 50 + mascot;
  const circle = Math.max(64, Math.min(320, width - 96, availableHeight - reserved));
  return { circle, mascot, padding, numberSize: circle * 0.52 };
}
