import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

import type { AdaptiveLayout } from "@/shared/responsiveLayout";
import { CARD_SHADOW, COLORS } from "@/theme/tokens";

type HomeHeroProps = { layout?: AdaptiveLayout };

export function HomeHero({ layout = "phone" }: HomeHeroProps) {
  const isTablet = layout !== "phone";
  const isLandscapeTablet = layout === "tablet-landscape";

  return (
    <View
      style={[
        styles.heroCard,
        isTablet && styles.tabletHeroCard,
        isLandscapeTablet && styles.landscapeHeroCard,
        CARD_SHADOW,
      ]}
    >
      <View style={styles.heroOrbLarge} />
      <View style={styles.heroOrbSmall} />
      <View style={[styles.heroCopy, isTablet && styles.tabletHeroCopy, isLandscapeTablet && styles.landscapeHeroCopy]}>
        <Text maxFontSizeMultiplier={1.2} numberOfLines={1} adjustsFontSizeToFit style={styles.heroLine}>
          Pick your
        </Text>
        <Text maxFontSizeMultiplier={1.2} numberOfLines={1} adjustsFontSizeToFit style={styles.heroAccent}>
          sprint
        </Text>
      </View>
      <Image
        accessibilityLabel="Benster mascot peeking around a yellow panel"
        contentFit="contain"
        source={require("../../../../assets/mascot/penguin-peeking-double-width-wall.png")}
        style={[styles.mascot, isTablet && styles.tabletMascot, isLandscapeTablet && styles.landscapeMascot]}
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
  tabletHeroCard: { height: 200 },
  landscapeHeroCard: { height: 292 },
  heroCopy: { zIndex: 2, width: "51%", paddingLeft: 24 },
  tabletHeroCopy: { paddingLeft: 32 },
  landscapeHeroCopy: { alignSelf: "flex-start", marginTop: 100, width: "70%", paddingLeft: 20 },
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
    right: -28,
    bottom: -28,
    width: 240,
    height: 225,
  },
  tabletMascot: { right: -18, bottom: -38, width: 300, height: 280 },
  landscapeMascot: { right: -200, bottom: -35, width: 420, height: 365 },
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
