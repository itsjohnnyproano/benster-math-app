import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { AppState } from "react-native";

import type { HistoryCursor } from "@/data/results/createResultsRepository";
import { resultsRepository } from "@/data/results/resultsRepository";
import type { SavedSprint } from "@/domain/results";
import type { SprintMode } from "@/domain/sprint";

export function useHistory(mode: SprintMode | undefined) {
  const [records, setRecords] = useState<SavedSprint[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState(false);
  const [cursor, setCursor] = useState<HistoryCursor | null>(null);
  const generation = useRef(0);
  const busy = useRef(false);

  const refresh = useCallback(async () => {
    const request = ++generation.current;
    busy.current = true;
    setStatus("loading");
    setRecords([]);
    setCursor(null);
    setMoreError(false);
    setLoadingMore(false);
    try {
      const page = await resultsRepository.list({ mode });
      if (request !== generation.current) return;
      setRecords(page.records);
      setCursor(page.nextCursor);
      setStatus("ready");
    } catch {
      if (request === generation.current) setStatus("error");
    } finally {
      if (request === generation.current) busy.current = false;
    }
  }, [mode]);

  useFocusEffect(useCallback(() => {
    void refresh();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });
    return () => {
      generation.current++;
      busy.current = false;
      subscription.remove();
    };
  }, [refresh]));

  const loadMore = useCallback(async () => {
    if (!cursor || busy.current || status !== "ready") return;
    const request = generation.current;
    busy.current = true;
    setLoadingMore(true);
    setMoreError(false);
    try {
      const page = await resultsRepository.list({ mode, cursor });
      if (request !== generation.current) return;
      setRecords((current) => {
        const ids = new Set(current.map((record) => record.id));
        return [...current, ...page.records.filter((record) => !ids.has(record.id))];
      });
      setCursor(page.nextCursor);
    } catch {
      if (request === generation.current) setMoreError(true);
    } finally {
      if (request === generation.current) {
        busy.current = false;
        setLoadingMore(false);
      }
    }
  }, [cursor, mode, status]);

  return { records, status, refresh, loadMore, loadingMore, moreError, hasMore: cursor !== null };
}
