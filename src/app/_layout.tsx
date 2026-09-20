import "../global.css";

import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useAppFonts } from "@/lib/fonts";
import { PreferencesProvider, usePreferences } from "@/providers/PreferencesProvider";
import { PreferenceSaveStatus } from "@/components/preferences/PreferenceSaveStatus";
import { COLORS } from "@/theme/tokens";

SplashScreen.preventAutoHideAsync();

function AppNavigation() {
  const { isReady, loadError, preferences, resetUnreadablePreferences } = usePreferences();

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <Text style={styles.brand}>Benster</Text>
        {loadError ? (
          <>
            <Text accessibilityRole="alert" style={styles.loadError}>Saved preferences couldn’t be read.</Text>
            <Text style={styles.loadHelp}>Reset them to continue. Your sprint history stays on this device.</Text>
            <Pressable accessibilityRole="button" onPress={() => void resetUnreadablePreferences()} style={styles.resetButton}>
              <Text style={styles.resetText}>Reset saved preferences</Text>
            </Pressable>
          </>
        ) : (
          <>
            <ActivityIndicator color={COLORS.primary} size="large" />
            <PreferenceSaveStatus />
          </>
        )}
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!preferences.onboardingCompleted}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={preferences.onboardingCompleted}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="streak" />
        <Stack.Screen name="history/[sprintId]" />
        <Stack.Screen name="sprint/setup" />
        <Stack.Screen name="sprint/play" />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: COLORS.background, justifyContent: "center", alignItems: "center", padding: 24, gap: 16 },
  brand: { fontFamily: "NunitoSans_700Bold", fontSize: 32, color: COLORS.primary },
  loadError: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 18, textAlign: "center" },
  loadHelp: { color: COLORS.secondary, fontFamily: "NunitoSans_600SemiBold", fontSize: 14, lineHeight: 20, maxWidth: 320, textAlign: "center" },
  resetButton: { minHeight: 48, borderRadius: 16, backgroundColor: COLORS.primary, justifyContent: "center", paddingHorizontal: 20 },
  resetText: { color: COLORS.card, fontFamily: "NunitoSans_700Bold", fontSize: 16 },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useAppFonts();

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <PreferencesProvider>
      <AppNavigation />
    </PreferencesProvider>
  );
}
