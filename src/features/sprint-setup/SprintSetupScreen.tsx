import { Image } from "expo-image";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  isCardLayout,
  isInputStyle,
  isSprintDuration,
  isSprintMode,
} from "@/domain/sprint";
import { usePreferences } from "@/providers/PreferencesProvider";
import { CARD_SHADOW, COLORS } from "@/theme/tokens";

import { LevelUpRow } from "./components/LevelUpRow";
import { OptionBottomSheet } from "./components/OptionBottomSheet";
import { PreferenceRow } from "./components/PreferenceRow";
import { SetupHeader } from "./components/SetupHeader";
import {
  formatDurationLabel,
  formatDurationSubtitle,
} from "./formatSprintDuration";
import {
  CARD_LAYOUT_OPTIONS,
  CARD_LAYOUT_LABELS,
  DURATION_OPTIONS,
  INPUT_STYLE_OPTIONS,
  INPUT_STYLE_LABELS,
} from "./sprintSetupOptions";

type ActiveSheet = "duration" | "input-style" | "card-layout" | null;

export default function SprintSetupScreen() {
  const router = useRouter();
  const { mode: modeParam } = useLocalSearchParams<{ mode?: string }>();
  const { preferences, isReady, updatePreference } = usePreferences();
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const [isStarting, setIsStarting] = useState(false);
  const mode = isSprintMode(modeParam) ? modeParam : "addition";

  useFocusEffect(
    useCallback(() => {
      setIsStarting(false);
    }, []),
  );

  const startSprint = () => {
    if (!isReady || isStarting) return;
    setIsStarting(true);

    router.push({
      pathname: "/sprint/play",
      params: {
        mode,
        durationSeconds: String(preferences.durationSeconds),
        inputStyle: preferences.inputStyle,
        cardLayout: preferences.cardLayout,
        levelUpEnabled: String(preferences.levelUpEnabled),
      },
    });
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <ScrollView
        bounces={false}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SetupHeader
          mode={mode}
          onBack={() => router.back()}
          subtitle={formatDurationSubtitle(preferences.durationSeconds)}
        />

        <View style={styles.preferenceList}>
          <PreferenceRow
            disabled={!isReady}
            label="Sprint length"
            onPress={() => setActiveSheet("duration")}
            value={formatDurationLabel(preferences.durationSeconds)}
          />
          <PreferenceRow
            disabled={!isReady}
            label="Input style"
            onPress={() => setActiveSheet("input-style")}
            value={INPUT_STYLE_LABELS[preferences.inputStyle]}
          />
          <PreferenceRow
            disabled={!isReady}
            label="Card layout"
            onPress={() => setActiveSheet("card-layout")}
            value={CARD_LAYOUT_LABELS[preferences.cardLayout]}
          />
          <LevelUpRow
            disabled={!isReady}
            enabled={preferences.levelUpEnabled}
            onChange={(enabled) =>
              updatePreference("levelUpEnabled", enabled)
            }
          />
        </View>

        <View style={styles.mascotArea}>
          <Image
            accessibilityLabel="Math Sprint penguin running"
            contentFit="contain"
            source={require("../../../assets/mascot/penguin-running.png")}
            style={styles.mascot}
          />
        </View>

        <Pressable
          accessibilityLabel="Start Sprint"
          accessibilityRole="button"
          accessibilityState={{ disabled: !isReady || isStarting }}
          disabled={!isReady || isStarting}
          onPress={startSprint}
          style={({ pressed }) => [
            styles.startButton,
            CARD_SHADOW,
            (!isReady || isStarting) && styles.disabledButton,
            pressed && styles.pressedButton,
          ]}
        >
          <Text style={styles.startButtonText}>
            {isStarting ? "Starting…" : "Start Sprint"}
          </Text>
        </Pressable>
      </ScrollView>

      <OptionBottomSheet
        onClose={() => setActiveSheet(null)}
        onSelect={(value) => {
          if (!isSprintDuration(value)) return;
          updatePreference("durationSeconds", value);
          setActiveSheet(null);
        }}
        options={DURATION_OPTIONS}
        selectedValue={preferences.durationSeconds}
        title="Choose sprint length"
        visible={activeSheet === "duration"}
      />
      <OptionBottomSheet
        onClose={() => setActiveSheet(null)}
        onSelect={(value) => {
          if (!isInputStyle(value)) return;
          updatePreference("inputStyle", value);
          setActiveSheet(null);
        }}
        options={INPUT_STYLE_OPTIONS}
        selectedValue={preferences.inputStyle}
        title="Choose input style"
        visible={activeSheet === "input-style"}
      />
      <OptionBottomSheet
        onClose={() => setActiveSheet(null)}
        onSelect={(value) => {
          if (!isCardLayout(value)) return;
          updatePreference("cardLayout", value);
          setActiveSheet(null);
        }}
        options={CARD_LAYOUT_OPTIONS}
        selectedValue={preferences.cardLayout}
        title="Choose card layout"
        visible={activeSheet === "card-layout"}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  preferenceList: {
    marginTop: 22,
    gap: 12,
  },
  mascotArea: {
    minHeight: 184,
    marginTop: 24,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  mascot: {
    width: 205,
    height: 180,
  },
  startButton: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  startButtonText: {
    color: COLORS.card,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 19,
    lineHeight: 25,
  },
  disabledButton: { opacity: 0.55 },
  pressedButton: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
