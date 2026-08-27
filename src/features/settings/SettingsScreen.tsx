import Constants from "expo-constants";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTabBarLayout } from "@/components/navigation/tabBarLayout";
import { PracticePreferences } from "@/components/preferences/PracticePreferences";
import { PreferenceSaveStatus } from "@/components/preferences/PreferenceSaveStatus";
import { MAX_NICKNAME_LENGTH, normalizeNickname } from "@/domain/nickname";
import { resultsRepository } from "@/data/results/resultsRepository";
import { usePreferences } from "@/providers/PreferencesProvider";
import { CARD_SHADOW, COLORS } from "@/theme/tokens";
import { formatResetPracticeMessage } from "./settingsPresentation";

export default function SettingsScreen() {
  const { contentInset } = useTabBarLayout();
  const { preferences, isReady, updatePreference, resetPracticePreferences, deleteAllPreferences } = usePreferences();
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  // Keep the shared save/retry feedback beside the most recently edited section.
  const [saveSection, setSaveSection] = useState<"nickname" | "practice">("practice");
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.screen}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: contentInset }]} showsVerticalScrollIndicator={false}>
          <Text accessibilityRole="header" style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Make practice feel like you.</Text>

          <Text accessibilityRole="header" style={styles.section}>Your nickname</Text>
          <NicknameEditor
            key={preferences.nickname}
            nickname={preferences.nickname}
            disabled={!isReady}
            onSave={(nickname) => {
              setSaveSection("nickname");
              updatePreference("nickname", nickname);
            }}
          />
          {saveSection === "nickname" && <PreferenceSaveStatus />}

          <Text accessibilityRole="header" style={styles.section}>Practice defaults</Text>
          <Text style={[styles.help, styles.sectionHelp]}>Changes save automatically and apply to your next sprint.</Text>
          <PracticePreferences showSaveStatus={saveSection === "practice"} onChange={() => setSaveSection("practice")} />

          <Pressable accessibilityRole="button" disabled={!isReady} accessibilityState={{ disabled: !isReady }} onPress={() => setResetOpen(true)} style={({ pressed }) => [styles.reset, pressed && styles.pressed]}>
            <Text style={styles.resetText}>Reset practice defaults</Text>
          </Pressable>
          <Text style={[styles.help, styles.centeredHelp]}>Your nickname, history, and personal bests stay yours.</Text>

          <Text accessibilityRole="header" style={styles.section}>Saved data</Text>
          <Text style={[styles.help, styles.sectionHelp]}>Permanently remove this learner’s nickname, preferences, sprint history, streak, and personal bests from this device.</Text>
          <Pressable
            accessibilityRole="button"
            disabled={!isReady}
            accessibilityState={{ disabled: !isReady }}
            onPress={() => {
              setDeleteError(false);
              setDeleteOpen(true);
            }}
            style={({ pressed }) => [styles.deleteButton, !isReady && styles.disabled, pressed && styles.pressed]}
          >
            <Text style={styles.deleteButtonText}>Delete all saved data</Text>
          </Pressable>

          <Text accessibilityRole="header" style={styles.section}>About</Text>
          <View style={[styles.about, CARD_SHADOW]}>
            <Text style={styles.aboutTitle}>Math Sprint</Text>
            <Text style={[styles.help, styles.aboutMeta]}>Version {Constants.expoConfig?.version ?? "—"}</Text>
            <Text style={[styles.help, styles.aboutTagline]}>Little moments of practice. Lasting confidence.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal transparent visible={resetOpen} animationType="fade" onRequestClose={() => setResetOpen(false)}>
        <View style={styles.backdrop}>
          <View accessibilityViewIsModal style={styles.dialog}>
            <Text accessibilityRole="header" style={styles.dialogTitle}>Reset practice defaults?</Text>
            <Text style={styles.help}>{formatResetPracticeMessage()}</Text>
            <Pressable accessibilityRole="button" onPress={() => { setSaveSection("practice"); resetPracticePreferences(); setResetOpen(false); }} style={styles.button}>
              <Text style={styles.buttonText}>Reset defaults</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setResetOpen(false)} style={styles.reset}>
              <Text style={styles.resetText}>Keep my settings</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal
        transparent
        visible={deleteOpen}
        animationType="fade"
        onRequestClose={() => {
          if (!isDeleting) setDeleteOpen(false);
        }}
      >
        <View style={styles.backdrop}>
          <View accessibilityViewIsModal style={styles.dialog}>
            <Text accessibilityRole="header" style={styles.dialogTitle}>Delete all saved data?</Text>
            <Text style={styles.help}>Your nickname, preferences, sprint history, day streak, and personal bests will be permanently deleted from this device. This can’t be undone.</Text>
            {deleteError && (
              <Text accessibilityLiveRegion="polite" style={styles.deleteError}>We couldn’t delete everything. Your remaining data is still on this device. Please try again.</Text>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: isDeleting }}
              disabled={isDeleting}
              onPress={async () => {
                if (isDeleting) return;
                setIsDeleting(true);
                setDeleteError(false);
                try {
                  // Clear results first. Retrying is safe if preference deletion fails afterward.
                  await resultsRepository.clearAll();
                  await deleteAllPreferences();
                  setDeleteOpen(false);
                } catch {
                  setDeleteError(true);
                } finally {
                  setIsDeleting(false);
                }
              }}
              style={({ pressed }) => [styles.confirmDeleteButton, isDeleting && styles.disabled, pressed && styles.pressed]}
            >
              <Text style={styles.confirmDeleteText}>{isDeleting ? "Deleting…" : "Delete everything"}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: isDeleting }}
              disabled={isDeleting}
              onPress={() => setDeleteOpen(false)}
              style={styles.keepDataButton}
            >
              <Text style={styles.resetText}>Keep my data</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function NicknameEditor({ nickname, disabled, onSave }: { nickname: string; disabled: boolean; onSave: (value: string) => void }) {
  const [draft, setDraft] = useState(nickname);
  const normalized = normalizeNickname(draft);
  const unchanged = normalized === nickname;
  const save = () => {
    if (disabled || unchanged) return;
    onSave(normalized);
    setDraft(normalized);
  };
  return (
    <View style={[styles.profile, CARD_SHADOW]}>
      <Text style={styles.help}>Optional—use a nickname, not your full name. Saved on this device.</Text>
      <TextInput
        accessibilityLabel="Nickname"
        editable={!disabled}
        value={draft}
        onChangeText={setDraft}
        maxLength={MAX_NICKNAME_LENGTH}
        placeholder="What should we call you?"
        placeholderTextColor={COLORS.secondary}
        autoCorrect={false}
        autoComplete="off"
        returnKeyType="done"
        onSubmitEditing={save}
        style={styles.input}
      />
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: disabled || unchanged }} disabled={disabled || unchanged} onPress={save} style={[styles.button, (disabled || unchanged) && styles.disabled]}>
        <Text style={styles.buttonText}>Save nickname</Text>
      </Pressable>
      <Text style={styles.help}>Leave it blank for a simple “Hey there!”</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  input: { minHeight: 52, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 14, color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 17, paddingHorizontal: 14, paddingVertical: 12 },
  button: { minHeight: 48, justifyContent: "center", alignItems: "center", paddingHorizontal: 18, paddingVertical: 12, backgroundColor: COLORS.primary, borderRadius: 16 },
  buttonText: { color: COLORS.card, fontFamily: "NunitoSans_700Bold", fontSize: 15 },
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
  confirmDeleteButton: { minHeight: 50, borderRadius: 16, backgroundColor: COLORS.red, alignItems: "center", justifyContent: "center", paddingHorizontal: 18, paddingVertical: 12 },
  confirmDeleteText: { color: COLORS.card, fontFamily: "NunitoSans_700Bold", fontSize: 15 },
  keepDataButton: { minHeight: 46, alignItems: "center", justifyContent: "center", paddingVertical: 10 },
  deleteError: { color: COLORS.red, fontFamily: "NunitoSans_700Bold", fontSize: 13, lineHeight: 19, textAlign: "center" },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.7 },
});
