import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import type { PropsWithChildren } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CARD_SHADOW, COLORS } from "@/theme/tokens";
import { usePracticeStreak } from "./usePracticeStreak";
import { streakEncouragement, streakMascotState } from "./streakPresentation";
import { getStreakLayout } from "./streakLayout";

const CELEBRATING_PENGUIN = require("../../../assets/mascot/penguin-jumping-celebration-confetti.png");
const SLEEPING_PENGUIN = require("../../../assets/mascot/penguin-sleeping-z-running-shoes.png");

export default function StreakScreen() {
  const router = useRouter();
  const { width, height, fontScale } = useWindowDimensions();
  const { tablet, twoColumn, maxWidth } = getStreakLayout(width, height, Platform.OS, fontScale);
  const streak = usePracticeStreak();
  const encouragement = streak.status === "ready" && (
    <View style={styles.encouragement}>
      <Image
        accessible={false}
        source={streakMascotState(streak.data) === "celebrating" ? CELEBRATING_PENGUIN : SLEEPING_PENGUIN}
        contentFit="contain"
        style={[styles.mascot, !streak.data.practicedToday && styles.sleepingMascot, tablet && styles.tabletMascot, twoColumn && styles.landscapeMascot]}
      />
      <View style={styles.message}><Text style={[styles.messageText, tablet && styles.tabletBody]}>{streakEncouragement(streak.data)}</Text></View>
    </View>
  );
  const practiceButton = (
    <Pressable accessibilityRole="button" onPress={() => router.dismissTo("/")} style={({ pressed }) => [styles.button, tablet && styles.tabletButton, twoColumn && styles.landscapeButton, pressed && styles.pressed]}>
      <Text style={[styles.buttonText, tablet && styles.tabletButtonText]}>Practice now</Text>
    </Pressable>
  );
  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      <ScrollView bounces={!twoColumn} alwaysBounceVertical={!twoColumn} contentContainerStyle={[styles.content, { maxWidth }, tablet && styles.tabletContent]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.canGoBack() ? router.back() : router.replace("/")} style={styles.back}>
            <SymbolView name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }} size={22} tintColor={COLORS.ink} />
          </Pressable>
          <Text accessibilityRole="header" style={[styles.title, tablet && styles.tabletTitle]}>Practice streak</Text>
          <View style={styles.headerSpacer} />
        </View>

        {streak.status === "loading" ? (
          <View style={styles.state}><ActivityIndicator color={COLORS.primary} /><Text style={[styles.body, tablet && styles.tabletBody]}>Loading your practice days…</Text></View>
        ) : streak.status === "error" ? (
          <View style={styles.state}>
            <Text style={[styles.sectionTitle, tablet && styles.tabletSectionTitle]}>Couldn’t load your streak</Text>
            <Text style={[styles.body, tablet && styles.tabletBody]}>Your saved sprints haven’t been changed.</Text>
            <Pressable accessibilityRole="button" onPress={streak.retry} style={styles.button}><Text style={styles.buttonText}>Try again</Text></Pressable>
          </View>
        ) : (
          <View style={[styles.main, twoColumn && styles.columns]}>
            <View style={twoColumn && styles.heroColumn}>
            <View style={styles.hero}>
              <View style={[styles.flameCircle, tablet && styles.tabletFlame]}>
                <SymbolView name={{ ios: "flame.fill", android: "local_fire_department", web: "local_fire_department" }} size={tablet ? 90 : 74} tintColor={COLORS.orange} />
              </View>
              <Text style={[styles.count, tablet && styles.tabletCount]}>{streak.data.currentStreak}</Text>
              <Text style={[styles.countLabel, tablet && styles.tabletSectionTitle]}>day streak</Text>
              <Text style={[styles.body, tablet && styles.tabletBody]}>Small steps. Every day.</Text>
            </View>
            {twoColumn && encouragement}
            </View>

            <View style={[styles.details, twoColumn && styles.detailsColumn]}>
            <View style={[styles.card, CARD_SHADOW, tablet && styles.tabletCard]}>
              <Text accessibilityRole="header" style={[styles.sectionTitle, tablet && styles.tabletSectionTitle]}>This week</Text>
              <WeekRow tablet={tablet}>
                {streak.data.week.map((day) => (
                  <View key={day.key} accessible accessibilityLabel={`${day.date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}${day.isToday ? ", today" : ""}, ${day.practiced ? "practiced" : day.isFuture ? "upcoming" : "not practiced"}`} style={styles.day}>
                    <Text style={[styles.weekday, tablet && styles.tabletWeekday, day.isToday && styles.todayText]}>{day.date.toLocaleDateString(undefined, { weekday: "short" })}</Text>
                    <View style={[styles.marker, tablet && { minWidth: 44 * fontScale, maxWidth: 44 * fontScale }, day.isToday && styles.todayMarker, day.practiced && styles.practicedMarker]}>
                      {day.practiced ? <SymbolView name={{ ios: "checkmark", android: "check", web: "check" }} size={tablet ? 22 : 17} tintColor={COLORS.card} /> : <Text style={[styles.date, tablet && styles.tabletWeekday]}>{day.date.getDate()}</Text>}
                    </View>
                    <View style={[styles.todayDot, !day.isToday && styles.invisible]} />
                  </View>
                ))}
              </WeekRow>
              <Text style={[styles.caption, tablet && styles.tabletCaption]}>One completed sprint makes a practice day.</Text>
            </View>

            <View style={styles.stats}>
              <Stat tablet={tablet} value={streak.data.longestStreak} label="Longest streak" />
              <Stat tablet={tablet} value={streak.data.totalPracticeDays} label="Total practice days" />
            </View>
            {!twoColumn && encouragement}
            <Text style={[styles.caption, tablet && styles.tabletCaption]}>Finish a sprint each day to build your streak. A missed day starts a fresh one.</Text>
            {twoColumn && practiceButton}
            </View>
          </View>
        )}
        {(!twoColumn || streak.status !== "ready") && practiceButton}
      </ScrollView>
    </SafeAreaView>
  );
}

function WeekRow({ tablet, children }: PropsWithChildren<{ tablet: boolean }>) {
  // Keep all seven days readable when accessibility text exceeds the available width.
  return tablet
    ? <ScrollView horizontal contentContainerStyle={[styles.week, styles.tabletWeek]}>{children}</ScrollView>
    : <View style={styles.week}>{children}</View>;
}

function Stat({ value, label, tablet = false }: { value: number; label: string; tablet?: boolean }) {
  return <View style={[styles.stat, CARD_SHADOW]}><Text style={[styles.statValue, tablet && styles.tabletStatValue]}>{value}</Text><Text style={[styles.caption, tablet && styles.tabletCaption]}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  tabletContent: { paddingHorizontal: 32, paddingTop: 20, gap: 28 },
  main: { gap: 20 },
  columns: { flexDirection: "row", alignItems: "center", gap: 32, flexGrow: 1 },
  heroColumn: { flex: 1, gap: 20 },
  landscapeMascot: { width: 112, height: 130 },
  landscapeButton: { maxWidth: "100%" },
  details: { gap: 20 },
  detailsColumn: { flex: 1.5, minWidth: 0 },
  tabletTitle: { fontSize: 28 },
  tabletFlame: { width: 140, height: 140, borderRadius: 70 },
  tabletCount: { fontSize: 80, lineHeight: 96 },
  tabletSectionTitle: { fontSize: 24 },
  tabletBody: { fontSize: 18, lineHeight: 27 },
  tabletCaption: { fontSize: 16, lineHeight: 24 },
  tabletWeekday: { fontSize: 15 },
  tabletWeek: { flexGrow: 1 },
  tabletCard: { padding: 22 },
  tabletStatValue: { fontSize: 36 },
  tabletMascot: { width: 148, height: 164 },
  tabletButton: { width: "100%", maxWidth: 420, alignSelf: "center", minHeight: 64 },
  tabletButtonText: { fontSize: 21 },
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24, gap: 20, maxWidth: 520, width: "100%", alignSelf: "center" },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  back: { width: 44, height: 44, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card, alignItems: "center", justifyContent: "center" },
  headerSpacer: { width: 44 },
  title: { flex: 1, textAlign: "center", fontFamily: "NunitoSans_700Bold", fontSize: 22, color: COLORS.ink },
  hero: { alignItems: "center", gap: 4, paddingVertical: 4 },
  flameCircle: { width: 112, height: 112, borderRadius: 56, backgroundColor: COLORS.orangeSoft, alignItems: "center", justifyContent: "center" },
  count: { fontFamily: "NunitoSans_700Bold", color: COLORS.ink, fontSize: 64, lineHeight: 76, fontVariant: ["tabular-nums"] },
  countLabel: { fontFamily: "NunitoSans_700Bold", color: COLORS.orange, fontSize: 21, marginTop: -4, marginBottom: 4 },
  body: { fontFamily: "NunitoSans_600SemiBold", color: COLORS.secondary, fontSize: 15, lineHeight: 22, textAlign: "center" },
  card: { borderRadius: 24, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card, padding: 16, gap: 16 },
  sectionTitle: { fontFamily: "NunitoSans_700Bold", color: COLORS.ink, fontSize: 18 },
  week: { flexDirection: "row", gap: 4 },
  day: { flex: 1, alignItems: "center", gap: 8 },
  weekday: { fontFamily: "NunitoSans_700Bold", fontSize: 11, color: COLORS.secondary },
  marker: { width: "100%", maxWidth: 36, aspectRatio: 1, borderRadius: 30, backgroundColor: COLORS.background, borderWidth: 1.5, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  todayMarker: { borderColor: COLORS.orange },
  practicedMarker: { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
  todayText: { color: COLORS.orange },
  date: { fontFamily: "NunitoSans_700Bold", fontSize: 12, color: COLORS.secondary },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.orange },
  invisible: { opacity: 0 },
  caption: { fontFamily: "NunitoSans_600SemiBold", color: COLORS.secondary, fontSize: 12, lineHeight: 18, textAlign: "center" },
  stats: { flexDirection: "row", gap: 12 },
  stat: { flex: 1, borderRadius: 22, padding: 16, gap: 4, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card, justifyContent: "center" },
  statValue: { fontFamily: "NunitoSans_700Bold", fontSize: 28, color: COLORS.primary, textAlign: "center" },
  encouragement: { flexDirection: "row", alignItems: "center", gap: 12 },
  mascot: { width: 108, height: 138 },
  sleepingMascot: { width: 120, height: 108 },
  message: { flex: 1, borderRadius: 22, backgroundColor: COLORS.card, padding: 16 },
  messageText: { fontFamily: "NunitoSans_700Bold", fontSize: 15, lineHeight: 22, color: COLORS.ink, textAlign: "center" },
  button: { backgroundColor: COLORS.primary, minHeight: 54, paddingHorizontal: 22, paddingVertical: 14, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  buttonText: { fontFamily: "NunitoSans_700Bold", color: COLORS.card, fontSize: 17 },
  pressed: { opacity: 0.8 },
  state: { flex: 1, paddingVertical: 50, gap: 18, alignItems: "center" },
});
