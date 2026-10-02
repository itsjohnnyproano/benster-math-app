import { normalizeNickname } from "./nickname";

export const LEGACY_LEARNER_ID = "legacy-learner";
export const MAX_LOCAL_LEARNERS = 8;
export const PROFILE_COLOR_IDS = ["violet", "sky", "teal", "green", "yellow", "orange", "coral", "rose", "berry", "indigo"] as const;

export type ProfileColorId = (typeof PROFILE_COLOR_IDS)[number];

const LEARNER_ID_PATTERN = /^[a-z][a-z0-9-]{1,127}$/;

export type Learner = Readonly<{
  id: string;
  nickname: string;
  colorId: ProfileColorId;
  createdAtMs: number;
}>;

export function isProfileColorId(value: unknown): value is ProfileColorId {
  return typeof value === "string" && (PROFILE_COLOR_IDS as readonly string[]).includes(value);
}

export function defaultProfileColorId(learnerId: string): ProfileColorId {
  let hash = 0;
  for (const character of learnerId) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return PROFILE_COLOR_IDS[hash % PROFILE_COLOR_IDS.length];
}

export function nextAvailableProfileColorId(learners: readonly Learner[]): ProfileColorId {
  return PROFILE_COLOR_IDS.find((colorId) => !learners.some((learner) => learner.colorId === colorId))
    ?? PROFILE_COLOR_IDS[learners.length % PROFILE_COLOR_IDS.length];
}

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
    colorId: isProfileColorId(candidate.colorId) ? candidate.colorId : defaultProfileColorId(candidate.id),
    createdAtMs,
  };
}
