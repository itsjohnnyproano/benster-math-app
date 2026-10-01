import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTabBarLayout } from "@/components/navigation/tabBarLayout";
import { PracticePreferences } from "@/components/preferences/PracticePreferences";
import { PreferenceSaveStatus } from "@/components/preferences/PreferenceSaveStatus";
import { LEGAL_LINKS } from "@/config/legalLinks";
import { MAX_NICKNAME_LENGTH, normalizeNickname } from "@/domain/nickname";
import { resultsRepository } from "@/data/results/resultsRepository";
import { usePreferences } from "@/providers/PreferencesProvider";
import { CARD_SHADOW, COLORS } from "@/theme/tokens";
import { formatResetPracticeMessage } from "./settingsPresentation";
import { getSettingsLayout } from "./settingsLayout";
import { SettingsColumns } from "./SettingsColumns";
import { ParentalGate } from "./ParentalGate";
import { useParentalGate } from "./useParentalGate";
import { confirmDeleteSavedData } from "./confirmDeleteSavedData";

export default function SettingsScreen() {
  const { contentInset, isIpad } = useTabBarLayout();
  const { width, height, fontScale } = useWindowDimensions();
  const { twoColumn, maxWidth } = getSettingsLayout(isIpad, width, height, fontScale);
  const { preferences, isReady, learners, activeLearner, switchLearner, addLearner, removeLearner, updatePreference, resetPracticePreferences, deleteAllPreferences } = usePreferences();
  // Keep an unfinished edit when rotation changes the settings container.
  const [nicknameDraft, setNicknameDraft] = useState(preferences.nickname);
  const [savedNickname, setSavedNickname] = useState(preferences.nickname);
  if (savedNickname !== preferences.nickname) {
    setSavedNickname(preferences.nickname);
    setNicknameDraft(preferences.nickname);
  }
  const [resetOpen, setResetOpen] = useState(false);
  const [profilePickerOpen, setProfilePickerOpen] = useState(false);
  const [addLearnerOpen, setAddLearnerOpen] = useState(false);
  const [newLearnerNickname, setNewLearnerNickname] = useState("");
  const [profileError, setProfileError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleting = useRef(false);
  const focused = useRef(false);
  const gate = useParentalGate();
  useFocusEffect(useCallback(() => {
    focused.current = true;
    setIsDeleting(deleting.current);
    return () => { focused.current = false; setResetOpen(false); };
  }, []));
  const deleteSavedData = async () => {
    if (deleting.current || !focused.current || !isReady) return;
    deleting.current = true;
    setIsDeleting(true);
    try {
      // Keep the existing deletion order. A failed preference clear can be retried.
      await resultsRepository.clearDevice();
      await deleteAllPreferences();
    } catch {
      if (focused.current) Alert.alert("Couldn’t delete everything", "Some data may already have been removed. Please try again from Settings.");
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
      <KeyboardAvoidingView style={styles.flex} pointerEvents={isDeleting ? "none" : "auto"} accessibilityElementsHidden={isDeleting} importantForAccessibility={isDeleting ? "no-hide-descendants" : "auto"} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <SettingsContent tablet={isIpad} twoColumn={twoColumn} maxWidth={maxWidth} bottomInset={contentInset} header={<>
          <Text accessibilityRole="header" maxFontSizeMultiplier={1.3} style={[styles.title, isIpad && styles.tabletTitle]}>Settings</Text>
          <Text maxFontSizeMultiplier={1.4} style={[styles.subtitle, isIpad && styles.tabletSubtitle]}>Make practice feel like you.</Text>
        </>} nickname={<>
          <Text accessibilityRole="header" maxFontSizeMultiplier={1.3} style={[styles.section, isIpad && styles.tabletSection]}>Learner profile</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Choose learner profile" onPress={() => setProfilePickerOpen(true)} style={({ pressed }) => [styles.profilePicker, CARD_SHADOW, isIpad && styles.tabletCard, pressed && styles.pressed]}>
            <View>
              <Text maxFontSizeMultiplier={1.3} style={[styles.profileName, isIpad && styles.tabletSectionText]}>{learnerDisplayName(activeLearner, learners)}</Text>
              <Text maxFontSizeMultiplier={1.5} style={[styles.help, styles.noBottomMargin, isIpad && styles.tabletHelp]}>Choose who is practicing</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          <Text accessibilityRole="header" maxFontSizeMultiplier={1.3} style={[styles.section, styles.nicknameSection, isIpad && styles.tabletSection]}>Nickname</Text>
          <NicknameEditor
            tablet={isIpad}
            nickname={preferences.nickname}
            draft={nicknameDraft}
            onChangeDraft={setNicknameDraft}
            disabled={!isReady}
            onSave={(nickname) => {
              setSaveSection("nickname");
              updatePreference("nickname", nickname);
            }}
          />
          {saveSection === "nickname" && <PreferenceSaveStatus />}
        </>}>
          <Text accessibilityRole="header" maxFontSizeMultiplier={1.3} style={[styles.section, isIpad && styles.tabletSection]}>Practice defaults</Text>
          <Text maxFontSizeMultiplier={1.5} style={[styles.help, styles.sectionHelp, isIpad && styles.tabletHelp]}>Changes save automatically and apply to your next sprint.</Text>
          <PracticePreferences tablet={isIpad} showSaveStatus={saveSection === "practice"} onChange={() => setSaveSection("practice")} />

          <Pressable accessibilityRole="button" disabled={!isReady || isDeleting} accessibilityState={{ disabled: !isReady || isDeleting }} onPress={() => gate.request(() => setResetOpen(true))} style={({ pressed }) => [styles.reset, pressed && styles.pressed]}>
            <Text maxFontSizeMultiplier={1.3} style={[styles.resetText, isIpad && styles.tabletButtonText]}>Reset practice defaults</Text>
          </Pressable>
          <Text maxFontSizeMultiplier={1.5} style={[styles.help, styles.centeredHelp, isIpad && styles.tabletHelp]}>Your nickname, history, and personal bests stay yours.</Text>
          <Text accessibilityRole="header" maxFontSizeMultiplier={1.3} style={[styles.section, isIpad && styles.tabletSection]}>Saved data</Text>
          <Text maxFontSizeMultiplier={1.5} style={[styles.help, styles.sectionHelp, isIpad && styles.tabletHelp]}>Permanently remove this learner’s nickname, preferences, sprint history, streak, and personal bests from this device.</Text>
          <Pressable
            accessibilityRole="button"
            disabled={!isReady || isDeleting}
            accessibilityState={{ disabled: !isReady || isDeleting }}
            onPress={() => gate.request(() => confirmDeleteSavedData(() => { void deleteSavedData(); }))}
            style={({ pressed }) => [styles.deleteButton, isIpad && styles.tabletButton, !isReady && styles.disabled, pressed && styles.pressed]}
          >
            <Text maxFontSizeMultiplier={1.3} style={[styles.deleteButtonText, isIpad && styles.tabletButtonText]}>{isDeleting ? "Deleting…" : "Delete all saved data"}</Text>
          </Pressable>
          <Text accessibilityRole="header" maxFontSizeMultiplier={1.3} style={[styles.section, isIpad && styles.tabletSection]}>About</Text>
          <View style={[styles.about, CARD_SHADOW, isIpad && styles.tabletCard]}>
            <Text maxFontSizeMultiplier={1.3} style={[styles.aboutTitle, isIpad && styles.tabletSectionText]}>Benster</Text>
            <Text maxFontSizeMultiplier={1.5} style={[styles.help, styles.aboutMeta, isIpad && styles.tabletHelp]}>Version {Constants.expoConfig?.version ?? "—"}</Text>
            <Text maxFontSizeMultiplier={1.5} style={[styles.help, styles.aboutTagline, isIpad && styles.tabletHelp]}>Little moments of practice. Lasting confidence.</Text>
            <LegalLinks tablet={isIpad} requestGate={gate.request} />
          </View>
        </SettingsContent>
      </KeyboardAvoidingView>
      {gate.visible && <ParentalGate onResolved={gate.onResolved} />}
      <Modal visible={profilePickerOpen} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setProfilePickerOpen(false)}>
        <SafeAreaView edges={["top", "left", "right", "bottom"]} style={styles.profileManagerScreen}>
          <ScrollView contentContainerStyle={styles.profileManagerContent} showsVerticalScrollIndicator={false}>
            <View style={styles.profileManagerHeader}>
              <View><Text accessibilityRole="header" style={styles.dialogTitle}>Manage learners</Text><Text style={styles.help}>Each learner keeps their own practice and progress.</Text></View>
              <Pressable accessibilityRole="button" onPress={() => setProfilePickerOpen(false)} style={styles.managerDone}><Text style={styles.resetText}>Done</Text></Pressable>
            </View>
            {learners.map((learner) => (
              <View key={learner.id} style={[styles.learnerRow, learner.id === activeLearner.id && styles.activeLearnerRow]}>
                <Pressable accessibilityRole="button" accessibilityState={{ selected: learner.id === activeLearner.id }} onPress={() => { void switchLearner(learner.id); setProfilePickerOpen(false); }} style={({ pressed }) => [styles.learnerOption, learner.id === activeLearner.id && styles.activeLearnerOption, pressed && styles.pressed]}>
                  <View style={[styles.managerAvatar, learner.id === activeLearner.id && styles.activeManagerAvatar]}><Text style={styles.managerAvatarText}>{learnerDisplayName(learner, learners).slice(0, 1).toUpperCase()}</Text></View>
                  <Text style={styles.learnerOptionText}>{learnerDisplayName(learner, learners)}</Text>
                  {learner.id === activeLearner.id && <Text style={styles.activeLearnerCheck}>✓</Text>}
                </Pressable>
                {learners.length > 1 && <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${learnerDisplayName(learner, learners)}`} onPress={() => { setProfilePickerOpen(false); gate.request(() => Alert.alert("Delete learner?", `This permanently removes ${learnerDisplayName(learner, learners)} and their local settings, history, streak, and personal bests. This cannot be undone.`, [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete learner", style: "destructive", onPress: () => { void resultsRepository.clearAll(learner.id).then(() => removeLearner(learner.id)).then(() => setProfilePickerOpen(false), () => setProfileError(true)); } },
                ])); }} style={styles.deleteLearnerButton}>
                  <Text style={styles.deleteLearnerText}>Delete</Text>
                </Pressable>}
              </View>
            ))}
            <Pressable accessibilityRole="button" onPress={() => { setProfilePickerOpen(false); gate.request(() => { setProfileError(false); setAddLearnerOpen(true); }); }} style={styles.addLearnerButton}>
              <Text style={styles.addLearnerText}>+ Add a learner</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>
      <Modal transparent visible={addLearnerOpen} animationType="fade" onRequestClose={() => setAddLearnerOpen(false)}>
        <View style={styles.backdrop}>
          <View accessibilityViewIsModal style={styles.dialog}>
            <Text accessibilityRole="header" style={styles.dialogTitle}>Add a learner</Text>
            <Text style={styles.help}>Use a nickname instead of a full name. This profile stays on this device.</Text>
            <TextInput accessibilityLabel="New learner nickname" value={newLearnerNickname} onChangeText={setNewLearnerNickname} maxLength={MAX_NICKNAME_LENGTH} placeholder="Nickname (optional)" placeholderTextColor={COLORS.secondary} autoCorrect={false} autoComplete="off" style={styles.input} />
            {profileError && <Text accessibilityLiveRegion="polite" style={styles.errorText}>Couldn’t add this learner. Please try again.</Text>}
            <Pressable accessibilityRole="button" onPress={() => { void addLearner(newLearnerNickname).then(() => { setNewLearnerNickname(""); setAddLearnerOpen(false); setProfilePickerOpen(true); }, () => setProfileError(true)); }} style={styles.button}>
              <Text style={styles.buttonText}>Add learner</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setAddLearnerOpen(false)} style={styles.reset}>
              <Text style={styles.resetText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal transparent visible={resetOpen} animationType="fade" onRequestClose={() => setResetOpen(false)}>
        <View style={styles.backdrop}>
          <View accessibilityViewIsModal style={styles.dialog}>
            <Text accessibilityRole="header" maxFontSizeMultiplier={1.3} style={styles.dialogTitle}>Reset practice defaults?</Text>
            <Text maxFontSizeMultiplier={1.5} style={styles.help}>{formatResetPracticeMessage()}</Text>
            <Pressable accessibilityRole="button" onPress={() => { setSaveSection("practice"); resetPracticePreferences(); setResetOpen(false); }} style={styles.button}>
              <Text maxFontSizeMultiplier={1.3} style={styles.buttonText}>Reset defaults</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setResetOpen(false)} style={styles.reset}>
              <Text maxFontSizeMultiplier={1.3} style={styles.resetText}>Keep my settings</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SettingsContent({ tablet, twoColumn, maxWidth, bottomInset, header, nickname, children }: {
  tablet: boolean; twoColumn: boolean; maxWidth: number; bottomInset: number;
  header: ReactNode; nickname: ReactNode; children: ReactNode;
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
    <ScrollView bounces={!tablet} keyboardShouldPersistTaps="handled" contentContainerStyle={[contentStyle, { paddingBottom: bottomInset }]} showsVerticalScrollIndicator={false}>
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
        <Pressable key={url} accessibilityRole="link" accessibilityHint="Requires a parental check, then opens in your browser" onPress={() => requestGate(() => { void openLink(url); })} style={({ pressed }) => [styles.legalLink, pressed && styles.pressed]}>
          <Text maxFontSizeMultiplier={1.3} style={[styles.resetText, tablet && styles.tabletButtonText]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function learnerDisplayName(learner: { id: string; nickname: string }, learners: readonly { id: string; nickname: string }[]) {
  if (learner.nickname) return learner.nickname;
  return `Learner ${learners.findIndex(({ id }) => id === learner.id) + 1}`;
}

function NicknameEditor({ nickname, draft, onChangeDraft, disabled, onSave, tablet = false }: { nickname: string; draft: string; onChangeDraft: (value: string) => void; disabled: boolean; onSave: (value: string) => void; tablet?: boolean }) {
  const normalized = normalizeNickname(draft);
  const unchanged = normalized === nickname;
  const save = () => {
    if (disabled || unchanged) return;
    onSave(normalized);
    onChangeDraft(normalized);
  };
  return (
    <View style={[styles.profile, CARD_SHADOW, tablet && styles.tabletCard]}>
      <Text maxFontSizeMultiplier={1.5} style={[styles.help, tablet && styles.tabletHelp]}>Optional—use a nickname, not your full name. Saved on this device.</Text>
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
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: disabled || unchanged }} disabled={disabled || unchanged} onPress={save} style={[styles.button, tablet && styles.tabletButton, (disabled || unchanged) && styles.disabled]}>
        <Text maxFontSizeMultiplier={1.3} style={[styles.buttonText, tablet && styles.tabletButtonText]}>Save nickname</Text>
      </Pressable>
      <Text maxFontSizeMultiplier={1.5} style={[styles.help, tablet && styles.tabletHelp]}>Leave it blank for a simple “Hey there!”</Text>
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
  help: { color: COLORS.secondary, fontFamily: "NunitoSans_600SemiBold", fontSize: 13, lineHeight: 19, marginBottom: 10 },
  sectionHelp: { marginBottom: 10 },
  centeredHelp: { textAlign: "center", marginTop: -5 },
  profile: { backgroundColor: COLORS.card, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: COLORS.border, gap: 8 },
  profilePicker: { backgroundColor: COLORS.card, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: COLORS.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  profileName: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 18 },
  noBottomMargin: { marginBottom: 0 },
  nicknameSection: { marginTop: 18 },
  chevron: { color: COLORS.secondary, fontFamily: "NunitoSans_600SemiBold", fontSize: 32, lineHeight: 32 },
  input: { minHeight: 52, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 14, color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 17, paddingHorizontal: 14, paddingVertical: 12 },
  button: { minHeight: 48, justifyContent: "center", alignItems: "center", paddingHorizontal: 18, paddingVertical: 12, backgroundColor: COLORS.primary, borderRadius: 16 },
  buttonText: { color: COLORS.card, fontFamily: "NunitoSans_700Bold", fontSize: 15 },
  profileManagerScreen: { flex: 1, backgroundColor: COLORS.background },
  // Keep content clear of the Dynamic Island when this modal is presented.
  profileManagerContent: { width: "100%", maxWidth: 640, alignSelf: "center", paddingHorizontal: 24, paddingTop: 112, paddingBottom: 24 },
  profileManagerHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 20 },
  managerDone: { minHeight: 44, justifyContent: "center", paddingHorizontal: 4 },
  learnerOption: { flex: 1, minHeight: 68, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, flexDirection: "row", alignItems: "center", gap: 12 },
  learnerRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 },
  activeLearnerRow: { },
  activeLearnerOption: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
  managerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.orangeSoft, justifyContent: "center", alignItems: "center" },
  activeManagerAvatar: { backgroundColor: COLORS.primary },
  managerAvatarText: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 18 },
  learnerOptionText: { flex: 1, color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 17 },
  activeLearnerCheck: { color: COLORS.primary, fontFamily: "NunitoSans_700Bold", fontSize: 20 },
  addLearnerButton: { minHeight: 52, justifyContent: "center", alignItems: "center", marginTop: 16, borderRadius: 16, borderWidth: 1.5, borderColor: COLORS.primary, borderStyle: "dashed" },
  addLearnerText: { color: COLORS.primary, fontFamily: "NunitoSans_700Bold", fontSize: 16 },
  errorText: { color: "#B42318", fontFamily: "NunitoSans_600SemiBold", fontSize: 13, marginTop: 8 },
  deleteLearnerButton: { alignSelf: "flex-end", minHeight: 36, justifyContent: "center", paddingHorizontal: 8 },
  deleteLearnerText: { color: "#B42318", fontFamily: "NunitoSans_700Bold", fontSize: 13 },
  reset: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: 16, paddingVertical: 10 },
  resetText: { color: COLORS.primary, fontFamily: "NunitoSans_700Bold", fontSize: 15 },
  deleteButton: { minHeight: 50, borderRadius: 16, borderWidth: 1.5, borderColor: COLORS.red, backgroundColor: COLORS.redSoft, alignItems: "center", justifyContent: "center", paddingHorizontal: 18, paddingVertical: 12 },
  deleteButtonText: { color: COLORS.red, fontFamily: "NunitoSans_700Bold", fontSize: 15 },
  about: { backgroundColor: COLORS.card, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: COLORS.border },
  aboutTitle: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 19, marginBottom: 2 },
  aboutMeta: { marginBottom: 1 },
  aboutTagline: { marginBottom: 0 },
  backdrop: { flex: 1, backgroundColor: "rgba(16,24,39,0.4)", justifyContent: "center", padding: 24 },
  dialog: { backgroundColor: COLORS.card, padding: 24, borderRadius: 24, gap: 12, width: "100%", maxWidth: 440, alignSelf: "center" },
  dialogTitle: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 23 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.7 },
});
