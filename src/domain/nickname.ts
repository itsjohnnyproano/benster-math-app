export const MAX_NICKNAME_LENGTH = 20;

export function normalizeNickname(value: unknown): string {
  if (typeof value !== "string") return "";
  return Array.from(value.normalize("NFC")
    .replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g, "")
    .replace(/\s+/g, " ").trim()).slice(0, MAX_NICKNAME_LENGTH).join("");
}
