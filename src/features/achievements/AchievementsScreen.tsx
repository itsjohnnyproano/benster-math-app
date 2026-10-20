import { Image, type ImageRef } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTabBarLayout } from "@/components/navigation/tabBarLayout";
import { ACHIEVEMENTS, ACHIEVEMENT_GROUPS, type AchievementGroupId, type AchievementId, type AchievementProgress } from "@/domain/achievements";
import { usePreferences } from "@/providers/PreferencesProvider";
import { useAnimatedValue } from "@/shared/useAnimatedValue";
import { CARD_SHADOW, COLORS } from "@/theme/tokens";
import { achievementColumns, achievementDetailModalWidth } from "./achievementsLayout";
import { useAchievements } from "./useAchievements";

const BADGES: Record<AchievementId, number> = {
  "first-step": require("../../../assets/badges/achievement-01-first-step.png"),
  "back-again": require("../../../assets/badges/achievement-02-back-again.png"),
  "triple-threat": require("../../../assets/badges/achievement-03-triple-threat.png"),
  "high-five": require("../../../assets/badges/achievement-04-high-five.png"),
  "perfect-week": require("../../../assets/badges/achievement-05-perfect-week.png"),
  "first-sprint": require("../../../assets/badges/achievement-06-first-sprint.png"),
  "getting-started": require("../../../assets/badges/achievement-07-getting-started.png"),
  "sprint-explorer": require("../../../assets/badges/achievement-08-sprint-explorer.png"),
  "sprint-star": require("../../../assets/badges/achievement-09-sprint-star.png"),
  "sprint-champion": require("../../../assets/badges/achievement-10-sprint-champion.png"),
  "first-perfect": require("../../../assets/badges/achievement-11-first-perfect.png"),
  "perfect-pair": require("../../../assets/badges/achievement-12-perfect-pair.png"),
  "triple-perfect": require("../../../assets/badges/achievement-13-triple-perfect.png"),
  "sharp-shooter": require("../../../assets/badges/achievement-14-sharp-shooter.png"),
  "math-lightning": require("../../../assets/badges/achievement-15-math-lightning.png"),
  "addition-ace": require("../../../assets/badges/achievement-16-addition-ace.png"),
  "subtraction-star": require("../../../assets/badges/achievement-17-subtraction-star.png"),
  "multiplication-master": require("../../../assets/badges/achievement-18-multiplication-master.png"),
  "mix-it-up": require("../../../assets/badges/achievement-19-mix-it-up.png"),
  "math-explorer": require("../../../assets/badges/achievement-20-math-explorer.png"),
  "five-minute-hero": require("../../../assets/badges/achievement-21-five-minute-hero.png"),
  "ten-minute-thinker": require("../../../assets/badges/achievement-22-ten-minute-thinker.png"),
  "comeback-kid": require("../../../assets/badges/achievement-23-comeback-kid.png"),
  "personal-best": require("../../../assets/badges/achievement-24-personal-best.png"),
  "hundred-correct": require("../../../assets/badges/achievement-25-hundred-correct.png"),
  "ten-day-trail": require("../../../assets/badges/achievement-26-ten-day-trail.png"),
  "two-week-rhythm": require("../../../assets/badges/achievement-27-two-week-rhythm.png"),
  "three-week-focus": require("../../../assets/badges/achievement-28-three-week-focus.png"),
  "monthly-momentum": require("../../../assets/badges/achievement-29-monthly-momentum.png"),
  "weekend-warrior": require("../../../assets/badges/achievement-30-weekend-warrior.png"),
  "daily-double": require("../../../assets/badges/achievement-31-daily-double.png"),
  "daily-triple": require("../../../assets/badges/achievement-32-daily-triple.png"),
  "five-a-day": require("../../../assets/badges/achievement-33-five-a-day.png"),
  "steady-starter": require("../../../assets/badges/achievement-34-steady-starter.png"),
  "habit-builder": require("../../../assets/badges/achievement-35-habit-builder.png"),
  "sprint-veteran": require("../../../assets/badges/achievement-36-sprint-veteran.png"),
  "century-sprinter": require("../../../assets/badges/achievement-37-century-sprinter.png"),
  "sprint-legend": require("../../../assets/badges/achievement-38-sprint-legend.png"),
  "sprint-elite": require("../../../assets/badges/achievement-39-sprint-elite.png"),
  "sprint-hall-of-fame": require("../../../assets/badges/achievement-40-sprint-hall-of-fame.png"),
};

type BadgeSource = number | ImageRef;
const BADGE_IMAGE_PROPS = {
  cachePolicy: "memory-disk" as const,
  enforceEarlyResizing: true,
  loading: "eager" as const,
  transition: null,
};

export default function AchievementsScreen() {
  const router = useRouter();
  const { activeLearner } = usePreferences();
  const { coveredTabBarInset, isIpad } = useTabBarLayout();
  const { width, height, fontScale } = useWindowDimensions();
  const columns = achievementColumns(isIpad, width, height, fontScale);
  const detailModalWidth = achievementDetailModalWidth(isIpad, width, height);
  const achievements = useAchievements(activeLearner.id);
  const [selectedGroupId, setSelectedGroupId] = useState<AchievementGroupId | null>(null);
  const [selected, setSelected] = useState<AchievementProgress | null>(null);
  const reduceMotionEnabled = useReduceMotionEnabled();
  const { sourceFor, preload } = useBadgePreloads();
  const selectedGroup = ACHIEVEMENT_GROUPS.find((group) => group.id === selectedGroupId);
  const preloadGroup = useCallback((group: AchievementGroupId) => {
    preload(ACHIEVEMENTS.filter((achievement) => achievement.group === group).map((achievement) => achievement.id));
  }, [preload]);
  const openGroup = (group: AchievementGroupId) => {
    // A press begins decoding only the next visible group; do not compete with
    // the initial screen by eagerly decoding the entire 40-badge catalogue.
    preloadGroup(group);
    setSelectedGroupId(group);
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={[styles.content, isIpad && styles.tabletContent, { paddingBottom: coveredTabBarInset }]} showsVerticalScrollIndicator={isIpad}>
        {selectedGroup ? <GroupHeader group={selectedGroup} onBack={() => setSelectedGroupId(null)} /> : <>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text accessibilityRole="header" style={[styles.title, isIpad && styles.tabletTitle]}>Achievements</Text>
              <Text style={[styles.subtitle, isIpad && styles.tabletSubtitle]}>Every sprint tells a story.</Text>
            </View>
            {achievements.status === "ready" && <View style={styles.countPill}><Text style={styles.countText}>{achievements.data.filter((item) => item.earnedAtMs !== null).length} / {ACHIEVEMENTS.length}</Text></View>}
          </View>

          <Pressable accessibilityRole="button" accessibilityLabel="Open practice streak" onPress={() => router.push("/streak")} style={({ pressed }) => [styles.streakPill, pressed && styles.pressed]}>
            <SymbolView name={{ ios: "flame.fill", android: "local_fire_department", web: "local_fire_department" }} size={19} tintColor={COLORS.orange} />
            <Text style={styles.streakText}>Practice streak</Text>
            <SymbolView name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }} size={18} tintColor={COLORS.secondary} />
          </Pressable>
        </>}

        {achievements.status === "loading" && <State icon="hourglass" title="Loading your badges…" body="Checking your practice on this device." />}
        {achievements.status === "error" && <State icon="exclamationmark.circle" title="Couldn’t load achievements" body="Your saved sprints haven’t been changed." actionLabel="Try again" onAction={achievements.retry} />}
        {achievements.status === "ready" && (selectedGroup
          ? <GroupBadges achievements={achievements.data.filter((achievement) => achievement.group === selectedGroup.id)} columns={columns} onSelect={setSelected} reduceMotionEnabled={reduceMotionEnabled} sourceFor={sourceFor} />
          : <AchievementGroupCards achievements={achievements.data} columns={columns} onSelect={openGroup} onPreload={preloadGroup} sourceFor={sourceFor} />)}
      </ScrollView>
      <AchievementDetail achievement={selected} onClose={() => setSelected(null)} reduceMotionEnabled={reduceMotionEnabled} sourceFor={sourceFor} width={detailModalWidth} />
    </SafeAreaView>
  );
}

function useBadgePreloads() {
  const [loaded, setLoaded] = useState<Partial<Record<AchievementId, ImageRef>>>({});
  const queued = useRef(new Set<AchievementId>());
  const active = useRef(true);

  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

  const preload = useCallback((ids: readonly AchievementId[]) => {
    const missing = ids.filter((id) => !queued.current.has(id));
    if (missing.length === 0) return;
    missing.forEach((id) => queued.current.add(id));
    void Promise.allSettled(missing.map(async (id) => [id, await Image.loadAsync(BADGES[id], { maxWidth: 512, maxHeight: 512 })] as const))
      .then((results) => {
        const entries = results.flatMap((result, index) => {
          if (result.status === "fulfilled") return [result.value];
          queued.current.delete(missing[index]);
          return [];
        });
        if (active.current && entries.length > 0) setLoaded((current) => ({ ...current, ...Object.fromEntries(entries) }));
      });
  }, []);

  return { preload, sourceFor: (id: AchievementId): BadgeSource => loaded[id] ?? BADGES[id] };
}

function GroupHeader({ group, onBack }: { group: (typeof ACHIEVEMENT_GROUPS)[number]; onBack: () => void }) {
  return <View style={styles.detailHeader}>
    <View style={styles.detailBackRow}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back to achievement groups" onPress={onBack} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
        <SymbolView name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }} size={22} tintColor={COLORS.ink} />
      </Pressable>
      <Text style={styles.backText}>Groups</Text>
    </View>
    <Text accessibilityRole="header" style={styles.detailHeaderTitle}>{group.title}</Text>
    <Text style={styles.detailHeaderSubtitle}>{group.subtitle}</Text>
  </View>;
}

function AchievementGroupCards({ achievements, columns, onSelect, onPreload, sourceFor }: { achievements: AchievementProgress[]; columns: number; onSelect: (group: AchievementGroupId) => void; onPreload: (group: AchievementGroupId) => void; sourceFor: (id: AchievementId) => BadgeSource }) {
  const groupColumns = columns > 2 ? 3 : 2;
  return <>
    <View style={[styles.goForIt, CARD_SHADOW]}>
      <Text style={styles.sectionTitle}>Your badge collection</Text>
      <Text style={styles.sectionBody}>Choose a group to see every badge you can earn.</Text>
    </View>
    <View style={styles.groupCards}>
      {ACHIEVEMENT_GROUPS.map((group) => {
        const groupAchievements = achievements.filter((achievement) => achievement.group === group.id);
        return <AchievementGroupCard key={group.id} group={group} achievements={groupAchievements} columns={groupColumns} onPress={() => onSelect(group.id)} onPressIn={() => onPreload(group.id)} sourceFor={sourceFor} />;
      })}
    </View>
  </>;
}

function AchievementGroupCard({ group, achievements, columns, onPress, onPressIn, sourceFor }: { group: (typeof ACHIEVEMENT_GROUPS)[number]; achievements: AchievementProgress[]; columns: number; onPress: () => void; onPressIn: () => void; sourceFor: (id: AchievementId) => BadgeSource }) {
  const earned = achievements.filter((achievement) => achievement.earnedAtMs !== null).length;
  return <View style={{ width: `${100 / columns}%`, paddingHorizontal: 5 }}>
    <Pressable accessibilityRole="button" accessibilityLabel={`${group.title}, ${earned} of ${achievements.length} badges earned`} onPress={onPress} onPressIn={onPressIn} style={({ pressed }) => [styles.groupCard, CARD_SHADOW, pressed && styles.pressed]}>
      <Text style={styles.groupCardTitle}>{group.title}</Text>
      <Text numberOfLines={2} style={styles.groupCardSubtitle}>{group.subtitle}</Text>
      <View style={styles.badgePreview}>
        {achievements.slice(0, 3).map((achievement, index) => <Image key={achievement.id} source={sourceFor(achievement.id)} contentFit="contain" {...BADGE_IMAGE_PROPS} style={[styles.previewBadge, { marginLeft: index === 0 ? 0 : -25 }, achievement.earnedAtMs === null && styles.lockedBadge]} />)}
      </View>
      <View style={styles.groupCardFooter}>
        <Text style={styles.groupCardCount}>{earned} of {achievements.length}</Text>
        <Text style={styles.showAll}>Show all</Text>
      </View>
    </Pressable>
  </View>;
}

function GroupBadges({ achievements, columns, onSelect, reduceMotionEnabled, sourceFor }: { achievements: AchievementProgress[]; columns: number; onSelect: (achievement: AchievementProgress) => void; reduceMotionEnabled: boolean; sourceFor: (id: AchievementId) => BadgeSource }) {
  const earned = achievements.filter((achievement) => achievement.earnedAtMs !== null).length;
  return <>
    <Text style={styles.groupProgress}>{earned} of {achievements.length} badges earned</Text>
    <View style={[styles.grid, columns > 2 && styles.wideGrid]}>
      {achievements.map((achievement) => <AchievementTile achievement={achievement} columns={columns} key={achievement.id} onPress={() => onSelect(achievement)} reduceMotionEnabled={reduceMotionEnabled} sourceFor={sourceFor} />)}
    </View>
  </>;
}

function useReduceMotionEnabled() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (active) setEnabled(value); }).catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setEnabled);
    return () => { active = false; subscription.remove(); };
  }, []);
  return enabled;
}

function useBadgePressAnimation(reduceMotionEnabled: boolean) {
  const scale = useAnimatedValue(1);
  const rotation = useAnimatedValue(0);
  const lift = useAnimatedValue(0);

  const play = useCallback(() => {
    if (reduceMotionEnabled) return;
    scale.stopAnimation();
    rotation.stopAnimation();
    lift.stopAnimation();
    scale.setValue(1);
    rotation.setValue(0);
    lift.setValue(0);
    Animated.parallel([
      Animated.sequence([
        Animated.timing(scale, { toValue: 0.86, duration: 85, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1.18, useNativeDriver: true, speed: 22, bounciness: 14 }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 16, bounciness: 8 }),
      ]),
      Animated.sequence([
        Animated.timing(rotation, { toValue: -1, duration: 85, useNativeDriver: true }),
        Animated.timing(rotation, { toValue: 1, duration: 125, useNativeDriver: true }),
        Animated.timing(rotation, { toValue: -0.55, duration: 115, useNativeDriver: true }),
        Animated.timing(rotation, { toValue: 0, duration: 135, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(lift, { toValue: -8, duration: 85, useNativeDriver: true }),
        Animated.spring(lift, { toValue: 0, useNativeDriver: true, speed: 16, bounciness: 8 }),
      ]),
    ]).start();
  }, [lift, reduceMotionEnabled, rotation, scale]);

  return {
    play,
    style: {
      transform: [
        { translateY: lift },
        { scale },
        { rotate: rotation.interpolate({ inputRange: [-1, 0, 1], outputRange: ["-8deg", "0deg", "8deg"] }) },
      ],
    },
  };
}

function AchievementTile({ achievement, columns, onPress, reduceMotionEnabled, sourceFor }: { achievement: AchievementProgress; columns: number; onPress: () => void; reduceMotionEnabled: boolean; sourceFor: (id: AchievementId) => BadgeSource }) {
  const badgeAnimation = useBadgePressAnimation(reduceMotionEnabled);
  const earned = achievement.earnedAtMs !== null;
  const progress = Math.min(achievement.current / achievement.target, 1);
  const badgeSize = columns >= 4 ? 112 : columns === 3 ? 126 : 136;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${achievement.title}. ${earned ? `Earned ${formatDate(achievement.earnedAtMs)}` : progressText(achievement)}`}
      onPress={onPress}
      onPressIn={badgeAnimation.play}
      style={({ pressed }) => [styles.tile, { width: `${100 / columns}%` }, pressed && styles.tilePressed]}
    >
      <Animated.View style={badgeAnimation.style}>
        <Image source={sourceFor(achievement.id)} contentFit="contain" {...BADGE_IMAGE_PROPS} style={[styles.badge, { width: badgeSize, height: badgeSize }, !earned && styles.lockedBadge]} />
      </Animated.View>
      <Text numberOfLines={2} style={[styles.badgeTitle, !earned && styles.lockedText]}>{achievement.title}</Text>
      {earned ? <Text style={styles.earnedText}>{achievement.earnedCount > 1 ? `Earned ${achievement.earnedCount} times` : formatDate(achievement.earnedAtMs)}</Text> : <>
        <Text style={styles.progressText}>{progressText(achievement)}</Text>
        <View style={styles.track}><View style={[styles.fill, { width: `${progress * 100}%` }]} /></View>
      </>}
      {earned && achievement.earnedCount > 1 && <View style={styles.repeatCount}><Text style={styles.repeatText}>{achievement.earnedCount}</Text></View>}
    </Pressable>
  );
}

function AchievementDetail({ achievement, onClose, reduceMotionEnabled, sourceFor, width }: { achievement: AchievementProgress | null; onClose: () => void; reduceMotionEnabled: boolean; sourceFor: (id: AchievementId) => BadgeSource; width?: number }) {
  const badgeAnimation = useBadgePressAnimation(reduceMotionEnabled);
  if (!achievement) return null;
  const earned = achievement.earnedAtMs !== null;
  return (
    <Modal animationType="fade" transparent visible onRequestClose={onClose}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close achievement details" onPress={onClose} style={styles.backdrop}>
        <Pressable accessibilityViewIsModal onPress={(event) => event.stopPropagation()} style={[styles.detail, CARD_SHADOW, width !== undefined && { width, alignSelf: "center" }]}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Animate ${achievement.title} badge`} accessibilityHint="Plays the badge animation" hitSlop={12} onPress={badgeAnimation.play}>
            <Animated.View style={badgeAnimation.style}>
              <Image source={sourceFor(achievement.id)} contentFit="contain" {...BADGE_IMAGE_PROPS} style={[styles.detailBadge, !earned && styles.lockedBadge]} />
            </Animated.View>
          </Pressable>
          <Text accessibilityRole="header" style={styles.detailTitle}>{achievement.title}</Text>
          <Text style={styles.detailBody}>{achievement.description}</Text>
          <Text style={styles.detailStatus}>{earned ? `${achievement.earnedCount > 1 ? `Earned ${achievement.earnedCount} times · ` : "Earned "}${formatDate(achievement.earnedAtMs)}` : progressText(achievement)}</Text>
          <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}><Text style={styles.closeText}>Done</Text></Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function State({ icon, title, body, actionLabel, onAction }: { icon: "hourglass" | "exclamationmark.circle"; title: string; body: string; actionLabel?: string; onAction?: () => void }) {
  return <View style={styles.state}><SymbolView name={{ ios: icon === "hourglass" ? "hourglass" : "exclamationmark.circle", android: "error_outline", web: "error_outline" }} size={30} tintColor={COLORS.primary} /><Text style={styles.stateTitle}>{title}</Text><Text style={styles.stateBody}>{body}</Text>{actionLabel && onAction && <Pressable accessibilityRole="button" onPress={onAction} style={styles.retry}><Text style={styles.retryText}>{actionLabel}</Text></Pressable>}</View>;
}

function progressText(achievement: AchievementProgress) {
  const unit = achievement.metric === "minutes" ? "minutes" : achievement.metric === "modes" ? "modes" : achievement.metric === "correct-answers" ? "correct" : achievement.metric === "single-sprint" ? "sprint" : achievement.metric === "personal-bests" ? "personal bests" : achievement.metric === "comebacks" ? "comebacks" : achievement.metric === "mode-sprints" || achievement.metric === "sprints" ? "sprints" : achievement.metric === "perfect-sprints" ? "perfect sprints" : "days";
  return `${Math.min(achievement.current, achievement.target)} of ${achievement.target} ${unit}`;
}

function formatDate(timestamp: number | null) {
  return timestamp === null ? "" : new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: 20, paddingTop: 18, gap: 16 },
  tabletContent: { width: "100%", maxWidth: 980, alignSelf: "center", paddingHorizontal: 32, paddingTop: 24, gap: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerCopy: { flex: 1 },
  title: { fontFamily: "NunitoSans_700Bold", fontSize: 34, color: COLORS.ink },
  tabletTitle: { fontSize: 40 },
  subtitle: { marginTop: 2, fontFamily: "NunitoSans_600SemiBold", fontSize: 15, color: COLORS.secondary },
  tabletSubtitle: { fontSize: 18 },
  countPill: { minWidth: 58, paddingHorizontal: 12, minHeight: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.primarySoft },
  countText: { fontFamily: "NunitoSans_700Bold", fontSize: 13, color: COLORS.primary, fontVariant: ["tabular-nums"] },
  streakPill: { minHeight: 52, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 9 },
  streakText: { flex: 1, fontFamily: "NunitoSans_700Bold", fontSize: 15, color: COLORS.ink },
  detailHeader: { gap: 3, paddingBottom: 4 },
  detailBackRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  backButton: { width: 44, height: 44, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card, alignItems: "center", justifyContent: "center" },
  backText: { fontFamily: "NunitoSans_700Bold", fontSize: 15, color: COLORS.primary },
  detailHeaderTitle: { fontFamily: "NunitoSans_700Bold", fontSize: 30, color: COLORS.ink },
  detailHeaderSubtitle: { fontFamily: "NunitoSans_600SemiBold", fontSize: 15, color: COLORS.secondary },
  goForIt: { borderRadius: 22, padding: 18, backgroundColor: COLORS.primary, gap: 4 },
  sectionTitle: { fontFamily: "NunitoSans_700Bold", fontSize: 20, color: COLORS.card },
  sectionBody: { fontFamily: "NunitoSans_600SemiBold", fontSize: 14, lineHeight: 20, color: "#F0ECFF" },
  groupCards: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -5, rowGap: 10 },
  groupCard: { minHeight: 238, padding: 16, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card, borderRadius: 22, justifyContent: "space-between", overflow: "hidden" },
  groupCardTitle: { fontFamily: "NunitoSans_700Bold", fontSize: 19, lineHeight: 24, color: COLORS.ink },
  groupCardSubtitle: { marginTop: 2, fontFamily: "NunitoSans_600SemiBold", fontSize: 12, lineHeight: 17, color: COLORS.secondary },
  badgePreview: { flexDirection: "row", alignItems: "center", marginTop: 6, minHeight: 92 },
  previewBadge: { width: 88, height: 88 },
  groupCardFooter: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 4, marginTop: 4 },
  groupCardCount: { fontFamily: "NunitoSans_700Bold", fontSize: 12, color: COLORS.secondary, fontVariant: ["tabular-nums"] },
  showAll: { fontFamily: "NunitoSans_700Bold", fontSize: 12, color: COLORS.primary },
  groupProgress: { fontFamily: "NunitoSans_700Bold", fontSize: 14, color: COLORS.secondary, marginTop: -2 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4, rowGap: 18 },
  wideGrid: { rowGap: 22 },
  tile: { alignItems: "center", paddingHorizontal: 4, minHeight: 224, position: "relative" },
  tilePressed: { opacity: 0.82 },
  badge: { marginBottom: 7 },
  // Keep the original artwork recognizable; a muted preview is more motivating
  // than a single-color silhouette because it shows what the learner can earn.
  lockedBadge: { opacity: 0.42 },
  badgeTitle: { minHeight: 36, fontFamily: "NunitoSans_700Bold", fontSize: 14, lineHeight: 18, textAlign: "center", color: COLORS.ink },
  lockedText: { color: COLORS.secondary },
  earnedText: { marginTop: 3, fontFamily: "NunitoSans_600SemiBold", fontSize: 11, lineHeight: 16, color: COLORS.secondary, textAlign: "center" },
  progressText: { marginTop: 3, fontFamily: "NunitoSans_600SemiBold", fontSize: 11, lineHeight: 16, color: COLORS.secondary, textAlign: "center" },
  track: { width: "82%", height: 5, borderRadius: 3, backgroundColor: COLORS.border, overflow: "hidden", marginTop: 7 },
  fill: { height: "100%", borderRadius: 3, backgroundColor: COLORS.primary },
  repeatCount: { position: "absolute", top: 104, right: 18, minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 5, backgroundColor: COLORS.ink, alignItems: "center", justifyContent: "center" },
  repeatText: { fontFamily: "NunitoSans_700Bold", fontSize: 11, color: COLORS.card, fontVariant: ["tabular-nums"] },
  state: { minHeight: 240, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 8 },
  stateTitle: { fontFamily: "NunitoSans_700Bold", color: COLORS.ink, fontSize: 21, textAlign: "center" },
  stateBody: { fontFamily: "NunitoSans_600SemiBold", color: COLORS.secondary, fontSize: 14, lineHeight: 20, textAlign: "center" },
  retry: { minHeight: 44, paddingHorizontal: 18, marginTop: 4, justifyContent: "center" },
  retryText: { fontFamily: "NunitoSans_700Bold", color: COLORS.primary, fontSize: 16 },
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(16,24,39,0.38)", padding: 16, paddingBottom: 36 },
  detail: { borderRadius: 28, backgroundColor: COLORS.card, alignItems: "center", padding: 24, gap: 8 },
  detailBadge: { width: 156, height: 156 },
  detailTitle: { fontFamily: "NunitoSans_700Bold", fontSize: 25, color: COLORS.ink, textAlign: "center" },
  detailBody: { fontFamily: "NunitoSans_600SemiBold", fontSize: 15, lineHeight: 22, color: COLORS.secondary, textAlign: "center", maxWidth: 310 },
  detailStatus: { fontFamily: "NunitoSans_700Bold", fontSize: 14, color: COLORS.primary, textAlign: "center", marginTop: 2 },
  closeButton: { width: "100%", minHeight: 52, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", marginTop: 8 },
  closeText: { fontFamily: "NunitoSans_700Bold", fontSize: 17, color: COLORS.card },
  pressed: { opacity: 0.78 },
});
