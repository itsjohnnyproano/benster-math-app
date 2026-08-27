import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CARD_SHADOW, COLORS } from "@/theme/tokens";
import { usePracticeStreak } from "./usePracticeStreak";
import { streakEncouragement } from "./streakPresentation";

const PENGUIN = require("../../../assets/mascot/penguin-cheering.png");

export default function StreakScreen() {
  const router = useRouter();
  const streak = usePracticeStreak();
  return (
    <SafeAreaView style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.canGoBack() ? router.back() : router.replace("/")} style={styles.back}>
            <SymbolView name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }} size={22} tintColor={COLORS.ink} />
          </Pressable>
          <Text accessibilityRole="header" style={styles.title}>Practice streak</Text>
          <View style={styles.headerSpacer} />
        </View>

        {streak.status === "loading" ? (
          <View style={styles.state}><ActivityIndicator color={COLORS.primary} /><Text style={styles.body}>Loading your practice days…</Text></View>
        ) : streak.status === "error" ? (
          <View style={styles.state}>
            <Text style={styles.sectionTitle}>Couldn’t load your streak</Text>
            <Text style={styles.body}>Your saved sprints haven’t been changed.</Text>
            <Pressable accessibilityRole="button" onPress={streak.retry} style={styles.button}><Text style={styles.buttonText}>Try again</Text></Pressable>
          </View>
        ) : (
          <>
            <View style={styles.hero}>
              <View style={styles.flameCircle}>
                <SymbolView name={{ ios: "flame.fill", android: "local_fire_department", web: "local_fire_department" }} size={74} tintColor={COLORS.orange} />
              </View>
              <Text style={styles.count}>{streak.data.currentStreak}</Text>
              <Text style={styles.countLabel}>day streak</Text>
              <Text style={styles.body}>Small steps. Every day.</Text>
            </View>

            <View style={[styles.card, CARD_SHADOW]}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>This week</Text>
              <View style={styles.week}>
                {streak.data.week.map((day) => (
                  <View key={day.key} accessible accessibilityLabel={`${day.date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}${day.isToday ? ", today" : ""}, ${day.practiced ? "practiced" : day.isFuture ? "upcoming" : "not practiced"}`} style={styles.day}>
                    <Text style={[styles.weekday, day.isToday && styles.todayText]}>{day.date.toLocaleDateString(undefined, { weekday: "short" })}</Text>
                    <View style={[styles.marker, day.isToday && styles.todayMarker, day.practiced && styles.practicedMarker]}>
                      {day.practiced ? <SymbolView name={{ ios: "checkmark", android: "check", web: "check" }} size={17} tintColor={COLORS.card} /> : <Text style={styles.date}>{day.date.getDate()}</Text>}
                    </View>
                    <View style={[styles.todayDot, !day.isToday && styles.invisible]} />
                  </View>
                ))}
              </View>
              <Text style={styles.caption}>One completed sprint makes a practice day.</Text>
            </View>

            <View style={styles.stats}>
              <Stat value={streak.data.longestStreak} label="Longest streak" />
              <Stat value={streak.data.totalPracticeDays} label="Total practice days" />
            </View>
            <View style={styles.encouragement}>
              <Image accessible={false} source={PENGUIN} contentFit="contain" style={styles.mascot} />
              <View style={styles.message}><Text style={styles.messageText}>{streakEncouragement(streak.data)}</Text></View>
            </View>
            <Text style={styles.caption}>Finish a sprint each day to build your streak. A missed day starts a fresh one.</Text>
          </>
        )}
        <Pressable accessibilityRole="button" onPress={() => router.dismissTo("/")} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Text style={styles.buttonText}>Practice now</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return <View style={[styles.stat, CARD_SHADOW]}><Text style={styles.statValue}>{value}</Text><Text style={styles.caption}>{label}</Text></View>;
}

const styles = StyleSheet.create({
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
  message: { flex: 1, borderRadius: 22, backgroundColor: COLORS.card, padding: 16 },
  messageText: { fontFamily: "NunitoSans_700Bold", fontSize: 15, lineHeight: 22, color: COLORS.ink, textAlign: "center" },
  button: { backgroundColor: COLORS.primary, minHeight: 54, paddingHorizontal: 22, paddingVertical: 14, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  buttonText: { fontFamily: "NunitoSans_700Bold", color: COLORS.card, fontSize: 17 },
  pressed: { opacity: 0.8 },
  state: { flex: 1, paddingVertical: 50, gap: 18, alignItems: "center" },
});
