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
