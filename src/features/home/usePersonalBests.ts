import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { resultsRepository } from "@/data/results/resultsRepository";
import type { PersonalBests } from "@/data/results/createResultsRepository";
import type { SprintDurationSeconds } from "@/domain/sprint";

export function usePersonalBests(duration: SprintDurationSeconds, preferencesReady: boolean) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{
    duration: SprintDurationSeconds;
    attempt: number;
    status: "loading" | "loaded" | "error";
    bests: PersonalBests;
  }>({ duration, attempt, status: "loading", bests: {} });

  useFocusEffect(useCallback(() => {
    if (!preferencesReady) return;
    let active = true;
    setState({ duration, attempt, status: "loading", bests: {} });
    resultsRepository.getPersonalBests(duration).then(
      (bests) => { if (active) setState({ duration, attempt, status: "loaded", bests }); },
      () => { if (active) setState({ duration, attempt, status: "error", bests: {} }); },
    );
    return () => { active = false; };
  }, [duration, preferencesReady, attempt]));

  const isCurrent = state.duration === duration
    && state.attempt === attempt
    && preferencesReady;
  return {
    bests: isCurrent ? state.bests : {},
    status: isCurrent ? state.status : "loading",
    retry: () => setAttempt((current) => current + 1),
  };
}
