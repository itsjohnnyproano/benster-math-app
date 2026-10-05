import type { SprintResult } from "@/domain/math-engine";
import { isValidTimestamp } from "@/shared/isValidTimestamp";
import {
  assertSprintResult, calculatePersonalBest, RESULT_SCHEMA_VERSION,
  type SavedSprint,
} from "@/domain/results";
import {
  isSprintMode,
  getPracticeSelectionKey,
  SPRINT_MODES,
  type SprintDurationSeconds,
  type SprintMode,
} from "@/domain/sprint";
import { LEGACY_LEARNER_ID, isValidLearnerId } from "@/domain/learner";

type SqlValue = string | number | null;
export interface ResultsDatabase {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params: SqlValue[]): Promise<unknown>;
  getFirstAsync<T>(sql: string, params: SqlValue[]): Promise<T | null>;
  getAllAsync<T>(sql: string, params: SqlValue[]): Promise<T[]>;
  closeAsync(): Promise<void>;
}

type ResultRow = {
  id: string;
  schema_version: number;
  result_json: string;
  previous_best: number | null;
  updated_best: number | null;
  best_status: string;
};
export type PersonalBests = Partial<Record<SprintMode, number>>;
export type HistoryCursor = Readonly<{ completedAtMs: number; id: string }>;
export type HistoryPage = Readonly<{ records: SavedSprint[]; nextCursor: HistoryCursor | null }>;

const DATABASE_SCHEMA_VERSION = 4;
const SPRINT_ID_PATTERN = /^[a-zA-Z0-9-]{1,128}$/;
const SPRINT_MODE_SQL_LIST = SPRINT_MODES.map((mode) => `'${mode}'`).join(",");

export function isValidSprintId(value: unknown): value is string {
  return typeof value === "string" && SPRINT_ID_PATTERN.test(value);
}

const CREATE_TABLES = `
  CREATE TABLE sprints (
    id TEXT PRIMARY KEY NOT NULL,
    learner_id TEXT NOT NULL,
    schema_version INTEGER NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN (${SPRINT_MODE_SQL_LIST})),
    duration_seconds INTEGER NOT NULL CHECK (duration_seconds IN (30,60,90,120)),
    completed_at_ms INTEGER NOT NULL,
    result_json TEXT NOT NULL,
    previous_best INTEGER,
    updated_best INTEGER,
    best_status TEXT NOT NULL
  );
  CREATE TABLE personal_bests (
    learner_id TEXT NOT NULL,
    mode TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL,
    practice_key TEXT NOT NULL,
    correct_count INTEGER NOT NULL CHECK (correct_count >= 0),
    sprint_id TEXT NOT NULL REFERENCES sprints(id),
    PRIMARY KEY (learner_id, mode, duration_seconds, practice_key)
  );
`;
const CREATE_INDEX = "CREATE INDEX sprints_completed ON sprints(learner_id, completed_at_ms DESC);";
const CREATE_V2_TABLES = `
  CREATE TABLE sprints (
    id TEXT PRIMARY KEY NOT NULL,
    schema_version INTEGER NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN (${SPRINT_MODE_SQL_LIST})),
    duration_seconds INTEGER NOT NULL CHECK (duration_seconds IN (30,60,90,120)),
    completed_at_ms INTEGER NOT NULL,
    result_json TEXT NOT NULL,
    previous_best INTEGER,
    updated_best INTEGER,
    best_status TEXT NOT NULL
  );
  CREATE TABLE personal_bests (
    mode TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL,
    correct_count INTEGER NOT NULL CHECK (correct_count >= 0),
    sprint_id TEXT NOT NULL REFERENCES sprints(id),
    PRIMARY KEY (mode, duration_seconds)
  );
`;
const CREATE_V3_TABLES = `
  CREATE TABLE sprints (
    id TEXT PRIMARY KEY NOT NULL,
    learner_id TEXT NOT NULL,
    schema_version INTEGER NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN (${SPRINT_MODE_SQL_LIST})),
    duration_seconds INTEGER NOT NULL CHECK (duration_seconds IN (30,60,90,120)),
    completed_at_ms INTEGER NOT NULL,
    result_json TEXT NOT NULL,
    previous_best INTEGER,
    updated_best INTEGER,
    best_status TEXT NOT NULL
  );
  CREATE TABLE personal_bests (
    learner_id TEXT NOT NULL,
    mode TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL,
    correct_count INTEGER NOT NULL CHECK (correct_count >= 0),
    sprint_id TEXT NOT NULL REFERENCES sprints(id),
    PRIMARY KEY (learner_id, mode, duration_seconds)
  );
`;
const CREATE_V2_INDEX = "CREATE INDEX sprints_completed ON sprints(completed_at_ms DESC);";
const SCHEMA = `${CREATE_TABLES}${CREATE_INDEX}
  PRAGMA user_version = ${DATABASE_SCHEMA_VERSION};`;

const MIGRATE_V1_TO_V2 = `
  ALTER TABLE sprints RENAME TO sprints_v1;
  ALTER TABLE personal_bests RENAME TO personal_bests_v1;
  ${CREATE_V2_TABLES}
  INSERT INTO sprints SELECT * FROM sprints_v1;
  INSERT INTO personal_bests SELECT * FROM personal_bests_v1;
  DROP TABLE personal_bests_v1;
  DROP TABLE sprints_v1;
  ${CREATE_V2_INDEX}
  PRAGMA user_version = 2;
`;

const MIGRATE_V2_TO_V3 = `
  ALTER TABLE sprints RENAME TO sprints_v2;
  ALTER TABLE personal_bests RENAME TO personal_bests_v2;
  ${CREATE_V3_TABLES}
  INSERT INTO sprints (id, learner_id, schema_version, mode, duration_seconds, completed_at_ms, result_json, previous_best, updated_best, best_status)
    SELECT id, '${LEGACY_LEARNER_ID}', schema_version, mode, duration_seconds, completed_at_ms, result_json, previous_best, updated_best, best_status FROM sprints_v2;
  INSERT INTO personal_bests (learner_id, mode, duration_seconds, correct_count, sprint_id)
    SELECT '${LEGACY_LEARNER_ID}', mode, duration_seconds, correct_count, sprint_id FROM personal_bests_v2;
  DROP TABLE personal_bests_v2;
  DROP TABLE sprints_v2;
  ${CREATE_INDEX}
  PRAGMA user_version = 3;
`;

const MIGRATE_V3_TO_V4 = `
  ALTER TABLE personal_bests RENAME TO personal_bests_v3;
  CREATE TABLE personal_bests (
    learner_id TEXT NOT NULL,
    mode TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL,
    practice_key TEXT NOT NULL,
    correct_count INTEGER NOT NULL CHECK (correct_count >= 0),
    sprint_id TEXT NOT NULL REFERENCES sprints(id),
    PRIMARY KEY (learner_id, mode, duration_seconds, practice_key)
  );
  INSERT INTO personal_bests (learner_id, mode, duration_seconds, practice_key, correct_count, sprint_id)
    SELECT learner_id, mode, duration_seconds, 'normal', correct_count, sprint_id FROM personal_bests_v3;
  DROP TABLE personal_bests_v3;
  PRAGMA user_version = ${DATABASE_SCHEMA_VERSION};
`;

async function applySchemaUpdate(database: ResultsDatabase, sql: string) {
  await database.execAsync("BEGIN IMMEDIATE");
  try {
    await database.execAsync(sql);
    await database.execAsync("COMMIT");
  } catch (error) {
    await database.execAsync("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

function checkBest(value: unknown): asserts value is number | null {
  if (value !== null && (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0)) {
    throw new Error("Invalid saved personal best");
  }
}

function readResult(row: ResultRow): SavedSprint {
  if (row.schema_version !== RESULT_SCHEMA_VERSION) throw new Error("Unsupported result version");
  const result: unknown = JSON.parse(row.result_json);
  assertSprintResult(result);
  checkBest(row.previous_best);
  const personalBest = calculatePersonalBest(result, row.previous_best);
  if (personalBest.updated !== row.updated_best || personalBest.status !== row.best_status) {
    throw new Error("Invalid personal-best receipt");
  }
  return { id: row.id, schemaVersion: RESULT_SCHEMA_VERSION, result, personalBest };
}

export function createResultsRepository(openDatabase: () => Promise<ResultsDatabase>) {
  let database: ResultsDatabase | null = null;
  let queue: Promise<unknown> = Promise.resolve();

  // This dedicated connection is private to this repository. Every read and
  // write is serialized so no query can accidentally join another transaction.
  function serialize<T>(operation: () => Promise<T>): Promise<T> {
    const pending = queue.then(operation);
    queue = pending.catch(() => undefined);
    return pending;
  }

  async function getDatabase() {
    if (database) return database;
    const candidate = await openDatabase();
    try {
      await candidate.execAsync("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
      const version = await candidate.getFirstAsync<{ user_version: number }>("PRAGMA user_version", []);
      if (!version || version.user_version > DATABASE_SCHEMA_VERSION) throw new Error("Unsupported results database");
      if (version.user_version === 0) {
        await applySchemaUpdate(candidate, SCHEMA);
      } else if (version.user_version === 1) {
        await applySchemaUpdate(candidate, MIGRATE_V1_TO_V2);
        await applySchemaUpdate(candidate, MIGRATE_V2_TO_V3);
        await applySchemaUpdate(candidate, MIGRATE_V3_TO_V4);
      } else if (version.user_version === 2) {
        await applySchemaUpdate(candidate, MIGRATE_V2_TO_V3);
        await applySchemaUpdate(candidate, MIGRATE_V3_TO_V4);
      } else if (version.user_version === 3) {
        await applySchemaUpdate(candidate, MIGRATE_V3_TO_V4);
      }
      database = candidate;
      return candidate;
    } catch (error) {
      await candidate.closeAsync().catch(() => undefined);
      throw error;
    }
  }

  return {
    listCompletionTimes(learnerId = LEGACY_LEARNER_ID): Promise<number[]> {
      if (!isValidLearnerId(learnerId)) return Promise.reject(new Error("Invalid learner ID"));
      return serialize(async () => {
        const db = await getDatabase();
        const rows = await db.getAllAsync<{ completed_at_ms: number }>(
          "SELECT completed_at_ms FROM sprints WHERE learner_id = ? ORDER BY completed_at_ms", [learnerId],
        );
        return rows.map(({ completed_at_ms: timestamp }) => {
          if (!isValidTimestamp(timestamp)) {
            throw new Error("Invalid saved completion date");
          }
          return timestamp;
        });
      });
    },

    list(learnerIdOrOptions: string | { mode?: SprintMode; cursor?: HistoryCursor; limit?: number } = LEGACY_LEARNER_ID, providedOptions: { mode?: SprintMode; cursor?: HistoryCursor; limit?: number } = {}): Promise<HistoryPage> {
      const learnerId = typeof learnerIdOrOptions === "string" ? learnerIdOrOptions : LEGACY_LEARNER_ID;
      const options = typeof learnerIdOrOptions === "string" ? providedOptions : learnerIdOrOptions;
      const { mode, cursor, limit = 20 } = options;
      if (!isValidLearnerId(learnerId) || (mode !== undefined && !isSprintMode(mode))
        || !Number.isSafeInteger(limit) || limit < 1 || limit > 100
        || (cursor && (!Number.isSafeInteger(cursor.completedAtMs) || cursor.completedAtMs < 0
          || !isValidSprintId(cursor.id)))) {
        return Promise.reject(new Error("Invalid history query"));
      }
      // Keyset pagination stays stable when newer sprints are inserted. The ID
      // breaks timestamp ties; filtering happens in SQLite before the limit.
      const conditions: string[] = [];
      const params: SqlValue[] = [];
      conditions.push("learner_id = ?"); params.push(learnerId);
      if (mode) { conditions.push("mode = ?"); params.push(mode); }
      if (cursor) {
        conditions.push("(completed_at_ms < ? OR (completed_at_ms = ? AND id < ?))");
        params.push(cursor.completedAtMs, cursor.completedAtMs, cursor.id);
      }
      params.push(limit + 1);
      return serialize(async () => {
        const db = await getDatabase();
        const rows = await db.getAllAsync<ResultRow>(
          `SELECT * FROM sprints ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
            ORDER BY completed_at_ms DESC, id DESC LIMIT ?`, params,
        );
        const records = rows.slice(0, limit).map(readResult);
        const last = records.at(-1);
        return {
          records,
          nextCursor: rows.length > limit && last
            ? { completedAtMs: last.result.completedAtMs, id: last.id } : null,
        };
      });
    },

    save(learnerIdOrId: string, idOrResult: string | SprintResult, providedResult?: SprintResult): Promise<SavedSprint> {
      const learnerId = providedResult ? learnerIdOrId : LEGACY_LEARNER_ID;
      const id = providedResult ? idOrResult as string : learnerIdOrId;
      const result = providedResult ?? idOrResult as SprintResult;
      // timestamp/random IDs are identities only; never interpolate them into SQL.
      if (!isValidLearnerId(learnerId) || !isValidSprintId(id)) return Promise.reject(new Error("Invalid sprint ID or learner ID"));
      try { assertSprintResult(result); } catch (error) { return Promise.reject(error); }
      const resultJson = JSON.stringify(result);
      const snapshot: SprintResult = JSON.parse(resultJson);

      return serialize(async () => {
        const db = await getDatabase();
        await db.execAsync("BEGIN IMMEDIATE");
        try {
          const existing = await db.getFirstAsync<ResultRow>("SELECT * FROM sprints WHERE id = ? AND learner_id = ?", [id, learnerId]);
          if (existing) {
            if (existing.result_json !== resultJson) throw new Error("Sprint ID already belongs to a different result");
            const saved = readResult(existing);
            await db.execAsync("COMMIT");
            return saved;
          }

          const { mode, durationSeconds } = snapshot.configuration;
          const practiceKey = getPracticeSelectionKey(snapshot.configuration);
          const previous = await db.getFirstAsync<{ correct_count: number }>(
            "SELECT correct_count FROM personal_bests WHERE learner_id = ? AND mode = ? AND duration_seconds = ? AND practice_key = ?",
            [learnerId, mode, durationSeconds, practiceKey],
          );
          const previousScore = previous?.correct_count ?? null;
          checkBest(previousScore);
          const personalBest = calculatePersonalBest(snapshot, previousScore);
          await db.runAsync(
            `INSERT INTO sprints (id, learner_id, schema_version, mode, duration_seconds, completed_at_ms,
              result_json, previous_best, updated_best, best_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, learnerId, RESULT_SCHEMA_VERSION, mode, durationSeconds, snapshot.completedAtMs,
              resultJson, personalBest.previous, personalBest.updated, personalBest.status],
          );
          if (personalBest.status === "first" || personalBest.status === "new") {
            await db.runAsync(
              `INSERT INTO personal_bests (learner_id, mode, duration_seconds, practice_key, correct_count, sprint_id)
                VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(learner_id, mode, duration_seconds, practice_key) DO UPDATE SET
                correct_count = excluded.correct_count, sprint_id = excluded.sprint_id`,
              [learnerId, mode, durationSeconds, practiceKey, snapshot.correctCount, id],
            );
          }
          await db.execAsync("COMMIT");
          return { id, schemaVersion: RESULT_SCHEMA_VERSION, result: snapshot, personalBest };
        } catch (error) {
          try { await db.execAsync("ROLLBACK"); } catch {
            // Discard an unusable connection; a retry will reopen and read
            // the existing receipt if the prior commit actually succeeded.
            database = null;
            await db.closeAsync().catch(() => undefined);
          }
          throw error;
        }
      });
    },

    get(learnerIdOrId: string, providedId?: string): Promise<SavedSprint | null> {
      const learnerId = providedId ? learnerIdOrId : LEGACY_LEARNER_ID;
      const id = providedId ?? learnerIdOrId;
      if (!isValidLearnerId(learnerId) || !isValidSprintId(id)) return Promise.reject(new Error("Invalid sprint ID or learner ID"));
      return serialize(async () => {
        const db = await getDatabase();
        const row = await db.getFirstAsync<ResultRow>("SELECT * FROM sprints WHERE id = ? AND learner_id = ?", [id, learnerId]);
        return row ? readResult(row) : null;
      });
    },

    getPersonalBests(learnerIdOrDuration: string | SprintDurationSeconds, providedDuration?: SprintDurationSeconds): Promise<PersonalBests> {
      const learnerId = providedDuration === undefined ? LEGACY_LEARNER_ID : learnerIdOrDuration as string;
      const duration = providedDuration ?? learnerIdOrDuration as SprintDurationSeconds;
      if (!isValidLearnerId(learnerId)) return Promise.reject(new Error("Invalid learner ID"));
      return serialize(async () => {
        const db = await getDatabase();
        const rows = await db.getAllAsync<{ mode: string; correct_count: number }>(
          "SELECT mode, correct_count FROM personal_bests WHERE learner_id = ? AND duration_seconds = ? AND practice_key = 'normal'", [learnerId, duration],
        );
        const bests: PersonalBests = {};
        for (const row of rows) {
          checkBest(row.correct_count);
          if (!isSprintMode(row.mode)) throw new Error("Invalid saved mode");
          bests[row.mode] = row.correct_count;
        }
        return bests;
      });
    },

    clearAll(learnerId = LEGACY_LEARNER_ID): Promise<void> {
      if (!isValidLearnerId(learnerId)) return Promise.reject(new Error("Invalid learner ID"));
      return serialize(async () => {
        const db = await getDatabase();
        await db.execAsync("BEGIN IMMEDIATE");
        try {
          // Delete dependents first because foreign keys are enforced.
          await db.runAsync("DELETE FROM personal_bests WHERE learner_id = ?", [learnerId]);
          await db.runAsync("DELETE FROM sprints WHERE learner_id = ?", [learnerId]);
          await db.execAsync("COMMIT");
        } catch (error) {
          try {
            await db.execAsync("ROLLBACK");
          } catch {
            database = null;
            await db.closeAsync().catch(() => undefined);
          }
          throw error;
        }
      });
    },

    clearDevice(): Promise<void> {
      return serialize(async () => {
        const db = await getDatabase();
        await db.execAsync("BEGIN IMMEDIATE");
        try {
          await db.execAsync("DELETE FROM personal_bests; DELETE FROM sprints;");
          await db.execAsync("COMMIT");
        } catch (error) {
          try {
            await db.execAsync("ROLLBACK");
          } catch {
            database = null;
            await db.closeAsync().catch(() => undefined);
          }
          throw error;
        }
      });
    },
  };
}
