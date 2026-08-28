import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { DEFAULT_PREFERENCES, resetPracticeDefaults } from "@/data/preferences/preferenceDefaults";
import {
  deletePreferences,
  loadPreferences,
  savePreferences,
  sanitizePreferences,
} from "@/data/preferences/preferencesRepository";
import type { UserPreferences } from "@/domain/sprint";

type PreferencesContextValue = {
  preferences: UserPreferences;
  isReady: boolean;
  saveStatus: "idle" | "saving" | "saved" | "error";
  loadError: boolean;
  retryLoad: () => void;
  retrySave: () => void;
  deleteAllPreferences: () => Promise<void>;
  completeOnboarding: (nickname: string) => Promise<void>;
  resetPracticePreferences: () => void;
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
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [saveStatus, setSaveStatus] = useState<PreferencesContextValue["saveStatus"]>("idle");
  const preferencesRef = useRef(preferences);
  const mounted = useRef(false);
  const saveRevision = useRef(0);

  useEffect(() => {
    let isMounted = true;
    mounted.current = true;

    loadPreferences().then((savedPreferences) => {
      if (!isMounted) return;
      preferencesRef.current = savedPreferences;
      setPreferences(savedPreferences);
      setIsReady(true);
    }).catch(() => {
      if (isMounted) setLoadError(true);
    });

    return () => {
      isMounted = false;
      mounted.current = false;
    };
  }, [loadAttempt]);

  const value = useMemo<PreferencesContextValue>(
    () => {
      const persist = (nextPreferences: UserPreferences) => {
        const revision = ++saveRevision.current;
        setSaveStatus("saving");
        savePreferences(nextPreferences).then(() => {
          if (mounted.current && revision === saveRevision.current) setSaveStatus("saved");
        }).catch(() => {
          // Keep the current choice in memory and offer retry. Rolling back to
          // a previous optimistic value could falsely imply it was persisted.
          if (mounted.current && revision === saveRevision.current) setSaveStatus("error");
        });
      };
      const apply = (nextPreferences: UserPreferences) => {
        if (!isReady) return;
        const sanitized = sanitizePreferences(nextPreferences);
        preferencesRef.current = sanitized;
        setPreferences(sanitized);
        persist(sanitized);
      };
      return {
        preferences,
        isReady,
        saveStatus,
        loadError,
        retryLoad: () => {
          setLoadError(false);
          setLoadAttempt((attempt) => attempt + 1);
        },
        retrySave: () => { if (isReady) persist(preferencesRef.current); },
        completeOnboarding: async (nickname) => {
          if (!isReady) throw new Error("Preferences are not ready");
          const next = sanitizePreferences({
            ...preferencesRef.current,
            nickname,
            onboardingCompleted: true,
          });
          const revision = ++saveRevision.current;
          setSaveStatus("saving");
          try {
            // Commit nickname and completion together before opening Home.
            await savePreferences(next);
            if (mounted.current && revision === saveRevision.current) {
              preferencesRef.current = next;
              setPreferences(next);
              setSaveStatus("saved");
            }
          } catch (error) {
            if (mounted.current && revision === saveRevision.current) setSaveStatus("error");
            throw error;
          }
        },
        deleteAllPreferences: async () => {
          if (!isReady) throw new Error("Preferences are not ready");
          const revision = ++saveRevision.current;
          setSaveStatus("saving");
          try {
            await deletePreferences();
            if (mounted.current && revision === saveRevision.current) {
              preferencesRef.current = DEFAULT_PREFERENCES;
              setPreferences(DEFAULT_PREFERENCES);
              setSaveStatus("saved");
            }
          } catch (error) {
            if (mounted.current && revision === saveRevision.current) {
              setSaveStatus("error");
            }
            throw error;
          }
        },
        resetPracticePreferences: () => apply(resetPracticeDefaults(preferencesRef.current)),
        updatePreference: (key, nextValue) => {
          apply({
            ...preferencesRef.current,
            [key]: nextValue,
          });
        },
      };
    },
    [isReady, preferences, saveStatus, loadError],
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
