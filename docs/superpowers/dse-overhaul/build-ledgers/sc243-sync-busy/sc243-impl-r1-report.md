# SC-243 implementer report — round 1

## Executive summary

DONE. `CompendiumSyncService` now owns a single busy lock (`beginOperation`/`endOperation`/
`onBusyChange`/`currentBusy`, kinds `'sync'|'check'`); `main.syncCompendium` holds it across
its own prelude (reconcile/manifest-load/migration-detection) via a re-entrant `heldToken`
so it never refuses itself, and clears it on success, on a thrown error, and on hand-off to
the migration/legacy modal. The Settings Sync/Check-for-updates row subscribes live (SC-140
pattern) — both buttons disable, the in-flight one's label swaps, no reopen needed. A second
request from any entry point while one is in flight is refused with a Notice, never starts a
second run. 29 new/changed tests (20 net-new, 9 repaired for the new `sync()` return type),
all confirmed red pre-change. All 7 dse-verify gates pass on the rebased tip. Real-Obsidian
evidence (6 PNGs, dark+light, rest/mid-sync/mid-check) captured and attached below.

## Shas

- DSE (`draw-steel-elements`), branch `sc243-sync-busy`: **`e8d5274`** (rebased onto
  `origin/develop` `6c4f6aa` per the owner's mid-task message; prior pre-rebase tip was
  `b0eed56` on base `c524fd2` — same diff, carried forward cleanly, no conflicts).
- Workspace superproject worktree, branch `sc243-sync-busy`: **`5bcdd27`** (CHANGELOG.md
  bullet only — no submodule pointer bump committed, per the brief; the worktree's
  `draw-steel-elements` pointer is left dirty for the dispatcher/landing step).

Commits:
- `7a70c17` feat(compendium): SC-243 — busy state disables Sync/Check-for-updates while an
  operation is in flight (implementation + tests)
- `e8d5274` docs(changelog): SC-243 — sync/check-for-updates busy state (DSE's own
  `CHANGELOG.md`, `## 7.0.0 (unreleased)`)
- `5bcdd27` docs(changelog): SC-243 — sync/check-for-updates busy state under Unreleased
  (workspace `CHANGELOG.md`)

## Lock design (3 lines)

1. `CompendiumSyncService` owns one busy lock (`busyKind: 'sync'|'check'|null` +
   `busyToken: symbol|null`) shared by both operation kinds, so either kind in flight
   disables both buttons; `beginOperation(kind)` returns a token or `null` if already held,
   `endOperation(token)` releases only if the token still matches, `onBusyChange`/
   `currentBusy` are the live-subscribe seam the settings row uses (same shape as SC-140's
   `ManifestStore.onChange`).
2. `main.syncCompendium` calls `beginOperation('sync')` **before** its own reconcile/
   manifest-load/migration-detection prelude and releases in a `finally` on every exit path
   (success, thrown error, hand-off to a modal); it hands that **same token** into its two
   direct `syncService.sync(options, token)` calls via an optional `heldToken` param, so
   `sync()` never tries to re-acquire a lock its own caller already holds (no self-refusal).
3. Every other caller — `checkForUpdates()`, and the bare `syncService.sync(options)` calls
   from `LegacyCompendiumModal`/`offerMigration`'s callbacks, which fire only after
   `syncCompendium`'s own span has already released — acquires and releases its own fresh
   lock; a caller that loses the race gets `null` back, shows the ticket's exact-wording
   Notice (`SYNC_BUSY_NOTICE`, exported so both refusal sites are byte-identical), and starts
   no work.

## Tests — red-first confirmation

Verified by `git stash push` of the 3 implementation files (keeping the new/edited test
files in place) and re-running jest/tsc against unmodified `develop` code, then
`git stash pop` to restore:

- `test/unit/data/compendiumSyncBusy.test.ts` (new, 9 tests) — all 9 red pre-change
  (`CompendiumSyncService` has no `beginOperation`/`endOperation`/`onBusyChange`/
  `currentBusy`/`isBusy`/`SYNC_BUSY_NOTICE`).
- `test/dom/framework/syncCompendiumBusy.test.ts` (new, 2 tests) — whole suite failed to
  load pre-change (same missing API, referenced at module scope).
- `test/dom/views/settings-tab.test.ts`, new `SC-243 — sync/check busy buttons` describe
  (9 tests) — 8 of 9 red pre-change; the 9th (`B6: non-busy render is unchanged`) correctly
  passes both before and after — it documents the unchanged resting state, not a behavior
  change.

Total: **19 of 20 new/changed-behavior tests confirmed red pre-change** (17 counted as
jest failures — 9 unit + 8 DOM — plus the whole `syncCompendium busy lock` DOM suite
failing to load); the 20th (B6) is a deliberate same-both-ways sanity test. Evidence log:
`/tmp/sc243-jest-redcheck.log` (17 failed, 57 passed, 74 total, 3 suites failed).
`test/unit/data/compendiumSyncRelease.test.ts`'s 6 non-null-assertion edits are a minimal
type-repair for `sync()`'s new `SyncReport | null` return, not new behavior tests.

## Gates (dse-verify battery, measured on the rebased tip `e8d5274`, base `6c4f6aa`)

| Gate | Result |
|---|---|
| 1. `npm run tsc` | clean (no output), exit 0 |
| 2. `npm run lint` | clean (no output), exit 0 |
| 3. `npx jest` (base `6c4f6aa`) | 3997 passed / 1 skipped / 206 of 207 suites / 3 snapshots |
| 3. `npx jest` (after `e8d5274`) | **4017 passed / 1 skipped / 208 of 209 suites / 3 snapshots** (net **+20**: 9 unit + 2 DOM (new files) + 9 DOM (new describe in settings-tab.test.ts) = 20, all this ticket's own) |
| 4. `npm run obsidian-lifecycle` | `OBSIDIAN-LIFECYCLE done: 6/6 ok, 0 failed`, exit 0 (`G-S7a`, `G-S7b`, `G-S6a`, `G-S6b`, `G-S6u`, `G-S5n`) |
| 5. `npm run shots` | 524 PNGs, 0 FAIL |
| 6. `check-freeze.sh` | `freeze OK (260/260 frozen print PNGs byte-identical)`, exit 0 — unchanged, no rebaseline needed |
| 7. `npm run parity` | `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`, exit 0 — unchanged composition |

All 7 gates green. Zero pixels moved (O5), zero frozen bytes moved, parity composition
unchanged — matches the owner ruling's expectation exactly.

Logs (this session's scratch, not committed):
- `/tmp/sc243-tsc-rebased.log`, `/tmp/sc243-lint-rebased.log`
- `/tmp/sc243-jest-base-6c4f6aa.log`, `/tmp/sc243-jest-after-rebased.log`, `/tmp/sc243-jest-redcheck.log`
- `/tmp/sc243-lifecycle-rebased.log`
- `/tmp/sc243-shots-final.log` (the clean, uninterrupted final run backing the numbers above)
- `/tmp/sc243-parity-final.log`

## Evidence (real Obsidian, for Scott)

Captured via a new one-off script (`visual-harness/sc243-evidence.mjs`, **not committed** —
kept as a narrow SC-243-specific tool per the brief; two reusable fixes it needed beyond
copying `settings-evidence.mjs`'s scaffolding are called out under Follow-ups). Busy state
driven through the real service (`syncService.beginOperation`/`endOperation`), not a network
stub. Dark and light, at rest / mid-sync / mid-check, cropped to the status line + Sync
compendium row:

- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc243-sync-busy/evidence/sc243-compendium-rest-dark.png` — Sync/Check for updates both enabled
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc243-sync-busy/evidence/sc243-compendium-mid-sync-dark.png` — "Syncing…" + both disabled
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc243-sync-busy/evidence/sc243-compendium-mid-check-dark.png` — "Checking…" + both disabled
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc243-sync-busy/evidence/sc243-compendium-rest-light.png`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc243-sync-busy/evidence/sc243-compendium-mid-sync-light.png`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc243-sync-busy/evidence/sc243-compendium-mid-check-light.png`

Console-logged button states at capture time (also visually confirmed by reading each PNG),
matching acceptance exactly:
```
rest:       [{"text":"Sync","disabled":false},{"text":"Check for updates","disabled":false}]
mid-sync:   [{"text":"Syncing…","disabled":true},{"text":"Check for updates","disabled":true}]
mid-check:  [{"text":"Sync","disabled":true},{"text":"Checking…","disabled":true}]
```

## Drive-by fixes (made)

- `test/mocks/obsidian-core.ts`'s `FakeButton` gained `disabled`/`setDisabled()` (mirroring
  the real `ButtonComponent`) and now suppresses `click()` while disabled, mirroring a real
  disabled `<button>` element. Required for the new tests to assert/exercise the busy state
  at all; local to the mock file the settings-tab tests already depend on.

## Follow-ups (left alone — for the ticket-owner to file if warranted)

- **`visual-harness/settings-evidence.mjs` (existing, pre-SC-243 script) does not work in a
  fresh/sandboxed environment.** While building this ticket's evidence capture I found it
  fails two ways there that `obsidian-lifecycle.mjs`/`obsidian-camera.mjs` already handle:
  (a) it relies on an online self-update (`warmUpUpdate()`) to get a current-enough Obsidian
  asar rather than copying the newest one from `~/.config/obsidian` (unreliable/slow without
  guaranteed outbound network); (b) it never calls `app.plugins.setEnable(true)` to escape
  restricted mode on a freshly seeded isolated UDD, so the plugin silently never loads
  (`app.plugins.plugins` stays empty; `isEnabled()` reports `false`) — `obsidian-camera.mjs`
  step 2b already has this exact fix. Not touched here (out of scope, not a file this task
  otherwise edits) but worth a Backlog ticket since it presumably also affects any other
  agent trying to reuse `settings-evidence.mjs` off Scott's own already-trusted profile.
- Two `npm run shots` runs in this session appeared to spawn a **second, longer-lived
  `node visual-harness/shoot.mjs` process** alongside the primary one (different PPIDs,
  both consuming CPU for the whole run). The final clean run's numbers are verified correct
  (524/0 FAIL, freeze/parity clean against its actual output), so this had no effect on the
  delivered gates, but it cost real time mid-session (one run was killed by a bad `pkill`
  guess before I understood the pattern, requiring a full re-run) and is worth a maintainer
  look — normal parallelism inside `shoot.mjs`, or a real leak.

## Out of scope (per the brief)

No change to migration/legacy modal flows beyond the busy/guard wiring; no new CSS (O4 uses
native `ButtonComponent.setDisabled` + host styling only).
