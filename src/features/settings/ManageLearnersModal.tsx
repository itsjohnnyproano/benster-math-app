import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";
import { useState } from "react";

import { resultsRepository } from "@/data/results/resultsRepository";
import {
  isDuplicateLearnerDisplayName,
  learnerDisplayName,
  nextAvailableLearnerDefaultName,
  PROFILE_COLOR_IDS,
} from "@/domain/learner";
import { MAX_NICKNAME_LENGTH } from "@/domain/nickname";
import { usePreferences } from "@/providers/PreferencesProvider";
import { PROFILE_COLORS } from "@/theme/profileColors";
import { COLORS } from "@/theme/tokens";
import { ParentalGate } from "./ParentalGate";
import { useParentalGate } from "./useParentalGate";

type PendingCleanup = Readonly<{
  learnerId: string;
  displayName: string;
  preferences: boolean;
  history: boolean;
}>;

export function ManageLearnersModal({
  visible,
  tablet,
  onClose,
  onOpen,
}: {
  visible: boolean;
  tablet: boolean;
  onClose: () => void;
  onOpen: () => void;
}) {
  const {
    learners,
    activeLearner,
    switchLearner,
    addLearner,
    removeLearner,
    retryRemovedLearnerPreferencesCleanup,
    updateLearnerColor,
  } = usePreferences();
  const gate = useParentalGate();
  const [addOpen, setAddOpen] = useState(false);
  const [openAddAfterManagerDismiss, setOpenAddAfterManagerDismiss] = useState(false);
  const [openManagerAfterAddDismiss, setOpenManagerAfterAddDismiss] = useState(false);
  const [newLearnerNickname, setNewLearnerNickname] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [pendingCleanups, setPendingCleanups] = useState<readonly PendingCleanup[]>([]);
  const [colorPickerLearnerId, setColorPickerLearnerId] = useState<string | null>(null);
  const [colorError, setColorError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const remove = async (learnerId: string) => {
    setProfileError(null);
    const learner = learners.find(({ id }) => id === learnerId);
    const displayName = learner ? learnerDisplayName(learner, learners) : "this learner";
    let preferencesCleared: boolean;
    try {
      ({ localPreferencesCleared: preferencesCleared } = await removeLearner(learnerId));
    } catch {
      setProfileError("Couldn’t remove this learner. Please try again.");
      return;
    }
    let historyCleared = true;
    try {
      await resultsRepository.clearAll(learnerId);
    } catch {
      historyCleared = false;
    }
    if (preferencesCleared && historyCleared) {
      onClose();
      return;
    }
    setPendingCleanups((current) => [
      ...current.filter((cleanup) => cleanup.learnerId !== learnerId),
      { learnerId, displayName, preferences: !preferencesCleared, history: !historyCleared },
    ]);
    setProfileError(
      "The learner was removed, but some local data could not be cleared. Retry cleanup to finish removing it."
    );
  };

  const retryCleanup = async (learnerId: string) => {
    const pending = pendingCleanups.find((cleanup) => cleanup.learnerId === learnerId);
    if (!pending) return;
    setProfileError(null);
    const preferencesCleared =
      !pending.preferences || (await retryRemovedLearnerPreferencesCleanup(learnerId));
    let historyCleared = !pending.history;
    if (pending.history) {
      try {
        await resultsRepository.clearAll(learnerId);
        historyCleared = true;
      } catch {
        historyCleared = false;
      }
    }
    if (preferencesCleared && historyCleared) {
      setPendingCleanups((current) => current.filter((cleanup) => cleanup.learnerId !== learnerId));
      return;
    }
    setPendingCleanups((current) =>
      current.map((cleanup) =>
        cleanup.learnerId === learnerId
          ? { ...cleanup, preferences: !preferencesCleared, history: !historyCleared }
          : cleanup
      )
    );
    setProfileError("Some local data could not be cleared. Retry cleanup to finish removing it.");
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={onClose}
        onDismiss={() => {
          if (!openAddAfterManagerDismiss) return;
          setOpenAddAfterManagerDismiss(false);
          setAddOpen(true);
        }}
      >
        <SafeAreaProvider>
          <SafeAreaView edges={["top", "left", "right", "bottom"]} style={styles.screen}>
            <View style={styles.viewport}>
              <ScrollView
                contentContainerStyle={[
                  styles.content,
                  tablet && styles.tabletContent,
                  { paddingTop: tablet ? 104 : 10 },
                ]}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.header}>
                  <View style={styles.titleRow}>
                    <Text accessibilityRole="header" style={styles.title}>
                      Manage learners
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={onClose}
                      style={[styles.done, tablet && styles.tabletDone]}
                    >
                      <Text style={styles.link}>Done</Text>
                    </Pressable>
                  </View>
                  <Text
                    adjustsFontSizeToFit
                    maxFontSizeMultiplier={1.2}
                    minimumFontScale={0.82}
                    numberOfLines={1}
                    style={styles.help}
                  >
                    Each learner keeps their own practice and progress.
                  </Text>
                  {profileError && (
                    <Text accessibilityLiveRegion="polite" style={styles.error}>
                      {profileError}
                    </Text>
                  )}
                  {pendingCleanups.map((cleanup) => (
                    <Pressable
                      key={cleanup.learnerId}
                      accessibilityRole="button"
                      accessibilityLabel={`Retry cleanup for ${cleanup.displayName}`}
                      onPress={() => void retryCleanup(cleanup.learnerId)}
                      style={styles.retry}
                    >
                      <Text style={styles.link}>Retry cleanup for {cleanup.displayName}</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={[styles.list, tablet && styles.tabletList]}>
                  {learners.map((learner) => {
                    const color = PROFILE_COLORS[learner.colorId];
                    const displayName = learnerDisplayName(learner, learners);
                    return (
                      <View key={learner.id} style={[styles.group, tablet && styles.tabletGroup]}>
                        <View style={styles.row}>
                          <View
                            style={[
                              styles.option,
                              tablet && styles.tabletOption,
                              learner.id === activeLearner.id && styles.activeOption,
                            ]}
                          >
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`Change ${displayName}'s profile color`}
                              accessibilityHint="Opens ten color choices"
                              onPress={() => {
                                setColorError(null);
                                setColorPickerLearnerId((current) =>
                                  current === learner.id ? null : learner.id
                                );
                              }}
                              style={({ pressed }) => [
                                styles.avatar,
                                { backgroundColor: color.background },
                                pressed && styles.pressed,
                              ]}
                            >
                              <Text style={[styles.avatarText, { color: color.foreground }]}>
                                {displayName.slice(0, 1).toUpperCase()}
                              </Text>
                            </Pressable>
                            <Pressable
                              accessibilityRole="button"
                              accessibilityState={{ selected: learner.id === activeLearner.id }}
                              onPress={() => {
                                void switchLearner(learner.id);
                                onClose();
                              }}
                              style={({ pressed }) => [styles.select, pressed && styles.pressed]}
                            >
                              <Text style={styles.optionText}>{displayName}</Text>
                              {learner.id === activeLearner.id && (
                                <Text style={styles.check}>✓</Text>
                              )}
                            </Pressable>
                          </View>
                          {learners.length > 1 && (
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`Delete ${displayName}`}
                              onPress={() => {
                                setProfileError(null);
                                gate.request(() =>
                                  Alert.alert(
                                    "Delete learner?",
                                    `This permanently removes ${displayName} and their local settings, history, streak, and personal bests. This cannot be undone.`,
                                    [
                                      { text: "Cancel", style: "cancel" },
                                      {
                                        text: "Delete learner",
                                        style: "destructive",
                                        onPress: () => void remove(learner.id),
                                      },
                                    ]
                                  )
                                );
                              }}
                              style={[styles.delete, tablet && styles.tabletDelete]}
                            >
                              <SymbolView
                                name={{
                                  ios: "trash",
                                  android: "delete_outline",
                                  web: "delete_outline",
                                }}
                                size={24}
                                tintColor="#B42318"
                              />
                            </Pressable>
                          )}
                        </View>
                        {colorPickerLearnerId === learner.id && (
                          <View
                            accessibilityLabel={`Choose a color for ${displayName}`}
                            style={styles.colors}
                          >
                            {PROFILE_COLOR_IDS.map((colorId) => {
                              const option = PROFILE_COLORS[colorId];
                              return (
                                <Pressable
                                  key={colorId}
                                  accessibilityRole="button"
                                  accessibilityLabel={option.label}
                                  accessibilityState={{ selected: learner.colorId === colorId }}
                                  onPress={() => {
                                    setColorError(null);
                                    void updateLearnerColor(learner.id, colorId).then(
                                      () => setColorPickerLearnerId(null),
                                      () =>
                                        setColorError(
                                          "Couldn’t update this color. Please try again."
                                        )
                                    );
                                  }}
                                  style={({ pressed }) => [
                                    styles.color,
                                    { backgroundColor: option.background },
                                    learner.colorId === colorId && styles.selectedColor,
                                    pressed && styles.pressed,
                                  ]}
                                >
                                  {learner.colorId === colorId && (
                                    <Text style={[styles.colorCheck, { color: option.foreground }]}>
                                      ✓
                                    </Text>
                                  )}
                                </Pressable>
                              );
                            })}
                          </View>
                        )}
                        {colorPickerLearnerId === learner.id && colorError && (
                          <Text accessibilityLiveRegion="polite" style={styles.error}>
                            {colorError}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      gate.request(() => {
                        setProfileError(null);
                        // iOS cannot reliably present a second native modal while
                        // this full-screen manager is still animating away.
                        if (Platform.OS === "ios") setOpenAddAfterManagerDismiss(true);
                        onClose();
                        if (Platform.OS !== "ios") setAddOpen(true);
                      })
                    }
                    style={[styles.add, tablet && styles.tabletAdd]}
                  >
                    <Text style={styles.addText}>+ Add a learner</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
            {gate.visible && <ParentalGate onResolved={gate.onResolved} />}
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
      <Modal
        transparent
        visible={addOpen}
        animationType="fade"
        onRequestClose={() => {
          if (!isAdding) setAddOpen(false);
        }}
        onDismiss={() => {
          if (!openManagerAfterAddDismiss) return;
          setOpenManagerAfterAddDismiss(false);
          onOpen();
        }}
      >
        <View style={styles.backdrop}>
          <View accessibilityViewIsModal style={styles.dialog}>
            <Text accessibilityRole="header" style={styles.title}>
              Add a learner
            </Text>
            <Text style={styles.help}>
              Use a nickname instead of a full name. This profile stays on this device.
            </Text>
            <TextInput
              accessibilityLabel="New learner nickname"
              value={newLearnerNickname}
              onChangeText={setNewLearnerNickname}
              maxLength={MAX_NICKNAME_LENGTH}
              placeholder="Nickname (optional)"
              placeholderTextColor={COLORS.secondary}
              autoCorrect={false}
              autoComplete="off"
              style={styles.input}
            />
            {profileError && (
              <Text accessibilityLiveRegion="polite" style={styles.error}>
                {profileError}
              </Text>
            )}
            <Pressable
              accessibilityRole="button"
              disabled={isAdding}
              accessibilityState={{ disabled: isAdding }}
              onPress={() => {
                if (isAdding) return;
                setIsAdding(true);
                void addLearner(newLearnerNickname)
                  .then(
                    () => {
                      setNewLearnerNickname("");
                      if (Platform.OS === "ios") setOpenManagerAfterAddDismiss(true);
                      setAddOpen(false);
                      if (Platform.OS !== "ios") onOpen();
                    },
                    () =>
                      setProfileError(
                        isDuplicateLearnerDisplayName(
                          newLearnerNickname,
                          learners,
                          undefined,
                          nextAvailableLearnerDefaultName(learners)
                        )
                          ? "That nickname is already being used by another learner."
                          : "Couldn’t add this learner. Please try again."
                      )
                  )
                  .finally(() => setIsAdding(false));
              }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>{isAdding ? "Adding…" : "Add learner"}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isAdding}
              accessibilityState={{ disabled: isAdding }}
              onPress={() => {
                if (!isAdding) setAddOpen(false);
              }}
              style={[styles.cancel, isAdding && styles.disabled]}
            >
              <Text style={styles.link}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  viewport: { flex: 1, overflow: "hidden" },
  content: {
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  tabletContent: { maxWidth: 860, paddingHorizontal: 32, paddingBottom: 40 },
  header: { marginBottom: 20 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 23 },
  done: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  tabletDone: { width: 64 },
  help: {
    color: COLORS.secondary,
    fontFamily: "NunitoSans_600SemiBold",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  error: { color: "#B42318", fontFamily: "NunitoSans_600SemiBold", fontSize: 13, marginTop: 8 },
  retry: { alignSelf: "flex-start", minHeight: 44, justifyContent: "center", marginTop: 4 },
  link: { color: COLORS.primary, fontFamily: "NunitoSans_700Bold", fontSize: 15 },
  list: { width: "100%" },
  tabletList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    columnGap: 16,
    rowGap: 16,
  },
  group: { marginBottom: 4 },
  tabletGroup: { width: "48%", marginBottom: 0 },
  row: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 },
  option: {
    flex: 1,
    minHeight: 68,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tabletOption: { backgroundColor: COLORS.card },
  activeOption: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontFamily: "NunitoSans_700Bold", fontSize: 18 },
  select: { flex: 1, minHeight: 52, flexDirection: "row", alignItems: "center", gap: 8 },
  optionText: { flex: 1, color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 17 },
  check: { color: COLORS.primary, fontFamily: "NunitoSans_700Bold", fontSize: 20 },
  delete: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  tabletDelete: { width: 64 },
  colors: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  color: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedColor: { borderWidth: 3, borderColor: COLORS.ink },
  colorCheck: { fontFamily: "NunitoSans_700Bold", fontSize: 18 },
  add: {
    minHeight: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
  },
  tabletAdd: { width: "100%", marginTop: 4 },
  addText: { color: COLORS.primary, fontFamily: "NunitoSans_700Bold", fontSize: 16 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(16,24,39,0.4)",
    justifyContent: "center",
    padding: 24,
  },
  dialog: {
    backgroundColor: COLORS.card,
    padding: 24,
    borderRadius: 24,
    gap: 12,
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
  },
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
  cancel: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingVertical: 10,
  },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.7 },
});
