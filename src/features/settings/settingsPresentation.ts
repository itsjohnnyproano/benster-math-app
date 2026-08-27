import { CARD_LAYOUT_LABELS, INPUT_STYLE_LABELS } from "@/components/preferences/practiceOptions";
import { DEFAULT_PREFERENCES } from "@/data/preferences/preferenceDefaults";
import type { UserPreferences } from "@/domain/sprint";
import { formatDurationLabel } from "@/shared/formatSprintDuration";

export function formatResetPracticeMessage(
  defaults: Pick<UserPreferences, "durationSeconds" | "inputStyle" | "cardLayout" | "levelUpEnabled"> = DEFAULT_PREFERENCES,
) {
  return `Restore ${formatDurationLabel(defaults.durationSeconds)}, ${INPUT_STYLE_LABELS[defaults.inputStyle]}, ${CARD_LAYOUT_LABELS[defaults.cardLayout]} cards, and Level Up ${defaults.levelUpEnabled ? "on" : "off"}. Your nickname and saved sprints won’t change.`;
}
