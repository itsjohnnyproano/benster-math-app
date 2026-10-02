import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useRef, useState } from "react";

import { deleteLearnerRegistry, loadLearnerRegistry, saveLearnerRegistry, type LearnerRegistry } from "@/data/learners/learnersRepository";
import { DEFAULT_PREFERENCES, resetPracticeDefaults } from "@/data/preferences/preferenceDefaults";
import { deletePreferences, loadLearnerPreferences, loadPreferences, savePreferences, sanitizePreferences } from "@/data/preferences/preferencesRepository";
import { createLearnerId, defaultProfileColorId, LEGACY_LEARNER_ID, MAX_LOCAL_LEARNERS, nextAvailableProfileColorId, type Learner, type ProfileColorId } from "@/domain/learner";
import { isDuplicateNickname, normalizeNickname } from "@/domain/nickname";
import type { UserPreferences } from "@/domain/sprint";

type PreferencesContextValue = {
  preferences: UserPreferences;
  learners: readonly Learner[];
  activeLearner: Learner;
  isReady: boolean;
  saveStatus: "idle" | "saving" | "saved" | "error";
  loadError: boolean;
  retryLoad: () => void;
  resetUnreadablePreferences: () => Promise<void>;
  retrySave: () => void;
  deleteAllPreferences: () => Promise<void>;
  completeOnboarding: (nickname: string) => Promise<void>;
  resetPracticePreferences: () => void;
  updatePreference: <Key extends keyof UserPreferences>(key: Key, value: UserPreferences[Key]) => void;
  renameActiveLearner: (nickname: string) => Promise<void>;
  switchLearner: (learnerId: string) => Promise<void>;
  addLearner: (nickname: string) => Promise<void>;
  updateLearnerColor: (learnerId: string, colorId: ProfileColorId) => Promise<void>;
  removeLearner: (learnerId: string) => Promise<{ localPreferencesCleared: boolean }>;
  profilePickerVisible: boolean;
  openProfilePicker: () => void;
  closeProfilePicker: () => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: PropsWithChildren) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [registry, setRegistry] = useState<LearnerRegistry>({
    activeLearnerId: LEGACY_LEARNER_ID,
    learners: [{ id: LEGACY_LEARNER_ID, nickname: "", colorId: defaultProfileColorId(LEGACY_LEARNER_ID), createdAtMs: 0 }],
  });
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [saveStatus, setSaveStatus] = useState<PreferencesContextValue["saveStatus"]>("idle");
  const [profilePickerVisible, setProfilePickerVisible] = useState(false);
  const preferencesRef = useRef(preferences);
  const registryRef = useRef<LearnerRegistry | null>(null);
  const mounted = useRef(false);
  const saveRevision = useRef(0);
  const learnerMutationQueue = useRef<Promise<void> | null>(null);

  const serializeLearnerMutation = <Value,>(operation: () => Promise<Value>) => {
    const pending = learnerMutationQueue.current
      ? learnerMutationQueue.current.then(operation, operation)
      : operation();
    learnerMutationQueue.current = pending.then(() => undefined, () => undefined);
    return pending;
  };

  useEffect(() => {
    let isMounted = true;
    mounted.current = true;
    (async () => {
      const legacyPreferences = await loadPreferences();
      const loadedRegistry = await loadLearnerRegistry(legacyPreferences.nickname);
      const active = loadedRegistry.learners.find(({ id }) => id === loadedRegistry.activeLearnerId);
      if (!active) throw new Error("Saved learner profile could not be found");
      const learnerPreferences = await loadLearnerPreferences(active.id, legacyPreferences);
      if (!isMounted) return;
      registryRef.current = loadedRegistry;
      preferencesRef.current = learnerPreferences;
      setRegistry(loadedRegistry);
      setPreferences(learnerPreferences);
      setIsReady(true);
      setProfilePickerVisible(loadedRegistry.learners.length > 1);
    })().catch(() => { if (isMounted) setLoadError(true); });
    return () => { isMounted = false; mounted.current = false; };
  }, [loadAttempt]);

  const value = useMemo<PreferencesContextValue>(() => {
    const activeLearner = registry.learners.find(({ id }) => id === registry.activeLearnerId);
    if (!activeLearner) throw new Error("Active learner profile is missing");
    const persist = (nextPreferences: UserPreferences) => {
      const revision = ++saveRevision.current;
      const learnerId = registryRef.current?.activeLearnerId;
      if (!learnerId) return;
      setSaveStatus("saving");
      savePreferences(nextPreferences, learnerId).then(
        () => { if (mounted.current && revision === saveRevision.current) setSaveStatus("saved"); },
        () => { if (mounted.current && revision === saveRevision.current) setSaveStatus("error"); },
      );
    };
    const apply = (nextPreferences: UserPreferences) => {
      if (!isReady) return;
      const sanitized = sanitizePreferences(nextPreferences);
      preferencesRef.current = sanitized;
      setPreferences(sanitized);
      persist(sanitized);
    };
    const saveLearnerName = (learnerId: string, nextPreferences: UserPreferences) => serializeLearnerMutation(async () => {
      const current = registryRef.current;
      const learner = current?.learners.find(({ id }) => id === learnerId);
      if (!current || !learner) throw new Error("Unknown learner profile");
      if (isDuplicateNickname(nextPreferences.nickname, current.learners
        .filter(({ id }) => id !== learnerId)
        .map(({ nickname }) => nickname))) {
        throw new Error("A learner already uses that nickname");
      }
      const revision = ++saveRevision.current;
      const nextRegistry: LearnerRegistry = {
        ...current,
        learners: current.learners.map((currentLearner) => currentLearner.id === learnerId
          ? { ...currentLearner, nickname: nextPreferences.nickname } : currentLearner),
      };
      setSaveStatus("saving");
      try {
        await savePreferences(nextPreferences, learner.id);
        await saveLearnerRegistry(nextRegistry);
        if (mounted.current && revision === saveRevision.current) {
          registryRef.current = nextRegistry;
          preferencesRef.current = nextPreferences;
          setRegistry(nextRegistry);
          setPreferences(nextPreferences);
          setSaveStatus("saved");
        }
      } catch (error) {
        if (mounted.current && revision === saveRevision.current) setSaveStatus("error");
        throw error;
      }
    });
    return {
      preferences,
      learners: registry.learners,
      activeLearner,
      isReady,
      saveStatus,
      loadError,
      retryLoad: () => { setLoadError(false); setLoadAttempt((attempt) => attempt + 1); },
      resetUnreadablePreferences: async () => {
        if (isReady) throw new Error("Preferences are already available");
        await deletePreferences();
        await deleteLearnerRegistry();
        if (mounted.current) {
          setLoadError(false);
          setLoadAttempt((attempt) => attempt + 1);
        }
      },
      retrySave: () => { if (isReady) persist(preferencesRef.current); },
      completeOnboarding: async (nickname) => {
        if (!isReady) throw new Error("Preferences are not ready");
        const learnerId = registryRef.current?.activeLearnerId;
        if (!learnerId) throw new Error("Learner profiles are not ready");
        await saveLearnerName(learnerId, sanitizePreferences({ ...preferencesRef.current, nickname, onboardingCompleted: true }));
      },
      deleteAllPreferences: () => serializeLearnerMutation(async () => {
        if (!isReady) throw new Error("Preferences are not ready");
        const revision = ++saveRevision.current;
        setSaveStatus("saving");
        try {
          const current = registryRef.current!;
          await Promise.all(current.learners.map((learner) => deletePreferences(learner.id)));
          await deletePreferences();
          await deleteLearnerRegistry();
          if (mounted.current && revision === saveRevision.current) {
            const nextRegistry: LearnerRegistry = {
              activeLearnerId: LEGACY_LEARNER_ID,
              learners: [{ id: LEGACY_LEARNER_ID, nickname: "", colorId: defaultProfileColorId(LEGACY_LEARNER_ID), createdAtMs: 0 }],
            };
            registryRef.current = nextRegistry;
            preferencesRef.current = DEFAULT_PREFERENCES;
            setRegistry(nextRegistry);
            setPreferences(DEFAULT_PREFERENCES);
            setSaveStatus("saved");
          }
        } catch (error) {
          if (mounted.current && revision === saveRevision.current) setSaveStatus("error");
          throw error;
        }
      }),
      resetPracticePreferences: () => apply(resetPracticeDefaults(preferencesRef.current)),
      updatePreference: (key, nextValue) => {
        const next = sanitizePreferences({ ...preferencesRef.current, [key]: nextValue });
        const learnerId = registryRef.current?.activeLearnerId;
        if (key === "nickname") {
          if (learnerId) void saveLearnerName(learnerId, next).catch(() => undefined);
          return;
        }
        apply(next);
      },
      renameActiveLearner: async (nickname) => {
        if (!isReady) throw new Error("Preferences are not ready");
        const learnerId = registryRef.current?.activeLearnerId;
        if (!learnerId) throw new Error("Learner profiles are not ready");
        await saveLearnerName(learnerId, sanitizePreferences({ ...preferencesRef.current, nickname }));
      },
      switchLearner: (learnerId) => serializeLearnerMutation(async () => {
        if (!isReady) throw new Error("Preferences are not ready");
        const current = registryRef.current;
        const learner = current?.learners.find(({ id }) => id === learnerId);
        if (!current || !learner) throw new Error("Unknown learner profile");
        if (learnerId === current.activeLearnerId) return;
        setIsReady(false);
        try {
          const nextRegistry = { ...current, activeLearnerId: learner.id };
          await saveLearnerRegistry(nextRegistry);
          const nextPreferences = await loadLearnerPreferences(learner.id, { ...DEFAULT_PREFERENCES, onboardingCompleted: true, nickname: learner.nickname });
          if (mounted.current) {
            registryRef.current = nextRegistry;
            preferencesRef.current = nextPreferences;
            setRegistry(nextRegistry);
            setPreferences(nextPreferences);
            setIsReady(true);
          }
        } catch (error) {
          if (mounted.current) { setIsReady(true); setSaveStatus("error"); }
          throw error;
        }
      }),
      addLearner: (nickname) => serializeLearnerMutation(async () => {
        if (!isReady) throw new Error("Preferences are not ready");
        const current = registryRef.current;
        if (!current) throw new Error("Learner profiles are not ready");
        if (current.learners.length >= MAX_LOCAL_LEARNERS) throw new Error(`You can add up to ${MAX_LOCAL_LEARNERS} learners on this device`);
        if (isDuplicateNickname(nickname, current.learners.map(({ nickname: existingNickname }) => existingNickname))) {
          throw new Error("A learner already uses that nickname");
        }
        const createdAtMs = Date.now();
        const learner: Learner = { id: createLearnerId(createdAtMs), nickname: normalizeNickname(nickname), colorId: nextAvailableProfileColorId(current.learners), createdAtMs };
        await savePreferences({ ...DEFAULT_PREFERENCES, onboardingCompleted: true, nickname: learner.nickname }, learner.id);
        const nextRegistry = { ...current, learners: [...current.learners, learner] };
        await saveLearnerRegistry(nextRegistry);
        if (mounted.current) { registryRef.current = nextRegistry; setRegistry(nextRegistry); }
      }),
      updateLearnerColor: (learnerId, colorId) => serializeLearnerMutation(async () => {
        if (!isReady) throw new Error("Preferences are not ready");
        const current = registryRef.current;
        if (!current?.learners.some(({ id }) => id === learnerId)) throw new Error("Unknown learner profile");
        const nextRegistry: LearnerRegistry = {
          ...current,
          learners: current.learners.map((learner) => learner.id === learnerId ? { ...learner, colorId } : learner),
        };
        await saveLearnerRegistry(nextRegistry);
        if (mounted.current) {
          registryRef.current = nextRegistry;
          setRegistry(nextRegistry);
        }
      }),
      removeLearner: (learnerId) => serializeLearnerMutation(async () => {
        if (!isReady) throw new Error("Preferences are not ready");
        const current = registryRef.current;
        const remaining = current?.learners.filter((learner) => learner.id !== learnerId) ?? [];
        if (!current || remaining.length === current.learners.length) throw new Error("Unknown learner profile");
        if (remaining.length === 0) throw new Error("At least one learner profile is required");
        const nextActive = learnerId === current.activeLearnerId
          ? remaining[0]
          : current.learners.find(({ id }) => id === current.activeLearnerId)!;
        const nextRegistry: LearnerRegistry = { activeLearnerId: nextActive.id, learners: remaining };
        const nextPreferences = nextActive.id === current.activeLearnerId
          ? preferencesRef.current
          : await loadLearnerPreferences(nextActive.id, { ...DEFAULT_PREFERENCES, onboardingCompleted: true, nickname: nextActive.nickname });
        await saveLearnerRegistry(nextRegistry);
        if (mounted.current) {
          registryRef.current = nextRegistry;
          preferencesRef.current = nextPreferences;
          setRegistry(nextRegistry);
          setPreferences(nextPreferences);
        }
        try {
          await deletePreferences(learnerId);
          return { localPreferencesCleared: true };
        } catch {
          return { localPreferencesCleared: false };
        }
      }),
      profilePickerVisible,
      openProfilePicker: () => setProfilePickerVisible(true),
      closeProfilePicker: () => setProfilePickerVisible(false),
    };
  }, [isReady, loadError, preferences, profilePickerVisible, registry, saveStatus]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error("usePreferences must be used within PreferencesProvider");
  return context;
}
