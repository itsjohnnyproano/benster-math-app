import { Pressable, StyleSheet, Text, View } from "react-native";

import { CARD_SHADOW, COLORS } from "@/theme/tokens";

import type { AnswerFeedback } from "../types";
import type { GameplayLayout } from "../gameplayLayout";

type MultipleChoiceAnswersProps = {
  choices: readonly number[];
  feedback: AnswerFeedback | null;
  layout: GameplayLayout;
  onSelect: (answer: number) => void;
};

export function MultipleChoiceAnswers({
  choices,
  feedback,
  layout,
  onSelect,
}: MultipleChoiceAnswersProps) {
  return (
    <View style={[styles.grid, { rowGap: layout.choiceGap }]}>
      {choices.map((choice) => {
        const isSubmitted = feedback?.submittedAnswer === choice;
        const isCorrect = feedback?.correctAnswer === choice;
        const isWrongSelection = Boolean(feedback && isSubmitted && !isCorrect);

        return (
          <Pressable
            accessibilityLabel={`Answer ${choice}`}
            accessibilityRole="button"
            disabled={Boolean(feedback)}
            key={choice}
            onPress={() => onSelect(choice)}
            style={({ pressed }) => [
              styles.answer,
              { height: layout.choiceHeight },
              CARD_SHADOW,
              feedback && isCorrect && styles.correctAnswer,
              isWrongSelection && styles.wrongAnswer,
              pressed && styles.pressed,
            ]}
          >
            <Text
              maxFontSizeMultiplier={1.2}
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[
                styles.answerText,
                feedback && isCorrect && styles.feedbackText,
                isWrongSelection && styles.feedbackText,
              ]}
            >
              {choice}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  answer: {
    width: "47.7%",
    borderRadius: 17,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
  },
  answerText: {
    color: COLORS.ink,
    fontFamily: "NunitoSans_700Bold",
    fontSize: 23,
  },
  correctAnswer: {
    borderColor: COLORS.green,
    backgroundColor: COLORS.green,
  },
  wrongAnswer: {
    borderColor: COLORS.red,
    backgroundColor: COLORS.red,
  },
  feedbackText: { color: COLORS.card },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
});
