import { SymbolView } from "expo-symbols";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { CARD_SHADOW, COLORS } from "@/theme/tokens";

const ROW_HEIGHT = 44;

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
      style={({ pressed }) => [styles.historyCard, CARD_SHADOW, pressed && styles.pressed]}
    >
      <View style={styles.historyRow}>
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

        <View style={styles.historyLabelWrap}>
          <Text style={styles.historyLabel}>History</Text>
        </View>

        <View style={styles.chevronSlot}>
          <View style={styles.chevronIcon}>
            <SymbolView
              name={{
                ios: "chevron.right",
                android: "chevron_right",
                web: "chevron_right",
              }}
              size={20}
              tintColor={COLORS.secondary}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  historyCard: {
    height: 68,
    borderRadius: 20,
    paddingHorizontal: 16,
    backgroundColor: COLORS.card,
    justifyContent: "center",
  },
  historyRow: {
    height: ROW_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
  },
  historyIconCircle: {
    width: ROW_HEIGHT,
    height: ROW_HEIGHT,
    borderRadius: 15,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  historyLabelWrap: {
    flex: 1,
    height: ROW_HEIGHT,
    marginLeft: 14,
    justifyContent: "center",
  },
  historyLabel: {
    color: COLORS.ink,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 24,
    lineHeight: 24,
    includeFontPadding: false,
    transform: [{ translateY: 2 }],
    ...Platform.select({
      android: { textAlignVertical: "center" },
    }),
  },
  chevronSlot: {
    width: 24,
    height: ROW_HEIGHT,
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  chevronIcon: {
    transform: [{ translateY: -1 }],
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
});
