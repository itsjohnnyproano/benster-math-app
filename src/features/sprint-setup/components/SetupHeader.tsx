import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { SPRINT_MODE_DETAILS } from "@/config/sprintModeDetails";
import type { SprintMode } from "@/domain/sprint";
import { COLORS } from "@/theme/tokens";

type SetupHeaderProps = {
  mode: SprintMode;
  subtitle: string;
  onBack: () => void;
};

export function SetupHeader({ mode, subtitle, onBack }: SetupHeaderProps) {
  const modeDetails = SPRINT_MODE_DETAILS[mode];

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityLabel="Go back"
        accessibilityRole="button"
        hitSlop={12}
        onPress={onBack}
        style={({ pressed }) => [
          styles.backButton,
          pressed && styles.pressed,
        ]}
      >
        <SymbolView
          name={{
            ios: "chevron.left",
            android: "arrow_back_ios_new",
            web: "arrow_back_ios_new",
          }}
          size={25}
          tintColor={COLORS.ink}
        />
      </Pressable>

      <View style={styles.titleBlock}>
        <Text style={styles.title}>Let&apos;s go!</Text>
        <View
          style={[
            styles.modePill,
            { backgroundColor: `${modeDetails.color}18` },
          ]}
        >
          <Text style={[styles.modePillText, { color: modeDetails.color }]}>
            {modeDetails.symbol} {modeDetails.title}
          </Text>
        </View>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.headerBalance} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleBlock: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 4,
  },
  title: {
    color: COLORS.ink,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.8,
  },
  modePill: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  modePillText: {
    fontFamily: "NunitoSans_700Bold",
    fontSize: 13,
    lineHeight: 18,
  },
  subtitle: {
    marginTop: 5,
    color: COLORS.secondary,
    fontFamily: "NunitoSans_600SemiBold",
    fontSize: 15,
    lineHeight: 20,
  },
  headerBalance: { width: 42 },
  pressed: { opacity: 0.55 },
});
