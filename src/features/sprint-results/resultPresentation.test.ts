import { describe, expect, it } from "vitest";

import { formatResponseTime, RESULT_PRESENTATION } from "./resultPresentation";

describe("result presentation", () => {
  it("preserves wording and mascot choices for every outcome", () => {
    expect(RESULT_PRESENTATION).toEqual({
      "no-attempts": { useEncouragementMascot: false, message: "Ready when you are—try another sprint!" },
      "short-practice": { useEncouragementMascot: false, message: "Every bit of practice counts!" },
      "needs-encouragement": { useEncouragementMascot: true, message: "Keep practicing—you’re building your skills!" },
      celebrate: { useEncouragementMascot: false, message: "Great practice. Keep it up!" },
    });
  });

  it("formats response times without changing the empty state", () => {
    expect(formatResponseTime(2800 / 3)).toBe("0.9 sec");
    expect(formatResponseTime(0)).toBe("0.0 sec");
    expect(formatResponseTime(null)).toBe("—");
  });
});
