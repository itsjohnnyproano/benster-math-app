import { SymbolView } from "expo-symbols";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnswerReviewRow } from "@/components/sprints/AnswerReviewRow";
import { SPRINT_MODE_DETAILS } from "@/config/sprintModeDetails";
import type { SavedSprint } from "@/domain/results";
import { formatResponseTime } from "@/shared/formatResponseTime";
import { formatDurationLabel } from "@/shared/formatSprintDuration";
import { getAdaptiveLayout } from "@/shared/responsiveLayout";
import { CARD_SHADOW, COLORS } from "@/theme/tokens";

import { useHistorySprint } from "./useHistorySprint";
import { getHistoryLayout } from "./historyLayout";

function useDetailLayout() {
  const { width, height, fontScale } = useWindowDimensions();
  const tablet = Platform.OS === "ios" && getAdaptiveLayout(width, height) !== "phone";
  return { tablet, ...getHistoryLayout(tablet, width, height, fontScale) };
}

type ReviewFilter = "incorrect" | "all";

type Props = {
  onBack: () => void;
  sprintId: string | null;
};

export default function SprintHistoryDetailScreen({ onBack, sprintId }: Props) {
  const { state, retry } = useHistorySprint(sprintId);

  if (state.status !== "ready") {
    return (
      <DetailState
        status={state.status}
        onBack={onBack}
        onRetry={retry}
      />
    );
  }

  return <SprintReview key={state.record.id} record={state.record} onBack={onBack} />;
}

function SprintReview({ onBack, record }: { onBack: () => void; record: SavedSprint }) {
  const { tablet, columns, maxWidth } = useDetailLayout();
  const [filter, setFilter] = useState<ReviewFilter>("incorrect");
  const { result } = record;
  const { configuration } = result;
  const mode = SPRINT_MODE_DETAILS[configuration.mode];
  const incorrectAnswers = useMemo(
    () => result.answeredQuestions.filter((answer) => !answer.isCorrect),
    [result.answeredQuestions],
  );
  const answers = filter === "incorrect" ? incorrectAnswers : result.answeredQuestions;

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} style={styles.screen}>
      <StatusBar style="dark" />
      {tablet && <View style={[styles.tabletNavigation, { maxWidth }]}><NavigationHeader onBack={onBack} tablet /></View>}
      <FlatList
        key={columns}
        numColumns={columns}
        columnWrapperStyle={columns === 2 ? styles.answerColumns : undefined}
        data={answers}
        keyExtractor={(answer) => String(answer.question.id)}
        renderItem={({ item }) => (
          <View style={columns === 2 ? styles.answerColumn : undefined}>
          <AnswerReviewRow
            answer={item}
            emphasizeCorrection
            position={item.question.id}
            tablet={tablet}
          />
          </View>
        )}
        ItemSeparatorComponent={ListGap}
        ListHeaderComponent={(
          <View style={styles.headerContent}>
            {!tablet && <NavigationHeader onBack={onBack} />}
            <View style={[styles.overview, columns === 2 && styles.overviewColumns]}>
            <View style={[styles.hero, columns === 2 && styles.overviewColumn, { backgroundColor: `${mode.color}12`, borderColor: `${mode.color}30` }]}>
              <View style={[styles.symbol, { backgroundColor: mode.color }]}>
                <Text style={styles.symbolText}>{mode.symbol}</Text>
              </View>
              <Text style={[styles.eyebrow, { color: mode.color }]}>{mode.title.toUpperCase()} SPRINT</Text>
              <Text style={[styles.heroTitle, tablet && styles.tabletTitle]}>Sprint review</Text>
              <Text style={[styles.heroMeta, tablet && styles.tabletBody]}>
                {formatDurationLabel(configuration.durationSeconds)} · {new Date(result.completedAtMs).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </Text>
            </View>

            <View style={[styles.summary, CARD_SHADOW, columns === 2 && styles.overviewColumn]}>
              <SummaryStat tablet={tablet} label="Correct" value={`${result.correctCount} / ${result.attemptedCount}`} />
              <SummaryStat tablet={tablet} label="Accuracy" value={result.attemptedCount ? `${Math.round(result.accuracy * 100)}%` : "—"} />
              <SummaryStat tablet={tablet} label="Avg. answer" value={formatResponseTime(result.averageResponseMs)} />
              <SummaryStat
                tablet={tablet}
                label={configuration.levelUpEnabled ? "Highest level" : "Best streak"}
                value={String(configuration.levelUpEnabled ? result.finalLevel : result.bestStreak)}
              />
            </View>
            </View>

            <View accessibilityRole="tablist" style={styles.filters}>
              <ReviewTab
                tablet={tablet}
                color={mode.color}
                label={`Incorrect (${incorrectAnswers.length})`}
                selected={filter === "incorrect"}
                onPress={() => setFilter("incorrect")}
              />
              <ReviewTab
                tablet={tablet}
                color={mode.color}
                label={`All answers (${result.answeredQuestions.length})`}
                selected={filter === "all"}
                onPress={() => setFilter("all")}
              />
            </View>
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {result.attemptedCount === 0 ? "No answers submitted" : "No incorrect answers!"}
            </Text>
            <Text style={styles.emptyBody}>
              {result.attemptedCount === 0
                ? "This sprint ended before an answer was submitted."
                : "Every submitted answer was correct. Nice work!"}
            </Text>
            {result.attemptedCount > 0 && (
              <Pressable accessibilityRole="button" onPress={() => setFilter("all")} style={({ pressed }) => [styles.viewAll, { backgroundColor: mode.color }, pressed && styles.pressed]}>
                <Text style={styles.viewAllText}>View all answers</Text>
              </Pressable>
            )}
          </View>
        )}
        contentContainerStyle={[styles.content, tablet && styles.tabletContent, tablet && { maxWidth }]}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function NavigationHeader({ onBack, tablet = false }: { onBack: () => void; tablet?: boolean }) {
  return (
    <View style={styles.navigation}>
      <Pressable accessibilityLabel="Back to history" accessibilityRole="button" hitSlop={10} onPress={onBack} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
        <SymbolView name={{ ios: "chevron.left", android: "arrow_back_ios_new", web: "arrow_back_ios_new" }} size={22} tintColor={COLORS.ink} />
      </Pressable>
      <Text accessibilityRole="header" style={[styles.navigationTitle, tablet && styles.tabletNavigationTitle]}>Sprint details</Text>
      <View style={styles.navigationBalance} />
    </View>
  );
}

function SummaryStat({ label, value, tablet = false }: { label: string; value: string; tablet?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, tablet && styles.tabletStatValue]}>{value}</Text>
      <Text style={[styles.statLabel, tablet && styles.tabletBody]}>{label}</Text>
    </View>
  );
}

function ReviewTab({ color, label, onPress, selected, tablet = false }: { color: string; label: string; onPress: () => void; selected: boolean; tablet?: boolean }) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.filter,
        tablet && styles.tabletFilter,
        selected && { backgroundColor: color, borderColor: color },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.filterText, tablet && styles.tabletBody, selected && styles.selectedFilterText]}>{label}</Text>
    </Pressable>
  );
}

function DetailState({ onBack, onRetry, status }: { onBack: () => void; onRetry: () => void; status: "loading" | "not-found" | "error" }) {
  const { tablet, maxWidth } = useDetailLayout();
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={[styles.stateContent, tablet && styles.tabletContent, tablet && { maxWidth }]}>
        <NavigationHeader onBack={onBack} tablet={tablet} />
        <View style={styles.stateCard}>
          {status === "loading" ? (
            <><ActivityIndicator color={COLORS.primary} size="large" /><Text style={styles.emptyBody}>Loading sprint details…</Text></>
          ) : (
            <>
              <Text style={styles.emptyTitle}>{status === "not-found" ? "Sprint not found" : "Couldn’t load this sprint"}</Text>
              <Text style={styles.emptyBody}>
                {status === "not-found" ? "This saved sprint is no longer available." : "Your saved history has not been changed. Please try again."}
              </Text>
              {status === "error" && (
                <Pressable accessibilityRole="button" onPress={onRetry} style={({ pressed }) => [styles.retry, pressed && styles.pressed]}>
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              )}
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function ListGap() {
  return <View style={styles.listGap} />;
}

const styles = StyleSheet.create({
  tabletContent: { width: "100%", alignSelf: "center" },
  tabletNavigation: { width: "100%", alignSelf: "center", paddingHorizontal: 24, paddingBottom: 16 },
  tabletNavigationTitle: { fontSize: 24 },
  overview: { gap: 16 },
  overviewColumns: { flexDirection: "row" },
  overviewColumn: { flex: 1, justifyContent: "center" },
  answerColumns: { justifyContent: "space-between" },
  answerColumn: { width: "49%" },
  tabletTitle: { fontSize: 32 },
  tabletBody: { fontSize: 16 },
  tabletStatValue: { fontSize: 28 },
  tabletFilter: { minHeight: 56, paddingVertical: 10 },
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: 24, paddingBottom: 28 },
  headerContent: { gap: 16, paddingBottom: 16 },
  navigation: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  back: { width: 44, height: 44, borderRadius: 16, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  navigationTitle: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 20 },
  navigationBalance: { width: 44 },
  hero: { alignItems: "center", borderWidth: 1, borderRadius: 26, paddingHorizontal: 18, paddingVertical: 22 },
  symbol: { width: 48, height: 48, borderRadius: 17, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  symbolText: { color: COLORS.card, fontFamily: "NunitoSans_700Bold", fontSize: 25 },
  eyebrow: { fontFamily: "NunitoSans_700Bold", fontSize: 12, letterSpacing: 1.2 },
  heroTitle: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 27, marginTop: 2 },
  heroMeta: { color: COLORS.secondary, fontFamily: "NunitoSans_600SemiBold", fontSize: 13, textAlign: "center", marginTop: 4 },
  summary: { flexDirection: "row", flexWrap: "wrap", backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 22, paddingVertical: 8 },
  stat: { width: "50%", alignItems: "center", paddingVertical: 12, paddingHorizontal: 6 },
  statValue: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 21 },
  statLabel: { color: COLORS.secondary, fontFamily: "NunitoSans_600SemiBold", fontSize: 12, marginTop: 2 },
  filters: { flexDirection: "row", gap: 8 },
  filter: { flex: 1, minHeight: 46, alignItems: "center", justifyContent: "center", borderRadius: 15, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card, paddingHorizontal: 8 },
  filterText: { color: COLORS.secondary, fontFamily: "NunitoSans_700Bold", fontSize: 13, textAlign: "center" },
  selectedFilterText: { color: COLORS.card },
  listGap: { height: 10 },
  empty: { alignItems: "center", backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 22, padding: 24, gap: 8 },
  emptyTitle: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 22, textAlign: "center" },
  emptyBody: { color: COLORS.secondary, fontFamily: "NunitoSans_600SemiBold", fontSize: 14, lineHeight: 21, textAlign: "center" },
  viewAll: { minHeight: 46, borderRadius: 15, alignItems: "center", justifyContent: "center", paddingHorizontal: 20, marginTop: 6 },
  viewAllText: { color: COLORS.card, fontFamily: "NunitoSans_700Bold", fontSize: 14 },
  stateContent: { flex: 1, paddingHorizontal: 24 },
  stateCard: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 24 },
  retry: { minHeight: 48, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  retryText: { color: COLORS.card, fontFamily: "NunitoSans_700Bold", fontSize: 15 },
  pressed: { opacity: 0.75 },
});
