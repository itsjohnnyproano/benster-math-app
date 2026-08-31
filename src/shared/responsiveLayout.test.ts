import { describe, expect, it } from "vitest";

import { getAdaptiveLayout } from "./responsiveLayout";

describe("getAdaptiveLayout", () => {
  it("keeps phones and narrow iPad windows in the phone layout", () => {
    expect(getAdaptiveLayout(393, 852)).toBe("phone");
    expect(getAdaptiveLayout(600, 800)).toBe("phone");
  });

  it("uses the tablet portrait layout when the available width is regular", () => {
    expect(getAdaptiveLayout(768, 1024)).toBe("tablet-portrait");
    expect(getAdaptiveLayout(700, 700)).toBe("tablet-portrait");
  });

  it("uses the tablet landscape layout only when the wide viewport is wider than tall", () => {
    expect(getAdaptiveLayout(1024, 768)).toBe("tablet-landscape");
    expect(getAdaptiveLayout(1366, 1024)).toBe("tablet-landscape");
  });
});
