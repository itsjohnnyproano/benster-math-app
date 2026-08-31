/// <reference types="node" />
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { makeResult } from "@/test/resultFixture";
import { createResultsRepository, type ResultsDatabase } from "./createResultsRepository";

const databases: DatabaseSync[] = [];
const directories: string[] = [];
function databaseAdapter(path = ":memory:") {
  const db = new DatabaseSync(path);
  databases.push(db);
  const adapter: ResultsDatabase = {
    execAsync: async (sql) => { db.exec(sql); },
    runAsync: async (sql, params) => db.prepare(sql).run(...params),
    getFirstAsync: async <T>(sql: string, params: (string | number | null)[]) =>
      (db.prepare(sql).get(...params) as T | undefined) ?? null,
    getAllAsync: async <T>(sql: string, params: (string | number | null)[]) =>
      db.prepare(sql).all(...params) as T[],
    closeAsync: async () => { db.close(); },
  };
  return { db, adapter };
}
afterEach(() => {
  for (const db of databases.splice(0)) { try { db.close(); } catch { /* already closed */ } }
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true });
});

describe("SQLite results repository", () => {
  it("migrates existing results before saving division sprints", async () => {
    const { adapter, db } = databaseAdapter();
    const legacyResult = makeResult();
    db.exec(`
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
    `);
    db.prepare(`INSERT INTO sprints VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      "legacy", 1, "addition", 30, legacyResult.completedAtMs,
      JSON.stringify(legacyResult), null, legacyResult.correctCount, "first",
    );
    db.prepare(`INSERT INTO personal_bests VALUES (?, ?, ?, ?)`).run(
      "addition", 30, legacyResult.correctCount, "legacy",
    );

    const repo = createResultsRepository(async () => adapter);
    expect((await repo.list()).records.map(({ id }) => id)).toEqual(["legacy"]);
    expect(await repo.getPersonalBests(30)).toEqual({ addition: 3 });

    const divisionResult = makeResult(4, 5, { mode: "division" });
    expect((await repo.save("division", divisionResult)).personalBest.status).toBe("first");
    expect(await repo.getPersonalBests(30)).toEqual({ addition: 3, division: 4 });
    expect(db.prepare("PRAGMA user_version").get()?.user_version).toBe(2);
  });

  it("reads all completion timestamps beyond the history page across modes", async () => {
    const { adapter, db } = databaseAdapter();
    const repo = createResultsRepository(async () => adapter);
    expect(await repo.listCompletionTimes()).toEqual([]);
    for (let index = 0; index < 25; index++) {
      await repo.save(`streak-${index}`, makeResult(0, 0, { mode: index % 2 ? "mixed" : "addition" }));
    }
    expect((await repo.list()).records).toHaveLength(20);
    expect(await repo.listCompletionTimes()).toEqual(Array(25).fill(makeResult().completedAtMs));
    db.exec("UPDATE sprints SET completed_at_ms = -1 WHERE id = 'streak-0'");
    await expect(repo.listCompletionTimes()).rejects.toThrow("Invalid saved completion date");
  });

  it("paginates timestamp ties without duplicates and filters before limiting", async () => {
    const { adapter } = databaseAdapter();
    const repo = createResultsRepository(async () => adapter);
    for (const id of ["a", "b", "c", "d"]) await repo.save(id, makeResult());
    await repo.save("z", makeResult(2, 5, { mode: "mixed" }));
    const first = await repo.list({ mode: "addition", limit: 2 });
    expect(first.records.map((record) => record.id)).toEqual(["d", "c"]);
    expect(first.nextCursor).not.toBeNull();
    // An insertion ahead of the cursor must not shift subsequent pages.
    await repo.save("y", makeResult());
    const second = await repo.list({ mode: "addition", limit: 2, cursor: first.nextCursor! });
    expect(second.records.map((record) => record.id)).toEqual(["b", "a"]);
    expect(second.nextCursor).toBeNull();
    expect((await repo.list({ mode: "mixed", limit: 1 })).records.map((record) => record.id)).toEqual(["z"]);
    expect((await repo.list({ mode: "subtraction" })).records).toEqual([]);
    await expect(repo.list({ limit: 0 })).rejects.toThrow("Invalid history query");
  });

  it("lists persisted history after reopening the database", async () => {
    const directory = mkdtempSync(join(tmpdir(), "math-history-"));
    directories.push(directory);
    const path = join(directory, "results.db");
    const first = databaseAdapter(path);
    await createResultsRepository(async () => first.adapter).save("saved", makeResult(0, 0));
    await first.adapter.closeAsync();
    const reopened = createResultsRepository(async () => databaseAdapter(path).adapter);
    const page = await reopened.list();
    expect(page.records[0].result.attemptedCount).toBe(0);
    expect(page.records[0].id).toBe("saved");
    expect(page.nextCursor).toBeNull();
  });

  it("orders different completion times newest first", async () => {
    const { adapter } = databaseAdapter();
    const repo = createResultsRepository(async () => adapter);
    await repo.save("z-old", makeResult());
    await repo.save("a-new", makeResult(3, 5, { durationSeconds: 120 }));
    expect((await repo.list()).records.map((record) => record.id)).toEqual(["a-new", "z-old"]);
    await expect(repo.list({ cursor: { completedAtMs: NaN, id: "a" } })).rejects.toThrow("Invalid history query");
  });

  it("allows history retry after a read error without modifying records", async () => {
    const { adapter } = databaseAdapter();
    const repo = createResultsRepository(async () => adapter);
    await repo.save("saved", makeResult());
    const read = adapter.getAllAsync;
    adapter.getAllAsync = async () => { throw new Error("Read failed"); };
    await expect(repo.list()).rejects.toThrow("Read failed");
    adapter.getAllAsync = read;
    expect((await repo.list()).records.map((record) => record.id)).toEqual(["saved"]);
    expect(await repo.getPersonalBests(30)).toEqual({ addition: 3 });
  });

  it("saves timing and the best receipt and reloads them", async () => {
    const { adapter } = databaseAdapter();
    const repo = createResultsRepository(async () => adapter);
    const saved = await repo.save("first", makeResult());
    expect(saved.personalBest).toEqual({ previous: null, updated: 3, status: "first" });
    expect(await repo.get("first")).toEqual(saved);
    expect(await repo.getPersonalBests(30)).toEqual({ addition: 3 });
  });

  it("deduplicates concurrent saves and preserves the original receipt", async () => {
    const { db, adapter } = databaseAdapter();
    const repo = createResultsRepository(async () => adapter);
    const [first, duplicate] = await Promise.all([repo.save("same", makeResult()), repo.save("same", makeResult())]);
    expect(duplicate).toEqual(first);
    await repo.save("better", makeResult(5));
    expect(await repo.save("same", makeResult())).toEqual(first);
    expect(db.prepare("SELECT count(*) AS total FROM sprints").get()?.total).toBe(2);
    await expect(repo.save("same", makeResult(1))).rejects.toThrow("different result");
  });

  it("separates bests by mode and duration but not input style or layout", async () => {
    const { adapter } = databaseAdapter();
    const repo = createResultsRepository(async () => adapter);
    await repo.save("a", makeResult(3));
    await repo.save("b", makeResult(5, 5, { durationSeconds: 120 }));
    await repo.save("c", makeResult(1, 5, { mode: "multiplication" }));
    expect(await repo.getPersonalBests(30)).toEqual({ addition: 3, multiplication: 1 });
    expect(await repo.getPersonalBests(120)).toEqual({ addition: 5 });
    const changed = await repo.save("d", makeResult(4, 5, { inputStyle: "multiple-choice", cardLayout: "vertical" }));
    expect(changed.personalBest).toEqual({ previous: 3, updated: 4, status: "new" });
  });

  it("records zero attempts without establishing or replacing a best", async () => {
    const { adapter } = databaseAdapter();
    const repo = createResultsRepository(async () => adapter);
    expect((await repo.save("empty", makeResult(0, 0))).personalBest.status).toBe("ineligible");
    expect(await repo.getPersonalBests(30)).toEqual({});
    await repo.save("answered", makeResult());
    expect((await repo.save("empty-again", makeResult(0, 0))).personalBest.updated).toBe(3);
  });

  it("rolls back both writes on failure, then permits retry", async () => {
    const { db, adapter } = databaseAdapter();
    const originalRun = adapter.runAsync;
    let fail = true;
    adapter.runAsync = async (sql, params) => {
      if (fail && sql.includes("INSERT INTO personal_bests")) throw new Error("Disk write failed");
      return originalRun(sql, params);
    };
    const repo = createResultsRepository(async () => adapter);
    await expect(repo.save("retry", makeResult())).rejects.toThrow("Disk write failed");
    expect(db.prepare("SELECT count(*) AS total FROM sprints").get()?.total).toBe(0);
    expect(await repo.getPersonalBests(30)).toEqual({});
    fail = false;
    expect((await repo.save("retry", makeResult())).personalBest.status).toBe("first");
  });

  it("persists after closing and reopening the database", async () => {
    const directory = mkdtempSync(join(tmpdir(), "math-sprint-results-test-"));
    directories.push(directory);
    const path = join(directory, "runs.db");
    const first = databaseAdapter(path);
    const saved = await createResultsRepository(async () => first.adapter).save("durable", makeResult());
    await first.adapter.closeAsync();
    const second = databaseAdapter(path);
    const reopened = createResultsRepository(async () => second.adapter);
    expect(await reopened.get("durable")).toEqual(saved);
    expect(await reopened.getPersonalBests(30)).toEqual({ addition: 3 });
  });

  it("rejects corrupt JSON instead of inventing a result", async () => {
    const { db, adapter } = databaseAdapter();
    const repo = createResultsRepository(async () => adapter);
    await repo.save("corrupt", makeResult());
    db.prepare("UPDATE sprints SET result_json = ? WHERE id = ?").run("{}", "corrupt");
    await expect(repo.get("corrupt")).rejects.toThrow("Invalid sprint result");
  });

  it("recovers from an open failure without poisoning later saves", async () => {
    const { adapter } = databaseAdapter();
    let fail = true;
    const repo = createResultsRepository(async () => {
      if (fail) throw new Error("Database unavailable");
      return adapter;
    });
    await expect(repo.save("retry-open", makeResult())).rejects.toThrow("Database unavailable");
    fail = false;
    expect((await repo.save("retry-open", makeResult())).personalBest.status).toBe("first");
  });

  it("leaves a best unchanged for ties and lower scores", async () => {
    const { adapter } = databaseAdapter();
    const repo = createResultsRepository(async () => adapter);
    await repo.save("original", makeResult(4));
    expect((await repo.save("tie", makeResult(4))).personalBest.status).toBe("matched");
    expect((await repo.save("lower", makeResult(2))).personalBest.status).toBe("unchanged");
    expect(await repo.getPersonalBests(30)).toEqual({ addition: 4 });
  });

  it("clears history and personal bests and remains usable", async () => {
    const { adapter } = databaseAdapter();
    const repo = createResultsRepository(async () => adapter);
    await repo.save("before-delete", makeResult(4));

    await repo.clearAll();

    expect((await repo.list()).records).toEqual([]);
    expect(await repo.listCompletionTimes()).toEqual([]);
    expect(await repo.getPersonalBests(30)).toEqual({});
    expect((await repo.save("after-delete", makeResult(2))).personalBest.status).toBe("first");
  });
});
