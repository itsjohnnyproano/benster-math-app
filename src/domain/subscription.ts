/** Product rules independent of the RevenueCat SDK. */
export const PREMIUM_ENTITLEMENT_ID = "premium";

export function hasPremiumEntitlement(activeEntitlements: Record<string, unknown>) {
  return activeEntitlements[PREMIUM_ENTITLEMENT_ID] !== undefined;
}

export function isSevenDayFreeTrial(intro: { price: number; periodUnit: string; periodNumberOfUnits: number } | null | undefined) {
  return intro?.price === 0
    && ((intro.periodUnit === "DAY" && intro.periodNumberOfUnits === 7)
      || (intro.periodUnit === "WEEK" && intro.periodNumberOfUnits === 1));
}

/** Unknown eligibility is treated as ineligible so the UI never promises a trial Apple may not grant. */
export function isEligibleForSevenDayTrial(status: "eligible" | "ineligible" | "unknown") {
  return status === "eligible";
}

/**
 * The completed onboarding sprint and its celebration remain visible. Once
 * both are complete, the first subscription decision gates the rest of the
 * app until RevenueCat confirms the Premium entitlement.
 */
export function requiresPremiumAfterOnboardingSprint({
  onboardingCompleted,
  firstFreeSprintCompleted,
  firstResultCelebrationSeen,
  isPremium,
}: {
  onboardingCompleted: boolean;
  firstFreeSprintCompleted: boolean;
  firstResultCelebrationSeen: boolean;
  isPremium: boolean;
}) {
  return onboardingCompleted
    && firstFreeSprintCompleted
    && firstResultCelebrationSeen
    && !isPremium;
}

/**
 * The confirmation is a short, in-session acknowledgement of a purchase or
 * restore. An existing member returning to the app should resume on Home.
 */
export function shouldShowSubscriptionSuccess({
  subscriptionActive,
  purchaseCompletedInSession,
}: {
  subscriptionActive: boolean;
  purchaseCompletedInSession: boolean;
}) {
  return subscriptionActive && purchaseCompletedInSession;
}
