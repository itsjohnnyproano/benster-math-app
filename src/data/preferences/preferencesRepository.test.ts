import { beforeEach, describe, expect, it, vi } from "vitest";

const storage = vi.hoisted(() => ({ getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() }));
vi.mock("expo-sqlite/kv-store", () => ({ default: storage }));

import { DEFAULT_PREFERENCES, resetPracticeDefaults } from "./preferenceDefaults";
import { deletePreferences, loadPreferences, sanitizePreferences, savePreferences } from "./preferencesRepository";

beforeEach(() => {
  storage.getItem.mockReset().mockResolvedValue(null);
  storage.setItem.mockReset().mockResolvedValue(undefined);
  storage.removeItem.mockReset().mockResolvedValue(undefined);
});

describe("preferences storage", () => {
  it("loads old preferences without losing choices when nickname is absent", async () => {
    storage.getItem.mockResolvedValue(JSON.stringify({ durationSeconds: 90, inputStyle: "typed", cardLayout: "vertical", levelUpEnabled: false, darkModeEnabled: false }));
    expect(await loadPreferences()).toEqual({ nickname: "", durationSeconds: 90, inputStyle: "typed", cardLayout: "vertical", levelUpEnabled: false, darkModeEnabled: false });
  });

  it("persists and reloads the nickname and all practice preferences", async () => {
    const preferences = { ...DEFAULT_PREFERENCES, nickname: "Jo", durationSeconds: 120 as const, cardLayout: "both" as const };
    await savePreferences(preferences);
    storage.getItem.mockResolvedValue(storage.setItem.mock.calls[0][1]);
    expect(await loadPreferences()).toEqual(preferences);
  });

  it("resets only practice settings, preserving the nickname and unrelated preferences", () => {
    const original = { ...DEFAULT_PREFERENCES, nickname: "Jo", darkModeEnabled: true, durationSeconds: 90 as const, inputStyle: "typed" as const, cardLayout: "vertical" as const, levelUpEnabled: false };
    expect(resetPracticeDefaults(original)).toEqual({ ...DEFAULT_PREFERENCES, nickname: "Jo", darkModeEnabled: true });
    expect(original.durationSeconds).toBe(90);
  });

  it("uses defaults for missing or malformed JSON but surfaces I/O failure", async () => {
    expect(await loadPreferences()).toEqual(DEFAULT_PREFERENCES);
    storage.getItem.mockResolvedValue("not json");
    expect(await loadPreferences()).toEqual(DEFAULT_PREFERENCES);
    storage.getItem.mockRejectedValue(new Error("Unavailable"));
    await expect(loadPreferences()).rejects.toThrow("Unavailable");
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("sanitizes invalid fields and restricts the saved nickname", () => {
    expect(sanitizePreferences({ nickname: "  Jo\n  ", durationSeconds: 17, inputStyle: "invalid" })).toEqual({ ...DEFAULT_PREFERENCES, nickname: "Jo" });
  });

  it("snapshots queued writes and recovers after a failed save", async () => {
    storage.setItem.mockRejectedValueOnce(new Error("Full"));
    const preferences = { ...DEFAULT_PREFERENCES, nickname: "First" };
    const failed = savePreferences(preferences);
    const retry = savePreferences({ ...preferences, nickname: "Second" });
    preferences.nickname = "Mutated";
    await expect(failed).rejects.toThrow("Full");
    await retry;
    expect(JSON.parse(storage.setItem.mock.calls[0][1]).nickname).toBe("First");
    expect(JSON.parse(storage.setItem.mock.calls[1][1]).nickname).toBe("Second");
  });

  it("deletes preferences after any queued write", async () => {
    await savePreferences({ ...DEFAULT_PREFERENCES, nickname: "Jo" });
    await deletePreferences();

    expect(storage.removeItem).toHaveBeenCalledWith("math-sprint:user-preferences:v1");
    expect(storage.setItem.mock.invocationCallOrder[0])
      .toBeLessThan(storage.removeItem.mock.invocationCallOrder[0]);
  });
});
