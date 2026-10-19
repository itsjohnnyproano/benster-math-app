import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useAppFonts } from "@/lib/fonts";
import {
  canAccessSubscriptionGatedRoutes,
  hasPendingFirstResultCelebration,
  requiresPremiumAfterOnboardingSprint,
} from "@/domain/subscription";
import { PreferencesProvider, usePreferences } from "@/providers/PreferencesProvider";
import { SubscriptionProvider, useSubscription } from "@/providers/SubscriptionProvider";
import { PreferenceSaveStatus } from "@/components/preferences/PreferenceSaveStatus";
import { PreferencesRecoveryScreen } from "@/components/preferences/PreferencesRecoveryScreen";
import { COLORS } from "@/theme/tokens";
import { ProfilePickerController } from "@/features/learners/ProfilePickerController";

SplashScreen.preventAutoHideAsync();

function AppNavigation() {
  const { isReady, loadError, preferences } = usePreferences();
  const { isPremium, status: subscriptionStatus } = useSubscription();
  const requiresPremium = requiresPremiumAfterOnboardingSprint({
    onboardingCompleted: preferences.onboardingCompleted,
    firstFreeSprintCompleted: preferences.firstFreeSprintCompleted,
    firstResultCelebrationSeen: preferences.firstResultCelebrationSeen,
    isPremium,
  });
  const pendingFirstResultCelebration = hasPendingFirstResultCelebration({
    onboardingCompleted: preferences.onboardingCompleted,
    firstFreeSprintCompleted: preferences.firstFreeSprintCompleted,
    firstResultCelebrationSeen: preferences.firstResultCelebrationSeen,
  });
  const canAccessAppRoutes = canAccessSubscriptionGatedRoutes({
    requiresPremium,
    subscriptionStatus,
  });
  const postOnboardingGateRedirect = pendingFirstResultCelebration
    ? "/first-result-celebration"
    : "/subscription";
  // Protected routes are removed from the navigator as soon as saved data is
  // cleared. Their fallback must remain available in that same render; using
  // another protected route here can otherwise make Expo Router repeatedly
  // try to redirect between unavailable screens.
  const appRouteRedirect = preferences.onboardingCompleted
    ? postOnboardingGateRedirect
    : "/onboarding";
  const firstResultRedirect = preferences.onboardingCompleted
    ? "/subscription"
    : "/onboarding";

  if (!isReady) {
    if (loadError) return <PreferencesRecoveryScreen />;

    return (
      <View style={styles.loading}>
        <Text style={styles.brand}>Benster</Text>
        <ActivityIndicator color={COLORS.primary} size="large" />
        <PreferenceSaveStatus />
      </View>
    );
  }

  return <>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!preferences.onboardingCompleted}>
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      </Stack.Protected>
      <Stack.Protected guard={pendingFirstResultCelebration} redirectTo={firstResultRedirect}>
        <Stack.Screen name="first-result-celebration" options={{ gestureEnabled: false }} />
      </Stack.Protected>
      <Stack.Protected
        guard={preferences.onboardingCompleted && !pendingFirstResultCelebration && canAccessAppRoutes}
        redirectTo={appRouteRedirect}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="streak" />
        <Stack.Screen name="history/[sprintId]" />
        <Stack.Screen name="sprint/setup" />
      </Stack.Protected>
      <Stack.Protected
        guard={preferences.onboardingCompleted && canAccessAppRoutes}
        redirectTo={appRouteRedirect}
      >
        {/* Keep an in-memory completed first sprint visible. The screen itself
            sends a fresh launch with a pending celebration to its resume route. */}
        <Stack.Screen name="sprint/play" />
      </Stack.Protected>
      <Stack.Protected guard={preferences.onboardingCompleted && !pendingFirstResultCelebration} redirectTo={appRouteRedirect}>
        <Stack.Screen name="subscription" options={{ gestureEnabled: false }} />
      </Stack.Protected>
    </Stack>
    <ProfilePickerController />
  </>;
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
      <SubscriptionProvider>
        <AppNavigation />
      </SubscriptionProvider>
    </PreferencesProvider>
  );
}
