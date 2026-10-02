import Storage from "expo-sqlite/kv-store";

import {
  LEGACY_LEARNER_ID,
  MAX_LOCAL_LEARNERS,
  defaultProfileColorId,
  nextAvailableLearnerDefaultName,
  sanitizeLearner,
  type Learner,
} from "@/domain/learner";
import { normalizeNickname } from "@/domain/nickname";

const LEARNERS_KEY = "benster:learners:v1";

export type LearnerRegistry = Readonly<{
  activeLearnerId: string;
  learners: readonly Learner[];
}>;

let writeQueue = Promise.resolve();

function defaultRegistry(nickname: string): LearnerRegistry {
  return {
    activeLearnerId: LEGACY_LEARNER_ID,
    learners: [{
      id: LEGACY_LEARNER_ID,
      nickname: normalizeNickname(nickname),
      defaultName: "Learner 1",
      colorId: defaultProfileColorId(LEGACY_LEARNER_ID),
      createdAtMs: 0,
    }],
  };
}

export function sanitizeLearnerRegistry(value: unknown, legacyNickname = ""): LearnerRegistry {
  if (!value || typeof value !== "object") return defaultRegistry(legacyNickname);
  const candidate = value as Partial<LearnerRegistry>;
  if (!Array.isArray(candidate.learners)) return defaultRegistry(legacyNickname);
  const learners = candidate.learners.map(sanitizeLearner).filter((learner): learner is Learner => learner !== null);
  const uniqueLearners = learners.filter((learner, index) => learners.findIndex(({ id }) => id === learner.id) === index);
  if (uniqueLearners.length === 0 || uniqueLearners.length > MAX_LOCAL_LEARNERS) return defaultRegistry(legacyNickname);
  // Older registries did not save a fallback label. Assign it once while
  // reading, then carry it forward on every subsequent registry save so an
  // unnamed learner's label never changes when a sibling is removed.
  const learnersWithDefaultNames = uniqueLearners.reduce<Learner[]>((learners, learner) => [
    ...learners,
    { ...learner, defaultName: learner.defaultName || nextAvailableLearnerDefaultName(learners) },
  ], []);
  const activeLearnerId = learnersWithDefaultNames.some(({ id }) => id === candidate.activeLearnerId)
    ? candidate.activeLearnerId as string
    : learnersWithDefaultNames[0].id;
  return { activeLearnerId, learners: learnersWithDefaultNames };
}

export async function loadLearnerRegistry(legacyNickname = ""): Promise<LearnerRegistry> {
  const value = await Storage.getItem(LEARNERS_KEY);
  if (!value) return defaultRegistry(legacyNickname);
  try {
    return sanitizeLearnerRegistry(JSON.parse(value), legacyNickname);
  } catch {
    throw new Error("Saved learner profiles could not be read");
  }
}

export function saveLearnerRegistry(registry: LearnerRegistry): Promise<void> {
  const snapshot = JSON.stringify(sanitizeLearnerRegistry(registry));
  const pending = writeQueue.then(() => Storage.setItem(LEARNERS_KEY, snapshot));
  writeQueue = pending.catch(() => undefined);
  return pending;
}

export function deleteLearnerRegistry(): Promise<void> {
  const pending = writeQueue.then(() => Storage.removeItem(LEARNERS_KEY));
  writeQueue = pending.catch(() => undefined);
  return pending;
}
