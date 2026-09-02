import { Image } from "expo-image";
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { isSprintMode } from "@/domain/sprint";
import { usePreferences } from "@/providers/PreferencesProvider";
import { CARD_SHADOW, COLORS } from "@/theme/tokens";

import { PracticePreferences } from "@/components/preferences/PracticePreferences";
import { formatDurationSubtitle } from "@/shared/formatSprintDuration";
import { SetupHeader } from "./components/SetupHeader";
import { getSetupLayout } from "./setupLayout";

export default function SprintSetupScreen() {
  const router = useRouter();
  const { width, height, fontScale } = useWindowDimensions();
  const { mode: modeParam } = useLocalSearchParams<{ mode?: string }>();
  const { preferences, isReady } = usePreferences();
  const [isStarting, setIsStarting] = useState(false);
  const mode = isSprintMode(modeParam) ? modeParam : "addition";
  const { tablet: isTablet, twoColumn: isLandscapeTablet, maxWidth } = getSetupLayout(width, height, Platform.OS, fontScale);

  useFocusEffect(
    useCallback(() => {
      setIsStarting(false);
    }, [])
  );

  const startSprint = () => {
    if (!isReady || isStarting) return;
    setIsStarting(true);

    router.push({
      pathname: "/sprint/play",
      params: {
        mode,
        durationSeconds: String(preferences.durationSeconds),
        inputStyle: preferences.inputStyle,
        cardLayout: preferences.cardLayout,
        levelUpEnabled: String(preferences.levelUpEnabled),
      },
    });
  };

  return (
    <SafeAreaView edges={isTablet ? ["top", "left", "right", "bottom"] : ["top", "left", "right"]} style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <ScrollView bounces={false} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.content, isTablet && styles.tabletContent, isTablet && { maxWidth }]}>
          <SetupHeader
            tablet={isTablet}
            mode={mode}
            onBack={() => router.back()}
            subtitle={formatDurationSubtitle(preferences.durationSeconds)}
          />

          <View style={[styles.setupBody, isLandscapeTablet && styles.landscapeBody]}>
            <View style={[styles.preferenceList, isLandscapeTablet && styles.landscapePreferenceList]}>
              <PracticePreferences showSaveStatus={false} tablet={isTablet} />
            </View>

            <View style={[isTablet && styles.tabletActionPane, isLandscapeTablet && styles.landscapeActionPane]}>
              <View style={[styles.mascotArea, isLandscapeTablet && styles.landscapeMascotArea]}>
                <Image
                  accessibilityLabel="Benster mascot running"
                  contentFit="contain"
                  source={require("../../../assets/mascot/penguin-running.png")}
                  style={[styles.mascot, isTablet && styles.tabletMascot]}
                />
              </View>

              <Pressable
                accessibilityLabel="Start Sprint"
                accessibilityRole="button"
                accessibilityState={{ disabled: !isReady || isStarting }}
                disabled={!isReady || isStarting}
                onPress={startSprint}
                style={({ pressed }) => [
                  styles.startButton,
                  isTablet && styles.tabletStartButton,
                  CARD_SHADOW,
                  (!isReady || isStarting) && styles.disabledButton,
                  pressed && styles.pressedButton,
                ]}
              >
                <Text style={[styles.startButtonText, isTablet && styles.tabletStartButtonText]}>{isStarting ? "Starting…" : "Start Sprint"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1, alignItems: "center" },
  content: {
    width: "100%",
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  tabletContent: { paddingHorizontal: 32, paddingTop: 20, paddingBottom: 32 },
  setupBody: { flexGrow: 1 },
  landscapeBody: { flexDirection: "row", alignItems: "stretch", gap: 36 },
  preferenceList: {
    marginTop: 22,
    gap: 12,
  },
  landscapePreferenceList: { flex: 1, maxWidth: 620 },
  tabletActionPane: { width: "100%", maxWidth: 420, alignSelf: "center" },
  landscapeActionPane: { width: "38%", justifyContent: "center", alignSelf: "stretch" },
  mascotArea: {
    minHeight: 184,
    marginTop: 24,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  landscapeMascotArea: { minHeight: 20, marginTop: 0, marginBottom: 24 },
  mascot: {
    width: 205,
    height: 180,
  },
  tabletMascot: { width: 235, height: 205 },
  tabletStartButton: { minHeight: 68, paddingHorizontal: 20, paddingVertical: 16 },
  tabletStartButtonText: { fontSize: 23, lineHeight: 30, textAlign: "center" },
  startButton: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  startButtonText: {
    color: COLORS.card,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 19,
    lineHeight: 25,
  },
  disabledButton: { opacity: 0.55 },
  pressedButton: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
