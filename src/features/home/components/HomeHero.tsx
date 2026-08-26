import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

import { CARD_SHADOW, COLORS } from "@/theme/tokens";

export function HomeHero() {
  return (
    <View style={[styles.heroCard, CARD_SHADOW]}>
      <View style={styles.heroOrbLarge} />
      <View style={styles.heroOrbSmall} />
      <View style={styles.heroCopy}>
        <Text style={styles.heroLine}>Pick your</Text>
        <Text style={styles.heroAccent}>sprint</Text>
      </View>
      <Image
        accessibilityLabel="Math Sprint penguin mascot peeking around a yellow panel"
        contentFit="contain"
        source={require("../../../../assets/mascot/penguin-peeking.png")}
        style={styles.mascot}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    height: 166,
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: "rgba(109, 69, 232, 0.08)",
    flexDirection: "row",
    alignItems: "center",
  },
  heroCopy: { zIndex: 2, width: "51%", paddingLeft: 24 },
  heroLine: {
    color: COLORS.ink,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 35,
    // lineHeight: 34,
    letterSpacing: -0.7,
  },
  heroAccent: {
    marginTop: -8,
    color: COLORS.primary,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 35,
    // lineHeight: 49,
    letterSpacing: -1,
  },
  mascot: {
    position: "absolute",
    right: -3,
    bottom: -7,
    width: 190,
    height: 171,
  },
  heroOrbLarge: {
    position: "absolute",
    right: -42,
    bottom: -82,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "rgba(109, 69, 232, 0.07)",
  },
  heroOrbSmall: {
    position: "absolute",
    left: 64,
    top: 24,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.33)",
  },
});
