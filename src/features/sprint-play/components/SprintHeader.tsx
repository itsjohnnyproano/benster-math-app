import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS } from "@/theme/tokens";

type SprintHeaderProps = {
  remainingSeconds: number;
  streak: number;
  onClose: () => void;
};

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function SprintHeader({
  remainingSeconds,
  streak,
  onClose,
}: SprintHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityLabel="Leave sprint"
        accessibilityRole="button"
        hitSlop={10}
        onPress={onClose}
        style={({ pressed }) => [
          styles.closeButton,
          pressed && styles.pressed,
        ]}
      >
        <SymbolView
          name={{ ios: "xmark", android: "close", web: "close" }}
          size={20}
          tintColor={COLORS.ink}
        />
      </Pressable>

      <View style={styles.timerPill}>
        <SymbolView
          name={{ ios: "timer", android: "timer", web: "timer" }}
          size={17}
          tintColor={COLORS.primary}
        />
        <Text maxFontSizeMultiplier={1.2} numberOfLines={1} adjustsFontSizeToFit style={styles.timerText}>{formatTime(remainingSeconds)}</Text>
      </View>

      <View style={styles.streakPill}>
        <Text maxFontSizeMultiplier={1.2} style={styles.streakIcon}>🔥</Text>
        <Text maxFontSizeMultiplier={1.2} numberOfLines={1} adjustsFontSizeToFit style={styles.streakText}>{streak}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
  },
  timerPill: {
    height: 42,
    paddingHorizontal: 15,
    borderRadius: 15,
    backgroundColor: COLORS.primarySoft,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  timerText: {
    minWidth: 42,
    color: COLORS.primary,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 17,
    fontVariant: ["tabular-nums"],
  },
  streakPill: {
    minWidth: 56,
    height: 42,
    paddingHorizontal: 10,
    borderRadius: 15,
    backgroundColor: "#FFF0DE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  streakIcon: { fontSize: 15 },
  streakText: {
    color: COLORS.orange,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 16,
  },
  pressed: { opacity: 0.58 },
});
