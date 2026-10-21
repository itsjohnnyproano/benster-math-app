import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { SPRINT_MODE_DETAILS } from "@/config/sprintModeDetails";
import {
  createSprint,
  getRemainingMs,
  getSprintMilestone,
  submitAnswer,
  tickSprint,
  type SprintMilestone,
  type SprintState,
} from "@/domain/math-engine";
import { createLocalSprintId } from "@/domain/results";
import { parseFactNumberLimit, parseFactTables, parsePracticeNumberRange } from "@/domain/practiceSelection";
import {
  isCardLayout,
  isInputStyle,
  isSprintMode,
  parseSprintDuration,
  type SprintConfiguration,
} from "@/domain/sprint";
import { SprintResultsScreen } from "@/features/sprint-results/SprintResultsScreen";
import { useAnimatedValue } from "@/shared/useAnimatedValue";
import { getAdaptiveLayout } from "@/shared/responsiveLayout";
import { COLORS } from "@/theme/tokens";
import { usePreferences } from "@/providers/PreferencesProvider";
import { useSubscription } from "@/providers/SubscriptionProvider";

import { CountdownView } from "./components/CountdownView";
import { MultipleChoiceAnswers } from "./components/MultipleChoiceAnswers";
import { NumberPad } from "./components/NumberPad";
import { QuestionCard } from "./components/QuestionCard";
import { SprintHeader } from "./components/SprintHeader";
import { getGameplayLayout, resolveQuestionCardLayout } from "./gameplayLayout";
import { createSprintClock } from "./sprintClock";
import { canStartSprintCountdown, getSprintSubscriptionGate } from "./subscriptionGate";
import type { AnswerFeedback } from "./types";
import { hasPendingFirstResultCelebration } from "@/domain/subscription";

const FEEDBACK_DURATION_MS = 650;
const SPRINT_MILESTONE_DURATION_MS = 1_800;

function readBoolean(value: string | undefined) {
  return value === "true";
}

function useReduceMotionEnabled() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) setEnabled(value);
      })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setEnabled);

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return enabled;
}

export default function SprintPlayScreen() {
  const router = useRouter();
  const [sprintId] = useState(createLocalSprintId);
  const { activeLearner, preferences } = usePreferences();
  const { isPremium, status: subscriptionStatus } = useSubscription();
  const [learnerId] = useState(activeLearner.id);
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);
  const params = useLocalSearchParams<{
    mode?: string;
    durationSeconds?: string;
    inputStyle?: string;
    cardLayout?: string;
    levelUpEnabled?: string;
    range?: string;
    tables?: string;
    factNumberLimit?: string;
  }>();
  const [configuration] = useState<SprintConfiguration>(() => {
    const mode = isSprintMode(params.mode) ? params.mode : "addition";
    const range = parsePracticeNumberRange(params.range);
    const tables = parseFactTables(params.tables);
    const factNumberLimit = parseFactNumberLimit(params.factNumberLimit);
    return Object.freeze({
      mode,
      durationSeconds: parseSprintDuration(params.durationSeconds) ?? 60,
      inputStyle: isInputStyle(params.inputStyle) ? params.inputStyle : "multiple-choice",
      cardLayout: isCardLayout(params.cardLayout) ? params.cardLayout : "horizontal",
      levelUpEnabled: readBoolean(params.levelUpEnabled),
      ...((mode === "addition" || mode === "subtraction") && range ? { range } : {}),
      ...((mode === "multiplication" || mode === "division") && tables ? { tables } : {}),
      ...((mode === "multiplication" || mode === "division") && factNumberLimit ? { factNumberLimit } : {}),
    });
  });
  const [countdown, setCountdown] = useState(3);
  const [sprintState, setSprintState] = useState<SprintState | null>(null);
  const [remainingMs, setRemainingMs] = useState(configuration.durationSeconds * 1000);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [sprintMilestone, setSprintMilestone] = useState<SprintMilestone | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const milestoneTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const levelUpAnimation = useAnimatedValue(0);
  const submissionLockedRef = useRef(false);
  const clockRef = useRef<ReturnType<typeof createSprintClock> | null>(null);
  const modeDetails = SPRINT_MODE_DETAILS[configuration.mode];
  const adaptiveLayout = Platform.OS === "ios" ? getAdaptiveLayout(window.width, window.height) : "phone";
  const isIpad = adaptiveLayout !== "phone";
  const isLandscapeIpad = adaptiveLayout === "tablet-landscape";
  const reduceMotionEnabled = useReduceMotionEnabled();
  const layout = getGameplayLayout(
    measuredHeight ?? window.height - insets.top - insets.bottom,
    configuration.inputStyle,
    adaptiveLayout
  );
  const { subscriptionCheckPending, requiresPremium } = getSprintSubscriptionGate({
    firstFreeSprintCompleted: preferences.firstFreeSprintCompleted,
    isPremium,
    sprintCompleted: sprintState?.status === "completed",
    subscriptionStatus,
  });
  const pendingFirstResultCelebration = hasPendingFirstResultCelebration({
    onboardingCompleted: preferences.onboardingCompleted,
    firstFreeSprintCompleted: preferences.firstFreeSprintCompleted,
    firstResultCelebrationSeen: preferences.firstResultCelebrationSeen,
  });
  const shouldResumePendingCelebration = pendingFirstResultCelebration && sprintState?.status !== "completed";
  const canStartCountdown = canStartSprintCountdown({ subscriptionCheckPending, requiresPremium });
  const milestoneCopy = sprintMilestone === null
    ? null
    : sprintMilestone.kind === "level-up"
      ? {
          accessibilityLabel: `Level up! You reached level ${sprintMilestone.level}.`,
          label: `Level ${sprintMilestone.level}`,
        }
      : sprintMilestone.kind === "on-fire"
        ? {
            accessibilityLabel: "On fire! Twenty correct answers in a row.",
            label: "On Fire!",
          }
        : {
            accessibilityLabel: "Math Master! Thirty correct answers in a row.",
            label: "Math Master!",
          };

  useEffect(() => {
    if (!canStartCountdown || shouldResumePendingCelebration || countdown <= 0) return;
    const timeout = setTimeout(() => {
      if (countdown > 1) {
        setCountdown(countdown - 1);
      } else {
        const clock = createSprintClock();
        clockRef.current = clock;
        setSprintState(createSprint(configuration, clock.startedAtMs));
        setRemainingMs(configuration.durationSeconds * 1000);
        setCountdown(0);
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [canStartCountdown, configuration, countdown, shouldResumePendingCelebration]);

  useEffect(() => {
    const clock = clockRef.current;
    if (!sprintState || sprintState.status !== "active" || !clock) return;

    const interval = setInterval(() => {
      const nowMs = clock.now();
      setRemainingMs(getRemainingMs(sprintState, nowMs));
      if (!submissionLockedRef.current) setSprintState((current) => current && tickSprint(current, nowMs));
    }, 100);

    return () => clearInterval(interval);
  }, [feedback, sprintState]);

  useEffect(
    () => () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      if (milestoneTimeoutRef.current) clearTimeout(milestoneTimeoutRef.current);
      levelUpAnimation.stopAnimation();
    },
    [levelUpAnimation]
  );

  useEffect(() => {
    if (requiresPremium) router.replace("/subscription");
  }, [requiresPremium, router]);

  useEffect(() => {
    if (shouldResumePendingCelebration) router.replace("/first-result-celebration");
  }, [router, shouldResumePendingCelebration]);

  const submit = useCallback(
    (submittedAnswer: number) => {
      const clock = clockRef.current;
      if (!sprintState || sprintState.status !== "active" || submissionLockedRef.current || !clock) return;
      if (!Number.isSafeInteger(submittedAnswer) || submittedAnswer < 0) return;
      const answeredAtMs = clock.now();

      if (answeredAtMs >= sprintState.endsAtMs) {
        setSprintState(tickSprint(sprintState, answeredAtMs));
        return;
      }

      submissionLockedRef.current = true;
      setFeedback({
        submittedAnswer,
        correctAnswer: sprintState.currentQuestion.correctAnswer,
        isCorrect: submittedAnswer === sprintState.currentQuestion.correctAnswer,
      });

      feedbackTimeoutRef.current = setTimeout(() => {
        const nextQuestionPresentedAtMs = clock.now();
        const nextState = submitAnswer(
          sprintState,
          submittedAnswer,
          answeredAtMs,
          Math.random,
          nextQuestionPresentedAtMs
        );
        setSprintState(nextState);
        const milestone = nextState.status === "active"
          ? getSprintMilestone(
              sprintState.difficultyLevel,
              nextState.difficultyLevel,
              nextState.currentStreak,
            )
          : null;
        if (milestone) {
          if (milestoneTimeoutRef.current) clearTimeout(milestoneTimeoutRef.current);
          levelUpAnimation.stopAnimation();
          levelUpAnimation.setValue(0);
          setSprintMilestone(milestone);
          if (reduceMotionEnabled) {
            levelUpAnimation.setValue(1);
          } else {
            Animated.sequence([
              Animated.spring(levelUpAnimation, {
                toValue: 1,
                useNativeDriver: true,
                speed: 20,
                bounciness: 12,
              }),
              Animated.delay(950),
              Animated.timing(levelUpAnimation, {
                toValue: 0,
                duration: 220,
                useNativeDriver: true,
              }),
            ]).start();
          }
          milestoneTimeoutRef.current = setTimeout(() => {
            setSprintMilestone(null);
            milestoneTimeoutRef.current = null;
          }, SPRINT_MILESTONE_DURATION_MS);
        }
        setTypedAnswer("");
        setFeedback(null);
        submissionLockedRef.current = false;
        feedbackTimeoutRef.current = null;
      }, FEEDBACK_DURATION_MS);
    },
    [levelUpAnimation, reduceMotionEnabled, sprintState]
  );

  const leaveSprint = () => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    if (milestoneTimeoutRef.current) clearTimeout(milestoneTimeoutRef.current);
    feedbackTimeoutRef.current = null;
    milestoneTimeoutRef.current = null;
    levelUpAnimation.stopAnimation();
    submissionLockedRef.current = false;
    // Onboarding replaces its route with the sprint, so it has no previous
    // navigator entry to pop. A root replacement also works for later sprints.
    router.replace("/");
  };

  const closeSprint = () => {
    Alert.alert("End this sprint?", "Your current progress won’t be saved. You can start another sprint anytime.", [
      { text: "Keep going", style: "cancel" },
      { text: "End sprint", style: "destructive", onPress: leaveSprint },
    ]);
  };

  if (subscriptionCheckPending || requiresPremium || shouldResumePendingCelebration) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.subscriptionLoading}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (countdown > 0 || !sprintState) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar style="dark" />
        <CountdownView count={countdown} modeTitle={modeDetails.title} onClose={leaveSprint} />
      </SafeAreaView>
    );
  }

  if (sprintState.status === "completed") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
        <StatusBar style="dark" />
        <SprintResultsScreen learnerId={learnerId} sprintId={sprintId} onDone={() => router.dismissTo("/")} result={sprintState.result} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      <View style={styles.content} onLayout={({ nativeEvent }) => setMeasuredHeight(nativeEvent.layout.height)}>
        <SprintHeader
          answerStreak={sprintState.currentStreak}
          onClose={closeSprint}
          remainingSeconds={Math.ceil(remainingMs / 1000)}
        />

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.max(0, (remainingMs / (configuration.durationSeconds * 1000)) * 100)}%`,
              },
            ]}
          />
        </View>

        <View style={styles.playArea}>
          <View
            style={[
              styles.questionArea,
              { paddingVertical: layout.gap },
              configuration.inputStyle === "multiple-choice" && [
                styles.choiceQuestionArea,
                { paddingTop: 0, paddingBottom: layout.gap * 2 },
              ],
            ]}
          >
            {layout.promptHeight > 0 && (
              <Text
                maxFontSizeMultiplier={1.2}
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[styles.prompt, { height: layout.promptHeight }]}
              >
                Solve it!
              </Text>
            )}
            <QuestionCard
              height={layout.cardHeight}
              layout={resolveQuestionCardLayout(configuration.cardLayout, sprintState.currentQuestion.id)}
              maxFontSize={layout.questionFontMaxSize}
              maxWidth={layout.cardMaxWidth}
              question={sprintState.currentQuestion}
              verticalLineWidth={layout.questionLineWidth}
            />
          </View>

          <View
            style={[
              styles.answerArea,
              configuration.inputStyle === "multiple-choice" && styles.insetAnswers,
              isLandscapeIpad && styles.landscapeAnswerArea,
            ]}
          >
            {configuration.inputStyle === "multiple-choice" ? (
              <MultipleChoiceAnswers
                choices={sprintState.currentQuestion.choices}
                feedback={feedback}
                layout={layout}
                onSelect={submit}
              />
            ) : (
              <NumberPad
                layout={layout}
                feedback={feedback}
                onChange={setTypedAnswer}
                onSubmit={() => submit(Number(typedAnswer))}
                value={typedAnswer}
              />
            )}
          </View>

          <Text
            maxFontSizeMultiplier={isIpad ? 1.1 : 1.2}
            numberOfLines={1}
            adjustsFontSizeToFit={!isIpad}
            style={[styles.levelLabel, isIpad && styles.ipadLevelLabel]}
          >
            Level {sprintState.difficultyLevel}
            {configuration.levelUpEnabled ? " · Level Up on" : ""}
          </Text>
          {sprintMilestone !== null && milestoneCopy !== null && (
            <Animated.View
              accessible
              accessibilityLabel={milestoneCopy.accessibilityLabel}
              accessibilityLiveRegion="polite"
              pointerEvents="none"
              style={[
                styles.levelUpCelebration,
                {
                  opacity: levelUpAnimation,
                  transform: [
                    {
                      scale: levelUpAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.7, 1],
                      }),
                    },
                    {
                      translateY: levelUpAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-10, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={[styles.levelUpMedallion, sprintMilestone.kind === "on-fire" && styles.onFireMedallion]}>
                {sprintMilestone.kind === "on-fire" ? (
                  <SymbolView
                    name={{ ios: "flame.fill", android: "local_fire_department", web: "local_fire_department" }}
                    size={27}
                    tintColor="#FFD552"
                  />
                ) : sprintMilestone.kind === "math-master" ? (
                  <SymbolView
                    name={{ ios: "star.fill", android: "star", web: "star" }}
                    size={26}
                    tintColor="#FFD552"
                  />
                ) : (
                  <SymbolView
                    name={{ ios: "bolt.fill", android: "bolt", web: "bolt" }}
                    size={27}
                    tintColor="#FFD552"
                  />
                )}
              </View>
              <Text style={styles.levelUpLabel}>{milestoneCopy.label}</Text>
            </Animated.View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 8,
  },
  progressTrack: {
    height: 6,
    marginTop: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  // Let the keypad reach the safe-area edges without widening the header.
  playArea: { flex: 1, marginHorizontal: -24 },
  subscriptionLoading: { flex: 1, alignItems: "center", justifyContent: "center" },
  levelUpCelebration: {
    position: "absolute",
    zIndex: 1,
    top: 12,
    alignSelf: "center",
    alignItems: "center",
  },
  levelUpMedallion: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: "#FFD552",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  onFireMedallion: { backgroundColor: COLORS.orange },
  levelUpLabel: {
    marginTop: 3,
    color: COLORS.primary,
    fontFamily: "NunitoSans_800ExtraBold",
    fontSize: 12,
    letterSpacing: 0.6,
    lineHeight: 16,
    textTransform: "uppercase",
  },
  questionArea: { flex: 1, minHeight: 0, alignItems: "center", justifyContent: "center" },
  prompt: {
    color: COLORS.secondary,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 14,
    lineHeight: 18,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  answerArea: {
    flexShrink: 0,
  },
  landscapeAnswerArea: { alignSelf: "center", width: "100%", maxWidth: 700 },
  // Center the question and choices as one group instead of pinning choices
  // to the bottom like the typed keypad. Keep the existing height budget.
  choiceQuestionArea: { flex: 0, marginTop: "auto" },
  insetAnswers: { paddingHorizontal: 24, marginBottom: "auto" },
  levelLabel: {
    marginTop: 4,
    height: 20,
    lineHeight: 20,
    color: COLORS.secondary,
    fontFamily: "NunitoSans_600SemiBold",
    fontSize: 12,
    textAlign: "center",
  },
  ipadLevelLabel: {
    height: 20,
    lineHeight: 20,
    marginTop: 3,
    color: COLORS.secondary,
    fontFamily: "NunitoSans_600SemiBold",
    fontSize: 14,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
});
