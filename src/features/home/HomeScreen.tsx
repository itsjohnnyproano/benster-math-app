import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTabBarLayout } from "@/components/navigation/tabBarLayout";

import { COLORS } from "@/theme/tokens";

import { HomeHeader } from "./components/HomeHeader";
import { HomeHero } from "./components/HomeHero";
import { ModeCard } from "./components/ModeCard";
import { HOME_MODE_CARDS } from "./homeModeCards";
import { usePracticeStreak } from "@/features/streak/usePracticeStreak";
import { usePreferences } from "@/providers/PreferencesProvider";
import { formatDurationLabel } from "@/shared/formatSprintDuration";
import { getAdaptiveLayout } from "@/shared/responsiveLayout";
import { usePersonalBests } from "./usePersonalBests";

export default function HomeScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { contentInset } = useTabBarLayout();
  const streak = usePracticeStreak();
  const { preferences, isReady } = usePreferences();
  const personalBests = usePersonalBests(preferences.durationSeconds, isReady);
  const layout = getAdaptiveLayout(width, height);
  const isTablet = layout !== "phone";
  const isLandscapeTablet = layout === "tablet-landscape";

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <StatusBar style="dark" />

      <ScrollView
        bounces={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: contentInset }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.content, isTablet && styles.tabletContent]}>
          <HomeHeader
            displayName={preferences.nickname}
            isTablet={isTablet}
            streakDays={streak.data?.currentStreak ?? null}
            onPressStreak={() => router.push("/streak")}
          />

          <View style={[styles.homeBody, isLandscapeTablet && styles.landscapeBody]}>
            <View style={[styles.heroPane, isLandscapeTablet && styles.landscapeHeroPane]}>
              <HomeHero layout={layout} />
            </View>

            <View style={[styles.modeList, isLandscapeTablet && styles.landscapeModeList]}>
              <Text maxFontSizeMultiplier={1.35} style={styles.bestContext}>
                Personal bests · {formatDurationLabel(preferences.durationSeconds)}
                {personalBests.status === "loading" ? " · Loading…" : ""}
              </Text>
              {personalBests.status === "error" && (
                <Pressable accessibilityRole="button" onPress={personalBests.retry} style={styles.retry}>
                  <Text maxFontSizeMultiplier={1.35} style={styles.bestContext}>Couldn’t load personal bests. Tap to retry.</Text>
                </Pressable>
              )}
              <View style={[styles.modeGrid, isTablet && styles.tabletModeGrid]}>
                {HOME_MODE_CARDS.map((mode, index) => (
                  <ModeCard
                    key={mode.id}
                    best={personalBests.bests[mode.id] ?? null}
                    color={mode.color}
                    onPress={() =>
                      router.push({
                        pathname: "/sprint/setup",
                        params: { mode: mode.id },
                      })
                    }
                    style={
                      isTablet && index === HOME_MODE_CARDS.length - 1
                        ? styles.wideModeCard
                        : isTablet
                          ? styles.tabletModeCard
                          : undefined
                    }
                    symbol={mode.symbol}
                    title={mode.title}
                    description={mode.description}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { alignItems: "center" },
  content: {
    width: "100%",
    paddingHorizontal: 24,
    paddingTop: 18,
    gap: 18,
  },
  tabletContent: { maxWidth: 1180, paddingHorizontal: 32, paddingTop: 24, gap: 24 },
  homeBody: { gap: 18 },
  landscapeBody: { flexDirection: "row", alignItems: "flex-start", gap: 24 },
  heroPane: { width: "100%" },
  landscapeHeroPane: { width: "36%", maxWidth: 410 },
  modeList: { gap: 13 },
  landscapeModeList: { flex: 1 },
  modeGrid: { gap: 13 },
  tabletModeGrid: { flexDirection: "row", flexWrap: "wrap" },
  tabletModeCard: { width: "48%" },
  wideModeCard: { width: "100%" },
  bestContext: { fontFamily: "NunitoSans_600SemiBold", fontSize: 13, color: COLORS.secondary },
  retry: { minHeight: 44, justifyContent: "center" },
});
