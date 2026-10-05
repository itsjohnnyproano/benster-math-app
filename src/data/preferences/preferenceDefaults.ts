import type { UserPreferences } from "@/domain/sprint";

export const DEFAULT_PREFERENCES: UserPreferences = {
  onboardingCompleted: false,
  nickname: "",
  durationSeconds: 60,
  inputStyle: "multiple-choice",
  cardLayout: "horizontal",
  levelUpEnabled: true,
  darkModeEnabled: false,
  additionRange: null,
  subtractionRange: null,
  multiplicationTables: null,
  divisionTables: null,
  multiplicationOtherFactorMax: null,
  divisionQuotientMax: null,
};

export function resetPracticeDefaults(preferences: UserPreferences): UserPreferences {
  return {
    ...preferences,
    durationSeconds: DEFAULT_PREFERENCES.durationSeconds,
    inputStyle: DEFAULT_PREFERENCES.inputStyle,
    cardLayout: DEFAULT_PREFERENCES.cardLayout,
    levelUpEnabled: DEFAULT_PREFERENCES.levelUpEnabled,
    additionRange: DEFAULT_PREFERENCES.additionRange,
    subtractionRange: DEFAULT_PREFERENCES.subtractionRange,
    multiplicationTables: DEFAULT_PREFERENCES.multiplicationTables,
    divisionTables: DEFAULT_PREFERENCES.divisionTables,
    multiplicationOtherFactorMax: DEFAULT_PREFERENCES.multiplicationOtherFactorMax,
    divisionQuotientMax: DEFAULT_PREFERENCES.divisionQuotientMax,
  };
}
