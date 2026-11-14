# SC-643 r1 implementer report

## Executive summary

- Verdict: DONE. Head `9724c190` on `sc643-sync-empty-destination` (dse worktree), base `8a81c5a7` (origin/develop unchanged). Not pushed.
- D1-D4 implemented as written. One pure resolver, `src/model/CompendiumDestination.ts`, is used by Sync, the migration offer, the Migrate command and all three link readers.
- Blank/whitespace destination resolves to `DS Compendium`; the stored setting is not rewritten. Root forms and anything outside the vault are refused with a Notice naming the setting; nothing is looked up, opened, written or trashed.
- D3 guards: `CompendiumSyncService.sync/applySync`, `CompendiumMigrationService.detect/plan/execute/reconcile/markDeclined/markSettled`, the trash site and the offer in `main.ts`, and `LegacyCompendiumModal.onOpen`.
- Tests: +96 jest tests; 62 red on the pre-fix code (the other 34 = 31 resolver-module tests that have no pre-fix to run against, plus 3 pins that hold both ways).
- Gates: tsc/lint clean; jest 12647 passed / 2 skipped (fresh); lifecycle 64/64; e2e 478/500 ok, 0 failed, 22 known-bug, 287/287 pairs; styles.css byte-identical to base, so shots/freeze/parity carry.
- Extras to rule on (see Follow-ups): `..` handling, whitespace trimming of real folder names, stale manifests with root `''`.

## Commits (dse worktree `/home/scott/code/steelCompendium/worktrees/sc643-sync-empty-destination/draw-steel-elements`)

- `a70cb489` fix(SC-643): an empty Destination folder is the default folder; a vault-root one is refused, and the vault root is never offered for trash
- `9724c190` test(SC-643): Destination-folder resolver table, Sync/Migrate with blank and vault-root destinations, service guards, window backstop, link resolvers

No trailers (user's global rule). No CHANGELOG edit.

## Files changed

Source: `main.ts`, `src/model/CompendiumDestination.ts` (new), `src/data/CompendiumSyncService.ts`, `src/data/CompendiumMigration.ts`, `src/views/LegacyCompendiumModal.ts`, `src/framework/seams/refs.ts`, `src/utils/ReferenceResolver.ts`, `src/refs/SccResolver.ts`.

Tests (new): `test/unit/model/compendiumDestination.test.ts`, `test/dom/framework/syncCompendiumDestination.test.ts`, `test/unit/data/compendiumDestinationGuard.test.ts`.
Tests (extended): `test/dom/views/legacy-compendium-modal.test.ts`, `test/unit/utils/reference-resolver.test.ts`, `test/unit/framework/refs.test.ts`, `test/unit/refs/sccResolver.test.ts`.

No Settings-tab change (D4), no CSS, no e2e change.

## Design

- `resolveCompendiumDestination(raw)`: `trim()`; blank -> `DEFAULT_SETTINGS.compendiumDestinationDirectory`; then `classifyDestinationPath`, which splits on `/` and `\`, drops empty and `.` segments, pops on `..` (a `..` with nothing to pop = `outside-vault`), and reports `refused: root` when no segment is left.
- `classifyDestinationPath` / `isVaultRootPath` is the form the services use. It has NO blank-to-default step, so an empty RESOLVED root is the vault root there.
- `main.syncOptions()` now returns `SyncOptions | null` (resolved `root`); `requireSyncOptions()` shows `DESTINATION_REFUSED_NOTICE` on null. `syncCompendium()` and `migrateCompendium()` check it before taking the busy lock. The three later callbacks (legacy window choice, `syncAnyway`, `syncAfter`) re-resolve at click time, so a setting changed while a window is open cannot reach a trash or a sync.
- Notice text: "Draw Steel Elements: the Destination folder can't be the vault root (or outside the vault). Choose a folder inside the vault in Settings → Draw Steel Elements → Compendium."
- Readers: `compendiumFolderPath()` gives the resolved folder or `null`. On `null` the compendium-relative tiers are skipped (tiers 1-2 already search from the vault root); `SccResolver.resolveByDerivation` returns `null` (the frontmatter index still resolves by code).

## normalizePath, measured

Real Obsidian 1.15.1 source copied from the shipped asar (`/tmp/dse-obsidian-lifecycle-3d0u7p/udd/obsidian-1.15.1.asar`): `normalizePath(o) = Yl(qo(o)).normalize("NFC")`, `qo` = collapse `[\\/]+` to `/`, strip leading/trailing `/`, `""` -> `"/"`; `Yl` = NBSP/NNBSP -> space. Ran both that and the jest mock (`test/mocks/obsidian-core.ts`) in node (`scratchpad/sc643-r1-impl/normtable.js`, output `normtable.out`):

| input | real Obsidian | jest mock | root? |
|---|---|---|---|
| `''` | `/` | `/` | yes |
| `'   '` | `'   '` | `'   '` | no, a folder named spaces |
| `'/'` | `/` | `/` | yes |
| `'.'` | `.` | `.` | no, normalizePath does not treat `.` as root |
| `'./'` | `.` | `/` | real: no; mock: yes (they differ) |
| `'//'` | `/` | `/` | yes |
| `' / '` | `' / '` | `' / '` | no (not trimmed) |
| `'\\'` | `/` | `/` | yes |
| `'..'` | `..` | `..` | no (not resolved) |
| `'a/..'` | `a/..` | `a/..` | no (not resolved) |
| `'./DS Compendium'` | `./DS Compendium` | `DS Compendium` | n/a (they differ) |
| `'DS Compendium/'`, `'a/b/'` | trailing `/` stripped | same | n/a |

Conclusion: `normalizePath` only yields the root for `''`, separator-only strings. It does not trim, does not drop `.`, does not resolve `..`, and the mock differs from real on `./`. So the resolver does not use it for root detection; the table above is why `.`, ` / `, `a/..` needed their own handling.

## Test results on the pre-fix code

Ran the 7 new/extended files with `main.ts`, `src/data`, `src/framework`, `src/refs`, `src/utils`, `src/views` stashed to `8a81c5a7` (the new resolver file left in place): 62 failed / 90 passed of 152 (log `jest-prefix.log`, names in `jest-prefix-v.log`).
New tests = 96. Red pre-fix 62. Green both ways: 31 resolver-module tests (a new module, nothing to run against) and 3 pins (`stored setting is not rewritten`; `a real root still syncs`; `SccResolver` vault-root derives nothing, where the old code also found nothing).

## Gates

| gate | result |
|---|---|
| tsc (`npm run tsc`, both tsconfigs) | exit 0, clean |
| lint (`npm run lint`) | exit 0, clean |
| jest, fresh worktree, `rm -f main.js styles.css` first | `Test Suites: 1 skipped, 285 passed, 285 of 286 total`; `Tests: 2 skipped, 12647 passed, 12649 total`. Fresh baseline is 12551 passed / 2 skipped (12552 with the shots cache, minus 1), so delta = +96 |
| lifecycle | part 1 21/21, part 2 16/16, part 3 9/9, part 4 4/4, part 5 7/7, part 6 4/4, part 7 3/3 = 64/64, 0 failed (appearance.json reset before parts 4-7; no re-runs needed) |
| e2e (`npm run e2e`) | `OBSIDIAN-E2E done: 478/500 ok, 0 failed, 22 known-bug, coverage: 287/287 pairs`, exit 0 |
| styles.css sha256 | head `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9`, base `8a81c5a7` (git archive build) `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9`: identical, so shots 592 / host-leak / capture clip, freeze 280/280, parity 0/0/24 carry, not re-run |

The host was shared (SC-440 ran lifecycle concurrently, load 6-9); no flake appeared.

## Drive-by fixes

None.

## Follow-ups

1. `..` segments: the resolver resolves them (`a/x/../b` -> `a/b`, `a/..` -> root = refused) and refuses any that climb out of the vault (`..`, `../x`) with the same Notice. The ticket does not name this; it falls under "anything else that normalizes to the root" plus the outside-vault case. Owner may want to keep or drop the outside-vault refusal.
2. Whitespace: the whole value is trimmed, so a stored `' My Compendium '` now resolves to `My Compendium`. Behaviour change for anyone who actually has leading/trailing spaces in the setting (their sync target moves, and the old folder is just a stale folder). Judged paste-artifact territory; flagging it.
3. Users who already synced with an empty setting have a manifest with `root: ''` (files in the vault root). The next sync under `DS Compendium` still uses that old manifest's root in `applySync` phase 2 to trash manifest-tracked, unmodified files absent upstream (same recoverable-trash path as before). `reconcile()` now returns 0 for a vault-root effective root. Not addressed; maybe a ticket for a migration/cleanup of such installs.
4. `visual-harness/entry.ts:2049` reads `deps.settings.compendiumDestinationDirectory` directly to seed a harness vault (test infra, default value only); left as is.
5. SC-440's `knownBug('SC-643', '[SET-C03] ...')` in `e2e/specs/settings/compendium.e2e.ts` flips under this fix (blank now triggers a release lookup); whoever lands second converts it, per the ledger. No e2e change here.
6. Sync Notice wording for the 'outside the vault' case shares the root text; the audit of `.repo-docs/` for a mention of "empty destination" was not done (no doc change made).

## Artifacts

- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc643-sync-empty-destination/sc643-r1-implementer-report.md`
- Scratch dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc643-r1-impl/`:
  - `normtable.js`, `normtable.out` (normalizePath real vs mock)
  - `tsc-b.log`, `lint-b.log`
  - `jest-full.log` (post-fix full run), `jest-prefix.log`, `jest-prefix-v.log` (pre-fix red list)
  - `lc-part1.log` ... `lc-part7.log` (lifecycle)
  - `e2e-full.log`
  - `styles-head.sha`, `styles-base.sha`, `build-head.log`, `build-base.log`
