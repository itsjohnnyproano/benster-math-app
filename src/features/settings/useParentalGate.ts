import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

export function useParentalGate() {
  const pending = useRef<{ action: () => void } | null>(null);
  const [request, setRequest] = useState<{ action: () => void } | null>(null);
  useFocusEffect(useCallback(() => () => {
    pending.current = null;
    setRequest(null);
  }, []));

  return {
    request: (action: () => void) => {
      if (pending.current) return;
      const next = { action };
      pending.current = next;
      setRequest(next);
    },
    visible: request !== null,
    onResolved: (approved: boolean) => {
      if (!request || pending.current !== request) return;
      pending.current = null;
      setRequest(null);
      if (approved) request.action();
    },
  };
}
