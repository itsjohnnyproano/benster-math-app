import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ONBOARDING_GOAL_DETAILS } from "@/config/onboardingGoals";
import { SPRINT_MODE_DETAILS } from "@/config/sprintModeDetails";
import { MAX_NICKNAME_LENGTH } from "@/domain/nickname";
import type { OnboardingGoal, SprintDurationSeconds, SprintMode } from "@/domain/sprint";
import { usePreferences } from "@/providers/PreferencesProvider";
import { COLORS } from "@/theme/tokens";
import { getOnboardingLayout, ONBOARDING_COLUMN_GAP } from "./onboardingLayout";
import { useIntroAdvance } from "./useIntroAdvance";

type SetupStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const DARK = "#24134B";
const GOLD = "#FFD56B";
// The portrait iPad footer is 640pt wide with 24pt side padding.
const IPAD_PRIMARY_CONTROL_WIDTH = 592;
const ANSWER_STYLE_OPTIONS = [
  { label: "Tap answers", value: "multiple-choice" },
  { label: "Type answers", value: "typed" },
] as const;
const SPRINT_LENGTH_OPTIONS = [
  { label: "30 sec", detail: "A quick win", value: 30 },
  { label: "1 min", detail: "A little more practice", value: 60 },
  { label: "2 min", detail: "Ready for a longer sprint", value: 120 },
] as const satisfies readonly ChoiceOption<SprintDurationSeconds>[];
const FIRST_PRACTICE_OPTIONS = [
  { label: "Addition", detail: "Build number confidence", value: "addition" },
  { label: "Subtraction", detail: "Make subtraction click", value: "subtraction" },
  { label: "Multiplication", detail: "Strengthen times tables", value: "multiplication" },
  { label: "Division", detail: "Practice fact families", value: "division" },
  { label: "Mixed", detail: "A little of everything", value: "mixed" },
] as const satisfies readonly ChoiceOption<SprintMode>[];
const ONBOARDING_GOAL_OPTIONS: readonly ChoiceOption<OnboardingGoal>[] = [
  { label: ONBOARDING_GOAL_DETAILS["math-facts"].choiceLabel, value: "math-facts" },
  { label: ONBOARDING_GOAL_DETAILS.speed.choiceLabel, value: "speed" },
  { label: ONBOARDING_GOAL_DETAILS.confidence.choiceLabel, value: "confidence" },
  { label: ONBOARDING_GOAL_DETAILS["class-ready"].choiceLabel, value: "class-ready" },
  { label: ONBOARDING_GOAL_DETAILS.practice.choiceLabel, value: "practice" },
];
const GROWTH_BENEFITS = [
  "Beat your personal best",
  "Build your practice streak",
  "Review incorrect answers",
  "Every learner keeps their own profile",
] as const;

const steps: Record<SetupStep, { title: string; body: string; mascot: number; dark?: boolean }> = {
  1: {
    title: "What should we call you?",
    body: "Choose a nickname for your profile. It stays on this device.",
    mascot: require("../../../assets/mascot/penguin-waving.png"),
  },
  2: {
    title: "How can Benster help you today?",
    body: "Pick the one that feels most like you.",
    mascot: require("../../../assets/mascot/penguin-focused.png"),
  },
  3: {
    title: "Pick your first practice.",
    body: "Choose one to start. You can switch anytime.",
    mascot: require("../../../assets/mascot/penguin-focused.png"),
  },
  4: {
    title: "Big confidence.\nLittle time.",
    body: "Choose a sprint length that feels right today.",
    mascot: require("../../../assets/mascot/penguin-running-right-exact.png"),
    dark: true,
  },
  5: {
    title: "Practice your way.",
    body: "Choose how you’d like to answer.",
    mascot: require("../../../assets/mascot/penguin-waving.png"),
  },
  6: {
    title: "Watch yourself grow.",
    body: "Each sprint helps you see what you can do.",
    mascot: require("../../../assets/mascot/penguin-reading-book-right.png"),
  },
  7: {
    title: "You’re ready!",
    body: "Your first sprint is ready when you are.",
    mascot: require("../../../assets/mascot/penguin-sprint-start-crouch-exact.png"),
    dark: true,
  },
};

export default function OnboardingScreen() {
  const router = useRouter();
  const { preferences, completeOnboarding } = usePreferences();
  const [screen, setScreen] = useState<"welcome" | SetupStep>("welcome");
  const [showIntro, setShowIntro] = useState(true);
  const [introReady, setIntroReady] = useState(false);
  const [nickname, setNickname] = useState(preferences.nickname);
  const [onboardingGoal, setOnboardingGoal] = useState<OnboardingGoal | null>(null);
  const [mode, setMode] = useState<SprintMode>("addition");
  const [durationSeconds, setDurationSeconds] = useState<SprintDurationSeconds>(30);
  const [inputStyle, setInputStyle] = useState(preferences.inputStyle);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const { width, height, fontScale } = useWindowDimensions();
  const mounted = useRef(true);
  const submitting = useRef(false);
  const finishIntro = useCallback(() => setShowIntro(false), []);
  const goBack = useCallback(() => {
    if (saving || screen === "welcome") return;

    Keyboard.dismiss();
    setScreen((current) => (
      typeof current === "number" && current !== 1
        ? (current - 1) as SetupStep
        : "welcome"
    ));
  }, [saving, screen]);

  useIntroAdvance(showIntro && introReady, finishIntro);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      // This is the app's root flow, so there is no navigator route to pop
      // from the welcome screen. Consuming the press prevents a dev warning.
      if (saving || screen === "welcome") return true;
      goBack();
      return true;
    });

    return () => subscription.remove();
  }, [goBack, saving, screen]);

  const startFirstSprint = async () => {
    if (submitting.current) return;

    submitting.current = true;
    setSaving(true);
    setError(false);
    Keyboard.dismiss();

    try {
      await completeOnboarding(nickname, {
        durationSeconds,
        inputStyle,
        cardLayout: "both",
        onboardingGoal,
      });
      router.replace({
        pathname: "/sprint/play",
        params: {
          mode,
          durationSeconds: String(durationSeconds),
          inputStyle,
          cardLayout: "both",
          levelUpEnabled: String(preferences.levelUpEnabled),
        },
      });
    } catch {
      if (mounted.current) setError(true);
    } finally {
      submitting.current = false;
      if (mounted.current) setSaving(false);
    }
  };

  if (showIntro) {
    return (
      <SafeAreaView style={[styles.screen, styles.dark]}>
        <StatusBar style="light" />
        <Image
          source={require("../../../assets/brand/Benster_stacked_white-text_1300px.png")}
          contentFit="contain"
          onDisplay={() => setIntroReady(true)}
          onError={() => setIntroReady(true)}
          style={styles.brand}
        />
      </SafeAreaView>
    );
  }

  if (screen === "welcome") return <Welcome onContinue={() => setScreen(1)} />;

  const step = steps[screen];
  const dark = step.dark === true;
  const displayName = nickname.trim() || preferences.nickname;
  const body = screen === 3 && onboardingGoal
    ? ONBOARDING_GOAL_DETAILS[onboardingGoal].firstPracticePrompt
    : step.body;
  const needsGoal = screen === 2 && onboardingGoal === null;
  const continueDisabled = saving || needsGoal;
  const choiceScreen = screen === 2 || screen === 3;
  const layout = getOnboardingLayout(Platform.OS === "ios", width, height, fontScale);
  const useLandscapeSingleColumnLayout = layout.twoColumn && screen === 1;
  const useLandscapeSplitLayout = layout.twoColumn && !useLandscapeSingleColumnLayout;
  const contentMaxWidth = useLandscapeSingleColumnLayout ? 640 : layout.maxWidth;

  return (
    <SafeAreaView style={[styles.screen, dark && styles.dark]}>
      <StatusBar style={dark ? "light" : "dark"} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { maxWidth: contentMaxWidth }]}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.navigationHeader}>
            <Text style={[styles.progressLabel, dark && styles.goldText]}>
              STEP {screen} OF 7
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              disabled={saving}
              onPress={goBack}
              hitSlop={8}
              style={({ pressed }) => [
                styles.backControl,
                dark && styles.darkBackControl,
                saving && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={[styles.backControlText, dark && styles.goldText]}>←</Text>
            </Pressable>
            <Progress step={screen} dark={dark} />
          </View>
          <View style={[
            styles.content,
            choiceScreen && styles.compactChoiceContent,
            choiceScreen && styles.centeredContent,
            (screen === 4 || screen === 5 || screen === 6 || screen === 7) && styles.centeredContent,
            useLandscapeSplitLayout && styles.landscapeChoiceContent,
            useLandscapeSingleColumnLayout && styles.landscapeNicknameContent,
          ]}>
            <View style={[
              styles.stepIntro,
              choiceScreen && styles.compactStepIntro,
              useLandscapeSplitLayout && styles.landscapeStepIntro,
            ]}>
              <Image
                source={step.mascot}
                contentFit="contain"
                style={[
                  styles.mascot,
                  choiceScreen && styles.compactChoiceMascot,
                  useLandscapeSplitLayout && styles.landscapeChoiceMascot,
                  useLandscapeSingleColumnLayout && styles.landscapeNicknameMascot,
                ]}
                accessible={false}
              />
              <Text accessibilityRole="header" style={[
                styles.title,
                choiceScreen && styles.compactChoiceTitle,
                useLandscapeSplitLayout && styles.landscapeChoiceTitle,
                useLandscapeSingleColumnLayout && styles.landscapeNicknameTitle,
                dark && styles.light,
              ]}>
                {screen === 7 && displayName ? `You’re ready, ${displayName}!` : step.title}
              </Text>
              <Text style={[
                styles.body,
                useLandscapeSplitLayout && styles.landscapeChoiceBody,
                dark && styles.lightBody,
              ]}>
                {body}
              </Text>
            </View>

            <View style={[styles.stepSelection, useLandscapeSplitLayout && styles.landscapeStepSelection]}>
              {screen === 1 && (
              <Nickname value={nickname} onChange={setNickname} disabled={saving} />
              )}
              {screen === 2 && <OnboardingGoalChoices value={onboardingGoal} onChange={setOnboardingGoal} compact />}
              {screen === 3 && <FirstPracticeChoices value={mode} onChange={setMode} compact />}
              {screen === 4 && <SprintLengthChoices value={durationSeconds} onChange={setDurationSeconds} />}
              {screen === 5 && <AnswerStyleChoices value={inputStyle} onChange={setInputStyle} />}
              {screen === 6 && <GrowthRows />}
              {screen === 7 && (
                <>
                  <View style={styles.firstStep}>
                    {onboardingGoal && (
                      <Text style={[styles.firstStepText, styles.firstStepGoal]}>
                        Your goal: {ONBOARDING_GOAL_DETAILS[onboardingGoal].readyLabel}
                      </Text>
                    )}
                    <Text style={styles.firstStepText}>
                      {SPRINT_MODE_DETAILS[mode].title} · {formatSprintLength(durationSeconds)}
                    </Text>
                    <Text style={[styles.firstStepText, styles.firstStepDetail]}>
                      {inputStyle === "typed" ? "Type answers" : "Tap answers"} · Vertical + horizontal cards
                    </Text>
                  </View>
                  <Text style={[styles.levelUpNote, styles.lightBody]}>
                    Level Up is on — get 5 correct in a row and the next questions get a little harder.
                  </Text>
                </>
              )}
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { maxWidth: contentMaxWidth }, layout.twoColumn && styles.landscapeFooter]}>
          {error && (
            <Text accessibilityRole="alert" style={styles.error}>
              We couldn’t save your setup. Please try again.
            </Text>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: continueDisabled, busy: saving }}
            disabled={continueDisabled}
            onPress={() => {
              if (screen === 7) {
                void startFirstSprint();
              } else {
                setScreen((screen + 1) as SetupStep);
              }
            }}
            style={({ pressed }) => [
              styles.button,
              dark && styles.goldButton,
              layout.twoColumn && styles.landscapeButton,
              layout.twoColumn && { width: IPAD_PRIMARY_CONTROL_WIDTH },
              continueDisabled && styles.buttonDisabled,
              (!continueDisabled && pressed) && styles.buttonPressed,
            ]}
          >
            <Text style={[styles.buttonText, dark && styles.goldButtonText]}>
              {screen === 7 ? (saving ? "Saving…" : "Start my first sprint") : "Continue"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Welcome({ onContinue }: { onContinue: () => void }) {
  return (
    <SafeAreaView style={[styles.screen, styles.dark]}>
      <StatusBar style="light" />
      <View style={[styles.content, styles.welcomeContent]}>
        <Image
          source={require("../../../assets/mascot/penguin-jumping-celebration-confetti.png")}
          contentFit="contain"
          style={styles.welcomeMascot}
          accessible={false}
        />
        <Text accessibilityRole="header" style={[styles.title, styles.light]}>
          Small sprints.{"\n"}Growing confidence.
        </Text>
        <Text style={[styles.body, styles.lightBody]}>
          Add, subtract, multiply, divide—or mix them up.
        </Text>
      </View>
      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={onContinue}
          style={({ pressed }) => [styles.button, styles.goldButton, pressed && styles.buttonPressed]}
        >
          <Text style={[styles.buttonText, styles.goldButtonText]}>Let’s get started</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Progress({ step, dark }: { step: SetupStep; dark: boolean }) {
  return (
    <View accessible accessibilityLabel={`Step ${step} of 7`} style={styles.progressWrap}>
      <View style={[styles.track, dark && styles.darkTrack]}>
        <View style={[styles.fill, dark && styles.goldFill, { width: `${(step / 7) * 100}%` }]} />
      </View>
      <Text style={[styles.progressCount, dark && styles.lightBody]}>{step} of 7</Text>
    </View>
  );
}

function Nickname({ value, onChange, disabled }: {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <View style={styles.nickname}>
      <TextInput
        accessibilityLabel="Your nickname, optional"
        value={value}
        editable={!disabled}
        onChangeText={onChange}
        maxLength={MAX_NICKNAME_LENGTH}
        autoCorrect={false}
        autoComplete="off"
        textContentType="none"
        autoCapitalize="words"
        placeholder="Nickname (optional)"
        placeholderTextColor={COLORS.secondary}
        returnKeyType="done"
        onSubmitEditing={Keyboard.dismiss}
        style={styles.input}
      />
      <Text style={styles.privacy}>Skip to use Learner 1. No account needed—add more profiles anytime.</Text>
    </View>
  );
}

type ChoiceOption<Value extends string | number> = {
  label: string;
  detail?: string;
  value: Value;
};

function SelectableChoices<Value extends string | number>({
  options,
  value,
  onChange,
  dark = false,
  alignStart = false,
  compact = false,
}: {
  options: readonly ChoiceOption<Value>[];
  value: Value | null;
  onChange: (value: Value) => void;
  dark?: boolean;
  alignStart?: boolean;
  compact?: boolean;
}) {
  return (
    <View accessibilityRole="radiogroup" style={[styles.rowList, compact && styles.compactRowList]}>
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            key={String(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.choiceRow,
              compact && styles.compactChoiceRow,
              dark && styles.darkChoiceRow,
              (dark || alignStart) && styles.choiceRowDetailed,
              selected && styles.choiceRowSelected,
              dark && selected && styles.darkChoiceRowSelected,
              pressed && styles.buttonPressed,
            ]}
          >
            <View>
              <Text style={[styles.rowText, dark && styles.light]}>{option.label}</Text>
              {option.detail && (
                <Text style={[styles.choiceDetail, dark && styles.lightBody]}>{option.detail}</Text>
              )}
            </View>
            {selected && (
              <View style={[styles.choiceCheck, dark && styles.darkChoiceCheck]}>
                <Text style={[styles.choiceCheckText, dark && styles.darkChoiceCheckText]}>✓</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

function OnboardingGoalChoices({ value, onChange, compact = false }: {
  value: OnboardingGoal | null;
  onChange: (value: OnboardingGoal) => void;
  compact?: boolean;
}) {
  return <SelectableChoices options={ONBOARDING_GOAL_OPTIONS} value={value} onChange={onChange} alignStart compact={compact} />;
}

function SprintLengthChoices({ value, onChange }: {
  value: SprintDurationSeconds;
  onChange: (value: SprintDurationSeconds) => void;
}) {
  return <SelectableChoices options={SPRINT_LENGTH_OPTIONS} value={value} onChange={onChange} dark />;
}

function FirstPracticeChoices({ value, onChange, compact = false }: {
  value: SprintMode;
  onChange: (value: SprintMode) => void;
  compact?: boolean;
}) {
  return (
    <View accessibilityRole="radiogroup" style={[styles.rowList, compact && styles.compactRowList]}>
      {FIRST_PRACTICE_OPTIONS.map((option) => {
        const selected = option.value === value;
        const details = SPRINT_MODE_DETAILS[option.value];

        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.practiceChoiceRow,
              compact && styles.compactPracticeChoiceRow,
              selected && styles.choiceRowSelected,
              pressed && styles.buttonPressed,
            ]}
          >
            <View style={[styles.practiceSymbol, { backgroundColor: details.color }]}>
              <Text
                style={[
                  styles.practiceSymbolText,
                  option.value === "mixed" && styles.mixedPracticeSymbolText,
                ]}
              >
                {details.symbol}
              </Text>
            </View>
            <View style={styles.practiceChoiceCopy}>
              <Text style={styles.rowText}>{option.label}</Text>
              <Text style={styles.choiceDetail}>{option.detail}</Text>
            </View>
            <View style={[styles.practiceSelection, selected && styles.practiceSelectionActive]}>
              {selected && <Text style={styles.choiceCheckText}>✓</Text>}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function AnswerStyleChoices({
  value,
  onChange,
}: {
  value: "multiple-choice" | "typed";
  onChange: (value: "multiple-choice" | "typed") => void;
}) {
  return <SelectableChoices options={ANSWER_STYLE_OPTIONS} value={value} onChange={onChange} />;
}

function formatSprintLength(durationSeconds: SprintDurationSeconds) {
  return durationSeconds === 30 ? "30-second sprint" : `${durationSeconds / 60}-minute sprint`;
}

function GrowthRows() {
  return (
    <View style={styles.benefitList}>
      {GROWTH_BENEFITS.map((benefit) => (
        <View key={benefit} style={styles.benefitRow}>
          <Text style={styles.benefitCheck}>✓</Text>
          <Text style={styles.benefitText}>{benefit}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  dark: { backgroundColor: DARK },
  flex: { flex: 1 },
  brand: { flex: 1, alignSelf: "center", width: "72%" },
  scroll: { flexGrow: 1, width: "100%", alignSelf: "center", maxWidth: 640 },
  navigationHeader: { width: "100%", flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingTop: 10 },
  backControl: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primarySoft, alignItems: "center", justifyContent: "center", transform: [{ translateY: 9 }] },
  darkBackControl: { backgroundColor: "#51397E", borderWidth: 1, borderColor: "#5A4387" },
  backControlText: { color: COLORS.primary, fontFamily: "NunitoSans_700Bold", fontSize: 24, lineHeight: 28 },
  progressWrap: { flex: 1, alignSelf: "stretch", paddingTop: 0, flexDirection: "row", alignItems: "center", gap: 10 },
  progressLabel: { position: "absolute", top: 17, left: 0, right: 0, textAlign: "center", fontFamily: "NunitoSans_700Bold", fontSize: 12, color: COLORS.primary, letterSpacing: 0.4 },
  track: { flex: 1, height: 6, marginTop: 17, borderRadius: 10, overflow: "hidden", backgroundColor: COLORS.border },
  fill: { height: "100%", backgroundColor: COLORS.primary, borderRadius: 10 },
  progressCount: { marginTop: 17, fontFamily: "NunitoSans_700Bold", color: COLORS.secondary, fontSize: 11 },
  darkTrack: { backgroundColor: "#5A4387" },
  goldFill: { backgroundColor: GOLD },
  goldText: { color: GOLD },
  content: { flex: 1, alignItems: "center", paddingHorizontal: 28, paddingTop: 22, gap: 14 },
  stepIntro: { alignItems: "center", gap: 14 },
  compactStepIntro: { gap: 10 },
  stepSelection: { width: "100%", alignItems: "center" },
  compactChoiceContent: { paddingTop: 8, gap: 10 },
  centeredContent: { justifyContent: "center", paddingBottom: 28 },
  landscapeChoiceContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: ONBOARDING_COLUMN_GAP,
    paddingHorizontal: 32,
    paddingTop: 10,
    paddingBottom: 12,
  },
  landscapeNicknameContent: { paddingHorizontal: 24, paddingTop: 12 },
  landscapeStepIntro: { flex: 1, maxWidth: 424 },
  landscapeStepSelection: { flex: 1, maxWidth: 536 },
  welcomeContent: { justifyContent: "center", paddingBottom: 30 },
  mascot: { width: 210, height: 210, marginTop: 2 },
  compactChoiceMascot: { width: 155, height: 155 },
  landscapeChoiceMascot: { width: 124, height: 124 },
  landscapeNicknameMascot: { width: 170, height: 170 },
  welcomeMascot: { width: 270, height: 270 },
  title: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 31, lineHeight: 39, textAlign: "center" },
  compactChoiceTitle: { fontSize: 29, lineHeight: 36 },
  landscapeChoiceTitle: { fontSize: 27, lineHeight: 33 },
  landscapeNicknameTitle: { fontSize: 29, lineHeight: 36 },
  body: { color: COLORS.secondary, fontFamily: "NunitoSans_600SemiBold", fontSize: 16, lineHeight: 23, textAlign: "center", maxWidth: 350 },
  landscapeChoiceBody: { maxWidth: 310, fontSize: 15, lineHeight: 21 },
  light: { color: COLORS.card },
  lightBody: { color: "#D8CDED" },
  nickname: { width: "100%", marginTop: 18, gap: 8 },
  input: { minHeight: 54, backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 16, fontFamily: "NunitoSans_700Bold", color: COLORS.ink, fontSize: 16 },
  privacy: { color: COLORS.secondary, textAlign: "center", fontFamily: "NunitoSans_600SemiBold", fontSize: 12 },
  rowList: { width: "100%", marginTop: 20, gap: 10 },
  compactRowList: { marginTop: 12, gap: 8 },
  rowText: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 14 },
  choiceRow: { minHeight: 58, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  compactChoiceRow: { minHeight: 54 },
  choiceRowDetailed: { justifyContent: "flex-start" },
  darkChoiceRow: { borderColor: "#5A4387", backgroundColor: "#51397E" },
  choiceRowSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft, borderWidth: 2 },
  darkChoiceRowSelected: { borderColor: GOLD, backgroundColor: "#624796" },
  choiceCheck: { position: "absolute", right: 14, width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  darkChoiceCheck: { backgroundColor: GOLD },
  choiceCheckText: { color: COLORS.card, fontFamily: "NunitoSans_700Bold", fontSize: 17, lineHeight: 20 },
  darkChoiceCheckText: { color: DARK },
  choiceDetail: { marginTop: 2, color: COLORS.secondary, fontFamily: "NunitoSans_600SemiBold", fontSize: 12 },
  practiceChoiceRow: { minHeight: 66, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card, paddingHorizontal: 14, flexDirection: "row", alignItems: "center" },
  compactPracticeChoiceRow: { minHeight: 58 },
  practiceSymbol: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  practiceSymbolText: { color: COLORS.card, fontFamily: "NunitoSans_700Bold", fontSize: 25, lineHeight: 29 },
  mixedPracticeSymbolText: { fontSize: 15, lineHeight: 19 },
  practiceChoiceCopy: { flex: 1, marginLeft: 13, marginRight: 10 },
  practiceSelection: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  practiceSelectionActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  benefitList: { width: "100%", marginTop: 24, gap: 14 },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  benefitCheck: { color: COLORS.primary, fontFamily: "NunitoSans_700Bold", fontSize: 18 },
  benefitText: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 15 },
  firstStep: { width: "100%", backgroundColor: "#51397E", padding: 15, borderRadius: 13, marginTop: 20 },
  firstStepText: { color: "#D8CDED", textAlign: "center", fontFamily: "NunitoSans_700Bold", fontSize: 14 },
  firstStepGoal: { color: GOLD, marginBottom: 6 },
  firstStepDetail: { marginTop: 5, color: "#D8CDED", fontFamily: "NunitoSans_600SemiBold", fontSize: 12 },
  levelUpNote: { maxWidth: 330, marginTop: 2, textAlign: "center", fontFamily: "NunitoSans_600SemiBold", fontSize: 12, lineHeight: 18 },
  footer: { width: "100%", alignSelf: "center", maxWidth: 640, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20 },
  landscapeFooter: { paddingHorizontal: 32, paddingTop: 10, paddingBottom: 16 },
  button: { minHeight: 54, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  landscapeButton: { alignSelf: "center" },
  goldButton: { backgroundColor: GOLD },
  buttonText: { color: COLORS.card, fontFamily: "NunitoSans_700Bold", fontSize: 17 },
  goldButtonText: { color: DARK },
  buttonPressed: { opacity: 0.72 },
  buttonDisabled: { opacity: 0.45 },
  error: { color: COLORS.red, textAlign: "center", fontFamily: "NunitoSans_600SemiBold", marginBottom: 10 },
});
