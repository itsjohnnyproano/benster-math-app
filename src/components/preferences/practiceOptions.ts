import {
  SPRINT_DURATIONS,
  type CardLayout,
  type InputStyle,
  type SprintDurationSeconds,
} from "@/domain/sprint";

import { formatDurationLabel } from "@/shared/formatSprintDuration";

export type PreferenceOption<Value extends string | number = string | number> = {
  value: Value;
  label: string;
  description?: string;
  preview?: CardLayout;
};

export const DURATION_OPTIONS: readonly PreferenceOption<SprintDurationSeconds>[] =
  SPRINT_DURATIONS.map((duration) => ({
    value: duration,
    label: formatDurationLabel(duration),
  }));

export const INPUT_STYLE_LABELS: Record<InputStyle, string> = {
  "multiple-choice": "Multiple Choice",
  typed: "Typed",
};

export const CARD_LAYOUT_LABELS: Record<CardLayout, string> = {
  horizontal: "Horizontal",
  vertical: "Vertical",
  both: "Both",
};

export const INPUT_STYLE_OPTIONS: readonly PreferenceOption<InputStyle>[] = [
  {
    value: "multiple-choice",
    label: INPUT_STYLE_LABELS["multiple-choice"],
    description: "Pick from four answers",
  },
  {
    value: "typed",
    label: INPUT_STYLE_LABELS.typed,
    description: "Use the number pad",
  },
];

export const CARD_LAYOUT_OPTIONS: readonly PreferenceOption<CardLayout>[] = [
  {
    value: "horizontal",
    label: CARD_LAYOUT_LABELS.horizontal,
    preview: "horizontal",
  },
  {
    value: "vertical",
    label: CARD_LAYOUT_LABELS.vertical,
    preview: "vertical",
  },
  {
    value: "both",
    label: CARD_LAYOUT_LABELS.both,
    preview: "both",
  },
];
