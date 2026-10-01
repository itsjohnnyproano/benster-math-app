import { normalizeNickname } from "./nickname";

export const LEGACY_LEARNER_ID = "legacy-learner";
export const MAX_LOCAL_LEARNERS = 8;

const LEARNER_ID_PATTERN = /^[a-z][a-z0-9-]{1,127}$/;

export type Learner = Readonly<{
  id: string;
  nickname: string;
  createdAtMs: number;
}>;

export function isValidLearnerId(value: unknown): value is string {
  return typeof value === "string" && LEARNER_ID_PATTERN.test(value);
}

export function createLearnerId(nowMs: number, random = Math.random): string {
  if (!Number.isSafeInteger(nowMs) || nowMs < 0) throw new Error("Invalid learner creation time");
  return `learner-${nowMs.toString(36)}-${Math.floor(random() * 0x100000000).toString(36)}`;
}

export function sanitizeLearner(value: unknown): Learner | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<Learner>;
  const createdAtMs = candidate.createdAtMs;
  if (!isValidLearnerId(candidate.id)
    || typeof createdAtMs !== "number"
    || !Number.isSafeInteger(createdAtMs)
    || createdAtMs < 0) return null;
  return {
    id: candidate.id,
    nickname: normalizeNickname(candidate.nickname),
    createdAtMs,
  };
}
