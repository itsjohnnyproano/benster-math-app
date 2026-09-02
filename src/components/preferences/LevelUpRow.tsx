import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { CARD_SHADOW, COLORS } from "@/theme/tokens";
import { tabletPreferenceStyles } from "./tabletPreferenceStyles";

type LevelUpRowProps = {
  disabled?: boolean;
  tablet?: boolean;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
};

export function LevelUpRow({
  disabled = false,
  tablet = false,
  enabled,
  onChange,
}: LevelUpRowProps) {
  return (
    <Pressable
      accessibilityHint="Questions get harder as your streak grows"
      accessibilityLabel={`Level Up mode, ${enabled ? "on" : "off"}`}
      accessibilityRole="switch"
      accessibilityState={{ checked: enabled, disabled }}
      disabled={disabled}
      onPress={() => onChange(!enabled)}
      style={({ pressed }) => [
        styles.row,
        tablet && tabletPreferenceStyles.row,
        CARD_SHADOW,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.copy}>
        <Text maxFontSizeMultiplier={tablet ? undefined : 1.3} numberOfLines={tablet ? undefined : 1} adjustsFontSizeToFit={!tablet} style={[styles.label, tablet && tabletPreferenceStyles.label]}>Level Up mode</Text>
        <Text maxFontSizeMultiplier={tablet ? undefined : 1.3} numberOfLines={tablet ? undefined : 2} style={[styles.description, tablet && tabletPreferenceStyles.detail]}>Questions get harder as you go</Text>
      </View>
      <View pointerEvents="none" style={styles.switchContainer}>
        <Switch
          ios_backgroundColor="#DDD8EA"
          trackColor={{ false: "#DDD8EA", true: COLORS.primary }}
          thumbColor={COLORS.card}
          value={enabled}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 76,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(109, 69, 232, 0.06)",
    backgroundColor: COLORS.card,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  copy: { flex: 1, gap: 2 },
  switchContainer: {
    alignSelf: "stretch",
    justifyContent: "center",
  },
  label: {
    color: COLORS.ink,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 18,
    lineHeight: 24,
  },
  description: {
    color: COLORS.secondary,
    fontFamily: "NunitoSans_600SemiBold",
    fontSize: 13,
    lineHeight: 18,
  },
  pressed: { opacity: 0.9 },
});
