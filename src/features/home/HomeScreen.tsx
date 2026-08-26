import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomNavigation } from "@/components/navigation/BottomNavigation";

import { COLORS } from "@/theme/tokens";

import { HistoryButton } from "./components/HistoryButton";
import { HomeHeader } from "./components/HomeHeader";
import { HomeHero } from "./components/HomeHero";
import { ModeCard } from "./components/ModeCard";
import { HOME_MODE_CARDS } from "./homeModeCards";
import { MOCK_HOME_DATA } from "./mockHomeData";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <ScrollView
        bounces={false}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader
          displayName={MOCK_HOME_DATA.displayName}
          streakDays={MOCK_HOME_DATA.streakDays}
        />
        <HomeHero />

        <View style={styles.modeList}>
          {HOME_MODE_CARDS.map((mode) => (
            <ModeCard
              key={mode.id}
              best={MOCK_HOME_DATA.personalBests[mode.id]}
              color={mode.color}
              onPress={() =>
                router.push({
                  pathname: "/sprint/setup",
                  params: { mode: mode.id },
                })
              }
              symbol={mode.symbol}
              title={mode.title}
            />
          ))}
        </View>

        <HistoryButton />
      </ScrollView>

      <BottomNavigation />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  content: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 22,
    gap: 18,
  },
  modeList: { gap: 13 },
});
