import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { DEFAULT_PREFERENCES } from "@/data/preferences/preferenceDefaults";
import {
  loadPreferences,
  savePreferences,
} from "@/data/preferences/preferencesRepository";
import type { UserPreferences } from "@/domain/sprint";

type PreferencesContextValue = {
  preferences: UserPreferences;
  isReady: boolean;
  updatePreference: <Key extends keyof UserPreferences>(
    key: Key,
    value: UserPreferences[Key],
  ) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: PropsWithChildren) {
  const [preferences, setPreferences] =
    useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isReady, setIsReady] = useState(false);
  const preferencesRef = useRef(preferences);

  useEffect(() => {
    let isMounted = true;

    loadPreferences().then((savedPreferences) => {
      if (!isMounted) return;
      preferencesRef.current = savedPreferences;
      setPreferences(savedPreferences);
      setIsReady(true);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      preferences,
      isReady,
      updatePreference: (key, nextValue) => {
        if (!isReady) return;

        const previousPreferences = preferencesRef.current;
        const nextPreferences = {
          ...previousPreferences,
          [key]: nextValue,
        };

        preferencesRef.current = nextPreferences;
        setPreferences(nextPreferences);

        savePreferences(nextPreferences).catch(() => {
          if (preferencesRef.current !== nextPreferences) return;
          preferencesRef.current = previousPreferences;
          setPreferences(previousPreferences);
        });
      },
    }),
    [isReady, preferences],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);

  if (!context) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }

  return context;
}
