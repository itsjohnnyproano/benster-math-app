import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { Slider as NativeSlider } from "@expo/ui/community/slider";

import { OptionBottomSheet } from "@/components/preferences/OptionBottomSheet";
import { PreferenceRow } from "@/components/preferences/PreferenceRow";
import {
  FACT_TABLES,
  PRACTICE_RANGES,
  type FactNumberLimit,
  type FactTable,
  type PracticeNumberRange,
  type PracticeRange,
} from "@/domain/practiceSelection";
import type { SprintMode } from "@/domain/sprint";
import { COLORS } from "@/theme/tokens";
import { getRangeExamples } from "./practiceChoicePresentation";

type PracticeChoicePickerProps = {
  mode: SprintMode;
  range: PracticeNumberRange | null;
  tables: FactTable[] | null;
  factNumberLimit: FactNumberLimit | null;
  tablet: boolean;
  disabled?: boolean;
  onRangeChange: (range: PracticeNumberRange | null) => void;
  onTablesChange: (tables: FactTable[] | null) => void;
  onFactNumberLimitChange: (limit: FactNumberLimit | null) => void;
};

type RangeMode = "addition" | "subtraction";
type TableMode = "multiplication" | "division";

const RANGE_DETAILS: Record<
  RangeMode,
  Record<PracticeRange, { title: string; example: string }>
> = {
  addition: {
    10: { title: "Sums through 10", example: "4 + 3" },
    20: { title: "Sums through 20", example: "8 + 7" },
    50: { title: "Sums through 50", example: "28 + 17" },
    100: { title: "Sums through 100", example: "46 + 28" },
    1000: { title: "Sums through 1,000", example: "347 + 285" },
  },
  subtraction: {
    10: { title: "Subtract within 10", example: "9 − 4" },
    20: { title: "Subtract within 20", example: "13 − 7" },
    50: { title: "Subtract within 50", example: "42 − 18" },
    100: { title: "Subtract within 100", example: "54 − 28" },
    1000: { title: "Subtract within 1,000", example: "347 − 285" },
  },
};

function formatTables(tables: FactTable[] | null) {
  if (tables === null) return "Normal sprint";
  if (tables.length === 0) return "Choose a table";
  if (tables.length === FACT_TABLES.length) return "All tables";
  return tables.map((table) => `×${table}`).join(", ");
}

function SelectionCircle({ selected }: { selected: boolean }) {
  return (
    <View
      accessibilityElementsHidden
      style={[
        styles.selectionCircle,
        selected && styles.selectedSelectionCircle,
      ]}
    >
      {selected && (
        <SymbolView
          name={{ ios: "checkmark", android: "check", web: "check" }}
          size={15}
          tintColor={COLORS.card}
        />
      )}
    </View>
  );
}

function ExampleProblems({ examples }: { examples: readonly string[] }) {
  return (
    <View style={styles.examples}>
      <Text style={styles.examplesTitle}>Example problems</Text>
      <View style={styles.exampleRow}>
        {examples.map((example, index) => (
          <Text key={`${example}-${index}`} style={styles.example}>{example}</Text>
        ))}
      </View>
    </View>
  );
}

function SaveChoiceButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
    >
      <Text style={styles.saveButtonText}>Save</Text>
    </Pressable>
  );
}

function RangeSliderPanel({
  maximum,
  onChange,
  title,
  value,
}: {
  maximum: number;
  onChange: (value: number) => void;
  title: string;
  value: number;
}) {
  return (
    <View style={styles.sliderPanel}>
      <View style={styles.sliderHeader}>
        <View>
          <Text style={styles.sliderTitle}>{title}</Text>
          <Text style={styles.sliderDescription}>Drag to set the highest number.</Text>
        </View>
        <Text style={styles.sliderValue}>{value.toLocaleString()}</Text>
      </View>
      <NativeSlider
        maximumValue={maximum}
        minimumTrackTintColor={COLORS.primary}
        minimumValue={1}
        onValueChange={(nextValue) => onChange(Math.round(nextValue))}
        step={1}
        style={styles.slider}
        value={value}
      />
      <View style={styles.sliderBounds}>
        <Text style={styles.sliderBound}>1</Text>
        <Text style={styles.sliderBound}>{maximum.toLocaleString()}</Text>
      </View>
    </View>
  );
}

function RangeChoices({
  mode,
  range,
  onChange,
  onDone,
}: {
  mode: RangeMode;
  range: PracticeNumberRange | null;
  onChange: (range: PracticeNumberRange | null) => void;
  onDone: () => void;
}) {
  const [draftRange, setDraftRange] = useState<PracticeNumberRange | null>(range);
  const [customRangeOpen, setCustomRangeOpen] = useState(
    range !== null && !PRACTICE_RANGES.some((preset) => preset === range),
  );
  const selectRange = (nextRange: PracticeNumberRange | null) => {
    setDraftRange(nextRange);
    setCustomRangeOpen(false);
  };
  const rangeTitle = mode === "addition" ? "Sums through" : "Subtract within";
  return (
    <>
      <Text style={styles.sheetSubtitle}>Pick a range for each problem.</Text>
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ selected: draftRange === null && !customRangeOpen }}
        onPress={() => selectRange(null)}
        style={({ pressed }) => [
          styles.normalChoice,
          draftRange === null && !customRangeOpen && styles.selectedChoice,
          pressed && styles.pressed,
        ]}
      >
        <View>
          <Text style={styles.choiceTitle}>Normal sprint</Text>
          <Text style={styles.choiceSubtitle}>Core fluency facts through 12</Text>
        </View>
        <SelectionCircle selected={draftRange === null && !customRangeOpen} />
      </Pressable>
      <View style={styles.rangeGrid}>
        {PRACTICE_RANGES.map((value) => {
          const selected = draftRange === value && !customRangeOpen;
          const detail = RANGE_DETAILS[mode][value];
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              key={value}
              onPress={() => selectRange(value)}
              style={({ pressed }) => [
                styles.rangeChoice,
                selected && styles.selectedChoice,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.choiceCopy}>
                <Text style={styles.choiceTitle}>{detail.title}</Text>
                <Text style={styles.choiceSubtitle}>{detail.example}</Text>
              </View>
              <SelectionCircle selected={selected} />
            </Pressable>
          );
        })}
        <Pressable
          accessibilityRole="radio"
          accessibilityState={{ selected: customRangeOpen }}
          onPress={() => {
            setCustomRangeOpen(true);
            setDraftRange(draftRange ?? 25);
          }}
          style={({ pressed }) => [
            styles.rangeChoice,
            customRangeOpen && styles.selectedChoice,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.choiceCopy}>
            <Text style={styles.choiceTitle}>Custom range</Text>
            <Text style={styles.choiceSubtitle}>Choose any number</Text>
          </View>
          <SelectionCircle selected={customRangeOpen} />
        </Pressable>
      </View>
      {customRangeOpen && (
        <RangeSliderPanel
          maximum={1000}
          onChange={setDraftRange}
          title={rangeTitle}
          value={draftRange ?? 25}
        />
      )}
      <ExampleProblems examples={getRangeExamples(mode, draftRange)} />
      <SaveChoiceButton onPress={() => {
        onChange(draftRange);
        onDone();
      }} />
    </>
  );
}

function TableChoices({
  mode,
  tables,
  factNumberLimit,
  onChange,
  onFactNumberLimitChange,
  onDone,
}: {
  mode: TableMode;
  tables: FactTable[] | null;
  factNumberLimit: FactNumberLimit | null;
  onChange: (tables: FactTable[] | null) => void;
  onFactNumberLimitChange: (limit: FactNumberLimit | null) => void;
  onDone: () => void;
}) {
  const [draftTables, setDraftTables] = useState<FactTable[] | null>(tables);
  const [draftLimit, setDraftLimit] = useState<FactNumberLimit | null>(factNumberLimit);
  const [customRangeOpen, setCustomRangeOpen] = useState(
    factNumberLimit !== null && factNumberLimit !== 12,
  );

  const selectedTables = draftTables ?? [];
  const hasSelectedTables = selectedTables.length > 0;
  const operator = mode === "multiplication" ? "×" : "÷";
  const exampleLimit = draftLimit ?? 12;
  const exampleTables = selectedTables.length > 0 ? selectedTables : [6, 7, 8];
  const exampleFactors = [
    Math.max(1, Math.round(exampleLimit * 0.25)),
    Math.max(1, Math.round(exampleLimit * 0.6)),
    exampleLimit,
  ];
  const examples = exampleFactors.map((factor, index) => {
    const table = exampleTables[index % exampleTables.length];
    return mode === "multiplication" ? `${table} × ${factor}` : `${table * factor} ÷ ${table}`;
  });
  const selectTables = (nextTables: FactTable[]) => {
    setDraftTables(nextTables);
    if (nextTables.length === 0) {
      setDraftLimit(null);
      setCustomRangeOpen(false);
    } else if (draftLimit === null) {
      setDraftLimit(12);
    }
  };
  const toggle = (table: FactTable) => {
    selectTables(
      selectedTables.includes(table)
        ? selectedTables.filter((value) => value !== table)
        : [...selectedTables, table].sort((left, right) => left - right),
    );
  };

  return (
    <>
      <Text style={styles.sheetSubtitle}>Choose one or more tables to practice.</Text>
      <View style={styles.quickActions}>
        <QuickAction label="All 1–12" onPress={() => selectTables([...FACT_TABLES])} />
        <QuickAction label="6–9" onPress={() => selectTables([6, 7, 8, 9])} />
        <QuickAction label="Normal sprint" onPress={() => {
          setDraftTables(null);
          setDraftLimit(null);
          setCustomRangeOpen(false);
        }} />
      </View>
      <View style={styles.tableGrid}>
        {FACT_TABLES.map((table) => {
          const selected = selectedTables.includes(table);
          return (
            <Pressable
              accessibilityLabel={`${operator} ${table}`}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              key={table}
              onPress={() => toggle(table)}
              style={({ pressed }) => [
                styles.tableChoice,
                selected && styles.selectedChoice,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.tableChoiceText}>{operator} {table}</Text>
              {selected && <TableCheckmark />}
            </Pressable>
          );
        })}
      </View>
      <>
        <Pressable
          accessibilityRole="radio"
          accessibilityState={{ disabled: !hasSelectedTables, selected: customRangeOpen }}
          disabled={!hasSelectedTables}
          onPress={() => {
            setCustomRangeOpen(true);
            setDraftLimit(draftLimit ?? 12);
          }}
          style={({ pressed }) => [
            styles.customRangeChoice,
            customRangeOpen && styles.selectedChoice,
            !hasSelectedTables && styles.disabledCustomRangeChoice,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.choiceCopy}>
            <Text style={styles.choiceTitle}>Custom factor range</Text>
            <Text style={styles.choiceSubtitle}>
              {hasSelectedTables
                ? mode === "multiplication"
                  ? "Choose the other factor, from 1 to 100"
                  : "Choose the quotient, from 1 to 100"
                : "Choose a table first"}
            </Text>
          </View>
          <SelectionCircle selected={customRangeOpen} />
        </Pressable>
        {hasSelectedTables && customRangeOpen && (
          <RangeSliderPanel
            maximum={100}
            onChange={setDraftLimit}
            title={mode === "multiplication" ? "Other factor" : "Quotient"}
            value={draftLimit ?? 12}
          />
        )}
      </>
      <ExampleProblems examples={examples} />
      <SaveChoiceButton onPress={() => {
        onChange(draftTables);
        onFactNumberLimitChange(draftTables !== null && draftTables.length > 0 ? draftLimit ?? 12 : null);
        onDone();
      }} />
    </>
  );
}

function QuickAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
    >
      <Text style={styles.quickActionText}>{label}</Text>
    </Pressable>
  );
}

function TableCheckmark() {
  return (
    <View accessibilityElementsHidden style={styles.tableCheckmark}>
      <SymbolView
        name={{ ios: "checkmark", android: "check", web: "check" }}
        size={13}
        tintColor={COLORS.card}
      />
    </View>
  );
}

export function PracticeChoicePicker({
  mode,
  range,
  tables,
  factNumberLimit,
  tablet,
  disabled = false,
  onRangeChange,
  onTablesChange,
  onFactNumberLimitChange,
}: PracticeChoicePickerProps) {
  const [visible, setVisible] = useState(false);
  if (mode === "mixed") return null;

  const isRangeMode = mode === "addition" || mode === "subtraction";
  const label = isRangeMode ? "Choose numbers" : "Choose tables";
  const value = isRangeMode
    ? range === null
      ? "Core facts through 12"
      : mode === "addition"
        ? `Sums through ${range.toLocaleString()}`
        : `Subtract within ${range.toLocaleString()}`
    : formatTables(tables);

  return (
    <>
      <PreferenceRow
        disabled={disabled}
        label={label}
        onPress={() => setVisible(true)}
        tablet={tablet}
        value={value}
      />
      <OptionBottomSheet
        onClose={() => setVisible(false)}
        title={label}
        visible={visible}
      >
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
        >
          {isRangeMode
            ? <RangeChoices
                key={`${visible}-${range ?? "normal"}`}
                mode={mode}
                range={range}
                onChange={onRangeChange}
                onDone={() => setVisible(false)}
              />
            : <TableChoices
                key={`${visible}-${tables?.join(",") ?? "normal"}-${factNumberLimit ?? "adaptive"}`}
                mode={mode}
                tables={tables}
                factNumberLimit={factNumberLimit}
                onChange={onTablesChange}
                onFactNumberLimitChange={onFactNumberLimitChange}
                onDone={() => setVisible(false)}
              />}
        </ScrollView>
      </OptionBottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  sheetContent: { gap: 14, paddingBottom: 8 },
  sheetSubtitle: {
    color: COLORS.secondary,
    fontFamily: "NunitoSans_400Regular",
    fontSize: 15,
    lineHeight: 21,
    marginTop: -4,
  },
  normalChoice: {
    minHeight: 66,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rangeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  rangeChoice: {
    width: "48%",
    minHeight: 68,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedChoice: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
  choiceTitle: {
    color: COLORS.ink,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 15,
    lineHeight: 20,
  },
  choiceSubtitle: {
    color: COLORS.secondary,
    fontFamily: "NunitoSans_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },
  choiceCopy: { flex: 1 },
  selectionCircle: {
    width: 25,
    height: 25,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "#D5CFDF",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  selectedSelectionCircle: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  quickActions: { flexDirection: "row", gap: 8 },
  quickAction: {
    flex: 1,
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  quickActionText: {
    color: COLORS.ink,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 13,
    lineHeight: 18,
  },
  tableGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tableChoice: {
    width: "23%",
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    position: "relative",
  },
  tableChoiceText: {
    color: COLORS.ink,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 15,
    lineHeight: 20,
  },
  customRangeChoice: {
    minHeight: 62,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  disabledCustomRangeChoice: { opacity: 0.55 },
  sliderPanel: {
    gap: 8,
    padding: 16,
    borderRadius: 18,
    backgroundColor: COLORS.primarySoft,
  },
  sliderHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  sliderTitle: { color: COLORS.ink, fontFamily: "NunitoSans_700Bold", fontSize: 15, lineHeight: 20 },
  sliderDescription: { color: COLORS.secondary, fontFamily: "NunitoSans_400Regular", fontSize: 13, lineHeight: 18 },
  sliderValue: { color: COLORS.primary, fontFamily: "NunitoSans_700Bold", fontSize: 24, lineHeight: 30 },
  slider: { height: 32, width: "100%" },
  sliderBounds: { flexDirection: "row", justifyContent: "space-between", marginTop: -2 },
  sliderBound: { color: COLORS.secondary, fontFamily: "NunitoSans_600SemiBold", fontSize: 13, lineHeight: 18 },
  tableCheckmark: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    right: -7,
    top: -7,
  },
  examples: { gap: 8, padding: 14, borderRadius: 18, backgroundColor: COLORS.primarySoft },
  examplesTitle: {
    color: COLORS.ink,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 14,
    lineHeight: 19,
  },
  exampleRow: { flexDirection: "row", gap: 8 },
  example: {
    flex: 1,
    color: COLORS.ink,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 14,
    lineHeight: 19,
    textAlign: "center",
    paddingVertical: 9,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: COLORS.card,
  },
  saveButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    color: COLORS.card,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 17,
    lineHeight: 22,
  },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
});
