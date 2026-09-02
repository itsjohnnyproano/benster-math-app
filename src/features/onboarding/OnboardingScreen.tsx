import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BackHandler, Keyboard, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MAX_NICKNAME_LENGTH } from "@/domain/nickname";
import { usePreferences } from "@/providers/PreferencesProvider";
import { CARD_SHADOW, COLORS } from "@/theme/tokens";
import { useIntroAdvance } from "./useIntroAdvance";
import { getOnboardingLayout, ONBOARDING_COLUMN_GAP } from "./onboardingLayout";

const WELCOME = {
  background: "#24134B",
  surface: "#34205E",
  muted: "#D8CDED",
  accent: "#FFD56B",
};

export default function OnboardingScreen() {
  const { preferences, completeOnboarding } = usePreferences();
  const [step, setStep] = useState<0 | 1>(0);
  const [showIntro, setShowIntro] = useState(true);
  const [introImageReady, setIntroImageReady] = useState(false);
  const finishIntro = useCallback(() => setShowIntro(false), []);
  useIntroAdvance(showIntro && introImageReady, finishIntro);
  const [nickname, setNickname] = useState(preferences.nickname);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const submitting = useRef(false);
  const mounted = useRef(true);
  const { width, height, fontScale } = useWindowDimensions();
  const { tablet, twoColumn, maxWidth, introSize, footerWidth } = getOnboardingLayout(Platform.OS === "ios", width, height, fontScale);
  const compact = height < 740;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (submitting.current) return true;
      if (step === 1) {
        Keyboard.dismiss();
        setStep(0);
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [step]);

  const finish = async (skipNickname: boolean) => {
    if (submitting.current) return;
    submitting.current = true;
    setSaving(true);
    setError(false);
    Keyboard.dismiss();
    try {
      // Skip ignores the draft, but never erases an existing user's nickname.
      await completeOnboarding(skipNickname ? preferences.nickname : nickname);
    } catch {
      if (mounted.current) setError(true);
    } finally {
      submitting.current = false;
      if (mounted.current) setSaving(false);
    }
  };

  if (showIntro) {
    return (
      <SafeAreaView style={[styles.screen, styles.darkScreen]}>
        <StatusBar style="light" />
        <View style={styles.intro}>
          <Image
            accessibilityLabel="Benster"
            source={require("../../../assets/brand/Benster_stacked_white-text_1300px.png")}
            contentFit="contain"
            onDisplay={() => setIntroImageReady(true)}
            onError={() => setIntroImageReady(true)}
            style={[styles.introBrand, compact && styles.compactIntroBrand, tablet && { width: introSize, maxWidth: introSize }]}
          />
        </View>
      </SafeAreaView>
    );
  }

  const welcome = step === 0;
  const nicknameTitle = (
    <Text accessibilityRole="header" style={[styles.title, tablet && styles.tabletTitle]}>What should{"\n"}we call you?</Text>
  );
  return (
    <SafeAreaView style={[styles.screen, welcome && styles.darkScreen]}>
      <StatusBar style={welcome ? "light" : "dark"} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          key={step}
          contentContainerStyle={[styles.scroll, tablet && styles.tabletScroll]}
          bounces={!tablet}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.page, { maxWidth }]}>
            <View style={styles.header}>
              {welcome ? (
                <Text style={[styles.wordmark, tablet && styles.tabletWordmark]}>benster<Text style={styles.wordmarkDot}>.</Text></Text>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Back to welcome"
                  disabled={saving}
                  accessibilityState={{ disabled: saving }}
                  onPress={() => { Keyboard.dismiss(); setStep(0); }}
                  style={({ pressed }) => [styles.back, pressed && styles.pressed]}
                >
                  <Text style={styles.backText}>‹</Text>
                </Pressable>
              )}
              <StepIndicator step={step} />
            </View>

            {welcome ? (
              <View style={[styles.main, twoColumn && styles.landscapeMain]}>
                <View style={[styles.visual, twoColumn && styles.landscapePane]}>
                <View
                  accessible={false}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={[styles.mascotStage, compact && styles.compactStage, tablet && styles.tabletStage]}
                >
                  <View style={styles.orbit} />
                  <View style={styles.halo} />
                  <Text style={[styles.mathTile, styles.plus]}>+</Text>
                  <Text style={[styles.mathTile, styles.times]}>×</Text>
                  <Text style={[styles.mathTile, styles.minus]}>−</Text>
                  <Image source={require("../../../assets/mascot/penguin-jumping-celebration-confetti.png")} contentFit="contain" style={styles.welcomeMascot} />
                </View>
                </View>
                <View style={[styles.copy, twoColumn && styles.landscapePane]}>
                <Text accessibilityRole="header" style={[styles.title, styles.lightTitle, tablet && styles.tabletTitle]}>
                  Small sprints.{"\n"}<Text style={styles.accent}>Growing confidence.</Text>
                </Text>
                <Text style={[styles.body, styles.lightBody, tablet && styles.tabletBody]}>
                  Add, subtract, multiply—or mix them up.
                </Text>
                <View style={styles.benefits}>
                  <Text style={[styles.benefit, tablet && styles.tabletSmallText]}>30 sec–2 min</Text>
                  <View style={styles.divider} />
                  <Text style={[styles.benefit, tablet && styles.tabletSmallText]}>Tap or type</Text>
                </View>
                </View>
              </View>
            ) : (
              <View style={[styles.main, twoColumn && styles.landscapeMain]}>
                <View style={[styles.visual, twoColumn && styles.landscapePane]}>
                <Image
                  accessibilityLabel="Benster running, ready to practice"
                  source={require("../../../assets/mascot/penguin-running-right-exact.png")}
                  contentFit="contain"
                  style={[styles.nicknameMascot, compact && styles.compactNicknameMascot, tablet && styles.tabletNicknameMascot, twoColumn && styles.landscapeNicknameMascot]}
                />
                {twoColumn && nicknameTitle}
                </View>
                <View style={[styles.copy, twoColumn && styles.landscapePane]}>
                {!twoColumn && nicknameTitle}
                <View style={[styles.nicknameCard, CARD_SHADOW, tablet && styles.tabletNicknameCard]}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.label, tablet && styles.tabletLabel]}>Nickname</Text>
                    <Text style={[styles.optional, tablet && styles.tabletSmallText]}>Optional</Text>
                  </View>
                  <TextInput
                    accessibilityLabel="Your nickname, optional"
                    value={nickname}
                    onChangeText={setNickname}
                    editable={!saving}
                    maxLength={MAX_NICKNAME_LENGTH}
                    autoCorrect={false}
                    autoComplete="off"
                    textContentType="none"
                    autoCapitalize="words"
                    placeholder="e.g. Jo"
                    placeholderTextColor={COLORS.secondary}
                    selectionColor={COLORS.primary}
                    returnKeyType="done"
                    onSubmitEditing={() => void finish(false)}
                    style={[styles.input, tablet && styles.tabletInput]}
                  />
                  <Text style={[styles.inputHelp, tablet && styles.tabletHelp]}>Not your full name. Change it anytime in Settings.</Text>
                </View>
                <Text style={[styles.privacyNote, tablet && styles.tabletHelp]}>Saved on this device. No account needed.</Text>
                </View>
              </View>
            )}

            <View style={[styles.footer, tablet && styles.tabletFooter, twoColumn && { width: footerWidth, alignSelf: "flex-end" }]}>
              {error && (
                <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>
                  We couldn’t save your setup. Please try again.
                </Text>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: saving, busy: saving }}
                disabled={saving}
                onPress={() => welcome ? setStep(1) : void finish(false)}
                style={({ pressed }) => [styles.button, tablet && styles.tabletButton, welcome && styles.welcomeButton, saving && styles.disabled, pressed && styles.pressed]}
              >
                <Text style={[styles.buttonText, tablet && styles.tabletLabel, welcome && styles.welcomeButtonText]}>
                  {welcome ? "Let’s get started" : saving ? "Saving…" : "Let’s practice"}
                </Text>
              </Pressable>
              {!welcome && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: saving }}
                  disabled={saving}
                  onPress={() => void finish(true)}
                  style={({ pressed }) => [styles.skip, pressed && styles.pressed]}
                >
                  <Text style={[styles.skipText, tablet && styles.tabletSmallText]}>Skip for now</Text>
                </Pressable>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StepIndicator({ step }: { step: 0 | 1 }) {
  return (
    <View accessible accessibilityLabel={`Step ${step + 2} of 3`} style={styles.steps}>
      {[0, 1, 2].map((index) => <View key={index} style={[styles.step, step === 0 && styles.darkStep, index === step + 1 && styles.activeStep]} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  tabletScroll: { paddingHorizontal: 32, paddingVertical: 24 },
  tabletWordmark: { fontSize: 36 },
  visual: { width: "100%", alignItems: "center" },
  copy: { width: "100%", alignItems: "center" },
  landscapeMain: { flexDirection: "row", gap: ONBOARDING_COLUMN_GAP },
  landscapePane: { width: undefined, flexBasis: 0, flexGrow: 1, flexShrink: 1, minWidth: 0 },
  tabletStage: { maxWidth: 420, height: 340, marginBottom: 24 },
  tabletTitle: { fontSize: 40, lineHeight: 48 },
  tabletBody: { fontSize: 20, lineHeight: 29, maxWidth: 460 },
  tabletSmallText: { fontSize: 16 },
  tabletLabel: { fontSize: 21 },
  tabletHelp: { fontSize: 16, lineHeight: 24, maxWidth: 460 },
  tabletNicknameMascot: { width: 240, height: 240 },
  landscapeNicknameMascot: { width: "100%", maxWidth: 380, height: 280 },
  tabletNicknameCard: { padding: 24 },
  tabletInput: { minHeight: 68, fontSize: 26 },
  tabletButton: { minHeight: 68 },
  tabletFooter: { width: "100%", maxWidth: 560, alignSelf: "center", paddingTop: 24 },
  screen: { flex: 1, backgroundColor: COLORS.background },
  darkScreen: { backgroundColor: WELCOME.background },
  intro: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  introBrand: { width: "100%", maxWidth: 380, aspectRatio: 1 },
  compactIntroBrand: { maxWidth: 300 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 12 },
  page: { flexGrow: 1, width: "100%", maxWidth: 480, alignSelf: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 48 },
  wordmark: { fontFamily: "NunitoSans_700Bold", fontSize: 30, color: COLORS.card, letterSpacing: -1 },
  wordmarkDot: { color: WELCOME.accent },
  steps: { flexDirection: "row", alignItems: "center", gap: 6 },
  step: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border },
  darkStep: { backgroundColor: "#665284" },
  activeStep: { width: 26, backgroundColor: COLORS.orange },
  back: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: COLORS.card, borderColor: COLORS.border, borderWidth: 1 },
  backText: { fontSize: 34, lineHeight: 38, color: COLORS.ink },
  main: { flexGrow: 1, justifyContent: "center", alignItems: "center", paddingVertical: 20 },
  mascotStage: { width: "100%", maxWidth: 340, height: 285, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  compactStage: { height: 205, marginBottom: 12 },
  orbit: { position: "absolute", width: "92%", height: "94%", borderRadius: 180, borderWidth: 1, borderColor: "#4B3570", transform: [{ rotate: "-15deg" }] },
  halo: { position: "absolute", width: "72%", height: "80%", borderRadius: 150, backgroundColor: WELCOME.surface },
  welcomeMascot: { width: "82%", height: "100%" },
  mathTile: { position: "absolute", overflow: "hidden", width: 49, height: 49, borderRadius: 16, fontFamily: "NunitoSans_700Bold", fontSize: 35, lineHeight: 47, textAlign: "center" },
  plus: { left: 5, top: "20%", color: COLORS.orange, backgroundColor: COLORS.orangeSoft, transform: [{ rotate: "-14deg" }] },
  times: { right: 2, top: "10%", color: COLORS.green, backgroundColor: COLORS.greenSoft, transform: [{ rotate: "13deg" }] },
  minus: { right: 12, bottom: "8%", color: COLORS.blue, backgroundColor: "#E4F0FF", transform: [{ rotate: "10deg" }] },
  title: { fontFamily: "NunitoSans_700Bold", fontSize: 34, lineHeight: 40, letterSpacing: -0.8, textAlign: "center", color: COLORS.ink },
  lightTitle: { color: COLORS.card },
  accent: { color: WELCOME.accent },
  body: { fontFamily: "NunitoSans_600SemiBold", fontSize: 16, lineHeight: 24, color: COLORS.secondary, textAlign: "center", marginTop: 14, maxWidth: 310 },
  lightBody: { color: WELCOME.muted },
  benefits: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 22 },
  benefit: { color: COLORS.card, fontFamily: "NunitoSans_700Bold", fontSize: 12 },
  divider: { width: 4, height: 4, borderRadius: 2, backgroundColor: WELCOME.accent },
  nicknameMascot: { width: 155, height: 155, marginBottom: 16 },
  compactNicknameMascot: { width: 105, height: 105 },
  nicknameCard: { width: "100%", marginTop: 24, padding: 20, backgroundColor: COLORS.card, borderRadius: 24, borderWidth: 1, borderColor: COLORS.border },
  labelRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12 },
  label: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 16 },
  optional: { color: COLORS.primary, backgroundColor: COLORS.primarySoft, overflow: "hidden", paddingVertical: 4, paddingHorizontal: 10, borderRadius: 9, fontFamily: "NunitoSans_700Bold", fontSize: 12 },
  input: { borderWidth: 2, borderColor: "#D9D3E8", backgroundColor: COLORS.background, borderRadius: 14, minHeight: 58, paddingHorizontal: 16, paddingVertical: 12, color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 22 },
  inputHelp: { color: COLORS.secondary, fontFamily: "NunitoSans_600SemiBold", fontSize: 13, lineHeight: 19, marginTop: 12 },
  privacyNote: { color: COLORS.secondary, fontFamily: "NunitoSans_600SemiBold", fontSize: 13, lineHeight: 20, textAlign: "center", marginTop: 18, maxWidth: 290 },
  footer: { gap: 12, paddingTop: 12 },
  button: { minHeight: 58, paddingVertical: 16, paddingHorizontal: 20, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  welcomeButton: { backgroundColor: WELCOME.accent },
  buttonText: { fontFamily: "NunitoSans_700Bold", color: COLORS.card, fontSize: 18, textAlign: "center" },
  welcomeButtonText: { color: WELCOME.background },
  skip: { minHeight: 44, alignItems: "center", justifyContent: "center", padding: 8 },
  skipText: { fontFamily: "NunitoSans_700Bold", color: COLORS.secondary, fontSize: 15 },
  error: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 14, lineHeight: 20, textAlign: "center" },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.6 },
});
