export function achievementColumns(isIpad: boolean, width: number, height: number, fontScale: number) {
  if (!isIpad) return 2;
  if (fontScale > 1.3) return 2;
  return width > height ? 4 : 3;
}

/** Keeps the landscape iPad detail sheet at its portrait-width counterpart. */
export function achievementDetailModalWidth(isIpad: boolean, width: number, height: number) {
  return isIpad && width > height ? Math.max(0, height - 32) : undefined;
}
