import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LEGAL_LINKS } from "@/config/legalLinks";
import { ONBOARDING_GOAL_DETAILS } from "@/config/onboardingGoals";
import {
  isPurchaseCancellation,
  loadSubscriptionOffers,
  purchaseSubscription,
  restoreSubscriptionPurchases,
  type SubscriptionOffer,
} from "@/data/subscription/revenueCatSubscription";
import { shouldShowSubscriptionSuccess } from "@/domain/subscription";
import { COLORS } from "@/theme/tokens";
import { usePreferences } from "@/providers/PreferencesProvider";
import { useSubscription } from "@/providers/SubscriptionProvider";
import { getSubscriptionLayout, SUBSCRIPTION_COLUMN_GAP } from "./subscriptionLayout";

type Status = "loading" | "ready" | "unavailable" | "purchasing" | "restoring" | "active" | "error";

export default function SubscriptionTrialScreen() {
  const router = useRouter();
  const { preferences } = usePreferences();
  const { isPremium, refreshSubscription } = useSubscription();
  const [offers, setOffers] = useState<readonly SubscriptionOffer[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [purchaseCompletedInSession, setPurchaseCompletedInSession] = useState(false);
  const busy = useRef(false);
  const mounted = useRef(true);
  const offerLoadRequest = useRef(0);
  const { width, height, fontScale } = useWindowDimensions();
  const layout = getSubscriptionLayout(Platform.OS === "ios", width, height, fontScale);

  const reloadOffers = useCallback(async () => {
    const request = ++offerLoadRequest.current;
    setStatus("loading");

    try {
      const [nextOffers, premium] = await Promise.all([loadSubscriptionOffers(), refreshSubscription()]);
      if (!mounted.current || request !== offerLoadRequest.current) return;

      setOffers(nextOffers);
      setSelectedOfferId((currentOfferId) => {
        if (currentOfferId && nextOffers.some(({ id }) => id === currentOfferId)) return currentOfferId;
        // Both plans remain equally visible, but yearly is the calm default
        // when it is available. People can always switch before purchasing.
        return (nextOffers.find((offer) => offer.label === "Yearly") ?? nextOffers[0])?.id ?? null;
      });
      setStatus(premium ? "active" : nextOffers.length === 2 ? "ready" : "unavailable");
    } catch {
      if (mounted.current && request === offerLoadRequest.current) setStatus("unavailable");
    }
  }, [refreshSubscription]);

  useEffect(() => {
    mounted.current = true;
    // Keep the network-triggered state transition asynchronous so mounting the
    // paywall does not cause a synchronous effect-driven render.
    void Promise.resolve().then(reloadOffers);

    return () => {
      mounted.current = false;
      offerLoadRequest.current += 1;
    };
  }, [reloadOffers]);

  const selectedOffer = offers.find(({ id }) => id === selectedOfferId) ?? null;
  const unavailable = status === "unavailable";
  const busyStatus = status === "purchasing" || status === "restoring";
  const subscriptionActive = status === "active" || isPremium;
  const purchaseActionDisabled = busyStatus || unavailable || (!selectedOffer && !subscriptionActive);
  const canShowOffers = selectedOffer !== null && offers.length > 0 && status !== "unavailable";
  const goal = preferences.onboardingGoal;

  useEffect(() => {
    if (status !== "loading" && subscriptionActive && !purchaseCompletedInSession) {
      router.replace("/");
    }
  }, [purchaseCompletedInSession, router, status, subscriptionActive]);

  const run = async (kind: "purchase" | "restore") => {
    if (busy.current || (kind === "purchase" && !selectedOffer)) return;

    busy.current = true;
    setStatus(kind === "purchase" ? "purchasing" : "restoring");

    try {
      const purchase = kind === "purchase"
        ? await purchaseSubscription(selectedOffer!)
        : { premium: await restoreSubscriptionPurchases() };
      if (purchase.premium) {
        // purchasePackage already returned current CustomerInfo. Refresh the
        // shared gate too, but never make a completed purchase look inactive
        // merely because that follow-up cache read failed.
        void refreshSubscription();
        setPurchaseCompletedInSession(true);
        setStatus("active");
      } else {
        setStatus("ready");
      }
    } catch (error) {
      // Closing Apple or Google’s purchase dialog is expected, not a failure.
      setStatus(kind === "purchase" && isPurchaseCancellation(error) ? "ready" : "error");
    } finally {
      busy.current = false;
    }
  };

  if (shouldShowSubscriptionSuccess({ subscriptionActive, purchaseCompletedInSession })) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style="dark" />
        <View style={styles.layout}>
          <View style={styles.successContent}>
            <Image
              source={require("../../../assets/mascot/penguin-celebrate.png")}
              contentFit="contain"
              style={styles.successMascot}
              accessible={false}
            />
            <View accessible accessibilityRole="image" accessibilityLabel="Premium is active" style={styles.successMark}>
              <Text style={styles.successMarkText}>✓</Text>
            </View>
            <Text accessibilityRole="header" style={styles.successTitle}>You’re all set!</Text>
            <Text accessibilityRole="status" style={styles.successSubtitle}>Benster Premium is active.</Text>
            <Text style={styles.successBody}>
              Unlimited sprints and progress are ready on this device.
            </Text>
          </View>
          <View style={styles.successFooter}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.dismissTo("/")}
              style={({ pressed }) => [styles.button, styles.successButton, pressed && styles.disabled]}
            >
              <Text style={styles.buttonText}>Continue to Benster</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.layout}>
        <ScrollView contentContainerStyle={[styles.content, { maxWidth: layout.maxWidth }]} showsVerticalScrollIndicator={false}>
          <View style={[styles.paywall, layout.twoColumn && styles.landscapePaywall]}>
            <View style={[styles.paywallIntro, layout.twoColumn && styles.landscapePaywallIntro]}>
              <Image
                source={require("../../../assets/mascot/penguin-thumbs-up2.png")}
                contentFit="contain"
                style={[styles.mascot, layout.twoColumn && styles.landscapeMascot]}
                accessible={false}
              />
              <Text accessibilityRole="header" style={styles.title}>
                More little wins,{"\n"}every day.
              </Text>
              <Text style={styles.body}>
                {goal
                  ? ONBOARDING_GOAL_DETAILS[goal].paywallMessage
                  : "Unlimited math sprints and progress for your family."}
              </Text>

              <View style={styles.benefits}>
                <Benefit>Build faster fact recall</Benefit>
                <Benefit>See every learner’s progress grow</Benefit>
                <Benefit>Practice in quick sprints, even offline</Benefit>
              </View>
            </View>

            <View style={[styles.paywallOptions, layout.twoColumn && styles.landscapePaywallOptions]}>
              {status === "loading" && <Text style={styles.note}>Checking available plans…</Text>}
              {canShowOffers && selectedOffer && (
                <OfferChoices
                  offers={offers}
                  selectedOffer={selectedOffer}
                  onSelect={setSelectedOfferId}
                  isTablet={layout.tablet}
                  disabled={busyStatus}
                />
              )}
              {unavailable && (
                <View style={styles.unavailableState}>
                  <Text accessibilityRole="alert" style={styles.note}>
                    We couldn’t load plans right now. Check your connection and try again.
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => void reloadOffers()}
                    style={({ pressed }) => [styles.retryPlans, pressed && styles.disabled]}
                  >
                    <Text style={styles.retryPlansText}>Retry plans</Text>
                  </Pressable>
                </View>
              )}
              {status === "error" && (
                <Text accessibilityRole="alert" style={styles.error}>
                  That didn’t go through. Please try again or restore purchases.
                </Text>
              )}

              <Pressable
                accessibilityRole="button"
                disabled={busyStatus}
                onPress={() => void run("restore")}
                style={({ pressed }) => [styles.restore, (busyStatus || pressed) && styles.disabled]}
              >
                <Text style={styles.restoreText}>{status === "restoring" ? "Restoring…" : "Restore purchases"}</Text>
              </Pressable>
              <View style={styles.legal}>
                {LEGAL_LINKS.map(({ label, url }) => (
                  <Pressable key={url} accessibilityRole="link" onPress={() => void Linking.openURL(url)}>
                    <Text style={styles.legalText}>{label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.purchaseFooter}>
          <View style={[styles.purchaseFooterContent, { maxWidth: layout.maxWidth }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{
                disabled: purchaseActionDisabled,
                busy: busyStatus,
              }}
              disabled={purchaseActionDisabled}
              onPress={() => {
                if (subscriptionActive) {
                  router.dismissTo("/");
                  return;
                }
                void run("purchase");
              }}
              style={({ pressed }) => [
                styles.button,
                (purchaseActionDisabled || pressed) && styles.disabled,
              ]}
            >
              <Text style={styles.buttonText}>
                {status === "purchasing"
                  ? "Starting…"
                  : selectedOffer?.hasSevenDayTrial
                      ? "Start 7-day free trial"
                      : `Continue with ${selectedOffer?.billingPeriod ?? "monthly"}`}
              </Text>
            </Pressable>
            <Text style={styles.commitment}>No commitment · Cancel anytime.</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function Benefit({ children }: { children: string }) {
  return (
    <View style={styles.benefit}>
      <Text accessibilityElementsHidden style={styles.benefitCheck}>✓</Text>
      <Text style={styles.benefitText}>{children}</Text>
    </View>
  );
}

function OfferChoices({
  offers,
  selectedOffer,
  onSelect,
  isTablet,
  disabled,
}: {
  offers: readonly SubscriptionOffer[];
  selectedOffer: SubscriptionOffer;
  onSelect: (id: string) => void;
  isTablet: boolean;
  disabled: boolean;
}) {
  const yearlyOffer = offers.find((offer) => offer.label === "Yearly");
  const monthlyOffer = offers.find((offer) => offer.label === "Monthly");
  const yearlySavingsPercent = yearlyOffer && monthlyOffer
    ? Math.round((1 - yearlyOffer.amount / (monthlyOffer.amount * 12)) * 100)
    : null;
  const orderedOffers = [yearlyOffer, monthlyOffer].filter(
    (offer): offer is SubscriptionOffer => offer !== undefined,
  );

  return (
    <View style={styles.offer}>
      <Text style={styles.offerTitle}>Choose your plan</Text>
      <View accessibilityRole="radiogroup" style={styles.offerChoices}>
        {orderedOffers.map((offer) => {
          const selected = offer.id === selectedOffer.id;
          const isYearly = offer.label === "Yearly";
          const yearlySavings = offer.label === "Yearly" && yearlySavingsPercent && yearlySavingsPercent > 0
            ? `Save ${yearlySavingsPercent}%`
            : null;

          return (
            <Pressable
              key={offer.id}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled }}
              accessibilityLabel={`${offer.label}, ${offer.hasSevenDayTrial ? `7 days free, then ${offer.price} yearly` : `${offer.price} billed ${offer.billingPeriod}`}${yearlySavings ? `, ${yearlySavings}` : ""}`}
              disabled={disabled}
              onPress={() => onSelect(offer.id)}
              style={({ pressed }) => [
                styles.offerChoice,
                isYearly && styles.yearlyOfferChoice,
                isTablet && styles.tabletOfferChoice,
                isYearly && isTablet && styles.tabletYearlyOfferChoice,
                !isYearly && isTablet && styles.tabletMonthlyOfferChoice,
                selected && styles.offerChoiceSelected,
                pressed && styles.disabled,
              ]}
            >
              {isYearly && (yearlySavings || offer.hasSevenDayTrial) && (
                <View pointerEvents="none" style={styles.yearlyBadges}>
                  {offer.hasSevenDayTrial && <Text style={styles.trialBadge}>7 days free</Text>}
                  {yearlySavings && <Text style={styles.savingsBadge}>{yearlySavings}</Text>}
                </View>
              )}
              <View style={styles.offerCopy}>
                <Text style={[styles.offerLabel, isTablet && styles.tabletOfferLabel]}>{offer.label}</Text>
              </View>
              <View style={[
                styles.offerPriceColumn,
                isYearly && isTablet && styles.tabletYearlyOfferPriceColumn,
              ]}>
                <Text style={styles.choicePriceAmount}>{offer.price}</Text>
                <Text style={styles.choicePrice}>
                  {offer.billingPeriod === "yearly" && offer.pricePerMonth
                    ? `${offer.pricePerMonth}/mo · Billed yearly`
                    : "Billed monthly"}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.offerPrice}>
        {selectedOffer.hasSevenDayTrial
          ? `No payment today. Then ${selectedOffer.price} each year, unless canceled.`
          : `${selectedOffer.price} each ${selectedOffer.billingPeriod === "yearly" ? "year" : "month"}, unless canceled.`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  layout: { flex: 1 },
  content: { flexGrow: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, paddingTop: 20, paddingBottom: 20, maxWidth: 600, width: "100%", alignSelf: "center" },
  paywall: { width: "100%", alignItems: "center", gap: 16 },
  paywallIntro: { width: "100%", alignItems: "center", gap: 12 },
  paywallOptions: { width: "100%", alignItems: "center", gap: 12 },
  unavailableState: { alignItems: "center", gap: 8 },
  landscapePaywall: { flexDirection: "row", alignItems: "center", gap: SUBSCRIPTION_COLUMN_GAP },
  landscapePaywallIntro: { flex: 1, maxWidth: 440 },
  landscapePaywallOptions: { flex: 1, maxWidth: 536 },
  mascot: { width: 136, height: 136 },
  landscapeMascot: { width: 118, height: 118 },
  title: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 30, lineHeight: 37, textAlign: "center" },
  body: { color: COLORS.secondary, fontFamily: "NunitoSans_600SemiBold", fontSize: 16, lineHeight: 23, textAlign: "center", maxWidth: 350 },
  benefits: { width: "100%", gap: 8, marginTop: 4 },
  benefit: { flexDirection: "row", alignItems: "center", gap: 9, minHeight: 24 },
  benefitCheck: { color: COLORS.primary, fontFamily: "NunitoSans_700Bold", fontSize: 17, lineHeight: 22 },
  benefitText: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 14, lineHeight: 20 },
  offer: { width: "100%", gap: 9, marginTop: 4 },
  offerTitle: { color: COLORS.ink, textAlign: "left", fontFamily: "NunitoSans_700Bold", fontSize: 17 },
  offerChoices: { gap: 8 },
  offerChoice: { minHeight: 76, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card, paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, position: "relative" },
  yearlyOfferChoice: { marginTop: 10 },
  tabletOfferChoice: { minHeight: 100, paddingHorizontal: 20, paddingVertical: 14, gap: 18 },
  tabletYearlyOfferChoice: { paddingTop: 24, paddingBottom: 14 },
  // The yearly badge protrudes 10pt beyond its top edge. Give Monthly the
  // same visible footprint on iPad without changing the yearly treatment.
  tabletMonthlyOfferChoice: { minHeight: 110 },
  offerChoiceSelected: { borderColor: COLORS.primary, borderWidth: 2, backgroundColor: COLORS.primarySoft },
  offerCopy: { flex: 1, minWidth: 0 },
  offerLabel: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 15 },
  tabletOfferLabel: { fontSize: 18, lineHeight: 23 },
  yearlyBadges: { position: "absolute", top: -11, right: 12, flexDirection: "row", alignItems: "center", gap: 5 },
  savingsBadge: { backgroundColor: COLORS.primary, borderRadius: 9, color: COLORS.card, fontFamily: "NunitoSans_700Bold", fontSize: 11, lineHeight: 17, overflow: "hidden", paddingHorizontal: 7 },
  trialBadge: { backgroundColor: COLORS.primarySoft, borderColor: COLORS.primary, borderRadius: 9, borderWidth: 1, color: COLORS.primary, fontFamily: "NunitoSans_700Bold", fontSize: 11, lineHeight: 17, overflow: "hidden", paddingHorizontal: 7 },
  offerPriceColumn: { alignItems: "flex-end", flexShrink: 0 },
  tabletYearlyOfferPriceColumn: { marginTop: 10, minWidth: 132 },
  choicePrice: { color: COLORS.secondary, fontFamily: "NunitoSans_600SemiBold", fontSize: 11, lineHeight: 16, marginTop: 2, textAlign: "right" },
  choicePriceAmount: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 20, lineHeight: 25, textAlign: "right" },
  offerPrice: { color: COLORS.secondary, textAlign: "left", fontFamily: "NunitoSans_600SemiBold", fontSize: 12, lineHeight: 17 },
  note: { color: COLORS.secondary, textAlign: "center", fontFamily: "NunitoSans_600SemiBold", fontSize: 14, lineHeight: 20, marginTop: 8 },
  retryPlans: { minHeight: 44, justifyContent: "center", alignItems: "center", paddingHorizontal: 12 },
  retryPlansText: { color: COLORS.primary, fontFamily: "NunitoSans_700Bold", fontSize: 16, textDecorationLine: "underline" },
  purchaseFooter: { backgroundColor: COLORS.background, borderTopColor: COLORS.border, borderTopWidth: StyleSheet.hairlineWidth, alignItems: "center" },
  purchaseFooterContent: { width: "100%", paddingHorizontal: 28, paddingTop: 12, paddingBottom: 8, gap: 8, alignItems: "center" },
  commitment: { color: COLORS.secondary, fontFamily: "NunitoSans_600SemiBold", fontSize: 12, lineHeight: 17, textAlign: "center" },
  button: { width: "100%", maxWidth: 544, minHeight: 54, borderRadius: 16, backgroundColor: COLORS.ink, justifyContent: "center", alignItems: "center" },
  buttonText: { color: COLORS.card, fontFamily: "NunitoSans_700Bold", fontSize: 17 },
  restore: { minHeight: 34, justifyContent: "center", alignItems: "center", marginTop: 2 },
  restoreText: { color: COLORS.primary, fontFamily: "NunitoSans_700Bold", fontSize: 15 },
  legal: { flexDirection: "row", gap: 16, marginTop: 2 },
  legalText: { color: COLORS.secondary, textDecorationLine: "underline", fontFamily: "NunitoSans_600SemiBold", fontSize: 12 },
  error: { color: COLORS.red, textAlign: "center", fontFamily: "NunitoSans_600SemiBold", fontSize: 14 },
  successContent: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, paddingBottom: 36, gap: 12, maxWidth: 600, width: "100%", alignSelf: "center" },
  successMascot: { width: 196, height: 196, marginBottom: 2 },
  successMark: { alignItems: "center", backgroundColor: COLORS.green, borderRadius: 16, height: 32, justifyContent: "center", width: 32 },
  successMarkText: { color: COLORS.card, fontFamily: "NunitoSans_700Bold", fontSize: 18, lineHeight: 22 },
  successTitle: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 30, lineHeight: 37, marginTop: 2, textAlign: "center" },
  successSubtitle: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 17, lineHeight: 24, textAlign: "center" },
  successBody: { color: COLORS.secondary, fontFamily: "NunitoSans_600SemiBold", fontSize: 15, lineHeight: 22, maxWidth: 310, textAlign: "center" },
  successFooter: { backgroundColor: COLORS.background, borderTopColor: COLORS.border, borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 28, paddingTop: 12, paddingBottom: 8, alignItems: "center" },
  successButton: { backgroundColor: COLORS.primary },
  disabled: { opacity: 0.45 },
});
