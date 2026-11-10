# SC-435 → dse-verify SKILL.md proposal (for the dispatcher)

1. Battery row 4b (e2e): "~36 s on 4 shards" is stale. SC-435 r1 measured ~3.5 min for 160
   tests on a loaded host (loadavg 17-50). Suggest: "~36 s at 128 tests on a quiet host; minutes
   under concurrent load". After SC-435 lands, e2e CURRENT becomes the r1b numbers (see
   decisions.md; expected `160/160 ok, 0 failed, 0 known-bug, coverage: 109/109 pairs`).
2. jest load-sensitive list: add `twin-reuse.test.ts` and `initiative-default-keys.test.ts`
   (5 s timeouts under load; both pass alone). Tracked as SC-568.
3. jest CURRENT rises by the SC-435 tests (r1b report has the exact count).
4. Lifecycle now starts Obsidian 1.15.1; the SKILL says 1.15.0 (SC-435 r2 INFO-5).
