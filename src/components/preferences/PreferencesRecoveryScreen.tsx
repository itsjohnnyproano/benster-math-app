import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { resultsRepository } from "@/data/results/resultsRepository";
import { usePreferences } from "@/providers/PreferencesProvider";
import { COLORS } from "@/theme/tokens";

export function PreferencesRecoveryScreen() {
  const { resetUnreadablePreferences } = usePreferences();
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState(false);

  const resetSavedData = async () => {
    if (isResetting) return;
    setIsResetting(true);
    setResetError(false);
    try {
      await resultsRepository.clearDevice();
      await resetUnreadablePreferences();
    } catch {
      setResetError(true);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.brand}>Benster</Text>
      <Text accessibilityRole="alert" style={styles.error}>Saved preferences couldn’t be read.</Text>
      <Text style={styles.help}>Reset all saved data to continue. This removes learner profiles, preferences, and local practice history.</Text>
      {resetError && <Text accessibilityRole="alert" style={styles.error}>Couldn’t reset saved data. Please try again.</Text>}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isResetting }}
        disabled={isResetting}
        onPress={() => void resetSavedData()}
        style={styles.button}
      >
        <Text style={styles.buttonText}>{isResetting ? "Resetting…" : "Reset all saved data"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background, justifyContent: "center", alignItems: "center", padding: 24, gap: 16 },
  brand: { fontFamily: "NunitoSans_700Bold", fontSize: 32, color: COLORS.primary },
  error: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 18, textAlign: "center" },
  help: { color: COLORS.secondary, fontFamily: "NunitoSans_600SemiBold", fontSize: 14, lineHeight: 20, maxWidth: 320, textAlign: "center" },
  button: { minHeight: 48, borderRadius: 16, backgroundColor: COLORS.primary, justifyContent: "center", paddingHorizontal: 20 },
  buttonText: { color: COLORS.card, fontFamily: "NunitoSans_700Bold", fontSize: 16 },
});
