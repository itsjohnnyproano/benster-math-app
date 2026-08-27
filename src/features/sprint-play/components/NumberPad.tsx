import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS } from "@/theme/tokens";

import type { AnswerFeedback } from "../types";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

type NumberPadProps = {
  value: string;
  feedback: AnswerFeedback | null;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function NumberPad({
  value,
  feedback,
  onChange,
  onSubmit,
}: NumberPadProps) {
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
          feedback?.isCorrect && styles.correctField,
          feedback && !feedback.isCorrect && styles.wrongField,
        ]}
      >
        <Text style={[styles.answerValue, !value && styles.placeholder]}>
          {value || "Your answer"}
        </Text>
      </View>

      <View style={styles.keypad}>
        {KEYS.map((key) => (
          <NumberKey
            disabled={Boolean(feedback)}
            key={key}
            label={key}
            onPress={() => appendDigit(key)}
          />
        ))}
        <NumberKey
          accessibilityLabel="Delete last digit"
          disabled={Boolean(feedback) || !value}
          onPress={() => onChange(value.slice(0, -1))}
          symbol="delete.left"
        />
        <NumberKey
          disabled={Boolean(feedback)}
          label="0"
          onPress={() => appendDigit("0")}
        />
        <Pressable
          accessibilityLabel="Check answer"
          accessibilityRole="button"
          disabled={!value || Boolean(feedback)}
          onPress={onSubmit}
          style={({ pressed }) => [
            styles.submitKey,
            (!value || feedback) && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <SymbolView
            name={{ ios: "checkmark", android: "check", web: "check" }}
            size={24}
            tintColor={COLORS.card}
          />
        </Pressable>
      </View>

      <Text style={styles.feedbackMessage}>
        {feedback
          ? feedback.isCorrect
            ? "Correct!"
            : `Answer: ${feedback.correctAnswer}`
          : "Tap ✓ when you’re ready"}
      </Text>
    </View>
  );
}

function NumberKey({
  label,
  symbol,
  onPress,
  disabled = false,
  accessibilityLabel,
}: {
  label?: string;
  symbol?: "delete.left";
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? `Number ${label}`}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.key,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {symbol ? (
        <SymbolView
          name={{ ios: symbol, android: "backspace", web: "backspace" }}
          size={23}
          tintColor={COLORS.ink}
        />
      ) : (
        <Text style={styles.keyText}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", alignItems: "center" },
  answerField: {
    width: "100%",
    height: 54,
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
    color: COLORS.ink,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 25,
  },
  placeholder: { color: COLORS.secondary, fontSize: 16 },
  keypad: {
    width: 304,
    marginTop: 15,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  key: {
    width: 92,
    height: 46,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
  },
  submitKey: {
    width: 92,
    height: 46,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  keyText: {
    color: COLORS.ink,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 21,
  },
  feedbackMessage: {
    minHeight: 20,
    marginTop: 10,
    color: COLORS.secondary,
    fontFamily: "NunitoSans_600SemiBold",
    fontSize: 13,
    textAlign: "center",
  },
  disabled: { opacity: 0.38 },
  pressed: { opacity: 0.62, transform: [{ scale: 0.97 }] },
});
