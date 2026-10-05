import Storage from "expo-sqlite/kv-store";
import { isValidLearnerId } from "@/domain/learner";
import { normalizeNickname } from "@/domain/nickname";
import { isFactNumberLimit, isPracticeNumberRange, sanitizeFactTables } from "@/domain/practiceSelection";

import {
  isCardLayout,
  isInputStyle,
  isSprintDuration,
  type UserPreferences,
} from "@/domain/sprint";

import { DEFAULT_PREFERENCES } from "./preferenceDefaults";

const LEGACY_PREFERENCES_KEY = "math-sprint:user-preferences:v1";
function learnerPreferencesKey(learnerId: string): string {
  if (!isValidLearnerId(learnerId)) throw new Error("Invalid learner ID");
  return `benster:learner-preferences:v1:${learnerId}`;
}

function preferencesKey(learnerId?: string): string {
  return learnerId === undefined ? LEGACY_PREFERENCES_KEY : learnerPreferencesKey(learnerId);
}
const LEARNER_PREFERENCES_PREFIX = "benster:learner-preferences:v1:";

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
    additionRange: isPracticeNumberRange(candidate.additionRange) ? candidate.additionRange : null,
    subtractionRange: isPracticeNumberRange(candidate.subtractionRange) ? candidate.subtractionRange : null,
    multiplicationTables: sanitizeFactTables(candidate.multiplicationTables),
    divisionTables: sanitizeFactTables(candidate.divisionTables),
    multiplicationOtherFactorMax: isFactNumberLimit(candidate.multiplicationOtherFactorMax) ? candidate.multiplicationOtherFactorMax : null,
    divisionQuotientMax: isFactNumberLimit(candidate.divisionQuotientMax) ? candidate.divisionQuotientMax : null,
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
  const key = preferencesKey(learnerId);
  const snapshot = JSON.stringify(sanitizePreferences(preferences));
  const nextWrite = writeQueue.then(() =>
    Storage.setItem(key, snapshot),
  );

  writeQueue = nextWrite.catch(() => undefined);
  return nextWrite;
}

export function deletePreferences(learnerId?: string): Promise<void> {
  const key = preferencesKey(learnerId);
  const nextWrite = writeQueue.then(() => Storage.removeItem(key));

  writeQueue = nextWrite.catch(() => undefined);
  return nextWrite;
}

/** Clears every learner preference when an unreadable registry leaves their IDs unknown. */
export function deleteAllLearnerPreferences(): Promise<void> {
  const nextWrite = writeQueue.then(async () => {
    const learnerKeys = (await Storage.getAllKeys()).filter((key) => key.startsWith(LEARNER_PREFERENCES_PREFIX));
    if (learnerKeys.length > 0) await Storage.multiRemove(learnerKeys);
  });

  writeQueue = nextWrite.catch(() => undefined);
  return nextWrite;
}
