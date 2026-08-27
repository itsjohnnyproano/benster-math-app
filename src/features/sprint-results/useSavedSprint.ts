import { useEffect, useState } from "react";
import { resultsRepository } from "@/data/results/resultsRepository";
import type { SprintResult } from "@/domain/math-engine";
import type { SavedSprint } from "@/domain/results";

type SaveState =
  | { status: "saving"; saved: null }
  | { status: "error"; saved: null }
  | { status: "saved"; saved: SavedSprint };

export function useSavedSprint(id: string, result: SprintResult) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<SaveState>({ status: "saving", saved: null });
  useEffect(() => {
    let active = true;
    resultsRepository.save(id, result).then(
      (saved) => { if (active) setState({ status: "saved", saved }); },
      () => { if (active) setState({ status: "error", saved: null }); },
    );
    return () => { active = false; };
  }, [id, result, attempt]);

  return {
    ...state,
    retry: () => {
      if (state.status !== "error") return;
      setState({ status: "saving", saved: null });
      setAttempt((current) => current + 1);
    },
  };
}
