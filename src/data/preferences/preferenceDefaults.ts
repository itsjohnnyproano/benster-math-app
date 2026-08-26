import type { UserPreferences } from "@/domain/sprint";

export const DEFAULT_PREFERENCES: UserPreferences = {
  durationSeconds: 60,
  inputStyle: "multiple-choice",
  cardLayout: "horizontal",
  levelUpEnabled: true,
  darkModeEnabled: false,
};
