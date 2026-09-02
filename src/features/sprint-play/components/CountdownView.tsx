import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "@/theme/tokens";
import { getAdaptiveLayout } from "@/shared/responsiveLayout";
import { getTabletCountdownLayout } from "../countdownLayout";

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
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tablet = Platform.OS === "ios" && getAdaptiveLayout(width, height) !== "phone";
  const layout = getTabletCountdownLayout(width - insets.left - insets.right, height - insets.top - insets.bottom, fontScale);
  const mascotSize = tablet ? layout.mascot : Math.max(48, Math.min(112, height - insets.top - insets.bottom - 480));

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
      <View style={[styles.container, tablet && { paddingVertical: layout.padding }]}>
        <Text maxFontSizeMultiplier={1.2} style={[styles.eyebrow, tablet && styles.tabletEyebrow]}>{modeTitle} sprint</Text>
        <Text maxFontSizeMultiplier={1.2} style={[styles.ready, tablet && styles.tabletReady]}>Ready?</Text>
        <View style={[styles.countCircle, tablet && { width: layout.circle, height: layout.circle, borderRadius: layout.circle / 2, marginTop: 18 }]}>
          <Text maxFontSizeMultiplier={1.2} style={[styles.count, tablet && { fontSize: layout.numberSize, lineHeight: layout.numberSize * 1.17, transform: [{ translateY: layout.numberSize / 16 }] }]}>{count}</Text>
        </View>
        <Image
          source={require("../../../../assets/mascot/penguin-sprint-start-crouch-exact.png")}
          contentFit="contain"
          accessible={false}
          style={[styles.mascot, { width: mascotSize, height: mascotSize }]}
        />
        <Text maxFontSizeMultiplier={1.2} style={[styles.note, tablet && styles.tabletNote]}>Your timer starts after the countdown</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabletEyebrow: { fontSize: 19, lineHeight: 26 },
  tabletReady: { fontSize: 46, lineHeight: 58 },
  tabletNote: { fontSize: 18, lineHeight: 26, maxWidth: 440 },
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
    paddingVertical: 52,
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
  mascot: { marginTop: 12 },
  note: {
    marginTop: 12,
    maxWidth: 280,
    color: COLORS.secondary,
    fontFamily: "NunitoSans_600SemiBold",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  pressed: { opacity: 0.58 },
});
