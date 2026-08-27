import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CARD_SHADOW, COLORS } from "@/theme/tokens";

type HomeHeaderProps = {
  displayName: string;
  streakDays: number | null;
  onPressStreak?: () => void;
};

export function HomeHeader({ displayName, streakDays, onPressStreak }: HomeHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.greetingBlock}>
        <Text style={styles.greeting}>{displayName ? `Hey, ${displayName}!` : "Hey there!"}</Text>
        <Text style={styles.subtitle}>Ready to practice?</Text>
      </View>

      <Pressable
        accessibilityLabel={streakDays === null ? "View practice streak" : `${streakDays} day practice streak`}
        accessibilityRole="button"
        onPress={onPressStreak}
        style={({ pressed }) => [styles.streakPill, CARD_SHADOW, pressed && styles.pressed]}
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
        <Text style={styles.streakText}>{streakDays === null ? "View streak" : `${streakDays} day streak`}</Text>
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
  greeting: {
    color: COLORS.ink,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 32,
    lineHeight: 41,
    letterSpacing: -1,
  },
  subtitle: {
    marginTop: 1,
    color: COLORS.secondary,
    fontFamily: "NunitoSans_600SemiBold",
    fontSize: 17,
    lineHeight: 23,
  },
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
  streakText: {
    color: COLORS.orange,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 14,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
});
