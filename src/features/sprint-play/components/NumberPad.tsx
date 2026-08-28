import { Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS } from "@/theme/tokens";

import type { AnswerFeedback } from "../types";
import type { GameplayLayout } from "../gameplayLayout";

const KEY_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
] as const;

type NumberPadProps = {
  layout: GameplayLayout;
  value: string;
  feedback: AnswerFeedback | null;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function NumberPad({ value, feedback, onChange, onSubmit, layout }: NumberPadProps) {
  const isShowingFeedback = feedback !== null;
  const canSubmit = value.length > 0 && !isShowingFeedback;
  const appendDigit = (digit: string) => {
    if (feedback || value.length >= 3) return;
    onChange(value === "0" ? digit : `${value}${digit}`);
  };

  return (
    <View style={styles.container}>
      <View
        accessibilityLabel={value ? `Answer ${value}` : "Answer is empty"}
        style={[
          styles.answerField,
          { height: layout.fieldHeight },
          feedback?.isCorrect && styles.correctField,
          feedback && !feedback.isCorrect && styles.wrongField,
        ]}
      >
        <Text
          maxFontSizeMultiplier={1.2}
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[styles.answerValue, value ? styles.answerDigits : styles.placeholder]}
        >
          {value || "Your answer"}
        </Text>
      </View>

      <View style={[styles.keyboardPanel, { marginTop: layout.gap }]}>
        <View style={[styles.keypad, { gap: layout.keyGap }]}>
          {KEY_ROWS.map((row) => (
            <View key={row[0]} style={[styles.keyRow, { height: layout.keyHeight }]}>
              {row.map((key) => (
                <NumberKey disabled={isShowingFeedback} key={key} label={key} onPress={() => appendDigit(key)} />
              ))}
            </View>
          ))}
          <View style={[styles.keyRow, { height: layout.keyHeight }]}>
            <NumberKey
              accessibilityLabel="Clear answer"
              disabled={isShowingFeedback || !value}
              label="Clear"
              onPress={() => onChange("")}
              variant="action"
            />
            <NumberKey disabled={isShowingFeedback} label="0" onPress={() => appendDigit("0")} />
            <NumberKey
              accessibilityLabel="Check answer"
              disabled={!canSubmit}
              label="Check"
              onPress={onSubmit}
              variant="primary"
            />
          </View>
        </View>
      </View>

      <Text maxFontSizeMultiplier={1.2} numberOfLines={1} adjustsFontSizeToFit accessibilityLiveRegion="polite" style={styles.feedbackMessage}>
        {feedback
          ? feedback.isCorrect
            ? "Correct!"
            : `Answer: ${feedback.correctAnswer}`
          : "Type your answer, then check"}
      </Text>
    </View>
  );
}

function NumberKey({
  label,
  variant = "number",
  onPress,
  disabled = false,
  accessibilityLabel,
}: {
  label: string;
  variant?: "number" | "action" | "primary";
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? `Number ${label}`}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.key, variant === "primary" && styles.primaryKey, disabled && styles.disabled, pressed && styles.pressed]}
    >
      <Text
        maxFontSizeMultiplier={1.2}
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[styles.keyText, variant !== "number" && styles.actionText, variant === "primary" && styles.primaryText]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", alignItems: "center" },
  answerField: {
    alignSelf: "stretch",
    marginHorizontal: 24,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#D9D3E8",
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
  },
  correctField: {
    borderColor: COLORS.green,
    backgroundColor: COLORS.greenSoft,
  },
  wrongField: { borderColor: COLORS.red, backgroundColor: COLORS.redSoft },
  answerValue: {
    maxHeight: "100%",
    color: COLORS.ink,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 32,
    lineHeight: 40,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
    includeFontPadding: false,
  },
  // Nunito numerals sit slightly above the center of their line box.
  answerDigits: { transform: [{ translateY: 2 }] },
  placeholder: { color: COLORS.secondary, fontSize: 18, lineHeight: 26 },
  keyboardPanel: { width: "100%" },
  keypad: {
    width: "100%",
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: COLORS.primarySoft,
  },
  keyRow: { flexDirection: "row", gap: 6 },
  key: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    paddingHorizontal: 8,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryKey: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  actionText: {
    fontSize: 18,
    lineHeight: 24,
  },
  primaryText: { color: COLORS.card },
  keyText: {
    color: COLORS.ink,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 24,
    lineHeight: 30,
  },
  feedbackMessage: {
    height: 20,
    lineHeight: 20,
    marginHorizontal: 24,
    marginTop: 2,
    color: COLORS.secondary,
    fontFamily: "NunitoSans_600SemiBold",
    fontSize: 13,
    textAlign: "center",
  },
  disabled: { opacity: 0.38 },
  pressed: { opacity: 0.62, transform: [{ scale: 0.97 }] },
});
