# Benster architecture

## Overview

Benster is organized by ownership: routes select screens, features coordinate UI state, domain modules own product rules, and data modules own persistence. Dependencies should point inward toward domain types and rules rather than from domain code toward React or SQLite.

```text
src/app (routes)
  -> src/features (screens, hooks, presentation)
       -> src/domain (pure rules and types)
       -> src/data (persistence boundaries)
  -> src/components (shared UI)

src/config   centralized product/display metadata
src/shared   cross-feature pure helpers and formatters
src/theme    colors, shadows, and design tokens
```

## Routes and features

Expo Router files live in `src/app`. Route files should remain small and delegate rendering to a feature screen. The root layout loads fonts, preferences, splash behavior, and navigation. The tab layout owns the persistent Home, History, and Settings navigation.

Feature folders own screen-specific components, hooks, and presentation mappings. A feature may call a repository or pure domain function, but reusable product rules should not be embedded in JSX or hooks.

## Domain

`src/domain/math-engine` owns question generation, answer calculation, distractors, sprint state, timing, streak progression, and final sprint results. Other domain modules validate sprint configuration, saved results, nicknames, and practice-streak calculations.

Domain modules are deterministic or accept time/randomness as inputs. They do not import React, Expo Router, SQLite, or React Native.

## Persistence

Preferences use `expo-sqlite/kv-store` through `src/data/preferences`. Completed sprints use the results repository in `src/data/results` and SQLite. Repository factories allow tests to use isolated databases.

Persisted and parsed values are untrusted boundaries: sanitize preferences and validate saved sprint data before returning it to features. Preserve existing database names, keys, and schemas unless an intentional, tested migration is part of the task.

Current data is local to the device. It can persist across app restarts, but uninstalling the app or clearing its data can remove it. Device backups may retain copies according to operating-system settings. The current database is not a secret-storage mechanism.

## Shared UI and styling

Cross-feature controls belong in `src/components`; screen-specific components stay with their feature. Reuse `src/theme/tokens.ts` and existing typography, spacing, safe-area, and card treatments. Use centralized formatters and mode metadata instead of duplicating labels or formatting logic.

## Testing

Prioritize pure unit tests for domain rules, boundary tests for repository validation/migrations, and focused lifecycle tests for hooks with timers, app-state listeners, or overlapping async requests. Visual behavior, safe areas, keyboards, rotation, and native persistence still require suitable device testing.
