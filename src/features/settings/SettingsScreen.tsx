import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useRef, useState, type ReactNode } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
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

import { useTabBarLayout } from "@/components/navigation/tabBarLayout";
import { PracticePreferences } from "@/components/preferences/PracticePreferences";
import { PreferenceSaveStatus } from "@/components/preferences/PreferenceSaveStatus";
import { LEGAL_LINKS } from "@/config/legalLinks";
import { resultsRepository } from "@/data/results/resultsRepository";
import { isDuplicateLearnerDisplayName, learnerDisplayName } from "@/domain/learner";
import { MAX_NICKNAME_LENGTH, normalizeNickname } from "@/domain/nickname";
import { usePreferences } from "@/providers/PreferencesProvider";
import { CARD_SHADOW, COLORS } from "@/theme/tokens";
import { confirmDeleteSavedData } from "./confirmDeleteSavedData";
import { ManageLearnersModal } from "./ManageLearnersModal";
import { ParentalGate } from "./ParentalGate";
import { SettingsColumns } from "./SettingsColumns";
import { getSettingsLayout } from "./settingsLayout";
import { formatResetPracticeMessage } from "./settingsPresentation";
import { useParentalGate } from "./useParentalGate";

export default function SettingsScreen() {
  const { contentInset, isIpad } = useTabBarLayout();
  const { width, height, fontScale } = useWindowDimensions();
  const { twoColumn, maxWidth } = getSettingsLayout(isIpad, width, height, fontScale);
  const {
    preferences,
    isReady,
    learners,
    activeLearner,
    renameActiveLearner,
    resetPracticePreferences,
    deleteAllPreferences,
  } = usePreferences();
  // Keep an unfinished edit when rotation changes the settings container.
  const [nicknameDraft, setNicknameDraft] = useState(preferences.nickname);
  const [savedNickname, setSavedNickname] = useState(preferences.nickname);
  if (savedNickname !== preferences.nickname) {
    setSavedNickname(preferences.nickname);
    setNicknameDraft(preferences.nickname);
  }
  const [resetOpen, setResetOpen] = useState(false);
  const [profilePickerOpen, setProfilePickerOpen] = useState(false);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleting = useRef(false);
  const focused = useRef(false);
  const gate = useParentalGate();
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      setIsDeleting(deleting.current);
      return () => {
        focused.current = false;
        setResetOpen(false);
      };
    }, [])
  );
  const deleteSavedData = async () => {
    if (deleting.current || !focused.current || !isReady) return;
    deleting.current = true;
    setIsDeleting(true);
    try {
      // Keep the existing deletion order. A failed preference clear can be retried.
      await resultsRepository.clearDevice();
      await deleteAllPreferences();
    } catch {
      if (focused.current)
        Alert.alert(
          "Couldn’t delete everything",
          "Some data may already have been removed. Please try again from Settings."
        );
    } finally {
      deleting.current = false;
      if (focused.current) setIsDeleting(false);
    }
  };
  // Keep the shared save/retry feedback beside the most recently edited section.
  const [saveSection, setSaveSection] = useState<"nickname" | "practice">("practice");
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.screen}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        pointerEvents={isDeleting ? "none" : "auto"}
        accessibilityElementsHidden={isDeleting}
        importantForAccessibility={isDeleting ? "no-hide-descendants" : "auto"}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <SettingsContent
          tablet={isIpad}
          twoColumn={twoColumn}
          maxWidth={maxWidth}
          bottomInset={contentInset}
          header={
            <>
              <Text
                accessibilityRole="header"
                maxFontSizeMultiplier={1.3}
                style={[styles.title, isIpad && styles.tabletTitle]}
              >
                Settings
              </Text>
              <Text maxFontSizeMultiplier={1.4} style={[styles.subtitle, isIpad && styles.tabletSubtitle]}>
                Make practice feel like you.
              </Text>
            </>
          }
          nickname={
            <>
              <Text
                accessibilityRole="header"
                maxFontSizeMultiplier={1.3}
                style={[styles.section, isIpad && styles.tabletSection]}
              >
                Learner profile
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Choose learner profile"
                onPress={() => setProfilePickerOpen(true)}
                style={({ pressed }) => [
                  styles.profilePicker,
                  CARD_SHADOW,
                  isIpad && styles.tabletCard,
                  pressed && styles.pressed,
                ]}
              >
                <View>
                  <Text maxFontSizeMultiplier={1.3} style={[styles.profileName, isIpad && styles.tabletSectionText]}>
                    {learnerDisplayName(activeLearner, learners)}
                  </Text>
                  <Text
                    maxFontSizeMultiplier={1.5}
                    style={[styles.help, styles.noBottomMargin, isIpad && styles.tabletHelp]}
                  >
                    Choose who is practicing
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
              <Text
                accessibilityRole="header"
                maxFontSizeMultiplier={1.3}
                style={[styles.section, styles.nicknameSection, isIpad && styles.tabletSection]}
              >
                Nickname
              </Text>
              <NicknameEditor
                tablet={isIpad}
                nickname={preferences.nickname}
                draft={nicknameDraft}
                onChangeDraft={(value) => {
                  setNicknameError(null);
                  setNicknameDraft(value);
                }}
                disabled={!isReady}
                onSave={(nickname) => {
                  setSaveSection("nickname");
                  if (
                    isDuplicateLearnerDisplayName(
                      nickname,
                      learners,
                      activeLearner.id,
                    )
                  ) {
                    setNicknameError("That nickname is already being used by another learner.");
                    return;
                  }
                  void renameActiveLearner(nickname).catch(() =>
                    setNicknameError("Couldn’t save this nickname. Please try again.")
                  );
                }}
                error={nicknameError}
              />
              {saveSection === "nickname" && <PreferenceSaveStatus />}
            </>
          }
        >
          <Text
            accessibilityRole="header"
            maxFontSizeMultiplier={1.3}
            style={[styles.section, isIpad && styles.tabletSection]}
          >
            Practice defaults
          </Text>
          <Text maxFontSizeMultiplier={1.5} style={[styles.help, styles.sectionHelp, isIpad && styles.tabletHelp]}>
            Changes save automatically and apply to your next sprint.
          </Text>
          <PracticePreferences
            tablet={isIpad}
            showSaveStatus={saveSection === "practice"}
            onChange={() => setSaveSection("practice")}
          />

          <Pressable
            accessibilityRole="button"
            disabled={!isReady || isDeleting}
            accessibilityState={{ disabled: !isReady || isDeleting }}
            onPress={() => gate.request(() => setResetOpen(true))}
            style={({ pressed }) => [styles.reset, pressed && styles.pressed]}
          >
            <Text maxFontSizeMultiplier={1.3} style={[styles.resetText, isIpad && styles.tabletButtonText]}>
              Reset practice defaults
            </Text>
          </Pressable>
          <Text maxFontSizeMultiplier={1.5} style={[styles.help, styles.centeredHelp, isIpad && styles.tabletHelp]}>
            Your nickname, history, and personal bests stay yours.
          </Text>
          <Text
            accessibilityRole="header"
            maxFontSizeMultiplier={1.3}
            style={[styles.section, isIpad && styles.tabletSection]}
          >
            Saved data
          </Text>
          <Text maxFontSizeMultiplier={1.5} style={[styles.help, styles.sectionHelp, isIpad && styles.tabletHelp]}>
            Permanently remove this learner’s nickname, preferences, sprint history, streak, and personal bests from
            this device.
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={!isReady || isDeleting}
            accessibilityState={{ disabled: !isReady || isDeleting }}
            onPress={() =>
              gate.request(() =>
                confirmDeleteSavedData(() => {
                  void deleteSavedData();
                })
              )
            }
            style={({ pressed }) => [
              styles.deleteButton,
              isIpad && styles.tabletButton,
              !isReady && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Text maxFontSizeMultiplier={1.3} style={[styles.deleteButtonText, isIpad && styles.tabletButtonText]}>
              {isDeleting ? "Deleting…" : "Delete all saved data"}
            </Text>
          </Pressable>
          <Text
            accessibilityRole="header"
            maxFontSizeMultiplier={1.3}
            style={[styles.section, isIpad && styles.tabletSection]}
          >
            About
          </Text>
          <View style={[styles.about, CARD_SHADOW, isIpad && styles.tabletCard]}>
            <Text maxFontSizeMultiplier={1.3} style={[styles.aboutTitle, isIpad && styles.tabletSectionText]}>
              Benster
            </Text>
            <Text maxFontSizeMultiplier={1.5} style={[styles.help, styles.aboutMeta, isIpad && styles.tabletHelp]}>
              Version {Constants.expoConfig?.version ?? "—"}
            </Text>
            <Text maxFontSizeMultiplier={1.5} style={[styles.help, styles.aboutTagline, isIpad && styles.tabletHelp]}>
              Little moments of practice. Lasting confidence.
            </Text>
            <LegalLinks tablet={isIpad} requestGate={gate.request} />
          </View>
        </SettingsContent>
      </KeyboardAvoidingView>
      {/* A gate for the base Settings screen belongs above its content. Gates
          requested from the full-screen learner manager render inside that
          modal below so they are immediately visible on iPhone and iPad. */}
      {gate.visible && <ParentalGate onResolved={gate.onResolved} />}
      <ManageLearnersModal
        visible={profilePickerOpen}
        tablet={isIpad}
        onClose={() => setProfilePickerOpen(false)}
        onOpen={() => setProfilePickerOpen(true)}
      />
      <Modal transparent visible={resetOpen} animationType="fade" onRequestClose={() => setResetOpen(false)}>
        <View style={styles.backdrop}>
          <View accessibilityViewIsModal style={styles.dialog}>
            <Text accessibilityRole="header" maxFontSizeMultiplier={1.3} style={styles.dialogTitle}>
              Reset practice defaults?
            </Text>
            <Text maxFontSizeMultiplier={1.5} style={styles.help}>
              {formatResetPracticeMessage()}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setSaveSection("practice");
                resetPracticePreferences();
                setResetOpen(false);
              }}
              style={styles.button}
            >
              <Text maxFontSizeMultiplier={1.3} style={styles.buttonText}>
                Reset defaults
              </Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setResetOpen(false)} style={styles.reset}>
              <Text maxFontSizeMultiplier={1.3} style={styles.resetText}>
                Keep my settings
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SettingsContent({
  tablet,
  twoColumn,
  maxWidth,
  bottomInset,
  header,
  nickname,
  children,
}: {
  tablet: boolean;
  twoColumn: boolean;
  maxWidth: number;
  bottomInset: number;
  header: ReactNode;
  nickname: ReactNode;
  children: ReactNode;
}) {
  const contentStyle = [styles.content, tablet && styles.tabletContent, tablet && { maxWidth }];
  if (twoColumn) {
    return (
      <View style={[contentStyle, styles.flex]}>
        {header}
        <SettingsColumns nickname={nickname} bottomInset={bottomInset}>
          {children}
        </SettingsColumns>
      </View>
    );
  }
  return (
    <ScrollView
      bounces={!tablet}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[contentStyle, { paddingBottom: bottomInset }]}
      showsVerticalScrollIndicator={false}
    >
      {header}
      {nickname}
      {children}
    </ScrollView>
  );
}

function LegalLinks({ tablet, requestGate }: { tablet: boolean; requestGate: (action: () => void) => void }) {
  const opening = useRef(false);
  const openLink = async (url: string) => {
    if (opening.current) return;
    opening.current = true;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Couldn’t open this page", `Please try again, or visit ${url} in your browser.`);
    } finally {
      opening.current = false;
    }
  };
  return (
    <View style={styles.legalLinks}>
      {LEGAL_LINKS.map(({ label, url }) => (
        <Pressable
          key={url}
          accessibilityRole="link"
          accessibilityHint="Requires a parental check, then opens in your browser"
          onPress={() =>
            requestGate(() => {
              void openLink(url);
            })
          }
          style={({ pressed }) => [styles.legalLink, pressed && styles.pressed]}
        >
          <Text maxFontSizeMultiplier={1.3} style={[styles.resetText, tablet && styles.tabletButtonText]}>
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function NicknameEditor({
  nickname,
  draft,
  onChangeDraft,
  disabled,
  onSave,
  error,
  tablet = false,
}: {
  nickname: string;
  draft: string;
  onChangeDraft: (value: string) => void;
  disabled: boolean;
  onSave: (value: string) => void;
  error: string | null;
  tablet?: boolean;
}) {
  const normalized = normalizeNickname(draft);
  const unchanged = normalized === nickname;
  const save = () => {
    if (disabled || unchanged) return;
    onSave(normalized);
    onChangeDraft(normalized);
  };
  return (
    <View style={[styles.profile, CARD_SHADOW, tablet && styles.tabletCard]}>
      <Text maxFontSizeMultiplier={1.5} style={[styles.help, tablet && styles.tabletHelp]}>
        Optional—use a nickname, not your full name. Saved on this device.
      </Text>
      <TextInput
        accessibilityLabel="Nickname"
        editable={!disabled}
        value={draft}
        onChangeText={onChangeDraft}
        maxLength={MAX_NICKNAME_LENGTH}
        placeholder="What should we call you?"
        placeholderTextColor={COLORS.secondary}
        autoCorrect={false}
        autoComplete="off"
        returnKeyType="done"
        onSubmitEditing={save}
        maxFontSizeMultiplier={1.3}
        style={[styles.input, tablet && styles.tabletInput]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || unchanged }}
        disabled={disabled || unchanged}
        onPress={save}
        style={[styles.button, tablet && styles.tabletButton, (disabled || unchanged) && styles.disabled]}
      >
        <Text maxFontSizeMultiplier={1.3} style={[styles.buttonText, tablet && styles.tabletButtonText]}>
          Save nickname
        </Text>
      </Pressable>
      {error && (
        <Text accessibilityLiveRegion="polite" style={styles.errorText}>
          {error}
        </Text>
      )}
      <Text maxFontSizeMultiplier={1.5} style={[styles.help, tablet && styles.tabletHelp]}>
        Leave it blank for a simple “Hey there!”
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabletContent: { width: "100%", alignSelf: "center", paddingHorizontal: 32 },
  legalLinks: { marginTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border },
  legalLink: { minHeight: 48, paddingVertical: 12, justifyContent: "center", alignItems: "flex-start" },
  tabletTitle: { fontSize: 40 },
  tabletSubtitle: { fontSize: 19 },
  tabletSection: { fontSize: 24, marginBottom: 10 },
  tabletSectionText: { fontSize: 24 },
  tabletHelp: { fontSize: 16, lineHeight: 24 },
  tabletCard: { padding: 24 },
  tabletInput: { minHeight: 60, fontSize: 20 },
  tabletButton: { minHeight: 58 },
  tabletButtonText: { fontSize: 18, textAlign: "center" },
  screen: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 24 },
  title: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 34 },
  subtitle: { color: COLORS.secondary, fontFamily: "NunitoSans_600SemiBold", fontSize: 16, marginTop: 2 },
  section: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 19, marginTop: 28, marginBottom: 5 },
  help: {
    color: COLORS.secondary,
    fontFamily: "NunitoSans_600SemiBold",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  sectionHelp: { marginBottom: 10 },
  centeredHelp: { textAlign: "center", marginTop: -5 },
  profile: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  profilePicker: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  profileName: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 18 },
  noBottomMargin: { marginBottom: 0 },
  nicknameSection: { marginTop: 18 },
  chevron: { color: COLORS.secondary, fontFamily: "NunitoSans_600SemiBold", fontSize: 32, lineHeight: 32 },
  input: {
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    color: COLORS.ink,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 17,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  button: {
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
  },
  buttonText: { color: COLORS.card, fontFamily: "NunitoSans_700Bold", fontSize: 15 },
  errorText: { color: "#B42318", fontFamily: "NunitoSans_600SemiBold", fontSize: 13, marginTop: 8 },
  reset: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: 16, paddingVertical: 10 },
  resetText: { color: COLORS.primary, fontFamily: "NunitoSans_700Bold", fontSize: 15 },
  deleteButton: {
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.red,
    backgroundColor: COLORS.redSoft,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  deleteButtonText: { color: COLORS.red, fontFamily: "NunitoSans_700Bold", fontSize: 15 },
  about: { backgroundColor: COLORS.card, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: COLORS.border },
  aboutTitle: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 19, marginBottom: 2 },
  aboutMeta: { marginBottom: 1 },
  aboutTagline: { marginBottom: 0 },
  backdrop: { flex: 1, backgroundColor: "rgba(16,24,39,0.4)", justifyContent: "center", padding: 24 },
  dialog: {
    backgroundColor: COLORS.card,
    padding: 24,
    borderRadius: 24,
    gap: 12,
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
  },
  dialogTitle: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 23 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.7 },
});
