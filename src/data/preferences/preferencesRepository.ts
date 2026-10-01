import Storage from "expo-sqlite/kv-store";
import { normalizeNickname } from "@/domain/nickname";

import {
  isCardLayout,
  isInputStyle,
  isSprintDuration,
  type UserPreferences,
} from "@/domain/sprint";

import { DEFAULT_PREFERENCES } from "./preferenceDefaults";

const LEGACY_PREFERENCES_KEY = "math-sprint:user-preferences:v1";
const learnerPreferencesKey = (learnerId: string) => `benster:learner-preferences:v1:${learnerId}`;

let writeQueue = Promise.resolve();

export function sanitizePreferences(value: unknown): UserPreferences {
  if (!value || typeof value !== "object") {
    return DEFAULT_PREFERENCES;
  }

  const candidate = value as Partial<UserPreferences>;

  return {
    onboardingCompleted: candidate.onboardingCompleted === true,
    nickname: normalizeNickname(candidate.nickname),
    durationSeconds: isSprintDuration(candidate.durationSeconds)
      ? candidate.durationSeconds
      : DEFAULT_PREFERENCES.durationSeconds,
    inputStyle: isInputStyle(candidate.inputStyle)
      ? candidate.inputStyle
      : DEFAULT_PREFERENCES.inputStyle,
    cardLayout: isCardLayout(candidate.cardLayout)
      ? candidate.cardLayout
      : DEFAULT_PREFERENCES.cardLayout,
    levelUpEnabled:
      typeof candidate.levelUpEnabled === "boolean"
        ? candidate.levelUpEnabled
        : DEFAULT_PREFERENCES.levelUpEnabled,
    darkModeEnabled:
      typeof candidate.darkModeEnabled === "boolean"
        ? candidate.darkModeEnabled
        : DEFAULT_PREFERENCES.darkModeEnabled,
  };
}

async function loadPreferencesAtKey(key: string): Promise<UserPreferences | null> {
  // An I/O failure must not masquerade as a new install and overwrite saved data.
  const savedValue = await Storage.getItem(key);
  if (!savedValue) return null;
  try {
    return sanitizePreferences(JSON.parse(savedValue));
  } catch {
    // The provider offers an explicit reset action instead of quietly treating
    // a returning learner as a new installation.
    throw new Error("Saved preferences could not be read");
  }
}

export async function loadPreferences(): Promise<UserPreferences> {
  return (await loadPreferencesAtKey(LEGACY_PREFERENCES_KEY)) ?? DEFAULT_PREFERENCES;
}

export async function loadLearnerPreferences(learnerId: string, legacyPreferences: UserPreferences): Promise<UserPreferences> {
  return (await loadPreferencesAtKey(learnerPreferencesKey(learnerId))) ?? legacyPreferences;
}

export function savePreferences(preferences: UserPreferences, learnerId?: string): Promise<void> {
  const snapshot = JSON.stringify(sanitizePreferences(preferences));
  const nextWrite = writeQueue.then(() =>
    Storage.setItem(learnerId ? learnerPreferencesKey(learnerId) : LEGACY_PREFERENCES_KEY, snapshot),
  );

  writeQueue = nextWrite.catch(() => undefined);
  return nextWrite;
}

export function deletePreferences(learnerId?: string): Promise<void> {
  const nextWrite = writeQueue.then(() => Storage.removeItem(learnerId ? learnerPreferencesKey(learnerId) : LEGACY_PREFERENCES_KEY));

  writeQueue = nextWrite.catch(() => undefined);
  return nextWrite;
}
