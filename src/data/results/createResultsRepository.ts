import type { SprintResult } from "@/domain/math-engine";
import {
  assertSprintResult, calculatePersonalBest, RESULT_SCHEMA_VERSION,
  type SavedSprint,
} from "@/domain/results";
import { isSprintMode, type SprintDurationSeconds, type SprintMode } from "@/domain/sprint";

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

const SCHEMA = `
  CREATE TABLE sprints (
    id TEXT PRIMARY KEY NOT NULL,
    schema_version INTEGER NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('addition','subtraction','multiplication','mixed')),
    duration_seconds INTEGER NOT NULL CHECK (duration_seconds IN (30,60,90,120)),
    completed_at_ms INTEGER NOT NULL,
    result_json TEXT NOT NULL,
    previous_best INTEGER,
    updated_best INTEGER,
    best_status TEXT NOT NULL
  );
  CREATE INDEX sprints_completed ON sprints(completed_at_ms DESC);
  CREATE TABLE personal_bests (
    mode TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL,
    correct_count INTEGER NOT NULL CHECK (correct_count >= 0),
    sprint_id TEXT NOT NULL REFERENCES sprints(id),
    PRIMARY KEY (mode, duration_seconds)
  );
  PRAGMA user_version = 1;
`;

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
      if (!version || version.user_version > RESULT_SCHEMA_VERSION) throw new Error("Unsupported results database");
      if (version.user_version === 0) {
        await candidate.execAsync("BEGIN IMMEDIATE");
        try {
          await candidate.execAsync(SCHEMA);
          await candidate.execAsync("COMMIT");
        } catch (error) {
          await candidate.execAsync("ROLLBACK");
          throw error;
        }
      }
      database = candidate;
      return candidate;
    } catch (error) {
      await candidate.closeAsync().catch(() => undefined);
      throw error;
    }
  }

  return {
    list(options: { mode?: SprintMode; cursor?: HistoryCursor; limit?: number } = {}): Promise<HistoryPage> {
      const { mode, cursor, limit = 20 } = options;
      if ((mode !== undefined && !isSprintMode(mode))
        || !Number.isSafeInteger(limit) || limit < 1 || limit > 100
        || (cursor && (!Number.isSafeInteger(cursor.completedAtMs) || cursor.completedAtMs < 0
          || !/^[a-zA-Z0-9-]{1,128}$/.test(cursor.id)))) {
        return Promise.reject(new Error("Invalid history query"));
      }
      // Keyset pagination stays stable when newer sprints are inserted. The ID
      // breaks timestamp ties; filtering happens in SQLite before the limit.
      const conditions: string[] = [];
      const params: SqlValue[] = [];
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

    save(id: string, result: SprintResult): Promise<SavedSprint> {
      // timestamp/random IDs are identities only; never interpolate them into SQL.
      if (!/^[a-zA-Z0-9-]{1,128}$/.test(id)) return Promise.reject(new Error("Invalid sprint ID"));
      try { assertSprintResult(result); } catch (error) { return Promise.reject(error); }
      const resultJson = JSON.stringify(result);
      const snapshot: SprintResult = JSON.parse(resultJson);

      return serialize(async () => {
        const db = await getDatabase();
        await db.execAsync("BEGIN IMMEDIATE");
        try {
          const existing = await db.getFirstAsync<ResultRow>("SELECT * FROM sprints WHERE id = ?", [id]);
          if (existing) {
            if (existing.result_json !== resultJson) throw new Error("Sprint ID already belongs to a different result");
            const saved = readResult(existing);
            await db.execAsync("COMMIT");
            return saved;
          }

          const { mode, durationSeconds } = snapshot.configuration;
          const previous = await db.getFirstAsync<{ correct_count: number }>(
            "SELECT correct_count FROM personal_bests WHERE mode = ? AND duration_seconds = ?",
            [mode, durationSeconds],
          );
          const previousScore = previous?.correct_count ?? null;
          checkBest(previousScore);
          const personalBest = calculatePersonalBest(snapshot, previousScore);
          await db.runAsync(
            `INSERT INTO sprints (id, schema_version, mode, duration_seconds, completed_at_ms,
              result_json, previous_best, updated_best, best_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, RESULT_SCHEMA_VERSION, mode, durationSeconds, snapshot.completedAtMs,
              resultJson, personalBest.previous, personalBest.updated, personalBest.status],
          );
          if (personalBest.status === "first" || personalBest.status === "new") {
            await db.runAsync(
              `INSERT INTO personal_bests (mode, duration_seconds, correct_count, sprint_id)
                VALUES (?, ?, ?, ?) ON CONFLICT(mode, duration_seconds) DO UPDATE SET
                correct_count = excluded.correct_count, sprint_id = excluded.sprint_id`,
              [mode, durationSeconds, snapshot.correctCount, id],
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

    get(id: string): Promise<SavedSprint | null> {
      return serialize(async () => {
        const db = await getDatabase();
        const row = await db.getFirstAsync<ResultRow>("SELECT * FROM sprints WHERE id = ?", [id]);
        return row ? readResult(row) : null;
      });
    },

    getPersonalBests(duration: SprintDurationSeconds): Promise<PersonalBests> {
      return serialize(async () => {
        const db = await getDatabase();
        const rows = await db.getAllAsync<{ mode: string; correct_count: number }>(
          "SELECT mode, correct_count FROM personal_bests WHERE duration_seconds = ?", [duration],
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
  };
}
