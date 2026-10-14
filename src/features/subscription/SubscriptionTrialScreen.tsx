import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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
import { COLORS } from "@/theme/tokens";
import { usePreferences } from "@/providers/PreferencesProvider";
import { useSubscription } from "@/providers/SubscriptionProvider";

type Status = "loading" | "ready" | "unavailable" | "purchasing" | "restoring" | "active" | "error";

export default function SubscriptionTrialScreen() {
  const router = useRouter();
  const { preferences } = usePreferences();
  const { isPremium, refreshSubscription } = useSubscription();
  const [offers, setOffers] = useState<readonly SubscriptionOffer[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const busy = useRef(false);

  useEffect(() => {
    let active = true;

    void Promise.all([loadSubscriptionOffers(), refreshSubscription()]).then(
      ([nextOffers, premium]) => {
        if (!active) return;

        setOffers(nextOffers);
        // Both plans remain equally visible, but yearly is the calm default
        // when it is available. People can always switch before purchasing.
        setSelectedOfferId((nextOffers.find((offer) => offer.label === "Yearly") ?? nextOffers[0])?.id ?? null);
        setStatus(premium ? "active" : nextOffers.length === 2 ? "ready" : "unavailable");
      },
      () => {
        if (active) setStatus("unavailable");
      },
    );

    return () => {
      active = false;
    };
  }, [refreshSubscription]);

  const selectedOffer = offers.find(({ id }) => id === selectedOfferId) ?? null;
  const unavailable = status === "unavailable";
  const busyStatus = status === "purchasing" || status === "restoring";
  const subscriptionActive = status === "active" || isPremium;
  const goal = preferences.onboardingGoal;

  const run = async (kind: "purchase" | "restore") => {
    if (busy.current || (kind === "purchase" && !selectedOffer)) return;

    busy.current = true;
    setStatus(kind === "purchase" ? "purchasing" : "restoring");

    try {
      const premium = kind === "purchase"
        ? await purchaseSubscription(selectedOffer!)
        : await restoreSubscriptionPurchases();
      if (premium) {
        // purchasePackage already returned current CustomerInfo. Refresh the
        // shared gate too, but never make a completed purchase look inactive
        // merely because that follow-up cache read failed.
        void refreshSubscription();
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

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Image
          source={require("../../../assets/mascot/penguin-thumbs-up2.png")}
          contentFit="contain"
          style={styles.mascot}
          accessible={false}
        />
        <Text accessibilityRole="header" style={styles.title}>
          More little wins,{"\n"}every day.
        </Text>
        <Text style={styles.body}>
          {goal
            ? `Keep building ${ONBOARDING_GOAL_DETAILS[goal].trialLabel} with unlimited math sprints.`
            : "Unlimited math sprints and progress for your family."}
        </Text>

        <View style={styles.benefits}>
          <Text style={styles.benefit}>Unlimited practice</Text>
          <Text style={styles.benefit}>Personal progress for each learner</Text>
          <Text style={styles.benefit}>Practice anywhere, even offline</Text>
        </View>

        {status === "loading" && <Text style={styles.note}>Checking available plans…</Text>}
        {status === "ready" && selectedOffer && (
          <OfferChoices
            offers={offers}
            selectedOffer={selectedOffer}
            onSelect={setSelectedOfferId}
          />
        )}
        {unavailable && (
          <Text accessibilityRole="alert" style={styles.note}>
            The yearly 7-day trial and monthly plan aren’t available yet. Please check back after Premium is configured.
          </Text>
        )}
        {subscriptionActive && (
          <Text accessibilityRole="status" style={styles.active}>
            Premium is active on this device.
          </Text>
        )}
        {status === "error" && (
          <Text accessibilityRole="alert" style={styles.error}>
            That didn’t go through. Please try again or restore purchases.
          </Text>
        )}

        <Text style={styles.commitment}>Subscription billed and managed by Apple. Cancel anytime.</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{
            disabled: !selectedOffer || busyStatus || unavailable || subscriptionActive,
            busy: busyStatus,
          }}
          disabled={!selectedOffer || busyStatus || unavailable || subscriptionActive}
          onPress={() => void run("purchase")}
          style={({ pressed }) => [
            styles.button,
            (!selectedOffer || busyStatus || unavailable || subscriptionActive || pressed) && styles.disabled,
          ]}
        >
          <Text style={styles.buttonText}>
            {status === "purchasing"
              ? "Starting…"
              : subscriptionActive
                ? "Premium is active"
                : selectedOffer?.hasSevenDayTrial
                  ? "Start 7-day free trial"
                  : `Continue with ${selectedOffer?.billingPeriod ?? "monthly"}`}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={busyStatus}
          onPress={() => void run("restore")}
          style={({ pressed }) => [styles.restore, (busyStatus || pressed) && styles.disabled]}
        >
          <Text style={styles.restoreText}>{status === "restoring" ? "Restoring…" : "Restore purchases"}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={busyStatus}
          onPress={() => router.dismissTo("/")}
          style={({ pressed }) => [styles.notNow, (busyStatus || pressed) && styles.disabled]}
        >
          <Text style={styles.notNowText}>{subscriptionActive ? "Continue to Benster" : "Not now"}</Text>
        </Pressable>
        <View style={styles.legal}>
          {LEGAL_LINKS.map(({ label, url }) => (
            <Pressable key={url} accessibilityRole="link" onPress={() => void Linking.openURL(url)}>
              <Text style={styles.legalText}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function OfferChoices({
  offers,
  selectedOffer,
  onSelect,
}: {
  offers: readonly SubscriptionOffer[];
  selectedOffer: SubscriptionOffer;
  onSelect: (id: string) => void;
}) {
  return (
    <View style={styles.offer}>
      <Text style={styles.offerTitle}>Choose your plan</Text>
      <View accessibilityRole="radiogroup" style={styles.offerChoices}>
        {offers.map((offer) => {
          const selected = offer.id === selectedOffer.id;

          return (
            <Pressable
              key={offer.id}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onSelect(offer.id)}
              style={({ pressed }) => [
                styles.offerChoice,
                selected && styles.offerChoiceSelected,
                pressed && styles.disabled,
              ]}
            >
              <View>
                <Text style={styles.offerLabel}>{offer.label}</Text>
                <Text style={styles.choicePrice}>
                  {offer.hasSevenDayTrial
                    ? `7 days free, then ${offer.price} yearly`
                    : `${offer.price} billed ${offer.billingPeriod}`}
                </Text>
              </View>
              {selected && <Text style={styles.choiceCheck}>✓</Text>}
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.offerPrice}>
        {selectedOffer.hasSevenDayTrial
          ? `Then ${selectedOffer.price} each year, unless canceled`
          : `${selectedOffer.price} each ${selectedOffer.billingPeriod === "yearly" ? "year" : "month"}, unless canceled`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { flexGrow: 1, alignItems: "center", paddingHorizontal: 28, paddingVertical: 24, gap: 14, maxWidth: 600, alignSelf: "center" },
  mascot: { width: 190, height: 190 },
  title: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 31, lineHeight: 39, textAlign: "center" },
  body: { color: COLORS.secondary, fontFamily: "NunitoSans_600SemiBold", fontSize: 16, lineHeight: 23, textAlign: "center" },
  benefits: { width: "100%", gap: 9, marginTop: 12 },
  benefit: { backgroundColor: COLORS.primarySoft, color: COLORS.ink, fontFamily: "NunitoSans_700Bold", borderRadius: 13, minHeight: 46, textAlign: "center", textAlignVertical: "center", paddingHorizontal: 12 },
  offer: { width: "100%", backgroundColor: COLORS.primarySoft, borderRadius: 16, padding: 16, gap: 12, marginTop: 8 },
  offerTitle: { color: COLORS.primary, textAlign: "center", fontFamily: "NunitoSans_700Bold", fontSize: 17 },
  offerChoices: { gap: 8 },
  offerChoice: { minHeight: 60, borderRadius: 13, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  offerChoiceSelected: { borderColor: COLORS.primary, borderWidth: 2 },
  offerLabel: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 15 },
  choicePrice: { color: COLORS.secondary, fontFamily: "NunitoSans_600SemiBold", fontSize: 12, marginTop: 2 },
  choiceCheck: { color: COLORS.primary, fontFamily: "NunitoSans_700Bold", fontSize: 22 },
  offerPrice: { color: COLORS.secondary, textAlign: "center", fontFamily: "NunitoSans_600SemiBold", fontSize: 13 },
  note: { color: COLORS.secondary, textAlign: "center", fontFamily: "NunitoSans_600SemiBold", fontSize: 14, lineHeight: 20, marginTop: 8 },
  commitment: { color: COLORS.secondary, fontFamily: "NunitoSans_600SemiBold", fontSize: 13, marginTop: 8 },
  button: { width: "100%", minHeight: 54, borderRadius: 16, backgroundColor: COLORS.primary, justifyContent: "center", alignItems: "center", marginTop: 2 },
  buttonText: { color: COLORS.card, fontFamily: "NunitoSans_700Bold", fontSize: 17 },
  restore: { minHeight: 42, justifyContent: "center", alignItems: "center" },
  restoreText: { color: COLORS.primary, fontFamily: "NunitoSans_700Bold", fontSize: 15 },
  notNow: { minHeight: 38, justifyContent: "center", alignItems: "center", marginTop: -4 },
  notNowText: { color: COLORS.secondary, fontFamily: "NunitoSans_600SemiBold", fontSize: 14 },
  legal: { flexDirection: "row", gap: 16, marginTop: 4 },
  legalText: { color: COLORS.secondary, textDecorationLine: "underline", fontFamily: "NunitoSans_600SemiBold", fontSize: 12 },
  error: { color: COLORS.red, textAlign: "center", fontFamily: "NunitoSans_600SemiBold", fontSize: 14 },
  active: { color: COLORS.green, textAlign: "center", fontFamily: "NunitoSans_700Bold", fontSize: 15 },
  disabled: { opacity: 0.45 },
});
