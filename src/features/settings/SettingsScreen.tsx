import Constants from "expo-constants";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomNavigation } from "@/components/navigation/BottomNavigation";
import { PracticePreferences } from "@/components/preferences/PracticePreferences";
import { PreferenceSaveStatus } from "@/components/preferences/PreferenceSaveStatus";
import { MAX_NICKNAME_LENGTH, normalizeNickname } from "@/domain/nickname";
import { usePreferences } from "@/providers/PreferencesProvider";
import { CARD_SHADOW, COLORS } from "@/theme/tokens";
import { formatResetPracticeMessage } from "./settingsPresentation";

export default function SettingsScreen() {
  const { preferences, isReady, updatePreference, resetPracticePreferences } = usePreferences();
  const [resetOpen, setResetOpen] = useState(false);
  // Keep the shared save/retry feedback beside the most recently edited section.
  const [saveSection, setSaveSection] = useState<"nickname" | "practice">("practice");
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
          <Text style={styles.help}>Changes save automatically and apply to your next sprint.</Text>
          <PracticePreferences showSaveStatus={saveSection === "practice"} onChange={() => setSaveSection("practice")} />

          <Pressable accessibilityRole="button" disabled={!isReady} accessibilityState={{ disabled: !isReady }} onPress={() => setResetOpen(true)} style={({ pressed }) => [styles.reset, pressed && styles.pressed]}>
            <Text style={styles.resetText}>Reset practice defaults</Text>
          </Pressable>
          <Text style={[styles.help, styles.centeredHelp]}>Your nickname, history, and personal bests stay yours.</Text>

          <Text accessibilityRole="header" style={styles.section}>About</Text>
          <View style={[styles.about, CARD_SHADOW]}>
            <Text style={styles.aboutTitle}>Math Sprint</Text>
            <Text style={styles.help}>Version {Constants.expoConfig?.version ?? "—"}</Text>
            <Text style={styles.help}>Little moments of practice. Lasting confidence.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <BottomNavigation active="settings" />
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
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 28 },
  title: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 34 },
  subtitle: { color: COLORS.secondary, fontFamily: "NunitoSans_600SemiBold", fontSize: 16, marginTop: 6 },
  section: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 19, marginTop: 28, marginBottom: 12 },
  help: { color: COLORS.secondary, fontFamily: "NunitoSans_600SemiBold", fontSize: 13, lineHeight: 19, marginBottom: 10 },
  centeredHelp: { textAlign: "center" },
  profile: { backgroundColor: COLORS.card, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: COLORS.border, gap: 8 },
  input: { minHeight: 52, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 14, color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 17, paddingHorizontal: 14, paddingVertical: 12 },
  button: { minHeight: 48, justifyContent: "center", alignItems: "center", paddingHorizontal: 18, paddingVertical: 12, backgroundColor: COLORS.primary, borderRadius: 16 },
  buttonText: { color: COLORS.card, fontFamily: "NunitoSans_700Bold", fontSize: 15 },
  reset: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: 16, paddingVertical: 10 },
  resetText: { color: COLORS.primary, fontFamily: "NunitoSans_700Bold", fontSize: 15 },
  about: { backgroundColor: COLORS.card, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: COLORS.border },
  aboutTitle: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 19, marginBottom: 6 },
  backdrop: { flex: 1, backgroundColor: "rgba(16,24,39,0.4)", justifyContent: "center", padding: 24 },
  dialog: { backgroundColor: COLORS.card, padding: 24, borderRadius: 24, gap: 12, width: "100%", maxWidth: 440, alignSelf: "center" },
  dialogTitle: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 23 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.7 },
});
