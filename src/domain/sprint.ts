export const SPRINT_MODES = [
  "addition",
  "subtraction",
  "multiplication",
  "mixed",
] as const;

export const SPRINT_DURATIONS = [30, 60, 90, 120] as const;
export const INPUT_STYLES = ["multiple-choice", "typed"] as const;
export const CARD_LAYOUTS = ["horizontal", "vertical"] as const;

export type SprintMode = (typeof SPRINT_MODES)[number];
export type SprintDurationSeconds = (typeof SPRINT_DURATIONS)[number];
export type InputStyle = (typeof INPUT_STYLES)[number];
export type CardLayout = (typeof CARD_LAYOUTS)[number];

export type UserPreferences = {
  durationSeconds: SprintDurationSeconds;
  inputStyle: InputStyle;
  cardLayout: CardLayout;
  levelUpEnabled: boolean;
  darkModeEnabled: boolean;
};

export type SprintConfiguration = Readonly<{
  mode: SprintMode;
  durationSeconds: SprintDurationSeconds;
  inputStyle: InputStyle;
  cardLayout: CardLayout;
  levelUpEnabled: boolean;
}>;

export function isSprintMode(value: unknown): value is SprintMode {
  return SPRINT_MODES.includes(value as SprintMode);
}

export function isSprintDuration(
  value: unknown,
): value is SprintDurationSeconds {
  return (
    typeof value === "number" &&
    SPRINT_DURATIONS.includes(value as SprintDurationSeconds)
  );
}

export function parseSprintDuration(
  value: unknown,
): SprintDurationSeconds | undefined {
  const parsedValue = Number(value);
  return isSprintDuration(parsedValue) ? parsedValue : undefined;
}

export function isInputStyle(value: unknown): value is InputStyle {
  return INPUT_STYLES.includes(value as InputStyle);
}

export function isCardLayout(value: unknown): value is CardLayout {
  return CARD_LAYOUTS.includes(value as CardLayout);
}
