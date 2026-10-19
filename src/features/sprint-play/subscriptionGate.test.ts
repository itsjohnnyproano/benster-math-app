import { describe, expect, it } from "vitest";

import { canStartSprintCountdown, getSprintSubscriptionGate } from "./subscriptionGate";

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

  it.each(["unavailable", "error"] as const)("fails closed when the subscription service is %s", (subscriptionStatus) => {
    expect(getSprintSubscriptionGate({
      firstFreeSprintCompleted: true,
      isPremium: false,
      sprintCompleted: false,
      subscriptionStatus,
    })).toEqual({ subscriptionCheckPending: false, requiresPremium: true });
  });

  it("does not start a countdown until the initial entitlement check has settled", () => {
    const pending = getSprintSubscriptionGate({
      firstFreeSprintCompleted: true,
      isPremium: false,
      sprintCompleted: false,
      subscriptionStatus: "loading",
    });
    const subscriber = getSprintSubscriptionGate({
      firstFreeSprintCompleted: true,
      isPremium: true,
      sprintCompleted: false,
      subscriptionStatus: "ready",
    });

    expect(canStartSprintCountdown(pending)).toBe(false);
    expect(canStartSprintCountdown(subscriber)).toBe(true);
  });
});
