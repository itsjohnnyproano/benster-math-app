import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SPRINT_MODE_DETAILS } from "@/config/sprintModeDetails";
import {
  createSprint,
  getRemainingMs,
  submitAnswer,
  tickSprint,
  type SprintState,
} from "@/domain/math-engine";
import {
  isCardLayout,
  isInputStyle,
  isSprintMode,
  parseSprintDuration,
  type SprintConfiguration,
} from "@/domain/sprint";
import { COLORS } from "@/theme/tokens";

import { CountdownView } from "./components/CountdownView";
import { MultipleChoiceAnswers } from "./components/MultipleChoiceAnswers";
import { NumberPad } from "./components/NumberPad";
import { QuestionCard } from "./components/QuestionCard";
import { SprintCompleteView } from "./components/SprintCompleteView";
import { SprintHeader } from "./components/SprintHeader";
import type { AnswerFeedback } from "./types";

const FEEDBACK_DURATION_MS = 650;

function readBoolean(value: string | undefined) {
  return value === "true";
}

export default function SprintPlayScreen() {
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
  const [countdown, setCountdown] = useState(3);
  const [sprintState, setSprintState] = useState<SprintState | null>(null);
  const [remainingMs, setRemainingMs] = useState(
    configuration.durationSeconds * 1000,
  );
  const [typedAnswer, setTypedAnswer] = useState("");
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modeDetails = SPRINT_MODE_DETAILS[configuration.mode];

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((current) => {
        if (current > 1) return current - 1;
        clearInterval(interval);
        const startedAtMs = Date.now();
        setSprintState(createSprint(configuration, startedAtMs));
        setRemainingMs(configuration.durationSeconds * 1000);
        return 0;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [configuration]);

  useEffect(() => {
    if (!sprintState || sprintState.status !== "active") return;

    const interval = setInterval(() => {
      const nowMs = Date.now();
      setRemainingMs(getRemainingMs(sprintState, nowMs));
      if (!feedback) setSprintState((current) => current && tickSprint(current, nowMs));
    }, 100);

    return () => clearInterval(interval);
  }, [feedback, sprintState]);

  useEffect(
    () => () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    },
    [],
  );

  const submit = useCallback(
    (submittedAnswer: number) => {
      if (!sprintState || sprintState.status !== "active" || feedback) return;
      const answeredAtMs = Date.now();

      if (answeredAtMs >= sprintState.endsAtMs) {
        setSprintState(tickSprint(sprintState, answeredAtMs));
        return;
      }

      setFeedback({
        submittedAnswer,
        correctAnswer: sprintState.currentQuestion.correctAnswer,
        isCorrect: submittedAnswer === sprintState.currentQuestion.correctAnswer,
      });

      feedbackTimeoutRef.current = setTimeout(() => {
        setSprintState((current) => {
          if (!current) return current;
          const answered = submitAnswer(current, submittedAnswer, answeredAtMs);
          return tickSprint(answered, Date.now());
        });
        setTypedAnswer("");
        setFeedback(null);
      }, FEEDBACK_DURATION_MS);
    },
    [feedback, sprintState],
  );

  const closeSprint = () => {
    Alert.alert("Leave this sprint?", "Your current progress won’t be saved.", [
      { text: "Keep going", style: "cancel" },
      { text: "Leave", style: "destructive", onPress: () => router.back() },
    ]);
  };

  if (countdown > 0 || !sprintState) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar style="dark" />
        <CountdownView
          count={countdown}
          modeTitle={modeDetails.title}
          onClose={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  if (sprintState.status === "completed") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar style="dark" />
        <SprintCompleteView
          onDone={() => router.dismissAll()}
          result={sprintState.result}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      <View style={styles.content}>
        <SprintHeader
          onClose={closeSprint}
          remainingSeconds={Math.ceil(remainingMs / 1000)}
          streak={sprintState.currentStreak}
        />

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.max(
                  0,
                  (remainingMs / (configuration.durationSeconds * 1000)) * 100,
                )}%`,
              },
            ]}
          />
        </View>

        <View style={styles.questionArea}>
          <Text style={styles.prompt}>Solve it!</Text>
          <QuestionCard
            layout={configuration.cardLayout}
            question={sprintState.currentQuestion}
          />
        </View>

        <View style={styles.answerArea}>
          {configuration.inputStyle === "multiple-choice" ? (
            <MultipleChoiceAnswers
              choices={sprintState.currentQuestion.choices}
              feedback={feedback}
              onSelect={submit}
            />
          ) : (
            <NumberPad
              feedback={feedback}
              onChange={setTypedAnswer}
              onSubmit={() => submit(Number(typedAnswer))}
              value={typedAnswer}
            />
          )}
        </View>

        <Text style={styles.levelLabel}>
          Level {sprintState.difficultyLevel}
          {configuration.levelUpEnabled ? " · Level Up on" : ""}
        </Text>
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
    paddingBottom: 12,
  },
  progressTrack: {
    height: 6,
    marginTop: 12,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  questionArea: { marginTop: 17, alignItems: "center" },
  prompt: {
    marginBottom: 12,
    color: COLORS.secondary,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  answerArea: {
    flex: 1,
    marginTop: 24,
    justifyContent: "center",
  },
  levelLabel: {
    color: COLORS.secondary,
    fontFamily: "NunitoSans_600SemiBold",
    fontSize: 12,
    textAlign: "center",
  },
});
