import {
  SPRINT_DURATIONS,
  type CardLayout,
  type InputStyle,
  type SprintDurationSeconds,
  type SprintMode,
} from "@/domain/sprint";
import { COLORS } from "@/theme/tokens";

import { formatDurationLabel } from "./formatSprintDuration";

export type SetupOption<Value extends string | number = string | number> = {
  value: Value;
  label: string;
  description?: string;
  preview?: CardLayout;
};

export const DURATION_OPTIONS: readonly SetupOption<SprintDurationSeconds>[] =
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
};

export const INPUT_STYLE_OPTIONS: readonly SetupOption<InputStyle>[] = [
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

export const CARD_LAYOUT_OPTIONS: readonly SetupOption<CardLayout>[] = [
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
];

export const MODE_DETAILS: Record<
  SprintMode,
  { title: string; symbol: string; color: string }
> = {
  addition: { title: "Addition", symbol: "+", color: COLORS.orange },
  subtraction: { title: "Subtraction", symbol: "−", color: COLORS.blue },
  multiplication: {
    title: "Multiplication",
    symbol: "×",
    color: COLORS.green,
  },
};
