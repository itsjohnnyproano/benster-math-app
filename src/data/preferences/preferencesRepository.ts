import Storage from "expo-sqlite/kv-store";
import { normalizeNickname } from "@/domain/nickname";

import {
  isCardLayout,
  isInputStyle,
  isSprintDuration,
  type UserPreferences,
} from "@/domain/sprint";

import { DEFAULT_PREFERENCES } from "./preferenceDefaults";

const PREFERENCES_KEY = "math-sprint:user-preferences:v1";

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

export async function loadPreferences(): Promise<UserPreferences> {
  // An I/O failure must not masquerade as a new install and overwrite saved data.
  const savedValue = await Storage.getItem(PREFERENCES_KEY);
  try {
    if (!savedValue) {
      return DEFAULT_PREFERENCES;
    }

    return sanitizePreferences(JSON.parse(savedValue));
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(preferences: UserPreferences): Promise<void> {
  const snapshot = JSON.stringify(sanitizePreferences(preferences));
  const nextWrite = writeQueue.then(() =>
    Storage.setItem(PREFERENCES_KEY, snapshot),
  );

  writeQueue = nextWrite.catch(() => undefined);
  return nextWrite;
}

export function deletePreferences(): Promise<void> {
  const nextWrite = writeQueue.then(() => Storage.removeItem(PREFERENCES_KEY));

  writeQueue = nextWrite.catch(() => undefined);
  return nextWrite;
}
