import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { AppState } from "react-native";
import { resultsRepository } from "@/data/results/resultsRepository";
import { calculatePracticeStreak, type PracticeStreak } from "@/domain/practiceStreak";

type State = { status: "loading"; data?: never } | { status: "error"; data?: never } | { status: "ready"; data: PracticeStreak };

export function usePracticeStreak() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  useFocusEffect(useCallback(() => {
    let active = true;
    let generation = 0;
    let timer: ReturnType<typeof setTimeout>;
    const refresh = async () => {
      const request = ++generation;
      clearTimeout(timer);
      setState({ status: "loading" });
      try {
        const times = await resultsRepository.listCompletionTimes();
        if (active && request === generation) setState({ status: "ready", data: calculatePracticeStreak(times) });
      } catch {
        if (active && request === generation) setState({ status: "error" });
      } finally {
        if (active && request === generation) {
          const now = new Date();
          const midnight = new Date(now);
          midnight.setHours(24, 0, 0, 0);
          timer = setTimeout(() => { void refresh(); }, midnight.getTime() - now.getTime() + 50);
        }
      }
    };
    void refresh();
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "active") void refresh();
    });
    return () => { active = false; clearTimeout(timer); subscription.remove(); };
  }, [attempt]));
  return { ...state, retry: () => setAttempt((value) => value + 1) };
}
