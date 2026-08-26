import { COLORS } from "@/theme/tokens";
import type { SprintMode } from "@/domain/sprint";

export type HomeModeCardConfig = {
  id: SprintMode;
  title: string;
  symbol: string;
  color: string;
};

export const HOME_MODE_CARDS: HomeModeCardConfig[] = [
  {
    id: "addition",
    title: "Addition",
    symbol: "+",
    color: COLORS.orange,
  },
  {
    id: "subtraction",
    title: "Subtraction",
    symbol: "−",
    color: COLORS.blue,
  },
  {
    id: "multiplication",
    title: "Multiplication",
    symbol: "×",
    color: COLORS.green,
  },
];
