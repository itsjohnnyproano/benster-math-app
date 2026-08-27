import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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
import { usePersonalBests } from "./usePersonalBests";

export default function HomeScreen() {
  const router = useRouter();
  const { contentInset } = useTabBarLayout();
  const streak = usePracticeStreak();
  const { preferences, isReady } = usePreferences();
  const personalBests = usePersonalBests(preferences.durationSeconds, isReady);

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <StatusBar style="dark" />

      <ScrollView
        bounces={false}
        contentContainerStyle={[styles.content, { paddingBottom: contentInset }]}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader
          displayName={preferences.nickname}
          streakDays={streak.data?.currentStreak ?? null}
          onPressStreak={() => router.push("/streak")}
        />
        <HomeHero />

        <View style={styles.modeList}>
          <Text style={styles.bestContext}>
            Personal bests · {formatDurationLabel(preferences.durationSeconds)}
            {personalBests.status === "loading" ? " · Loading…" : ""}
          </Text>
          {personalBests.status === "error" && (
            <Pressable accessibilityRole="button" onPress={personalBests.retry} style={styles.retry}>
              <Text style={styles.bestContext}>Couldn’t load personal bests. Tap to retry.</Text>
            </Pressable>
          )}
          {HOME_MODE_CARDS.map((mode) => (
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
              symbol={mode.symbol}
              title={mode.title}
              description={mode.description}
            />
          ))}
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  content: {
    paddingHorizontal: 24,
    paddingTop: 18,
    gap: 18,
  },
  modeList: { gap: 13 },
  bestContext: { fontFamily: "NunitoSans_600SemiBold", fontSize: 13, color: COLORS.secondary },
  retry: { minHeight: 44, justifyContent: "center" },
});
