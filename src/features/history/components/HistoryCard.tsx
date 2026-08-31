import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { SPRINT_MODE_DETAILS } from "@/config/sprintModeDetails";
import type { SavedSprint } from "@/domain/results";
import { formatDurationLabel } from "@/shared/formatSprintDuration";
import { formatResponseTime } from "@/shared/formatResponseTime";
import { CARD_SHADOW, COLORS } from "@/theme/tokens";

type Props = {
  onPress: () => void;
  record: SavedSprint;
};

export function HistoryCard({ onPress, record }: Props) {
  const { result } = record;
  const { configuration } = result;
  const mode = SPRINT_MODE_DETAILS[configuration.mode];
  return (
    <Pressable
      accessibilityHint="Opens the answer review for this sprint"
      accessibilityLabel={`${mode.title} sprint, ${result.correctCount} correct out of ${result.attemptedCount}, ${Math.round(result.accuracy * 100)} percent accuracy`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, CARD_SHADOW, pressed && styles.pressed]}
    >
      <View style={styles.heading}>
        <View style={[styles.dot, { backgroundColor: mode.color }]} />
        <Text style={styles.title}>{mode.title} Sprint</Text>
        <Text style={styles.duration}>{formatDurationLabel(configuration.durationSeconds)}</Text>
      </View>
      <View style={styles.scoreRow}>
        <View style={styles.scoreBlock}>
          <Text style={styles.score}>{result.correctCount}<Text style={styles.total}> / {result.attemptedCount}</Text></Text>
          <Text style={styles.label}>correct answers</Text>
        </View>
        <View style={styles.accuracy}>
          <Text style={styles.percent}>{Math.round(result.accuracy * 100)}%</Text>
          <Text style={styles.label}>accuracy</Text>
        </View>
      </View>
      <Text style={styles.pace}>Avg. answer: {formatResponseTime(result.averageResponseMs)}</Text>
      <View style={styles.footer}>
        <Text style={styles.meta}>{new Date(result.completedAtMs).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</Text>
        <View style={styles.footerAction}>
          {configuration.levelUpEnabled && <Text style={styles.level}>Level {result.finalLevel}</Text>}
          <Text style={styles.review}>Review</Text>
          <SymbolView name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }} size={13} tintColor={COLORS.primary} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.card, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border, padding: 18, marginBottom: 14 },
  heading: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  dot: { width: 9, height: 9, borderRadius: 5 },
  title: { flex: 1, color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 17 },
  duration: { color: COLORS.primary, fontFamily: "NunitoSans_700Bold", fontSize: 12, backgroundColor: COLORS.primarySoft, borderRadius: 9, paddingHorizontal: 8, paddingVertical: 5 },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 13 },
  scoreBlock: { flex: 1, gap: 0 },
  score: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 34, lineHeight: 38 },
  total: { color: COLORS.secondary, fontSize: 24 },
  label: { color: COLORS.secondary, fontFamily: "NunitoSans_600SemiBold", fontSize: 12, lineHeight: 15, marginTop: -2 },
  accuracy: { alignItems: "center", gap: 0, paddingLeft: 18, borderLeftWidth: 1, borderLeftColor: COLORS.border },
  percent: { color: COLORS.primary, fontFamily: "NunitoSans_700Bold", fontSize: 25, lineHeight: 30 },
  pace: { color: COLORS.secondary, fontFamily: "NunitoSans_600SemiBold", fontSize: 13, marginTop: 12 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 12, paddingTop: 10 },
  footerAction: { flexDirection: "row", alignItems: "center", gap: 6 },
  meta: { color: COLORS.secondary, fontFamily: "NunitoSans_600SemiBold", fontSize: 12 },
  level: { color: COLORS.primary, fontFamily: "NunitoSans_700Bold", fontSize: 12 },
  review: { color: COLORS.primary, fontFamily: "NunitoSans_700Bold", fontSize: 12 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
});
