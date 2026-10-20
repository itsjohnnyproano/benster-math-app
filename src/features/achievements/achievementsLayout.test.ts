import { describe, expect, it } from "vitest";
import { achievementColumns, achievementDetailModalWidth } from "./achievementsLayout";

describe("achievementColumns", () => {
  it("keeps phone badges touchable and expands the iPad grid responsively", () => {
    expect(achievementColumns(false, 390, 844, 1)).toBe(2);
    expect(achievementColumns(true, 834, 1194, 1)).toBe(3);
    expect(achievementColumns(true, 1194, 834, 1)).toBe(4);
    expect(achievementColumns(true, 1194, 834, 1.4)).toBe(2);
  });

  it("uses the portrait-equivalent width for only the iPad landscape detail sheet", () => {
    expect(achievementDetailModalWidth(false, 844, 390)).toBeUndefined();
    expect(achievementDetailModalWidth(true, 834, 1194)).toBeUndefined();
    expect(achievementDetailModalWidth(true, 1194, 834)).toBe(802);
  });
});
