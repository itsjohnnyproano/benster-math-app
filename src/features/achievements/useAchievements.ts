import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { resultsRepository } from "@/data/results/resultsRepository";
import { calculateAchievements, type AchievementProgress } from "@/domain/achievements";

type AchievementState =
  | { status: "loading"; data?: never }
  | { status: "error"; data?: never }
  | { status: "ready"; data: AchievementProgress[] };

export function useAchievements(learnerId: string) {
  const [state, setState] = useState<AchievementState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useFocusEffect(useCallback(() => {
    let active = true;
    let generation = attempt;
    // Keep the existing collection visible while a returning tab refreshes its
    // local history. It avoids a distracting empty/loading flash on every tap.
    setState((current) => current.status === "ready" ? current : { status: "loading" });
    resultsRepository.listAchievementSprints(learnerId).then(
      (records) => { if (active && generation === attempt) setState({ status: "ready", data: calculateAchievements(records) }); },
      () => { if (active && generation === attempt) setState({ status: "error" }); },
    );
    return () => { active = false; generation++; };
  }, [attempt, learnerId]));

  return { ...state, retry: () => setAttempt((value) => value + 1) };
}
