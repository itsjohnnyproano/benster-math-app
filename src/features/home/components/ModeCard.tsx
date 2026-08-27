import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { CARD_SHADOW, COLORS } from "@/theme/tokens";

type ModeCardProps = {
  title: string;
  best: number | null;
  symbol: string;
  color: string;
  onPress?: () => void;
};

const SYMBOL_OFFSETS: Record<string, { x: number; y: number }> = {
  "+": { x: 0, y: 7 },
  "−": { x: 0, y: 7 },
  "×": { x: 0, y: 7 },
};

function getSymbolOffset(symbol: string) {
  return SYMBOL_OFFSETS[symbol] ?? { x: 0, y: 7 };
}

export function ModeCard({ title, best, symbol, color, onPress }: ModeCardProps) {
  const symbolOffset = getSymbolOffset(symbol);

  return (
    <Pressable
      accessibilityHint={`Starts a ${title.toLowerCase()} sprint`}
      accessibilityLabel={`${title}, ${best === null ? "no personal best available" : `personal best ${best}`}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.modeCard, { backgroundColor: color }, CARD_SHADOW, pressed && styles.pressed]}
    >
      <View style={styles.modeDecorationOne} />
      <View style={styles.modeDecorationTwo} />
      <View style={styles.modeCopy}>
        <Text numberOfLines={1} style={styles.modeTitle}>
          {title}
        </Text>
        <View style={styles.bestPill}>
          <Text style={styles.bestText}>Best: {best ?? "—"}</Text>
        </View>
      </View>
      <View style={styles.symbolTile}>
        {symbol === "±×" ? (
          <View style={styles.mixedSymbol} accessible={false}>
            {[styles.plusHorizontal, styles.plusVertical, styles.minus, styles.timesForward, styles.timesBackward].map((stroke, index) => (
              <View key={index} style={[styles.symbolStroke, stroke, { backgroundColor: color }]} />
            ))}
          </View>
        ) : (
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[
            styles.symbol,
            { color },
            {
              transform: [{ translateX: symbolOffset.x }, { translateY: symbolOffset.y }],
            },
          ]}
        >
          {symbol}
        </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Draw the compound mark with centered geometry, independent of font baselines.
  mixedSymbol: { width: 56, height: 44 },
  symbolStroke: { position: "absolute", borderRadius: 1 },
  plusHorizontal: { left: 6, top: 16, width: 18, height: 4 },
  plusVertical: { left: 13, top: 9, width: 4, height: 18 },
  minus: { left: 6, top: 31, width: 18, height: 4 },
  timesForward: { left: 31, top: 20, width: 22, height: 4, transform: [{ rotate: "45deg" }] },
  timesBackward: { left: 31, top: 20, width: 22, height: 4, transform: [{ rotate: "-45deg" }] },
  modeCard: {
    height: 112,
    borderRadius: 24,
    paddingLeft: 22,
    paddingRight: 16,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modeCopy: { zIndex: 2, flex: 1, alignItems: "flex-start", gap: 10 },
  modeTitle: {
    color: COLORS.card,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 27,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  bestPill: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: "rgba(21, 30, 48, 0.12)",
  },
  bestText: {
    color: COLORS.card,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 15,
    lineHeight: 20,
  },
  symbolTile: {
    zIndex: 2,
    width: 72,
    height: 72,
    marginLeft: 10,
    borderRadius: 21,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#16233A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.14,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      default: { boxShadow: "0 4px 10px rgba(22, 35, 58, 0.14)" },
    }),
  },
  symbol: {
    fontFamily: "NunitoSans_700Bold",
    fontSize: 52,
    lineHeight: 52,
    width: 52,
    textAlign: "center",
    includeFontPadding: false,
    ...Platform.select({
      android: { textAlignVertical: "center" },
    }),
  },
  modeDecorationOne: {
    position: "absolute",
    top: -32,
    right: 78,
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  modeDecorationTwo: {
    position: "absolute",
    bottom: -42,
    left: -18,
    width: 125,
    height: 125,
    borderRadius: 63,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
});
