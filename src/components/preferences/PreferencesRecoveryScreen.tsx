import { Pressable, StyleSheet, Text, View } from "react-native";

import { usePreferences } from "@/providers/PreferencesProvider";
import { COLORS } from "@/theme/tokens";

export function PreferencesRecoveryScreen() {
  const { resetUnreadablePreferences } = usePreferences();

  return (
    <View style={styles.screen}>
      <Text style={styles.brand}>Benster</Text>
      <Text accessibilityRole="alert" style={styles.error}>Saved preferences couldn’t be read.</Text>
      <Text style={styles.help}>Reset them to continue. Your sprint history stays on this device.</Text>
      <Pressable accessibilityRole="button" onPress={() => void resetUnreadablePreferences()} style={styles.button}>
        <Text style={styles.buttonText}>Reset saved preferences</Text>
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
