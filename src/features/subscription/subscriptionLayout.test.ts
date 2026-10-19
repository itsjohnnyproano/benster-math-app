import { describe, expect, it } from "vitest";

import { getSubscriptionLayout } from "./subscriptionLayout";

describe("subscription layout", () => {
  it("keeps phones and iPad portrait in a centered single column", () => {
    expect(getSubscriptionLayout(true, 393, 852, 1)).toEqual({ tablet: false, twoColumn: false, maxWidth: 600 });
    expect(getSubscriptionLayout(true, 820, 1180, 1.25)).toEqual({ tablet: true, twoColumn: false, maxWidth: 600 });
  });

  it("uses two columns only when an iPad landscape window has room", () => {
    expect(getSubscriptionLayout(true, 1180, 820, 1.25)).toEqual({ tablet: true, twoColumn: true, maxWidth: 1120 });
    expect(getSubscriptionLayout(true, 740, 700, 1.25).twoColumn).toBe(false);
    expect(getSubscriptionLayout(false, 1180, 820, 1).twoColumn).toBe(false);
  });
});
