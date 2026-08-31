import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AnswerReviewRow } from "@/components/sprints/AnswerReviewRow";
import type { AnsweredQuestion } from "@/domain/math-engine";
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
            <AnswerReviewRow key={answer.question.id} answer={answer} position={index + 1} />
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
});
