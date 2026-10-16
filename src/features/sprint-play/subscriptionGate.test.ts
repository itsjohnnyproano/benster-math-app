import { describe, expect, it } from "vitest";

import { getSprintSubscriptionGate } from "./subscriptionGate";

describe("sprint subscription gate", () => {
  it("does not interrupt the completed first free sprint's results", () => {
    expect(getSprintSubscriptionGate({
      firstFreeSprintCompleted: true,
      isPremium: false,
      sprintCompleted: true,
      subscriptionStatus: "ready",
    })).toEqual({ subscriptionCheckPending: false, requiresPremium: false });
  });

  it("gates a later sprint for a non-subscriber", () => {
    expect(getSprintSubscriptionGate({
      firstFreeSprintCompleted: true,
      isPremium: false,
      sprintCompleted: false,
      subscriptionStatus: "ready",
    })).toEqual({ subscriptionCheckPending: false, requiresPremium: true });
  });
});
