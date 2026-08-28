import "../global.css";

import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useAppFonts } from "@/lib/fonts";
import { PreferencesProvider, usePreferences } from "@/providers/PreferencesProvider";
import { PreferenceSaveStatus } from "@/components/preferences/PreferenceSaveStatus";
import { COLORS } from "@/theme/tokens";

SplashScreen.preventAutoHideAsync();

function AppNavigation() {
  const { isReady, loadError, preferences } = usePreferences();

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <Text style={styles.brand}>Benster</Text>
        {!loadError && <ActivityIndicator color={COLORS.primary} size="large" />}
        <PreferenceSaveStatus />
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
        <Stack.Screen name="sprint/setup" />
        <Stack.Screen name="sprint/play" />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: COLORS.background, justifyContent: "center", alignItems: "center", padding: 24, gap: 16 },
  brand: { fontFamily: "NunitoSans_700Bold", fontSize: 32, color: COLORS.primary },
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
