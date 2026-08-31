import { SPRINT_MODE_DETAILS } from "@/config/sprintModeDetails";
import { SPRINT_MODES, type SprintMode } from "@/domain/sprint";

export type HomeModeCardConfig = {
  id: SprintMode;
  title: string;
  symbol: string;
  color: string;
  description: string;
};

const DESCRIPTIONS: Record<SprintMode, string> = {
  addition: "Build addition confidence",
  subtraction: "Make subtraction click",
  multiplication: "Strengthen times tables",
  division: "Make division click",
  mixed: "Mix all four skills",
};

export const HOME_MODE_CARDS: HomeModeCardConfig[] = SPRINT_MODES.map((id) => {
  const details = SPRINT_MODE_DETAILS[id];

  return {
    id,
    title: details.homeTitle,
    symbol: details.symbol,
    color: details.color,
    description: DESCRIPTIONS[id],
  };
});
