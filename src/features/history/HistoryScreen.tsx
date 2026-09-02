import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, SectionList, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTabBarLayout } from "@/components/navigation/tabBarLayout";
import { SPRINT_MODE_DETAILS } from "@/config/sprintModeDetails";
import { SPRINT_MODES, type SprintMode } from "@/domain/sprint";
import { COLORS } from "@/theme/tokens";
import { HistoryCard } from "./components/HistoryCard";
import { groupHistory } from "./historySections";
import { useHistory } from "./useHistory";
import { getHistoryLayout, historyRows } from "./historyLayout";

const READING_PENGUIN = require("../../../assets/mascot/penguin-reading-book-right.png");
const FILTERS: (SprintMode | undefined)[] = [undefined, ...SPRINT_MODES];

export default function HistoryScreen() {
  const router = useRouter();
  const { contentInset, isIpad } = useTabBarLayout();
  const { width, height, fontScale } = useWindowDimensions();
  const { columns, maxWidth } = getHistoryLayout(isIpad, width, height, fontScale);
  const [mode, setMode] = useState<SprintMode>();
  const history = useHistory(mode);
  const sections = historyRows(groupHistory(history.records), columns);

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.screen}>
      <StatusBar style="dark" />
      <View style={[styles.fixedHeader, isIpad && [styles.tabletContainer, { maxWidth }]]}>
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text accessibilityRole="header" style={[styles.title, isIpad && styles.tabletTitle]}>History</Text>
                <Text style={[styles.subtitle, isIpad && styles.tabletSubtitle]}>A little practice.{"\n"}A lot of progress.</Text>
              </View>
              <Image accessible={false} source={READING_PENGUIN} contentFit="contain" style={[styles.mascot, isIpad && styles.tabletMascot]} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
              {FILTERS.map((filter) => (
                <Pressable
                  key={filter ?? "all"}
                  accessibilityRole="button"
                  accessibilityState={{ selected: filter === mode }}
                  onPress={() => setMode(filter)}
                  style={({ pressed }) => [styles.filter, isIpad && styles.tabletFilter, filter === mode && styles.selectedFilter, pressed && styles.pressed]}
                >
                  <Text style={[styles.filterText, isIpad && styles.tabletFilterText, filter === mode && styles.selectedText]}>{filter ? SPRINT_MODE_DETAILS[filter].title : "All"}</Text>
                </Pressable>
              ))}
            </ScrollView>
      </View>
      <SectionList
        // Reset only the results scroll position; the header and pills stay mounted.
        key={mode ?? "all"}
        style={styles.results}
        sections={sections}
        keyExtractor={(row) => row[0].id}
        renderItem={({ item }) => (
          <View style={[styles.cardRow, columns === 2 && styles.twoColumns]}>
            {item.map((record) => (
              <View key={record.id} style={styles.cardCell}>
                <HistoryCard
                  record={record}
                  tablet={isIpad}
                  onPress={() => router.push({
                    pathname: "/history/[sprintId]",
                    params: { sprintId: record.id },
                  })}
                />
              </View>
            ))}
            {columns === 2 && item.length === 1 && <View style={styles.cardCell} />}
          </View>
        )}
        renderSectionHeader={({ section }) => <Text accessibilityRole="header" style={[styles.day, isIpad && styles.tabletDay]}>{section.title}</Text>}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={[styles.content, isIpad && [styles.tabletContainer, { maxWidth }], { paddingBottom: contentInset }]}
        showsVerticalScrollIndicator={isIpad}
        refreshing={history.status === "loading"}
        onRefresh={history.refresh}
        ListEmptyComponent={
          <View style={styles.state}>
            {history.status === "loading" ? (
              <><ActivityIndicator color={COLORS.primary} /><Text style={styles.stateBody}>Loading your sprints…</Text></>
            ) : history.status === "error" ? (
              <><Text style={styles.stateTitle}>Couldn’t load your history</Text><Text style={styles.stateBody}>Your saved sprints haven’t been changed. Please try again.</Text><Action label="Retry" onPress={history.refresh} /></>
            ) : (
              <>
                <Text style={styles.stateTitle}>{mode ? "No sprints here yet" : "Your story starts with a sprint."}</Text>
                <Text style={styles.stateBody}>{mode ? `Finish your first ${SPRINT_MODE_DETAILS[mode].title.toLowerCase()} sprint and it’ll appear here.` : "Pick a mode, give it a go, and watch your practice add up."}</Text>
                <Action
                  label={mode ? "Show all sprints" : "Pick a sprint"}
                  onPress={() => mode ? setMode(undefined) : router.navigate("/")}
                  separated
                />
              </>
            )}
          </View>
        }
        ListFooterComponent={history.records.length > 0 ? (
          <View style={styles.footer}>
            {history.loadingMore ? <ActivityIndicator color={COLORS.primary} />
              : history.moreError ? <><Text style={styles.stateBody}>Couldn’t load more sprints.</Text><Action label="Retry" onPress={history.loadMore} /></>
                : history.hasMore ? <Action label="Load more sprints" onPress={history.loadMore} />
                  : <Text style={styles.stateBody}>Every sprint is a step forward.</Text>}
          </View>
        ) : null}
      />
    </SafeAreaView>
  );
}

function Action({ label, onPress, separated = false }: { label: string; onPress: () => void; separated?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.action, separated && styles.separatedAction, pressed && styles.pressed]}><Text style={styles.actionText}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  fixedHeader: { paddingHorizontal: 24, paddingTop: 18 },
  tabletContainer: { width: "100%", alignSelf: "center", paddingHorizontal: 32 },
  tabletTitle: { fontSize: 40 },
  tabletSubtitle: { fontSize: 19, lineHeight: 26 },
  tabletMascot: { width: 140, height: 150 },
  tabletFilter: { minHeight: 50, paddingHorizontal: 20 },
  tabletFilterText: { fontSize: 16 },
  tabletDay: { fontSize: 17, marginTop: 20, marginBottom: 14 },
  cardRow: { flexDirection: "row" },
  twoColumns: { gap: 20, alignItems: "stretch" },
  cardCell: { flex: 1, minWidth: 0 },
  results: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24 },
  header: { flexDirection: "row", alignItems: "center", minHeight: 132, gap: 8, marginBottom: 18 },
  headerText: { flex: 1 },
  title: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 34 },
  subtitle: { color: COLORS.secondary, fontFamily: "NunitoSans_600SemiBold", fontSize: 15, lineHeight: 20, marginTop: 2 },
  mascot: { width: 112, height: 132 },
  filters: { gap: 8, paddingBottom: 10 },
  filter: { minHeight: 44, justifyContent: "center", paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card },
  selectedFilter: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { color: COLORS.secondary, fontFamily: "NunitoSans_700Bold", fontSize: 14 },
  selectedText: { color: COLORS.card },
  day: { color: COLORS.secondary, fontFamily: "NunitoSans_700Bold", fontSize: 14, marginTop: 16, marginBottom: 12 },
  state: { alignItems: "center", paddingVertical: 28, gap: 8 },
  stateTitle: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 23, textAlign: "center" },
  stateBody: { color: COLORS.secondary, fontFamily: "NunitoSans_600SemiBold", fontSize: 14, lineHeight: 21, textAlign: "center" },
  action: { minHeight: 48, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  separatedAction: { marginTop: 6 },
  actionText: { color: COLORS.card, fontFamily: "NunitoSans_700Bold", fontSize: 15 },
  footer: { alignItems: "center", gap: 12, paddingVertical: 18 },
  pressed: { opacity: 0.75 },
});
