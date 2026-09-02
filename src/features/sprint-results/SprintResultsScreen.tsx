import { Image } from "expo-image";
import { useCallback, useEffect } from "react";
import { Alert, BackHandler, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { SPRINT_MODE_DETAILS } from "@/config/sprintModeDetails";
import type { SprintResult } from "@/domain/math-engine";
import { getResultOutcome, type PersonalBestChange } from "@/domain/results";
import { formatDurationLabel } from "@/shared/formatSprintDuration";
import { CARD_SHADOW, COLORS } from "@/theme/tokens";
import { AnswerReview } from "./components/AnswerReview";
import { useSavedSprint } from "./useSavedSprint";
import { RESULT_PRESENTATION } from "./resultPresentation";
import { formatResponseTime } from "@/shared/formatResponseTime";
import { CARD_LAYOUT_LABELS } from "@/components/preferences/practiceOptions";
import { getResultsLayout } from "./resultsLayout";

type Props = { sprintId: string; result: SprintResult; onDone: () => void };

export function SprintResultsScreen({ sprintId, result, onDone }: Props) {
  const { width, height, fontScale } = useWindowDimensions();
  const { isTablet, isTwoColumn, contentMaxWidth } = getResultsLayout(width, height, Platform.OS, fontScale);
  const save = useSavedSprint(sprintId, result);
  const encouragement = RESULT_PRESENTATION[getResultOutcome(result)];
  const { configuration } = result;
  const duration = formatDurationLabel(configuration.durationSeconds);

  const leaveWithoutSaving = useCallback(() => {
    Alert.alert("Leave without saving?", "This sprint won’t appear in your saved results or personal bests.", [
      { text: "Stay here", style: "cancel" },
      { text: "Leave", style: "destructive", onPress: onDone },
    ]);
  }, [onDone]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (save.status === "saved") onDone();
      else if (save.status === "error") leaveWithoutSaving();
      // Stay on Results while saving; don't silently discard a pending result.
      return true;
    });
    return () => subscription.remove();
  }, [save.status, onDone, leaveWithoutSaving]);

  return (
    <View style={styles.screen}>
      <ScrollView bounces={!isTablet} contentContainerStyle={[
        styles.content,
        isTablet && [styles.tabletContent, { maxWidth: contentMaxWidth }],
      ]} showsVerticalScrollIndicator={isTablet}>
        <View style={[styles.summary, isTwoColumn && styles.summaryColumns]}>
          <View style={[styles.hero, isTwoColumn && styles.heroColumn]}>
            <Image
              source={encouragement.useEncouragementMascot
                ? require("../../../assets/mascot/penguin-score-lower-than-expected.png")
                : require("../../../assets/mascot/penguin-thumbs-up.png")}
              contentFit="contain"
              style={[styles.mascot, isTablet && styles.tabletMascot]}
              accessible={false}
            />
            <Text style={styles.eyebrow}>SPRINT COMPLETE</Text>
            <Text style={[styles.title, isTablet && styles.tabletTitle]}>You showed up!</Text>
            <Text style={[styles.message, isTablet && styles.tabletMessage]}>{encouragement.message}</Text>
            <Text style={styles.context}>{SPRINT_MODE_DETAILS[configuration.mode].title} · {duration}</Text>
          </View>

          <View style={[styles.summary, isTwoColumn && styles.scoreColumn]}>
            <View style={[styles.scoreCard, CARD_SHADOW, isTablet && styles.tabletScoreCard]}>
              <Text accessibilityLabel={`${result.correctCount} correct out of ${result.attemptedCount} answered`} style={[styles.score, isTablet && styles.tabletScore]}>
                {result.correctCount}<Text style={styles.scoreTotal}> / {result.attemptedCount}</Text>
              </Text>
              <Text style={styles.scoreLabel}>correct answers</Text>
              <View style={styles.stats}>
                <Stat label="Accuracy" value={result.attemptedCount === 0 ? "—" : `${Math.round(result.accuracy * 100)}%`} />
                <Stat label="Avg. answer time" value={formatResponseTime(result.averageResponseMs)} />
                <Stat label="Best answer streak" value={String(result.bestStreak)} />
                {configuration.levelUpEnabled
                  ? <Stat label="Highest level" value={String(result.finalLevel)} />
                  : <Stat label="Sprint duration" value={duration} />}
              </View>
              {result.attemptedCount === 0 && <Text style={styles.note}>No answers submitted this time.</Text>}
            </View>

            <View accessibilityLiveRegion="polite" style={styles.bestCard}>
              {save.status === "saved" ? (
                <PersonalBest best={save.saved.personalBest} duration={duration} />
              ) : save.status === "saving" ? (
                <Text style={styles.bestTitle}>Saving your sprint…</Text>
              ) : (
                <>
                  <Text style={styles.bestTitle}>Your sprint hasn’t been saved</Text>
                  <Text style={styles.note}>Your result is still here. Please try saving again.</Text>
                  <Pressable accessibilityRole="button" onPress={save.retry} style={styles.retryButton}>
                    <Text style={styles.retryText}>Retry saving</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </View>

        <AnswerReview answers={result.answeredQuestions} />
        <View style={styles.details}>
          <Text style={styles.detailsText}>
            {configuration.inputStyle === "typed" ? "Typed answers" : "Multiple choice"} · {CARD_LAYOUT_LABELS[configuration.cardLayout]} cards
          </Text>
          <Text style={styles.detailsText}>Level Up {configuration.levelUpEnabled ? "on" : "off"}</Text>
          <Text style={styles.detailsText}>{new Date(result.completedAtMs).toLocaleString()}</Text>
          <Text style={styles.detailsText}>{save.status === "saved" ? "Saved on this device" : "Not saved yet"}</Text>
        </View>
      </ScrollView>
      <View style={[styles.footer, isTablet && styles.tabletFooter]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Done, return home"
          accessibilityState={{ disabled: save.status !== "saved" }}
          disabled={save.status !== "saved"}
          onPress={onDone}
          style={({ pressed }) => [styles.doneButton, isTablet && styles.tabletDoneButton, save.status !== "saved" && styles.disabled, pressed && styles.pressed]}
        >
          <Text style={styles.doneText}>{save.status === "saving" ? "Saving…" : "Done"}</Text>
        </Pressable>
        {save.status === "error" && (
          <Pressable accessibilityRole="button" onPress={leaveWithoutSaving} style={styles.leaveButton}>
            <Text style={styles.detailsText}>Leave without saving</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function PersonalBest({ best, duration }: { best: PersonalBestChange; duration: string }) {
  const titles = {
    first: "First sprint recorded!", new: "New personal best!", matched: "Matched your best!",
    unchanged: "Another practice in the books", ineligible: "A fresh start next time",
  };
  return (
    <>
      <Text style={styles.bestTitle}>{titles[best.status]}</Text>
      <Text style={styles.note}>
        {best.updated === null ? "Submit an answer to establish your first best."
          : best.status === "new" ? `Previous best: ${best.previous} → New best: ${best.updated} · ${duration}`
            : `Personal best: ${best.updated} correct · ${duration}`}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 20, gap: 18 },
  summary: { gap: 18 },
  tabletContent: { width: "100%", alignSelf: "center", paddingHorizontal: 32, paddingTop: 24, paddingBottom: 28, gap: 24 },
  summaryColumns: { flexDirection: "row", alignItems: "center", gap: 32 },
  heroColumn: { flex: 1, minWidth: 0 },
  scoreColumn: { flex: 1.2, minWidth: 0 },
  tabletMascot: { width: 168, height: 168 },
  tabletTitle: { fontSize: 36, lineHeight: 44 },
  tabletMessage: { fontSize: 18, lineHeight: 26, maxWidth: 420 },
  tabletScoreCard: { padding: 24 },
  tabletScore: { fontSize: 64 },
  tabletFooter: { paddingVertical: 16 },
  tabletDoneButton: { width: "100%", maxWidth: 420, alignSelf: "center", minHeight: 60 },
  hero: { alignItems: "center", gap: 6 },
  mascot: { width: 124, height: 124 },
  eyebrow: { fontFamily: "NunitoSans_700Bold", color: COLORS.primary, fontSize: 12, letterSpacing: 1.4, textAlign: "center" },
  title: { fontFamily: "NunitoSans_700Bold", fontSize: 30, lineHeight: 38, color: COLORS.ink, textAlign: "center" },
  message: { fontFamily: "NunitoSans_600SemiBold", fontSize: 15, lineHeight: 21, color: COLORS.secondary, textAlign: "center", maxWidth: 320 },
  context: { fontFamily: "NunitoSans_700Bold", color: COLORS.primary, fontSize: 14, marginTop: 4 },
  scoreCard: { backgroundColor: COLORS.card, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border, padding: 20, alignItems: "center" },
  score: { fontFamily: "NunitoSans_700Bold", color: COLORS.ink, fontSize: 52, textAlign: "center" },
  scoreTotal: { fontSize: 32, color: COLORS.secondary },
  scoreLabel: { fontFamily: "NunitoSans_600SemiBold", color: COLORS.secondary, fontSize: 14 },
  stats: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border, flexDirection: "row", flexWrap: "wrap", width: "100%", rowGap: 20 },
  stat: { width: "50%", paddingHorizontal: 4, alignItems: "center" },
  statValue: { fontFamily: "NunitoSans_700Bold", fontSize: 23, color: COLORS.ink, textAlign: "center" },
  statLabel: { fontFamily: "NunitoSans_600SemiBold", fontSize: 12, color: COLORS.secondary, marginTop: 3, textAlign: "center" },
  bestCard: { backgroundColor: COLORS.primarySoft, borderRadius: 18, padding: 18, gap: 6 },
  bestTitle: { fontFamily: "NunitoSans_700Bold", fontSize: 18, color: COLORS.primary, textAlign: "center" },
  note: { fontFamily: "NunitoSans_600SemiBold", fontSize: 13, lineHeight: 19, color: COLORS.secondary, textAlign: "center" },
  retryButton: { minHeight: 44, justifyContent: "center", alignItems: "center", marginTop: 4 },
  retryText: { fontFamily: "NunitoSans_700Bold", fontSize: 16, color: COLORS.primary, textDecorationLine: "underline" },
  details: { gap: 5 },
  detailsText: { fontFamily: "NunitoSans_600SemiBold", fontSize: 12, color: COLORS.secondary, textAlign: "center" },
  footer: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  doneButton: { backgroundColor: COLORS.primary, minHeight: 56, borderRadius: 18, padding: 12, justifyContent: "center", alignItems: "center" },
  doneText: { fontFamily: "NunitoSans_700Bold", fontSize: 18, color: COLORS.card },
  leaveButton: { minHeight: 44, justifyContent: "center", marginTop: 4 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.8 },
});
