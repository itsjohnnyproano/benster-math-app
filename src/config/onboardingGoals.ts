import type { OnboardingGoal } from "@/domain/sprint";

export type OnboardingGoalDetails = Readonly<{
  choiceLabel: string;
  readyLabel: string;
  resultLabel: string;
  trialLabel: string;
  paywallMessage: string;
  levelUpMessage: string;
  firstPracticePrompt: string;
}>;

export const ONBOARDING_GOAL_DETAILS: Record<OnboardingGoal, OnboardingGoalDetails> = {
  "math-facts": {
    choiceLabel: "I forget my math facts",
    readyLabel: "Remember my math facts",
    resultLabel: "remembering your math facts",
    trialLabel: "stronger math facts",
    paywallMessage: "You chose stronger math facts. Build recall with quick daily wins.",
    levelUpMessage: "Your math facts are getting stronger.",
    firstPracticePrompt: "Let’s build your math-fact confidence. Pick one to start.",
  },
  speed: {
    choiceLabel: "I want to answer faster",
    readyLabel: "Answer more quickly",
    resultLabel: "answering more quickly",
    trialLabel: "more speed",
    paywallMessage: "You chose faster answers. Keep building that speed with quick daily wins.",
    levelUpMessage: "Your speed is growing.",
    firstPracticePrompt: "Let’s build your speed. Pick one to start.",
  },
  confidence: {
    choiceLabel: "I want to feel more confident",
    readyLabel: "Feel more confident in math",
    resultLabel: "feeling more confident in math",
    trialLabel: "more confidence in math",
    paywallMessage: "You chose more confidence in math. Turn small wins into real confidence.",
    levelUpMessage: "Your math confidence is growing.",
    firstPracticePrompt: "Let’s build your confidence. Pick one to start.",
  },
  "class-ready": {
    choiceLabel: "I want to be ready for class",
    readyLabel: "Be ready for class",
    resultLabel: "getting ready for class",
    trialLabel: "class-ready math skills",
    paywallMessage: "You chose to feel ready for class. Make practice part of the plan.",
    levelUpMessage: "You’re getting more ready for class.",
    firstPracticePrompt: "Let’s get you ready for class. Pick one to start.",
  },
  practice: {
    choiceLabel: "I’m just here to practice",
    readyLabel: "Practice a little every day",
    resultLabel: "building your practice habit",
    trialLabel: "a practice habit",
    paywallMessage: "You chose a little practice. Small daily wins can add up quickly.",
    levelUpMessage: "Your practice is paying off.",
    firstPracticePrompt: "Let’s make practice a habit. Pick one to start.",
  },
};
