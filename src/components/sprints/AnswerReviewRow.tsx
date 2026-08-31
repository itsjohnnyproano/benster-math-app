import { StyleSheet, Text, View } from "react-native";

import type { AnsweredQuestion } from "@/domain/math-engine";
import { formatResponseTime } from "@/shared/formatResponseTime";
import { COLORS } from "@/theme/tokens";

type Props = {
  answer: AnsweredQuestion;
  emphasizeCorrection?: boolean;
  position: number;
};

export function AnswerReviewRow({ answer, emphasizeCorrection = false, position }: Props) {
  return (
    <View style={[styles.row, !answer.isCorrect && styles.incorrectRow]}>
      <View style={styles.rowTop}>
        <Text style={styles.position}>Question {position}</Text>
        <Text style={[styles.status, !answer.isCorrect && styles.incorrectStatus]}>
          {answer.isCorrect ? "✓ Correct" : "✕ Incorrect"}
        </Text>
      </View>
      <Text style={styles.equation}>
        {answer.question.leftOperand} {answer.question.operator} {answer.question.rightOperand} = {answer.question.correctAnswer}
      </Text>
      <Text style={styles.detail}>Your answer: {answer.submittedAnswer}</Text>
      {emphasizeCorrection && !answer.isCorrect && (
        <Text style={styles.correctAnswer}>Correct answer: {answer.question.correctAnswer}</Text>
      )}
      <Text style={styles.detail}>Time taken: {formatResponseTime(answer.elapsedMs)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { padding: 14, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, gap: 7, backgroundColor: COLORS.card },
  incorrectRow: { backgroundColor: COLORS.redSoft },
  rowTop: { flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 6 },
  position: { fontFamily: "NunitoSans_700Bold", color: COLORS.secondary, fontSize: 12 },
  status: { fontFamily: "NunitoSans_700Bold", color: COLORS.primary, fontSize: 13 },
  incorrectStatus: { color: COLORS.ink },
  equation: { fontFamily: "NunitoSans_700Bold", color: COLORS.ink, fontSize: 22 },
  detail: { fontFamily: "NunitoSans_600SemiBold", color: COLORS.secondary, fontSize: 14 },
  correctAnswer: { fontFamily: "NunitoSans_700Bold", color: COLORS.ink, fontSize: 14 },
});
