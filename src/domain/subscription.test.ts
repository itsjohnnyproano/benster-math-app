import { describe, expect, it } from "vitest";
import { hasPremiumEntitlement, isEligibleForSevenDayTrial, isSevenDayFreeTrial } from "./subscription";

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
});
