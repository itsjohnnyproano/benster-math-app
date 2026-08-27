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

import { isSprintMode } from "@/domain/sprint";
import { usePreferences } from "@/providers/PreferencesProvider";
import { CARD_SHADOW, COLORS } from "@/theme/tokens";

import { PracticePreferences } from "@/components/preferences/PracticePreferences";
import { SetupHeader } from "./components/SetupHeader";
import { formatDurationSubtitle } from "@/shared/formatSprintDuration";

export default function SprintSetupScreen() {
  const router = useRouter();
  const { mode: modeParam } = useLocalSearchParams<{ mode?: string }>();
  const { preferences, isReady } = usePreferences();
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
          <PracticePreferences />
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
