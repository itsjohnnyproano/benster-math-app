import { StyleSheet, Text, View } from "react-native";

import type { MathQuestion } from "@/domain/math-engine";
import type { CardLayout } from "@/domain/sprint";
import { CARD_SHADOW, COLORS } from "@/theme/tokens";

type QuestionCardProps = {
  height: number;
  layout: CardLayout;
  question: MathQuestion;
};

export function QuestionCard({ layout, question, height }: QuestionCardProps) {
  const isVertical = layout === "vertical";
  // Equation sizing belongs to the card's height budget rather than OS text
  // scaling; the complete equation remains available to screen readers.
  const fontSize = Math.min(48, Math.max(24, (height - 20) / 2.6));
  const numberStyle = { fontSize, lineHeight: fontSize * 1.15 };
  const operatorStyle = { fontSize: fontSize * 0.8, lineHeight: fontSize * 1.15 };

  return (
    <View
      accessibilityLabel={`${question.leftOperand} ${question.operator} ${question.rightOperand}`}
      style={[
        styles.card,
        CARD_SHADOW,
        isVertical ? styles.verticalCard : styles.horizontalCard,
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
          <Text maxFontSizeMultiplier={1} style={[styles.horizontalOperator, operatorStyle]}>{question.operator}</Text>
          <Text maxFontSizeMultiplier={1} style={[styles.horizontalNumber, numberStyle]}>{question.rightOperand}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: "center",
    maxWidth: "90%",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(109, 69, 232, 0.08)",
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
  },
  horizontalCard: { width: 272 },
  verticalCard: { width: 260 },
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
