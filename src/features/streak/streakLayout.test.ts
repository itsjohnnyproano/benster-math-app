import { describe, expect, it } from "vitest";
import { getStreakLayout } from "./streakLayout";

describe("Streak layout", () => {
  it("preserves phone sizing and excludes other platforms", () => {
    expect(getStreakLayout(393, 852, "ios", 1)).toEqual({ tablet: false, twoColumn: false, maxWidth: 520 });
    expect(getStreakLayout(1100, 800, "web", 1).tablet).toBe(false);
  });
  it("adapts to both iPad orientations", () => {
    expect(getStreakLayout(768, 1024, "ios", 1)).toEqual({ tablet: true, twoColumn: false, maxWidth: 760 });
    expect(getStreakLayout(1024, 768, "ios", 1)).toEqual({ tablet: true, twoColumn: true, maxWidth: 1120 });
  });
  it("uses one column in narrow windows and with Larger Text", () => {
    expect(getStreakLayout(740, 700, "ios", 1).twoColumn).toBe(false);
    expect(getStreakLayout(1366, 1024, "ios", 1.5).twoColumn).toBe(false);
  });
});
