import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CARD_SHADOW, COLORS } from "@/theme/tokens";

type HistoryButtonProps = {
  onPress?: () => void;
};

export function HistoryButton({ onPress }: HistoryButtonProps) {
  return (
    <Pressable
      accessibilityHint="View your previous math sprints"
      accessibilityLabel="History"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.historyCard,
        CARD_SHADOW,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.historyIconCircle}>
        <SymbolView
          name={{
            ios: "clock.arrow.circlepath",
            android: "history",
            web: "history",
          }}
          size={27}
          tintColor={COLORS.primary}
        />
      </View>
      <Text style={styles.historyLabel}>History</Text>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  historyCard: {
    height: 68,
    borderRadius: 20,
    paddingHorizontal: 16,
    backgroundColor: COLORS.card,
    flexDirection: "row",
    alignItems: "center",
  },
  historyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  historyLabel: {
    flex: 1,
    marginLeft: 14,
    color: COLORS.ink,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 21,
  },
  chevron: {
    marginBottom: 3,
    color: COLORS.secondary,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 38,
    lineHeight: 40,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
});
