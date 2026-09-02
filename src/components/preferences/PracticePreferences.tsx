import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { isCardLayout, isInputStyle, isSprintDuration } from "@/domain/sprint";
import { usePreferences } from "@/providers/PreferencesProvider";
import { formatDurationLabel } from "@/shared/formatSprintDuration";
import { PreferenceRow } from "./PreferenceRow";
import { LevelUpRow } from "./LevelUpRow";
import { OptionBottomSheet } from "./OptionBottomSheet";
import { CARD_LAYOUT_OPTIONS, CARD_LAYOUT_LABELS, DURATION_OPTIONS, INPUT_STYLE_OPTIONS, INPUT_STYLE_LABELS } from "./practiceOptions";
import { PreferenceSaveStatus } from "./PreferenceSaveStatus";

type ActiveSheet = "duration" | "input-style" | "card-layout" | null;

// Shared by Setup and Settings: one set of controls and one preferences store.
export function PracticePreferences({ showSaveStatus = true, onChange, tablet = false }: { showSaveStatus?: boolean; onChange?: () => void; tablet?: boolean }) {
  const { preferences, isReady, updatePreference } = usePreferences();
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const update: typeof updatePreference = (key, value) => {
    onChange?.();
    updatePreference(key, value);
  };
  return (
    <>
      <View style={styles.list}>
          <PreferenceRow
            tablet={tablet}
            disabled={!isReady}
            label="Sprint length"
            onPress={() => setActiveSheet("duration")}
            value={formatDurationLabel(preferences.durationSeconds)}
          />
          <PreferenceRow
            tablet={tablet}
            disabled={!isReady}
            label="Input style"
            onPress={() => setActiveSheet("input-style")}
            value={INPUT_STYLE_LABELS[preferences.inputStyle]}
          />
          <PreferenceRow
            tablet={tablet}
            disabled={!isReady}
            label="Card layout"
            onPress={() => setActiveSheet("card-layout")}
            value={CARD_LAYOUT_LABELS[preferences.cardLayout]}
          />
          <LevelUpRow
            tablet={tablet}
            disabled={!isReady}
            enabled={preferences.levelUpEnabled}
            onChange={(enabled) =>
              update("levelUpEnabled", enabled)
            }
          />
      </View>
      {showSaveStatus && (
        <View style={tablet ? styles.tabletSaveStatusSlot : styles.saveStatusSlot}>
          <PreferenceSaveStatus compact={!tablet} />
        </View>
      )}
      <OptionBottomSheet
        onClose={() => setActiveSheet(null)}
        onSelect={(value) => {
          if (!isSprintDuration(value)) return;
          update("durationSeconds", value);
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
          update("inputStyle", value);
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
          update("cardLayout", value);
          setActiveSheet(null);
        }}
        options={CARD_LAYOUT_OPTIONS}
        selectedValue={preferences.cardLayout}
        title="Choose card layout"
        visible={activeSheet === "card-layout"}
      />
    </>
  );
}

const styles = StyleSheet.create({
  tabletSaveStatusSlot: { minHeight: 20 },
  list: { gap: 12 },
  saveStatusSlot: {
    height: 20,
    marginTop: 4,
    paddingRight: 20,
    alignItems: "flex-end",
    justifyContent: "center",
  },
});
