export const MAX_NICKNAME_LENGTH = 20;

export function normalizeNickname(value: unknown): string {
  if (typeof value !== "string") return "";
  return Array.from(value.normalize("NFC")
    .replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, "")
    .replace(/\s+/g, " ").trim()).slice(0, MAX_NICKNAME_LENGTH).join("");
}

/**
 * Profile names are labels children use to choose the correct local profile.
 * Treat case and incidental whitespace as the same label, while allowing blank
 * nicknames because those are displayed as distinct "Learner 1", etc. labels.
 */
export function isDuplicateNickname(candidate: string, existingNicknames: readonly string[]): boolean {
  const normalized = normalizeNickname(candidate);
  if (!normalized) return false;
  const key = normalized.toLocaleLowerCase();
  return existingNicknames.some((nickname) => normalizeNickname(nickname).toLocaleLowerCase() === key);
}
