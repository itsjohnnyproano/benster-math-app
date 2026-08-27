import { openDatabaseAsync } from "expo-sqlite";

import { createResultsRepository } from "./createResultsRepository";

export const resultsRepository = createResultsRepository(() =>
  openDatabaseAsync("math-sprint-results.db", { useNewConnection: true }),
);
