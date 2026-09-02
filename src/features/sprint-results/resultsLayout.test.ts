import { describe, expect, it } from "vitest";
import { getResultsLayout } from "./resultsLayout";

describe("Results responsive layout", () => {
  it.each([[375, 667], [393, 852], [440, 956]])("leaves iPhone %i × %i unchanged", (width, height) => {
    expect(getResultsLayout(width, height, "ios", 1).isTablet).toBe(false);
    expect(getResultsLayout(width, height, "ios", 1).isTwoColumn).toBe(false);
  });

  it.each([[744, 1133], [768, 1024], [1024, 1366]])("constrains portrait iPad %i × %i", (width, height) => {
    expect(getResultsLayout(width, height, "ios", 1)).toEqual({
      isTablet: true, isTwoColumn: false, contentMaxWidth: 720,
    });
  });

  it.each([[1024, 768], [1133, 744], [1366, 1024]])("uses two columns in landscape %i × %i", (width, height) => {
    expect(getResultsLayout(width, height, "ios", 1)).toEqual({
      isTablet: true, isTwoColumn: true, contentMaxWidth: 1080,
    });
  });

  it("falls back to a readable stack for narrow windows or larger text", () => {
    expect(getResultsLayout(600, 800, "ios", 1).isTablet).toBe(false);
    expect(getResultsLayout(740, 700, "ios", 1).isTwoColumn).toBe(false);
    expect(getResultsLayout(1024, 768, "ios", 1.5).isTwoColumn).toBe(false);
  });

  it("does not change other platforms", () => {
    for (const platform of ["android", "web"]) {
      expect(getResultsLayout(1366, 1024, platform, 1).isTablet).toBe(false);
    }
  });
});
