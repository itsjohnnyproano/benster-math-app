import { describe, expect, it } from "vitest";
import { getOnboardingLayout } from "./onboardingLayout";

describe("onboarding layout", () => {
  it("preserves phone sizing and excludes other platforms", () => {
    expect(getOnboardingLayout(true, 393, 852, 1)).toEqual({
      tablet: false, twoColumn: false, maxWidth: 480, introSize: undefined, footerWidth: undefined,
    });
    expect(getOnboardingLayout(false, 1180, 820, 1).tablet).toBe(false);
  });
  it("centers portrait iPad content", () => {
    expect(getOnboardingLayout(true, 820, 1180, 1.35)).toMatchObject({
      tablet: true, twoColumn: false, maxWidth: 640, introSize: 560,
    });
  });
  it.each([[1180, 820, 1.35], [1210, 834, 1], [1024, 768, 1], [1133, 744, 1]])(
    "fits landscape panes at %s × %s with text scale %s", (width, height, scale) => {
      const layout = getOnboardingLayout(true, width, height, scale);
      expect(layout.twoColumn).toBe(true);
      expect(layout.footerWidth! * 2 + 48).toBe(Math.min(width - 64, 1120));
      expect(layout.introSize!).toBeLessThanOrEqual(height - 128);
    },
  );
  it("stacks content when narrow windows or larger text need more room", () => {
    expect(getOnboardingLayout(true, 740, 700, 1.35).twoColumn).toBe(false);
    expect(getOnboardingLayout(true, 1180, 820, 2).twoColumn).toBe(false);
  });
});
