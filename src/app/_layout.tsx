import "../global.css";

import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useAppFonts } from "@/lib/fonts";
import { PreferencesProvider, usePreferences } from "@/providers/PreferencesProvider";
import { PreferenceSaveStatus } from "@/components/preferences/PreferenceSaveStatus";
import { PreferencesRecoveryScreen } from "@/components/preferences/PreferencesRecoveryScreen";
import { COLORS } from "@/theme/tokens";
import { ProfilePicker } from "@/features/learners/ProfilePicker";

SplashScreen.preventAutoHideAsync();

function AppNavigation() {
  const router = useRouter();
  const { isReady, loadError, preferences, learners, activeLearner, profilePickerVisible, switchLearner, closeProfilePicker } = usePreferences();

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
    <ProfilePicker
      activeLearnerId={activeLearner.id}
      learners={learners}
      visible={profilePickerVisible}
      onChoose={(learnerId) => { void switchLearner(learnerId).finally(closeProfilePicker); }}
      onManage={() => { closeProfilePicker(); router.navigate("/settings"); }}
    />
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
      <AppNavigation />
    </PreferencesProvider>
  );
}
