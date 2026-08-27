import { Pressable, StyleSheet, Text, View } from "react-native";

import type { SprintResult } from "@/domain/math-engine";
import { CARD_SHADOW, COLORS } from "@/theme/tokens";

type SprintCompleteViewProps = {
  result: SprintResult;
  onDone: () => void;
};

export function SprintCompleteView({ result, onDone }: SprintCompleteViewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Time’s up!</Text>
      <Text style={styles.title}>Sprint complete</Text>
      <View style={[styles.scoreCard, CARD_SHADOW]}>
        <Text style={styles.score}>
          {result.correctCount}/{result.attemptedCount}
        </Text>
        <Text style={styles.scoreLabel}>correct answers</Text>
        <View style={styles.divider} />
        <View style={styles.statRow}>
          <Stat label="Best streak" value={String(result.bestStreak)} />
          <Stat
            label="Accuracy"
            value={`${Math.round(result.accuracy * 100)}%`}
          />
          <Stat label="Level" value={String(result.finalLevel)} />
        </View>
      </View>
      <Pressable
        accessibilityLabel="Return home"
        accessibilityRole="button"
        onPress={onDone}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Text style={styles.buttonText}>Done</Text>
      </Pressable>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    color: COLORS.primary,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 16,
  },
  title: {
    marginTop: 4,
    color: COLORS.ink,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 31,
  },
  scoreCard: {
    alignSelf: "stretch",
    marginTop: 28,
    padding: 24,
    borderRadius: 24,
    backgroundColor: COLORS.card,
    alignItems: "center",
  },
  score: {
    color: COLORS.ink,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 48,
    lineHeight: 57,
  },
  scoreLabel: {
    color: COLORS.secondary,
    fontFamily: "NunitoSans_600SemiBold",
    fontSize: 14,
  },
  divider: {
    alignSelf: "stretch",
    height: StyleSheet.hairlineWidth,
    marginVertical: 22,
    backgroundColor: COLORS.border,
  },
  statRow: { alignSelf: "stretch", flexDirection: "row" },
  stat: { flex: 1, alignItems: "center" },
  statValue: {
    color: COLORS.ink,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 21,
  },
  statLabel: {
    marginTop: 2,
    color: COLORS.secondary,
    fontFamily: "NunitoSans_600SemiBold",
    fontSize: 11,
  },
  button: {
    alignSelf: "stretch",
    height: 58,
    marginTop: 26,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: COLORS.card,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 18,
  },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
});
