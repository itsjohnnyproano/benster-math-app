/** Product rules independent of the RevenueCat SDK. */
export const PREMIUM_ENTITLEMENT_ID = "premium";

export type SubscriptionCheckStatus = "loading" | "ready" | "unavailable" | "error";

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
 * The first saved sprint must lead through its acknowledgement before the
 * subscription decision. Keeping this as a distinct pending state lets the
 * app resume the acknowledgement after an interrupted launch.
 */
export function hasPendingFirstResultCelebration({
  onboardingCompleted,
  firstFreeSprintCompleted,
  firstResultCelebrationSeen,
}: {
  onboardingCompleted: boolean;
  firstFreeSprintCompleted: boolean;
  firstResultCelebrationSeen: boolean;
}) {
  return onboardingCompleted && firstFreeSprintCompleted && !firstResultCelebrationSeen;
}

/**
 * Keep a deep link mounted while RevenueCat reads the cached entitlement on a
 * cold launch. Once the initial read settles, non-members are redirected to
 * the subscription screen as usual.
 */
export function canAccessSubscriptionGatedRoutes({
  requiresPremium,
  subscriptionStatus,
}: {
  requiresPremium: boolean;
  subscriptionStatus: SubscriptionCheckStatus;
}) {
  return subscriptionStatus === "loading" || !requiresPremium;
}

/**
 * The confirmation is a short acknowledgement of a purchase, restore, or a
 * Premium learner completing their first sprint. Other returning members
 * resume on Home.
 */
export function shouldShowSubscriptionSuccess({
  subscriptionActive,
  purchaseCompletedInSession,
  showFirstSprintPremiumConfirmation,
}: {
  subscriptionActive: boolean;
  purchaseCompletedInSession: boolean;
  showFirstSprintPremiumConfirmation: boolean;
}) {
  return subscriptionActive && (purchaseCompletedInSession || showFirstSprintPremiumConfirmation);
}
