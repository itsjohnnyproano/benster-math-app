import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { resultsRepository } from "@/data/results/resultsRepository";
import { usePreferences } from "@/providers/PreferencesProvider";
import { COLORS } from "@/theme/tokens";
import { FirstResultCelebration } from "./FirstResultCelebration";

type PendingCelebrationState =
  | { status: "loading" }
  | { status: "ready"; correctCount: number }
  | { status: "error" };

/**
 * Restores the acknowledgement if the app closes after the first sprint is
 * saved but before the learner continues to the subscription decision.
 */
export default function PendingFirstResultCelebrationScreen() {
  const { activeLearner } = usePreferences();
  const [state, setState] = useState<PendingCelebrationState>({ status: "loading" });
  const loadRequest = useRef(0);

  const load = useCallback(async () => {
    const request = ++loadRequest.current;
    setState({ status: "loading" });
    try {
      const { records } = await resultsRepository.list(activeLearner.id, { limit: 1 });
      const firstPendingResult = records[0];
      if (!firstPendingResult) throw new Error("The pending first sprint is unavailable");
      if (request !== loadRequest.current) return;
      setState({ status: "ready", correctCount: firstPendingResult.result.correctCount });
    } catch {
      if (request === loadRequest.current) setState({ status: "error" });
    }
  }, [activeLearner.id]);

  useEffect(() => {
    // The repository read owns the state transition; defer it one microtask
    // so this mount effect only establishes the lifecycle boundary.
    void Promise.resolve().then(load);
    return () => {
      loadRequest.current += 1;
    };
  }, [load]);

  if (state.status === "ready") {
    return <FirstResultCelebration correctCount={state.correctCount} />;
  }

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        {state.status === "loading" ? (
          <>
            <ActivityIndicator color={COLORS.primary} size="large" />
            <Text style={styles.message}>Loading your first sprint…</Text>
          </>
        ) : (
          <>
            <Text accessibilityRole="header" style={styles.title}>We couldn’t load your first sprint</Text>
            <Text style={styles.message}>Your saved history has not changed. Please try again.</Text>
            <Pressable accessibilityRole="button" onPress={() => void load()} style={({ pressed }) => [styles.retry, pressed && styles.pressed]}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.background, padding: 24 },
  card: { width: "100%", maxWidth: 360, alignItems: "center", gap: 14, borderWidth: 1, borderColor: COLORS.border, borderRadius: 24, backgroundColor: COLORS.card, padding: 24 },
  title: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 21, lineHeight: 28, textAlign: "center" },
  message: { color: COLORS.secondary, fontFamily: "NunitoSans_600SemiBold", fontSize: 15, lineHeight: 22, textAlign: "center" },
  retry: { minHeight: 44, justifyContent: "center", alignItems: "center", paddingHorizontal: 12 },
  retryText: { color: COLORS.primary, fontFamily: "NunitoSans_700Bold", fontSize: 16, textDecorationLine: "underline" },
  pressed: { opacity: 0.75 },
});
