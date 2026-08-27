import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { AnsweredQuestion } from "@/domain/math-engine";
import { formatResponseTime } from "../resultPresentation";
import { COLORS } from "@/theme/tokens";

export function AnswerReview({ answers }: { answers: readonly AnsweredQuestion[] }) {
  const [expanded, setExpanded] = useState(false);
  const incorrectCount = answers.filter((answer) => !answer.isCorrect).length;
  if (answers.length === 0) return null;

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded(!expanded)}
        style={({ pressed }) => [styles.heading, pressed && { opacity: 0.7 }]}
      >
        <View style={styles.headingCopy}>
          <Text style={styles.title}>Review answers</Text>
          <Text style={styles.subtitle}>{answers.length} answered · {incorrectCount} incorrect</Text>
        </View>
        <Text style={styles.expand}>{expanded ? "−" : "+"}</Text>
      </Pressable>
      {expanded && (
        <View style={styles.list}>
          <Text style={styles.note}>Time is measured from each question appearing to your answer. Feedback time is excluded.</Text>
          {answers.map((answer, index) => (
            <View key={answer.question.id} style={[styles.row, !answer.isCorrect && styles.incorrectRow]}>
              <View style={styles.rowTop}>
                <Text style={styles.position}>Question {index + 1}</Text>
                <Text style={[styles.correct, !answer.isCorrect && styles.incorrect]}>
                  {answer.isCorrect ? "✓ Correct" : "✕ Incorrect"}
                </Text>
              </View>
              <Text style={styles.equation}>
                {answer.question.leftOperand} {answer.question.operator} {answer.question.rightOperand} = {answer.question.correctAnswer}
              </Text>
              <Text style={styles.answer}>Your answer: {answer.submittedAnswer}</Text>
              <Text style={styles.answer}>Time taken: {formatResponseTime(answer.elapsedMs)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.card, borderRadius: 22, borderWidth: 1, borderColor: COLORS.border },
  heading: { padding: 18, minHeight: 76, flexDirection: "row", alignItems: "center", gap: 12 },
  headingCopy: { flex: 1 },
  title: { fontFamily: "NunitoSans_700Bold", fontSize: 18, color: COLORS.ink },
  subtitle: { marginTop: 4, fontFamily: "NunitoSans_600SemiBold", fontSize: 13, color: COLORS.secondary },
  expand: { fontSize: 28, color: COLORS.primary },
  list: { padding: 14, paddingTop: 0, gap: 10 },
  note: { fontFamily: "NunitoSans_600SemiBold", fontSize: 13, lineHeight: 19, color: COLORS.secondary, marginBottom: 4 },
  row: { padding: 14, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, gap: 7 },
  incorrectRow: { backgroundColor: COLORS.redSoft },
  rowTop: { flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 6 },
  position: { fontFamily: "NunitoSans_700Bold", color: COLORS.secondary, fontSize: 12 },
  equation: { fontFamily: "NunitoSans_700Bold", color: COLORS.ink, fontSize: 22 },
  answer: { fontFamily: "NunitoSans_600SemiBold", color: COLORS.secondary, fontSize: 14 },
  correct: { fontFamily: "NunitoSans_700Bold", color: COLORS.primary, fontSize: 13 },
  incorrect: { color: COLORS.ink },
});
