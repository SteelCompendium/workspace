**The SC-441 test survey reproduced this and found a second shape: two migrations can run at once.**

While a migration is moving files, running the Migrate command or pressing Sync opens another "Move your compendium" window over the running one. Each window can start its own run.

This is the same cause as this ticket (the migration takes no busy lock), so no new ticket was filed. I moved this ticket into the DSE 7.0.0 project, as Scott asked for bugs found by the test rollout.

SC-441 adds tests marked as known-failing against this ticket. Whoever fixes it turns them into plain tests: `[BUG-3]` in `test/dom/framework/syncCompendiumBugs.test.ts`, and the `knownBug('SC-357')` scenario under `e2e/specs/sync/`.

Code: `main.ts:869-883` (`migrateCompendium` / `offerMigration` never call `beginOperation`).
