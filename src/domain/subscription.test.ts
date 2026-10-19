import { describe, expect, it } from "vitest";
import {
  canAccessSubscriptionGatedRoutes,
  hasPremiumEntitlement,
  hasPendingFirstResultCelebration,
  isEligibleForSevenDayTrial,
  isSevenDayFreeTrial,
  requiresPremiumAfterOnboardingSprint,
  shouldShowSubscriptionSuccess,
} from "./subscription";

describe("subscription rules", () => {
  it("recognizes only the configured premium entitlement", () => {
    expect(hasPremiumEntitlement({ premium: {} })).toBe(true);
    expect(hasPremiumEntitlement({ other: {} })).toBe(false);
  });

  it("recognizes Benster's configured seven-day annual trial", () => {
    expect(isSevenDayFreeTrial({ price: 0, periodUnit: "DAY", periodNumberOfUnits: 7 })).toBe(true);
    expect(isSevenDayFreeTrial({ price: 0, periodUnit: "WEEK", periodNumberOfUnits: 1 })).toBe(true);
    expect(isSevenDayFreeTrial({ price: 0, periodUnit: "DAY", periodNumberOfUnits: 14 })).toBe(false);
    expect(isSevenDayFreeTrial({ price: 4.99, periodUnit: "DAY", periodNumberOfUnits: 7 })).toBe(false);
    expect(isSevenDayFreeTrial(null)).toBe(false);
  });

  it("only promises a trial when RevenueCat confirms eligibility", () => {
    expect(isEligibleForSevenDayTrial("eligible")).toBe(true);
    expect(isEligibleForSevenDayTrial("ineligible")).toBe(false);
    expect(isEligibleForSevenDayTrial("unknown")).toBe(false);
  });

  it("gates the app only after the first sprint result and celebration are complete", () => {
    const beforePaywall = {
      onboardingCompleted: true,
      firstFreeSprintCompleted: true,
      firstResultCelebrationSeen: false,
      isPremium: false,
    };

    expect(requiresPremiumAfterOnboardingSprint(beforePaywall)).toBe(false);
    expect(requiresPremiumAfterOnboardingSprint({ ...beforePaywall, firstResultCelebrationSeen: true })).toBe(true);
    expect(requiresPremiumAfterOnboardingSprint({ ...beforePaywall, firstResultCelebrationSeen: true, isPremium: true })).toBe(false);
  });

  it("resumes a pending first-result celebration after an interrupted launch", () => {
    expect(hasPendingFirstResultCelebration({
      onboardingCompleted: true,
      firstFreeSprintCompleted: true,
      firstResultCelebrationSeen: false,
    })).toBe(true);
    expect(hasPendingFirstResultCelebration({
      onboardingCompleted: true,
      firstFreeSprintCompleted: true,
      firstResultCelebrationSeen: true,
    })).toBe(false);
  });

  it("keeps a returning subscriber's requested route mounted while their entitlement loads", () => {
    expect(canAccessSubscriptionGatedRoutes({
      requiresPremium: true,
      subscriptionStatus: "loading",
    })).toBe(true);
    expect(canAccessSubscriptionGatedRoutes({
      requiresPremium: true,
      subscriptionStatus: "ready",
    })).toBe(false);
    expect(canAccessSubscriptionGatedRoutes({
      requiresPremium: false,
      subscriptionStatus: "ready",
    })).toBe(true);
  });

  it("shows the Premium confirmation only after an in-session purchase or restore", () => {
    expect(shouldShowSubscriptionSuccess({ subscriptionActive: true, purchaseCompletedInSession: true })).toBe(true);
    expect(shouldShowSubscriptionSuccess({ subscriptionActive: true, purchaseCompletedInSession: false })).toBe(false);
    expect(shouldShowSubscriptionSuccess({ subscriptionActive: false, purchaseCompletedInSession: true })).toBe(false);
  });
});
