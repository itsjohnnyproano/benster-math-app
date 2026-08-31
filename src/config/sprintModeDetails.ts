import type { SprintMode } from "@/domain/sprint";
import { COLORS } from "@/theme/tokens";

export type SprintModeDetails = Readonly<{
  title: string;
  homeTitle: string;
  symbol: string;
  color: string;
}>;

export const SPRINT_MODE_DETAILS: Record<SprintMode, SprintModeDetails> = {
  addition: {
    title: "Addition",
    homeTitle: "Addition",
    symbol: "+",
    color: COLORS.orange,
  },
  subtraction: {
    title: "Subtraction",
    homeTitle: "Subtraction",
    symbol: "−",
    color: COLORS.blue,
  },
  multiplication: {
    title: "Multiplication",
    homeTitle: "Multiplication",
    symbol: "×",
    color: COLORS.green,
  },
  division: {
    title: "Division",
    homeTitle: "Division",
    symbol: "÷",
    color: COLORS.teal,
  },
  mixed: {
    title: "Mixed",
    homeTitle: "Mixed Sprint",
    symbol: "±×÷",
    color: COLORS.primary,
  },
};
