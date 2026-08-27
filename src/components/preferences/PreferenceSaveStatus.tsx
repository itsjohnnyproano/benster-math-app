import { Pressable, StyleSheet, Text } from "react-native";
import { usePreferences } from "@/providers/PreferencesProvider";
import { COLORS } from "@/theme/tokens";

export function PreferenceSaveStatus({ compact = false }: { compact?: boolean }) {
  const { isReady, loadError, saveStatus, retryLoad, retrySave } = usePreferences();
  if (loadError || saveStatus === "error") {
    return (
      <Pressable accessibilityRole="button" onPress={loadError ? retryLoad : retrySave} style={[styles.retry, compact && styles.compactRetry]}>
        <Text accessibilityLiveRegion="polite" style={[styles.error, compact && styles.compactText]}>
          {compact
            ? loadError ? "Couldn’t load · Tap to retry" : "Not saved · Tap to retry"
            : loadError ? "Couldn’t load preferences. Tap to retry." : "Changes aren’t saved yet. Tap to retry."}
        </Text>
      </Pressable>
    );
  }
  if (!isReady || saveStatus === "saving") {
    return <Text accessibilityLiveRegion="polite" style={[styles.status, compact && styles.compactText]}>{!isReady ? "Loading preferences…" : "Saving…"}</Text>;
  }
  return null;
}

const styles = StyleSheet.create({
  retry: { minHeight: 44, justifyContent: "center", marginTop: 8 },
  error: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 14 },
  status: { color: COLORS.secondary, fontFamily: "NunitoSans_600SemiBold", fontSize: 13, marginTop: 8 },
  compactRetry: { minHeight: 20, marginTop: 0 },
  compactText: { marginTop: 0, textAlign: "right" },
});
