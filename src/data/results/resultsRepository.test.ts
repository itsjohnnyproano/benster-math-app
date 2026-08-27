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
});
