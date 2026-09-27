# SC-243 implementer report — fix round 1

## Executive summary

DONE. All three review r1 findings (L1 required, L2/L3 FOLD) closed. L1: the
LegacyCompendiumModal choice and `syncAnyway` now acquire the busy lock **before**
`trashFile`/`markSettled`, not just before `sync()` — a sync already in flight refuses the
choice outright instead of losing its own destination folder or settling migration state
first. L2: `sync()` now validates a passed `heldToken` against the live lock, refusing a
stale/foreign token instead of trusting it unconditionally. L3: `opRow`'s `build` type
widened to `void | (() => void)` to match the cleanup it actually returns. Removed the
untracked `visual-harness/sc243-evidence.mjs` from the DSE tree (archived by the reviewer;
SC-359 tracks porting its fixes). 3 regression tests added (2 for L1, 1 for L2), all
confirmed red pre-fix. Rebase was a no-op (origin/develop unchanged at `6c4f6aa`). All
gates green: tsc/lint clean, jest 4021 passed (4017 + 4 new), lifecycle 6/6, shots
524/0 FAIL, freeze 260/260. Parity skipped — no CSS/DOM changed (rebase was a no-op and
this round is pure JS logic + one type signature), per the brief's own condition.

## Shas

- Rebase base: `origin/develop` = **`6c4f6aa`** — unchanged since round 1; `git rebase
  origin/develop` reported "Current branch sc243-sync-busy is up to date."
- DSE tip after fix round: **`7af05c2`**
- `git status` in the DSE clone: clean (only the untracked evidence script existed before
  this round's first commit; it is now deleted, not untracked).

Commits (one per fix, as asked):
- `50b3b1d` fix(compendium): SC-243 review r1 L1 — legacy-modal choice and syncAnyway are
  lock-first
- `99264eb` fix(compendium): SC-243 review r1 L2 — sync() validates heldToken against the
  live lock
- `7af05c2` fix(compendium): SC-243 review r1 L3 — widen opRow's build type to carry its
  cleanup

## Findings closed

- **L1 (required, FOLD to `syncAnyway` too).** `main.ts`'s `LegacyCompendiumModal` choice
  callback and `offerMigration`'s `syncAnyway` callback both did a real action
  (`trashFile(root)` / `migrationService.markSettled(root)`) unconditionally, then called
  the guarded `syncService.sync(...)` — so a sync already in flight when the user answered
  could have its OWN destination folder trashed (or migration state settled) before the
  choice's own sync was refused. Fixed by moving `beginOperation('sync')` to the very top
  of each callback: refused up front (Notice, return) with **no** side effect at all when
  busy; otherwise the side effect and the guarded `sync(options, token)` run under that
  same held token, released in `finally`.
- **L2 (FOLD, hardening).** `sync(options, heldToken?)`'s `heldToken ?? this.beginOperation(...)`
  trusted any *defined* token — nullish coalescing only falls through on `null`/`undefined`,
  so a stale (already-released) or outright foreign token skipped the guard entirely and ran
  unguarded, even while a genuinely different operation held the lock (review's probe P10).
  Fixed with an explicit check: a defined `heldToken` that isn't `=== this.busyToken` is
  refused (Notice, `null`) before anything else runs. No live caller is affected — only
  `syncCompendium` ever passes a token, and it always passes its own live one.
- **L3 (FOLD, type hygiene).** `opRow`'s `build` param was typed `(setting: Setting) => void`,
  but the Sync compendium row is the first `opRow` to return a live-mount cleanup — a bare
  `void` return position silently accepts that returned function, exactly the hazard
  `opChrome`'s own doc comment already called out for itself. Widened to
  `void | (() => void)`, matching `opChrome` and `NavRow.render`'s own type. No behavior
  change (obsidian already kept and called the cleanup correctly — SC-243 round 1's own
  teardown tests already proved that at runtime; this is a type-only fix).
- **L4**: left alone — Scott's call, no code action taken (visual note about the "Syncing…"
  row height and light-theme disabled-Check contrast).
- **I2/I3 (SC-357/SC-358)**: untouched, out of scope per the ledger.
- **I6/impl F2 (SC-359)**: `visual-harness/sc243-evidence.mjs` removed from the DSE tree
  (`git rm`-equivalent — it was untracked, so a plain delete; confirmed absent from
  `git status`). The reviewer's archived copy lives in the ledger's `evidence-tool/` dir.

## Tests — red-first confirmation

Verified by `git stash push -- main.ts src/data/CompendiumSyncService.ts` (keeping the new
test files in place — L3 has no test, it's a type-only change) and re-running the two
affected test files against pre-fix code, then `git stash pop` to restore:

- **L1a** — `LegacyCompendiumModal onChoice(true): a sync already in flight refuses the
  choice BEFORE trashing the root` — **RED pre-fix**: `trashFile` was called (1 call,
  expected 0).
- **L1b** — `offerMigration's syncAnyway: a sync already in flight refuses the choice
  BEFORE markSettled` — **RED pre-fix**: `markSettled` was called (1 call, expected 0).
- **L2** — `a stale or foreign heldToken is refused, not trusted unconditionally` — **RED
  pre-fix**: the stale token ran the sync unguarded, reaching the network and throwing
  "Downloaded compendium asset is empty" (i.e. it proceeded past `resolveRelease` into
  `downloadAsset`) instead of returning `null` with a busy Notice.
- A fourth new test (`onChoice(true): idle — trashes the root THEN syncs, under its own
  lock`) is a same-both-ways ordering sanity check, not a regression proof (it passed
  before and after by design — the bug was about the GUARD's placement, not the idle
  ordering).

3 of the 4 new tests failed pre-fix (3 failed, 12 passed in that two-file run); restored
to green after `git stash pop`. Log: `/tmp/sc243-fix1-redcheck.log`.

## Gates (measured on the fix-round tip `7af05c2`)

| Gate | Result |
|---|---|
| `npm run tsc` | clean, exit 0 |
| `npm run lint` | clean, exit 0 |
| `rm -f main.js styles.css && npx jest` | **4021 passed / 1 skipped / 208 of 209 suites / 3 snapshots**, exit 0 (4017 round-1 baseline + 4 new: 3 regression + 1 sanity) |
| `npm run obsidian-lifecycle` | `OBSIDIAN-LIFECYCLE done: 6/6 ok, 0 failed`, exit 0 (run because `main.ts` changed) |
| `npm run shots` | 524 PNGs, 0 FAIL |
| `check-freeze.sh` | `freeze OK (260/260 frozen print PNGs byte-identical)`, exit 0 — unchanged |
| `npm run parity` | **skipped** — no CSS/DOM changed this round (rebase was a no-op; this round is pure JS logic in `main.ts`/`CompendiumSyncService.ts` plus a TS-only type widening in `SettingsTab.ts`), per the brief's "only if the rebase pulled in CSS/DOM changes" condition |

Logs (scratch, not committed):
- `/tmp/sc243-fix1-tsc-4.log`, `/tmp/sc243-fix1-lint-1.log`
- `/tmp/sc243-fix1-jest-full.log` (4021), `/tmp/sc243-fix1-redcheck.log` (red-first)
- `/tmp/sc243-fix1-lifecycle.log`
- `/tmp/sc243-fix1-shots.log`

## `git status` (DSE clone, final)

```
clean
```

Untracked `visual-harness/sc243-evidence.mjs` from round 1 is gone (deleted, not merely
untracked-and-ignored).

## Out of scope (per the brief)

SC-357 (migration guard), SC-358 (prelude error Notices / unhandled rejections), SC-359
(`settings-evidence.mjs` env fixes) — not touched. No label/visual changes (L4 is Scott's
call, not acted on here).
