import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CARD_SHADOW, COLORS } from "@/theme/tokens";

type PreferenceRowProps = {
  disabled?: boolean;
  label: string;
  value: string;
  onPress: () => void;
};

export function PreferenceRow({
  disabled = false,
  label,
  value,
  onPress,
}: PreferenceRowProps) {
  return (
    <Pressable
      accessibilityHint={`Change ${label.toLowerCase()}`}
      accessibilityLabel={`${label}, ${value}`}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        CARD_SHADOW,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
      <SymbolView
        name={{
          ios: "chevron.right",
          android: "chevron_right",
          web: "chevron_right",
        }}
        size={24}
        tintColor={COLORS.secondary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 72,
    paddingHorizontal: 20,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(109, 69, 232, 0.06)",
    backgroundColor: COLORS.card,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  copy: { flex: 1, gap: 2 },
  label: {
    color: COLORS.ink,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 18,
    lineHeight: 24,
  },
  value: {
    color: COLORS.secondary,
    fontFamily: "NunitoSans_600SemiBold",
    fontSize: 14,
    lineHeight: 19,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
});
