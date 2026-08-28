import { useEffect } from "react";
import { AppState } from "react-native";

export const INTRO_DURATION_MS = 1500;

// Start after the mascot displays. Restart the brief hold after interruptions
// so returning users do not miss the intro; always clean up on unmount.
export function useIntroAdvance(ready: boolean, onComplete: () => void) {
  useEffect(() => {
    if (!ready) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const clear = () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = undefined;
    };
    const schedule = (state: string | null) => {
      clear();
      if (state === "active") timer = setTimeout(onComplete, INTRO_DURATION_MS);
    };
    const subscription = AppState.addEventListener("change", schedule);
    schedule(AppState.currentState);
    return () => {
      clear();
      subscription.remove();
    };
  }, [ready, onComplete]);
}
