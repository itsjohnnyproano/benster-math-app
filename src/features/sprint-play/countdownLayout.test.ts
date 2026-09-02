import { describe, expect, it } from "vitest";
import { getTabletCountdownLayout } from "./countdownLayout";

describe("tablet countdown sizing", () => {
  it.each([[768, 980], [1024, 720], [1366, 980]])("enlarges the circle at %i by %i", (width, height) => {
    const layout = getTabletCountdownLayout(width, height, 1);
    expect(layout.circle).toBe(320);
    expect(layout.numberSize).toBeGreaterThan(96);
  });
  it.each([1, 1.2, 2])("fits shorter windows at font scale %i", (fontScale) => {
    const layout = getTabletCountdownLayout(1024, 450, fontScale);
    const total = layout.circle + layout.padding * 2 + layout.mascot + 136 * Math.min(fontScale, 1.2) + 50;
    expect(total).toBeLessThanOrEqual(450);
  });
});
