import { StyleSheet, Text, View } from "react-native";

import type { MathQuestion } from "@/domain/math-engine";
import type { CardLayout } from "@/domain/sprint";
import { CARD_SHADOW, COLORS } from "@/theme/tokens";

type QuestionCardProps = {
  layout: CardLayout;
  question: MathQuestion;
};

export function QuestionCard({ layout, question }: QuestionCardProps) {
  const isVertical = layout === "vertical";

  return (
    <View
      accessibilityLabel={`${question.leftOperand} ${question.operator} ${question.rightOperand}`}
      style={[
        styles.card,
        CARD_SHADOW,
        isVertical ? styles.verticalCard : styles.horizontalCard,
      ]}
    >
      {isVertical ? (
        <View style={styles.verticalProblem}>
          <Text style={styles.verticalNumber}>{question.leftOperand}</Text>
          <View style={styles.verticalSecondRow}>
            <Text style={styles.operator}>{question.operator}</Text>
            <Text style={styles.verticalNumber}>{question.rightOperand}</Text>
          </View>
          <View style={styles.answerLine} />
        </View>
      ) : (
        <View style={styles.horizontalProblem}>
          <Text style={styles.horizontalNumber}>{question.leftOperand}</Text>
          <Text style={styles.horizontalOperator}>{question.operator}</Text>
          <Text style={styles.horizontalNumber}>{question.rightOperand}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(109, 69, 232, 0.08)",
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
  },
  horizontalCard: { width: 272, height: 146 },
  verticalCard: { width: 260, height: 220 },
  horizontalProblem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  horizontalNumber: {
    color: COLORS.ink,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 48,
    lineHeight: 58,
  },
  horizontalOperator: {
    color: COLORS.primary,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 39,
    lineHeight: 48,
  },
  verticalProblem: { minWidth: 112, alignItems: "flex-end" },
  verticalNumber: {
    color: COLORS.ink,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 48,
    lineHeight: 55,
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
    fontSize: 37,
  },
  answerLine: {
    alignSelf: "stretch",
    height: 4,
    marginTop: 7,
    borderRadius: 2,
    backgroundColor: COLORS.ink,
  },
});
