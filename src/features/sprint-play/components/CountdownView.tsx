import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS } from "@/theme/tokens";

type CountdownViewProps = {
  count: number;
  modeTitle: string;
  onClose: () => void;
};

export function CountdownView({
  count,
  modeTitle,
  onClose,
}: CountdownViewProps) {
  return (
    <View style={styles.screen}>
      <Pressable
        accessibilityLabel="Cancel countdown"
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
      <View style={styles.container}>
        <Text style={styles.eyebrow}>{modeTitle} sprint</Text>
        <Text style={styles.ready}>Ready?</Text>
        <View style={styles.countCircle}>
          <Text maxFontSizeMultiplier={1.2} style={styles.count}>{count}</Text>
        </View>
        <Text style={styles.note}>Your timer starts after the countdown</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 24 },
  closeButton: {
    position: "absolute",
    top: 8,
    left: 24,
    zIndex: 1,
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    color: COLORS.primary,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  ready: {
    marginTop: 8,
    color: COLORS.ink,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 34,
    lineHeight: 42,
    textAlign: "center",
  },
  countCircle: {
    width: 184,
    height: 184,
    marginTop: 24,
    borderRadius: 92,
    borderWidth: 5,
    borderColor: COLORS.primarySoft,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
  },
  count: {
    color: COLORS.primary,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 96,
    lineHeight: 112,
    textAlign: "center",
    includeFontPadding: false,
    fontVariant: ["tabular-nums"],
    // Optically center Nunito's numeral ink, not just its line box.
    transform: [{ translateY: 6 }],
  },
  note: {
    marginTop: 20,
    maxWidth: 280,
    color: COLORS.secondary,
    fontFamily: "NunitoSans_600SemiBold",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  pressed: { opacity: 0.58 },
});
