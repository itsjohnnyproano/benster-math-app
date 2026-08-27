import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { MathQuestion } from "@/domain/math-engine";
import type { ConcreteCardLayout } from "@/domain/sprint";
import { CARD_SHADOW, COLORS } from "@/theme/tokens";

type QuestionCardProps = {
  height: number;
  layout: ConcreteCardLayout;
  question: MathQuestion;
};

export function QuestionCard({ layout, question, height }: QuestionCardProps) {
  const isVertical = layout === "vertical";
  const [cardWidth, setCardWidth] = useState(272);
  // Equation sizing belongs to the card's height budget rather than OS text
  // scaling; the complete equation remains available to screen readers.
  const leftDigits = String(question.leftOperand).length;
  const rightDigits = String(question.rightOperand).length;
  const digitCount = isVertical ? Math.max(leftDigits, rightDigits) : leftDigits + rightDigits;
  // Reserve padding, operator width, and gaps even for equations like 100 + 100.
  const widthLimit = (cardWidth - 64) / (digitCount * 0.65 + 0.8);
  const fontSize = Math.min(60, widthLimit, Math.max(24, (height - 20) / 2.6));
  const numberStyle = { fontSize, lineHeight: fontSize * 1.15 };
  const operatorStyle = { fontSize: fontSize * 0.8, lineHeight: fontSize * 1.15 };

  return (
    <View
      onLayout={({ nativeEvent }) => setCardWidth(nativeEvent.layout.width)}
      accessibilityLabel={`${question.leftOperand} ${question.operator} ${question.rightOperand}`}
      style={[
        styles.card,
        CARD_SHADOW,
        { height },
      ]}
    >
      {isVertical ? (
        <View style={styles.verticalProblem}>
          <Text maxFontSizeMultiplier={1} style={[styles.verticalNumber, numberStyle]}>{question.leftOperand}</Text>
          <View style={styles.verticalSecondRow}>
            <Text maxFontSizeMultiplier={1} style={[styles.operator, operatorStyle]}>{question.operator}</Text>
            <Text maxFontSizeMultiplier={1} style={[styles.verticalNumber, numberStyle]}>{question.rightOperand}</Text>
          </View>
          <View style={styles.answerLine} />
        </View>
      ) : (
        <View style={styles.horizontalProblem}>
          <Text maxFontSizeMultiplier={1} style={[styles.horizontalNumber, numberStyle]}>{question.leftOperand}</Text>
          <Text
            maxFontSizeMultiplier={1}
            style={[
              styles.horizontalOperator,
              operatorStyle,
              // Align the symbol's visible center with Nunito's numeral ink.
              { transform: [{ translateY: -fontSize * 0.15 }] },
            ]}
          >
            {question.operator}
          </Text>
          <Text maxFontSizeMultiplier={1} style={[styles.horizontalNumber, numberStyle]}>{question.rightOperand}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: "center",
    width: "90%",
    maxWidth: 340,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(109, 69, 232, 0.08)",
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
  },
  horizontalProblem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  horizontalNumber: {
    color: COLORS.ink,
    fontFamily: "NunitoSans_700Bold",
  },
  horizontalOperator: {
    color: COLORS.primary,
    fontFamily: "NunitoSans_700Bold",
  },
  verticalProblem: { minWidth: 112, alignItems: "flex-end" },
  verticalNumber: {
    color: COLORS.ink,
    fontFamily: "NunitoSans_700Bold",
  },
  verticalSecondRow: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  operator: {
    color: COLORS.primary,
    fontFamily: "NunitoSans_700Bold",
  },
  answerLine: {
    alignSelf: "stretch",
    height: 4,
    marginTop: 7,
    borderRadius: 2,
    backgroundColor: COLORS.ink,
  },
});
