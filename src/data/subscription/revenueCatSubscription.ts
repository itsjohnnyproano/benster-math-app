import Purchases, {
  INTRO_ELIGIBILITY_STATUS,
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesPackage,
} from "react-native-purchases";
import { Platform } from "react-native";
import {
  hasPremiumEntitlement,
  isEligibleForSevenDayTrial,
  isSevenDayFreeTrial,
} from "@/domain/subscription";

export { PREMIUM_ENTITLEMENT_ID } from "@/domain/subscription";

export type SubscriptionOffer = Readonly<{
  id: string;
  label: "Monthly" | "Yearly";
  purchasePackage: PurchasesPackage;
  price: string;
  pricePerMonth: string | null;
  amount: number;
  billingPeriod: "monthly" | "yearly";
  hasSevenDayTrial: boolean;
}>;

export type SubscriptionAccess = Readonly<{
  configured: boolean;
  premium: boolean;
}>;

let configured = false;

function apiKey() {
  return Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
    default: undefined,
  });
}

/**
 * Configures RevenueCat once for this app process.
 *
 * Learner names, profile identifiers, and sprint data intentionally stay on
 * the device: no appUserID or subscriber attributes are supplied here.
 */
export function initializeSubscriptionService() {
  const key = apiKey();
  if (!key) return false;
  if (!configured) {
    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey: key });
    configured = true;
  }
  return true;
}

function isPremium(customerInfo: CustomerInfo) {
  return hasPremiumEntitlement(customerInfo.entitlements.active);
}

function hasConfiguredSevenDayTrial(aPackage: PurchasesPackage) {
  return isSevenDayFreeTrial(aPackage.product.introPrice);
}

async function isEligibleForAnnualTrial(aPackage: PurchasesPackage) {
  // RevenueCat only reports individual introductory-offer eligibility on iOS.
  // Android returns unknown, so its UI must use the standard annual terms.
  if (Platform.OS !== "ios") return false;

  try {
    const eligibility = await Purchases.checkTrialOrIntroductoryPriceEligibility([
      aPackage.product.identifier,
    ]);
    const status = eligibility[aPackage.product.identifier]?.status;
    return isEligibleForSevenDayTrial(
      status === INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE
        ? "eligible"
        : status === INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_INELIGIBLE
          ? "ineligible"
          : "unknown",
    );
  } catch {
    // Eligibility is intentionally conservative: a trial must be confirmed
    // before it is advertised to a learner's family.
    return false;
  }
}

function createSubscriptionOffer(
  purchasePackage: PurchasesPackage | null,
  label: SubscriptionOffer["label"],
): SubscriptionOffer | null {
  if (!purchasePackage) return null;

  const hasSevenDayTrial = hasConfiguredSevenDayTrial(purchasePackage);
  // Benster's launch offering is deliberately straightforward: the yearly plan
  // includes the seven-day introductory trial, while monthly is available as a
  // transparent no-trial alternative. Treat a dashboard mismatch as unavailable
  // rather than showing a misleading purchase promise.
  if ((label === "Yearly" && !hasSevenDayTrial) || (label === "Monthly" && hasSevenDayTrial)) return null;

  return {
    id: purchasePackage.identifier,
    label,
    purchasePackage,
    price: purchasePackage.product.priceString,
    pricePerMonth: purchasePackage.product.pricePerMonthString,
    amount: purchasePackage.product.price,
    billingPeriod: label === "Yearly" ? "yearly" : "monthly",
    // This is replaced with customer-specific eligibility below for annual.
    hasSevenDayTrial,
  };
}

export async function loadSubscriptionOffers(): Promise<readonly SubscriptionOffer[]> {
  if (!initializeSubscriptionService()) return [];
  const offering = (await Purchases.getOfferings()).current;
  // Only show the standard monthly and annual packages. The annual package
  // must have the configured seven-day trial; monthly must not.
  const monthly = createSubscriptionOffer(offering?.monthly ?? null, "Monthly");
  const annual = createSubscriptionOffer(offering?.annual ?? null, "Yearly");
  const annualWithEligibility = annual && {
    ...annual,
    hasSevenDayTrial: await isEligibleForAnnualTrial(annual.purchasePackage),
  };

  return [monthly, annualWithEligibility].filter((offer): offer is SubscriptionOffer => offer !== null);
}

/** Reads the device's current RevenueCat entitlement without associating local learners to an account. */
export async function getSubscriptionAccess(): Promise<SubscriptionAccess> {
  if (!initializeSubscriptionService()) return { configured: false, premium: false };
  return { configured: true, premium: isPremium(await Purchases.getCustomerInfo()) };
}

/** Subscribes to entitlement changes from purchases, restores, renewals, and expirations. */
export function subscribeToSubscriptionAccess(onChange: (premium: boolean) => void) {
  if (!initializeSubscriptionService()) return null;

  const listener = (customerInfo: CustomerInfo) => onChange(isPremium(customerInfo));
  Purchases.addCustomerInfoUpdateListener(listener);

  return () => {
    Purchases.removeCustomerInfoUpdateListener(listener);
  };
}

export async function purchaseSubscription(offer: SubscriptionOffer) {
  if (!initializeSubscriptionService()) throw new Error("Subscription purchases are not configured");
  const { customerInfo } = await Purchases.purchasePackage(offer.purchasePackage);
  return { premium: isPremium(customerInfo) };
}

export async function restoreSubscriptionPurchases() {
  if (!initializeSubscriptionService()) throw new Error("Subscription purchases are not configured");
  return isPremium(await Purchases.restorePurchases());
}

export function isPurchaseCancellation(error: unknown) {
  return typeof error === "object" && error !== null
    && "code" in error
    && error.code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;
}
