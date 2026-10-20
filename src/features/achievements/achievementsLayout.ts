export function achievementColumns(isIpad: boolean, width: number, height: number, fontScale: number) {
  if (!isIpad) return 2;
  if (fontScale > 1.3) return 2;
  return width > height ? 4 : 3;
}
