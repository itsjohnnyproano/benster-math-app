import { describe, expect, it } from "vitest";
import { getSetupLayout } from "./setupLayout";

describe("Sprint Setup layout", () => {
  it("keeps phones and other platforms out of iPad styling", () => {
    expect(getSetupLayout(393, 852, "ios", 1).tablet).toBe(false);
    expect(getSetupLayout(1366, 1024, "web", 1).tablet).toBe(false);
    expect(getSetupLayout(1366, 1024, "android", 1).tablet).toBe(false);
  });

  it("uses a centered column in portrait and two columns in wide landscape", () => {
    expect(getSetupLayout(768, 1024, "ios", 1)).toEqual({ tablet: true, twoColumn: false, maxWidth: 760 });
    expect(getSetupLayout(1024, 768, "ios", 1)).toEqual({ tablet: true, twoColumn: true, maxWidth: 1100 });
  });

  it("falls back for narrow windows and Larger Text", () => {
    expect(getSetupLayout(740, 700, "ios", 1).twoColumn).toBe(false);
    expect(getSetupLayout(1024, 768, "ios", 1.5).twoColumn).toBe(false);
    expect(getSetupLayout(600, 900, "ios", 1).tablet).toBe(false);
  });
});
