import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

import { resultsRepository } from "@/data/results/resultsRepository";
import { isValidSprintId } from "@/data/results/createResultsRepository";
import type { SavedSprint } from "@/domain/results";

type State =
  | { status: "loading" }
  | { status: "ready"; record: SavedSprint }
  | { status: "not-found" }
  | { status: "error" };

export function useHistorySprint(sprintId: string | null) {
  const [state, setState] = useState<State>({ status: "loading" });
  const request = useRef(0);
  const busy = useRef(false);

  const load = useCallback(() => {
    if (!isValidSprintId(sprintId)) {
      setState({ status: "not-found" });
      return;
    }
    if (busy.current) return;

    const requestId = ++request.current;
    busy.current = true;
    setState({ status: "loading" });
    resultsRepository.get(sprintId).then(
      (record) => {
        if (request.current !== requestId) return;
        busy.current = false;
        setState(record ? { status: "ready", record } : { status: "not-found" });
      },
      () => {
        if (request.current !== requestId) return;
        busy.current = false;
        setState({ status: "error" });
      },
    );
  }, [sprintId]);

  useFocusEffect(useCallback(() => {
    load();
    return () => {
      request.current += 1;
      busy.current = false;
    };
  }, [load]));

  return { state, retry: load };
}
