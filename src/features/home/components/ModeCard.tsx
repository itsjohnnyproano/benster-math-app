import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { CARD_SHADOW, COLORS } from "@/theme/tokens";

type ModeCardProps = {
  title: string;
  description: string;
  best: number | null;
  symbol: string;
  color: string;
  onPress?: () => void;
};

// Code-native vector decoration scales with the card without a new dependency.
function accentSource(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="140" viewBox="0 0 64 140" preserveAspectRatio="none">
    <path fill="${color}" d="M0 0H62C38 48 76 91 58 140H0Z"/>
    <path fill="none" stroke="white" stroke-opacity=".2" d="M54 0C30 48 68 91 50 140"/>
    <g fill="white" opacity=".22" font-family="Arial" font-weight="bold" font-size="23">
      <text x="9" y="30" transform="rotate(12 9 30)">7</text><text x="30" y="57">3</text>
      <text x="8" y="82">=</text><text x="24" y="111">+</text><text x="7" y="136">×</text>
    </g></svg>`;
  return { uri: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` };
}

export function ModeCard({ title, description, best, symbol, color, onPress }: ModeCardProps) {
  const { width } = useWindowDimensions();
  const compact = width < 375;
  return (
    <Pressable
      accessibilityHint={`Opens setup for a ${title.toLowerCase()} sprint`}
      accessibilityLabel={`${title}, ${best === null ? "no personal best available" : `personal best ${best}`}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, CARD_SHADOW, pressed && styles.pressed]}
    >
      <View pointerEvents="none" accessible={false} style={[styles.accent, compact && styles.compactAccent]}>
        <Image accessible={false} source={accentSource(color)} contentFit="fill" style={StyleSheet.absoluteFill} />
      </View>
      <View style={[styles.content, compact && styles.compactContent]}>
        <View style={styles.copy}>
          <Text maxFontSizeMultiplier={1.25} numberOfLines={1} adjustsFontSizeToFit style={styles.title}>{title}</Text>
          <Text maxFontSizeMultiplier={1.3} numberOfLines={2} style={styles.description}>{description}</Text>
          <Text maxFontSizeMultiplier={1.25} numberOfLines={1} style={styles.best}>Best: <Text style={{ color }}>{best ?? "—"}</Text></Text>
        </View>
        <View accessible={false} style={[styles.tile, { backgroundColor: `${color}12`, borderColor: `${color}30` }, compact && styles.compactTile]}>
          <View style={[styles.mark, compact && styles.compactMark]}>
            {symbol === "±×" ? (
              <>
                <View style={[styles.stroke, styles.mixedPlusHorizontal, { backgroundColor: color }]} />
                <View style={[styles.stroke, styles.mixedPlusVertical, { backgroundColor: color }]} />
                <View style={[styles.stroke, styles.mixedMinus, { backgroundColor: color }]} />
                <View style={[styles.stroke, styles.mixedTimes, styles.rotateForward, { backgroundColor: color }]} />
                <View style={[styles.stroke, styles.mixedTimes, styles.rotateBackward, { backgroundColor: color }]} />
              </>
            ) : (
              <>
                <View style={[styles.stroke, styles.horizontal, symbol === "×" && styles.rotateForward, { backgroundColor: color }]} />
                {symbol !== "−" && <View style={[styles.stroke, styles.horizontal, symbol === "+" ? styles.rotateVertical : styles.rotateBackward, { backgroundColor: color }]} />}
              </>
            )}
          </View>
        </View>
        <SymbolView name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }} size={16} tintColor={COLORS.secondary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 126, borderRadius: 24, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  accent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 48, borderTopLeftRadius: 23, borderBottomLeftRadius: 23, overflow: "hidden" },
  compactAccent: { width: 28 },
  content: { flexDirection: "row", alignItems: "center", gap: 10, paddingLeft: 62, paddingRight: 14, paddingVertical: 20, minHeight: 126 },
  compactContent: { paddingLeft: 38, paddingRight: 10, gap: 7 },
  copy: { flex: 1, gap: 5 },
  title: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 20, letterSpacing: -0.5 },
  description: { color: COLORS.secondary, fontFamily: "NunitoSans_600SemiBold", fontSize: 12, lineHeight: 17 },
  best: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 14, marginTop: 4 },
  tile: { width: 54, height: 58, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  compactTile: { width: 44, height: 50, borderRadius: 15 },
  mark: { width: 40, height: 40 },
  compactMark: { transform: [{ scale: 0.85 }] },
  stroke: { position: "absolute", borderRadius: 1 },
  horizontal: { left: 5, top: 17, width: 30, height: 6 },
  rotateVertical: { transform: [{ rotate: "90deg" }] },
  rotateForward: { transform: [{ rotate: "45deg" }] },
  rotateBackward: { transform: [{ rotate: "-45deg" }] },
  mixedPlusHorizontal: { left: 1, top: 12, width: 16, height: 4 },
  mixedPlusVertical: { left: 7, top: 6, width: 4, height: 16 },
  mixedMinus: { left: 1, top: 29, width: 16, height: 4 },
  mixedTimes: { left: 22, top: 18, width: 18, height: 4 },
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
});
