import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  isCardLayout,
  isInputStyle,
  isSprintMode,
  parseSprintDuration,
  type SprintConfiguration,
} from "@/domain/sprint";
import { CARD_SHADOW, COLORS } from "@/theme/tokens";

import { formatCountdown } from "../sprint-setup/formatSprintDuration";
import {
  CARD_LAYOUT_LABELS,
  INPUT_STYLE_LABELS,
  MODE_DETAILS,
} from "../sprint-setup/sprintSetupOptions";

function readBoolean(value: string | undefined) {
  return value === "true";
}

export default function SprintPlayPlaceholder() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    mode?: string;
    durationSeconds?: string;
    inputStyle?: string;
    cardLayout?: string;
    levelUpEnabled?: string;
  }>();
  const [configuration] = useState<SprintConfiguration>(() =>
    Object.freeze({
      mode: isSprintMode(params.mode) ? params.mode : "addition",
      durationSeconds: parseSprintDuration(params.durationSeconds) ?? 60,
      inputStyle: isInputStyle(params.inputStyle)
        ? params.inputStyle
        : "multiple-choice",
      cardLayout: isCardLayout(params.cardLayout)
        ? params.cardLayout
        : "horizontal",
      levelUpEnabled: readBoolean(params.levelUpEnabled),
    }),
  );
  const modeDetails = MODE_DETAILS[configuration.mode];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <View style={styles.content}>
        <View
          style={[
            styles.modeIcon,
            { backgroundColor: `${modeDetails.color}18` },
          ]}
        >
          <Text style={[styles.modeSymbol, { color: modeDetails.color }]}>
            {modeDetails.symbol}
          </Text>
        </View>
        <Text style={styles.title}>{modeDetails.title} Sprint</Text>
        <Text style={styles.subtitle}>Gameplay arrives in Phase 3</Text>

        <View style={[styles.summaryCard, CARD_SHADOW]}>
          <SummaryRow
            label="Duration"
            value={formatCountdown(configuration.durationSeconds)}
          />
          <SummaryRow
            label="Input"
            value={INPUT_STYLE_LABELS[configuration.inputStyle]}
          />
          <SummaryRow
            label="Layout"
            value={CARD_LAYOUT_LABELS[configuration.cardLayout]}
          />
          <SummaryRow
            isLast
            label="Level Up"
            value={configuration.levelUpEnabled ? "On" : "Off"}
          />
        </View>

        <Text style={styles.note}>
          This configuration is now frozen for this sprint.
        </Text>

        <Pressable
          accessibilityLabel="Return to sprint setup"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.backButtonText}>Back to Setup</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function SummaryRow({
  label,
  value,
  isLast = false,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.summaryRow, !isLast && styles.summaryDivider]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  modeIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  modeSymbol: {
    fontFamily: "NunitoSans_700Bold",
    fontSize: 45,
    lineHeight: 50,
  },
  title: {
    marginTop: 18,
    color: COLORS.ink,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 29,
    lineHeight: 36,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 4,
    color: COLORS.secondary,
    fontFamily: "NunitoSans_600SemiBold",
    fontSize: 15,
    lineHeight: 21,
  },
  summaryCard: {
    alignSelf: "stretch",
    marginTop: 28,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: COLORS.card,
  },
  summaryRow: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  summaryDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E7E2F0",
  },
  summaryLabel: {
    color: COLORS.secondary,
    fontFamily: "NunitoSans_600SemiBold",
    fontSize: 15,
  },
  summaryValue: {
    color: COLORS.ink,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 15,
  },
  note: {
    marginTop: 20,
    color: COLORS.secondary,
    fontFamily: "NunitoSans_600SemiBold",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  backButton: {
    alignSelf: "stretch",
    minHeight: 56,
    marginTop: 28,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    color: COLORS.card,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 17,
  },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
});
