import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CARD_SHADOW, COLORS } from "@/theme/tokens";

type HomeHeaderProps = {
  displayName: string;
  isTablet?: boolean;
  stacked?: boolean;
  streakDays: number | null;
  onPressStreak?: () => void;
};

export function HomeHeader({ displayName, isTablet = false, stacked = false, streakDays, onPressStreak }: HomeHeaderProps) {
  return (
    <View style={[styles.header, stacked && styles.stackedHeader]}>
      <View style={[styles.greetingBlock, stacked && styles.stackedGreetingBlock]}>
        <Text maxFontSizeMultiplier={1.3} style={[styles.greeting, isTablet && styles.tabletGreeting]}>{displayName ? `Hey, ${displayName}!` : "Hey there!"}</Text>
        <Text maxFontSizeMultiplier={1.4} style={[styles.subtitle, isTablet && styles.tabletSubtitle]}>Ready to practice?</Text>
      </View>

      <Pressable
        accessibilityLabel={streakDays === null ? "View practice streak" : `${streakDays} day practice streak`}
        accessibilityRole="button"
        onPress={onPressStreak}
        style={({ pressed }) => [styles.streakPill, isTablet && styles.tabletStreakPill, CARD_SHADOW, pressed && styles.pressed]}
      >
        <SymbolView
          name={{
            ios: "flame.fill",
            android: "local_fire_department",
            web: "local_fire_department",
          }}
          size={20}
          tintColor={COLORS.orange}
        />
        <Text maxFontSizeMultiplier={1.2} numberOfLines={1} style={[styles.streakText, isTablet && styles.tabletStreakText]}>{streakDays === null ? "View streak" : `${streakDays} day streak`}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  greetingBlock: { flex: 1 },
  stackedHeader: { flexDirection: "column", gap: 16 },
  stackedGreetingBlock: { flex: 0, width: "100%" },
  greeting: {
    color: COLORS.ink,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 32,
    lineHeight: 41,
    letterSpacing: -1,
  },
  tabletGreeting: { fontSize: 40, lineHeight: 50 },
  tabletStreakText: { fontSize: 17 },
  subtitle: {
    marginTop: 1,
    color: COLORS.secondary,
    fontFamily: "NunitoSans_600SemiBold",
    fontSize: 17,
    lineHeight: 23,
  },
  tabletSubtitle: { fontSize: 21, lineHeight: 29 },
  streakPill: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 24,
    backgroundColor: COLORS.orangeSoft,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  tabletStreakPill: { minHeight: 52, paddingHorizontal: 18, borderRadius: 26 },
  streakText: {
    color: COLORS.orange,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 14,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
});
