import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CARD_SHADOW, COLORS } from "@/theme/tokens";
import { PROFILE_COLORS } from "@/theme/profileColors";
import type { ProfileColorId } from "@/domain/learner";

type HomeHeaderProps = {
  displayName: string;
  profileInitial?: string;
  profileColorId?: ProfileColorId;
  isTablet?: boolean;
  stacked?: boolean;
  streakDays: number | null;
  onPressStreak?: () => void;
  onPressProfile?: () => void;
};

export function HomeHeader({ displayName, profileInitial, profileColorId = "violet", isTablet = false, stacked = false, streakDays, onPressStreak, onPressProfile }: HomeHeaderProps) {
  const profileColor = PROFILE_COLORS[profileColorId];
  return (
    <View style={[styles.header, stacked && styles.stackedHeader]}>
      <View style={[styles.greetingBlock, stacked && styles.stackedGreetingBlock]}>
        <View style={styles.greetingLine}>
          <Pressable accessibilityRole="button" accessibilityLabel="Choose learner profile" onPress={onPressProfile} style={({ pressed }) => [styles.profileAvatar, { backgroundColor: profileColor.background }, isTablet && styles.tabletProfileAvatar, pressed && styles.pressed]}>
            <Text style={[styles.profileInitial, { color: profileColor.foreground }, isTablet && styles.tabletProfileInitial]}>{(profileInitial || "L").slice(0, 1).toUpperCase()}</Text>
          </Pressable>
          <View style={styles.greetingCopy}>
            <Text adjustsFontSizeToFit maxFontSizeMultiplier={1.2} minimumFontScale={0.78} numberOfLines={1} style={[styles.greeting, isTablet && styles.tabletGreeting]}>{displayName ? `Hey, ${displayName}!` : "Hey there!"}</Text>
            <Text adjustsFontSizeToFit maxFontSizeMultiplier={1.1} minimumFontScale={0.82} numberOfLines={1} style={[styles.subtitle, isTablet && styles.tabletSubtitle]}>Ready to practice?</Text>
          </View>
        </View>
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
  greetingLine: { flexDirection: "row", alignItems: "center", gap: 10 },
  greetingCopy: { flex: 1, minWidth: 0 },
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
  profileAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  tabletProfileAvatar: { width: 60, height: 60, borderRadius: 30 },
  profileInitial: { fontFamily: "NunitoSans_700Bold", fontSize: 22 },
  tabletProfileInitial: { fontSize: 25 },
  tabletStreakText: { fontSize: 17 },
  subtitle: {
    marginTop: -2,
    color: COLORS.secondary,
    fontFamily: "NunitoSans_600SemiBold",
    fontSize: 16,
    lineHeight: 21,
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
