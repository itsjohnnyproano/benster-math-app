import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { ONBOARDING_GOAL_DETAILS } from "@/config/onboardingGoals";
import { usePreferences } from "@/providers/PreferencesProvider";
import { COLORS } from "@/theme/tokens";
import { getOnboardingLayout } from "./onboardingLayout";

export function FirstResultCelebration({ correctCount }: { correctCount: number }) {
  const router = useRouter();
  const { preferences, completeFirstResultCelebration } = usePreferences();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const submitting = useRef(false);
  const goal = preferences.onboardingGoal;
  const { width, height, fontScale } = useWindowDimensions();
  const layout = getOnboardingLayout(Platform.OS === "ios", width, height, fontScale);
  const controlMaxWidth = layout.tablet ? 640 : layout.maxWidth;

  const continueToTrial = async () => {
    if (submitting.current) return;
    submitting.current = true;
    setSaving(true);
    setError(false);
    try {
      await completeFirstResultCelebration();
      // Keep the Premium confirmation visible for learners who already have
      // access, instead of immediately returning them to Home.
      router.replace("/subscription?firstSprint=1" as never);
    } catch {
      setError(true);
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };

  return <View style={styles.screen}>
    <View style={[styles.content, { maxWidth: controlMaxWidth }]}>
      <Image source={require("../../../assets/mascot/penguin-celebrate.png")} contentFit="contain" style={styles.mascot} accessible={false} />
      <Text accessibilityRole="header" style={styles.title}>You did it{preferences.nickname ? `, ${preferences.nickname}` : ""}!</Text>
      <Text style={styles.body}>{correctCount} correct {correctCount === 1 ? "answer" : "answers"} in your first sprint.</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {goal ? `A strong first step toward ${ONBOARDING_GOAL_DETAILS[goal].resultLabel}` : "A strong start"}
        </Text>
      </View>
    </View>
    <View style={[styles.footer, { maxWidth: controlMaxWidth }]}>
      {error && <Text accessibilityRole="alert" style={styles.error}>We couldn’t continue. Please try again.</Text>}
      <Pressable accessibilityRole="button" disabled={saving} accessibilityState={{ disabled: saving, busy: saving }} onPress={() => void continueToTrial()} style={({ pressed }) => [styles.button, (saving || pressed) && styles.disabled]}><Text style={styles.buttonText}>{saving ? "Continuing…" : "Continue"}</Text></Pressable>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background }, content: { flex: 1, width: "100%", alignSelf: "center", alignItems: "center", justifyContent: "center", paddingHorizontal: 28, gap: 12 }, mascot: { width: 230, height: 230 }, title: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 33, lineHeight: 41, textAlign: "center" }, body: { color: COLORS.secondary, fontFamily: "NunitoSans_600SemiBold", fontSize: 16, textAlign: "center", lineHeight: 23 }, badge: { width: "100%", maxWidth: 360, backgroundColor: COLORS.primarySoft, borderRadius: 13, padding: 14, marginTop: 12 }, badgeText: { color: COLORS.ink, textAlign: "center", fontFamily: "NunitoSans_700Bold", fontSize: 14 }, footer: { width: "100%", alignSelf: "center", padding: 24, gap: 8 }, button: { minHeight: 54, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" }, buttonText: { color: COLORS.card, fontFamily: "NunitoSans_700Bold", fontSize: 17 }, error: { color: COLORS.red, fontFamily: "NunitoSans_600SemiBold", textAlign: "center", marginBottom: 3 }, disabled: { opacity: .45 },
});
