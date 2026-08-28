import type { UserPreferences } from "@/domain/sprint";

export const DEFAULT_PREFERENCES: UserPreferences = {
  onboardingCompleted: false,
  nickname: "",
  durationSeconds: 60,
  inputStyle: "multiple-choice",
  cardLayout: "horizontal",
  levelUpEnabled: true,
  darkModeEnabled: false,
};

export function resetPracticeDefaults(preferences: UserPreferences): UserPreferences {
  return {
    ...preferences,
    durationSeconds: DEFAULT_PREFERENCES.durationSeconds,
    inputStyle: DEFAULT_PREFERENCES.inputStyle,
    cardLayout: DEFAULT_PREFERENCES.cardLayout,
    levelUpEnabled: DEFAULT_PREFERENCES.levelUpEnabled,
  };
}
