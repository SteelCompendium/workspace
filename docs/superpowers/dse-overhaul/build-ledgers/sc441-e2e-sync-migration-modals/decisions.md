# SC-441 decisions ledger — e2e rollout (Tier 2): compendium sync and migration modals

Effort: `sc441-e2e-sync-migration-modals`. Worktree
`/home/scott/code/steelCompendium/worktrees/sc441-e2e-sync-migration-modals`, dse branch
`sc441-e2e-sync-migration-modals`, cut from dse `develop` @ `a0e55f6b` (workspace `2ebbdb1f`).
Owner session `e255a3cd-5cdb-4dc4-83be-b58e80eb1057` (Fable ticket-owner, spawned 2026-11-24).

This file is current state. Workers read this, never the tracker.

## Ticket scope (verbatim from SC-441, read 2026-11-24)

> Part of the SC-408 functional-test rollout. Scott (SC-408, 2026-10-18): "yes, I want to roll
> this out across all parts of the plugin, including the settings".
>
> **Scope:** compendium sync and the migration modals. This is the only flow in the plugin that
> moves or trashes vault files, so the consequence of a bug is the highest of any surface. Run
> every scenario in the disposable e2e vault copy, and assert the file tree before and after: what
> moved, what was trashed, and that nothing else changed. Cover confirm, cancel and close on every
> modal, plus a re-run with nothing to do.
>
> **Done means** (the same bar as the SC-408 stamina pilot; start from
> `draw-steel-elements/e2e/README.md`):
>
> * Every interactive node on the surface carries a `data-dse-control` id. Both censuses cover the
>   surface: jsdom `test/dom/e2eCensus.test.ts` and real-Obsidian `e2e/specs/_census.e2e.ts`.
> * A manifest in `e2e/manifest/` lists every (control, interaction) pair. A full `npm run e2e`
>   drives each pair at least once through real input, asserting the note file and the screen. At
>   least one driver per pair is a plain test, not a known-bug test.
> * The combinatorial logic (values × states × variants) lives in jsdom matrix tests.
> * Every bug found gets a Backlog ticket in the DSE 7.0.0 project, labelled Bug + DSE Plugin. The
>   ticket gets a `knownBug('SC-…')` (e2e) or `test.failing` (jest) marker citing it. No product
>   fixes in the test ticket. (Scott, SC-408: "For any bugs found, please mark them with the DSE
>   7.0.0 project.")
> * The full dse-verify battery is green, including `npm run e2e` with 0 failed and full coverage.

## Scott's rulings (verbatim, dated)

- 2026-10-18, SC-408: "yes, I want to roll this out across all parts of the plugin, including the
  settings".
- 2026-10-18, SC-408: "For any bugs found, please mark them with the DSE 7.0.0 project."
- 2026-10-18, SC-408 (e2e gate): "make it required to land future changes".
- SC-441 itself has no comments as of 2026-11-24.

## Owner rulings (2026-11-24, Fable ticket-owner)

**O1. Surface boundary.** In scope:

- `src/views/LegacyCompendiumModal.ts` — the "Existing compendium folder found" window (buttons
  "Keep everything", "Move old compendium to trash", the X, Escape, and a click outside the
  window if `DseModal` closes on one).
- `src/views/CompendiumMigrationModal.ts` — the pre-7.0.0 migration window in all its phases:
  PREVIEW ("Not now", "Sync without moving", "Move N file(s)", X, Escape), RUNNING ("Stop"),
  SUMMARY after a complete run ("Close", "Sync the compendium now"), SUMMARY after a stopped run
  ("Close", "Finish moving the remaining N"), the error state ("Close"), and the collapsible
  per-path lists in the summary.
- Every entry point that can open one of those windows or start a sync that writes files: the
  settings tab's Sync button (SC-440 drove it only up to the point a window would open), every
  sync / migration command in the palette (find them in `main.ts`), the compendium search window's
  empty-state Sync affordance (SC-443 stopped where a sync would start), an "Update available"
  notice if it carries a control, a Destination-folder change if it opens a window, and any offer
  made at plugin load (`CompendiumMigrationService.isPending` and friends).
- The sync run's effect on the vault (`src/data/CompendiumSyncService.ts`): files created, files
  updated, user-modified files kept, conflicts skipped, files removed upstream moved to the trash,
  unsafe paths rejected, the manifest it writes, and the Notices it shows (busy, refused
  destination, destination changed, summary).
- The migration run's effect (`src/data/CompendiumMigration.ts`): renames, the pre-migration
  backup folder, blocked renames, unmapped files left alone, the report note, the persisted state
  (declined / settled / incomplete), and Obsidian's own link rewrite in the user's notes.

Not in scope: the settings tab's own controls (SC-440, landed), the compendium search window's
query / result rows (SC-443, landed), `CompendiumIndex` and reference resolution, and how a synced
note renders.

**O2. Disposable vault only, and prove it.** Every scenario runs in the e2e runner's disposable
vault copy. The spec's `before` (or the driver helper every scenario goes through) must assert the
open vault's base path is the runner's temp copy and throw otherwise, before any sync, trash or
rename is triggered. Never open, read or point a test at Scott's live vault (the main checkout's
`draw-steel-elements/demo-vault`) or any other real vault.

**O3. Trash never leaves the vault.** Scenarios run with Obsidian's "Deleted files" setting on the
vault's own `.trash` folder, so a trashed file can be found and asserted and nothing lands in the
machine's system trash. The "Permanently delete" setting may be driven too (it only deletes inside
the disposable vault) — report what the plugin does under it. Do NOT run any scenario with the
"system trash" setting: if covering it seems necessary, return NEEDS_CONTEXT and ask.

**O4. File-tree assertion on every scenario.** A driver helper snapshots the whole disposable
vault before and after each scenario: every file's path, size and content hash, including
`.trash/`, the backup folder, the report note, and the plugin's `data.json` / compendium manifest.
Each scenario asserts the exact difference: which paths were created (with expected bytes), which
moved (old path gone, new path present, same bytes), which were trashed (now under `.trash/`, same
bytes), which were modified (expected bytes), and that every other file is byte-identical —
including the user's own notes inside and outside the Destination folder. A cancel, a close, an
Escape or a refused run asserts an EMPTY difference apart from the plugin state keys the code is
meant to write (name them in the assertion). An assertion that only checks "the window closed" or
"a Notice appeared" does not count as a driver for a pair.

**O5. Confirm, cancel, close on every window and phase; and the nothing-to-do re-run.** For each
window and each phase in O1: the confirming button(s), the declining button(s), the X, and Escape
(plus click-outside if it closes). And the re-runs: a second Sync against the same release (no
file created, updated or trashed; say what Notice it shows); a Sync after a completed migration;
re-opening after "Not now" (is the offer made again? what does the persisted decline do?); a
migration with nothing left to move; "Finish moving the remaining N" after a Stop, to completion.

**O6. No network; a fixture release.** No e2e test may reach the network. The sync resolves a
GitHub release and downloads a zip through `requestUrlFn`: stub it page-side (the SC-440
`requestUrlFn` guard in `e2e/driver/settingsDrive.ts` throws unless a test installs its own) with
a SMALL fixture release — a zip of a hand-picked handful of files, built at test time or checked
in under `e2e/` as a tiny fixture — in at least two versions (tag A, tag B) so an update, an
upstream removal and a new file are observable. A fixture that fails the lookup, fails the
download, and returns a broken zip drives the failure paths. If the service cannot be pointed at
a fixture without a product change, return NEEDS_CONTEXT in phase A — do not change product code
for it.

**O7. Legacy fixture for the migration.** The migration offer needs a pre-7.0.0 layout (at least
20 legacy paths, the detection threshold). Build it at test time in the disposable vault from the
real `migrationMap()` (old paths that really map), with: one hand-modified file (drives the
backup), one occupied destination (a blocked rename), one unmapped file inside the root (the
user's own note, must be left alone), and one user note OUTSIDE the root that links to a file that
moves (assert Obsidian rewrote that link and changed nothing else in the note). Make the run long
enough that "Stop" can be pressed mid-run through real input; if the run is too fast for that, a
test-side page wrapper that slows `fileManager.renameFile` is acceptable — say so in the report.
No product change for it.

**O8. Bug flow** (same as SC-438..443). Workers never touch the tracker. A worker that finds a
product bug commits its coherent work, finishes the survey, and returns `STATUS: NEEDS_CONTEXT`
ONCE with every bug's title, repro, file:line and severity. The owner files the Backlog ticket
(DSE 7.0.0, Bug + DSE Plugin, related to SC-441) and resumes the worker with the key, which the
worker then cites in `knownBug('SC-…')` / `test.failing`. No product fixes in this ticket; product
source may change ONLY to add `data-dse-control` attributes (and census plumbing) — no behaviour
change. **A bug that can lose or trash a user's file is reported as High with an exact repro, and
is never "worked around" in the test.**

**O9. Known tickets on this surface.**

- **SC-653 — OPEN, parked on Scott (not fixed, do not fix).** "Existing compendium folder found"
  offers to trash any non-empty Destination folder, including the user's own notes. Scott is
  choosing between (i) the same window without the trash button and (ii) refusing with a Notice.
  Both remove the trash button for a folder of the user's own notes. So: the plain tests drive the
  window as it is today on a compendium-like folder; ONE `knownBug('SC-653')` scenario asserts
  that a Destination folder holding only the user's own notes is NOT offered "Move old compendium
  to trash" (true under either option). Do not report SC-653 as new.
- **SC-643 — fixed, must stay fixed.** A blank Destination means `DS Compendium`; the vault root
  and a path outside the vault are refused with a Notice; the trash is guarded. Drive it.
- **SC-646 — fixed, must stay fixed.** A failed Sync from the settings tab leaves no
  "Uncaught (in promise)" in the console.
- **SC-125** (the migration), **SC-243** (the busy guard: a second Sync / Check while one runs
  shows the busy Notice) — fixed; a regression of a fixed one is a NEW bug, report it.
- Known e2e flakes under load, not this surface: INIT-W09 / INIT-W10 (SC-654), SET-X03 / SET-X04
  (SC-657), NEGO-R05 / NEGO-R08. A red there is re-run alone before it is believed, and reported
  either way.

**O10. Shared e2e infrastructure.** SC-682 is in flight in another worktree (it adds `AUTH-*`
tests). Keep `e2e/driver/*` changes small and additive: a new driver file (e.g.
`e2e/driver/sync.ts`) over edits to existing ones. Any edit to an EXISTING `e2e/driver/*` file
must be listed in the phase A report.

**O11. Scenario ids.** e2e ids `SYNC-*` (a new prefix; none exists on develop or in the SC-682 /
SC-691 worktrees as of 2026-11-24). Suggested groups: `SYNC-S*` sync runs and their file effects,
`SYNC-E*` the "Existing compendium folder found" window, `SYNC-M*` the migration window,
`SYNC-R*` re-runs with nothing to do, `SYNC-F*` failure paths, `SYNC-D*` destination guard. Census
ids start at `[CENSUS-35]` (develop ends at `[CENSUS-34]`). Ids are literal strings in test
titles; a duplicate id makes the runner exit 2. Never a bracketed ticket id in a test title
(SC-577).

**O12. Two phases.** Phase A: control ids, both censuses, the manifest, the jsdom matrix tests,
the bug survey, the mechanics answers — then STOP with `NEEDS_CONTEXT` even with zero bugs.
Phase B (after the owner files the bug tickets and resumes): the e2e specs, markers, full battery.

## Round log

- 2026-11-24 r1 (phase A): implementer dispatched. Brief `sc441-brief-r1-implementer.md`.
  Implementer agent id `a635d9206297b6682` (orchestration:implementer). Tracker: SC-441 flipped Backlog -> Awaiting 2026-11-24.
  Reviewer for phase B must be a different identity (author-independence).
- 2026-11-24 r1 (phase A) RETURNED `NEEDS_CONTEXT` as designed. dse head `874a5b95` (4 commits on
  `a0e55f6b`). tsc + lint clean; jest 14898 passed / 2 skipped fresh (+183); 16 DOM control ids
  (attributes only, 2 product files); 69 manifest pairs; 10 defects; 6 questions. Report
  `sc441-r1-implementer-report.md`.

## Owner rulings after phase A (2026-11-24)

**O13. Bug tickets (filed 2026-11-24, all Backlog, DSE 7.0.0, Bug + DSE Plugin, related SC-441).**

| Phase A id | Ticket | Priority | What |
|---|---|---|---|
| BUG-1 | **SC-694** | High | Sync replaces a compendium note the user edited, no copy, no warning. Spec-sanctioned today (the "F1 pin" test); the ticket asks Scott whether to keep it. Marker asserts only "the user's bytes survive somewhere". |
| BUG-2 | **SC-695** | Medium | "Move old compendium to trash" trashes before the release is downloaded; a failed Sync leaves nothing. |
| BUG-3 | **SC-357** (existing ticket, 2026-09-24; now in DSE 7.0.0) | none set | The migration takes no busy lock. Not a new ticket: SC-357 already asks for exactly this. |
| BUG-4 | **SC-696** | Low | Closing the migration window mid-run shows the "Not now" Notice and records a decline. |
| BUG-5 | **SC-697** | Low | Neither window closes on plugin unload; buttons still run. |
| BUG-6 | **SC-698** | Medium | Sync is a dead end when every legacy file's 7.0.0 path is taken ("nothing to migrate"). |
| BUG-7 | **SC-699** | Low | A Sync that fails part-way leaves its files unrecorded; the retry offers to trash them. |
| BUG-8 | **SC-700** | Low | Destination accepts `.obsidian` / `.trash`; a Destination that is a FILE gives raw ENOTDIR (phase A follow-up folded in). Phase B confirms in real Obsidian. |
| BUG-9 | **SC-653** (open, parked on Scott) | High | Trash button does not say it is permanent under "Permanently delete". Not a new ticket: SC-653's posted plan already says "Trashing a compendium-like folder moves it to the vault's own `.trash` folder. That happens whatever your "Deleted files" setting is, so it is never a permanent delete." Marker `SC-653`. |
| BUG-10 | **SC-701** | Low | A Destination holding only empty folders opens "Existing compendium folder found". |

Phase A follow-ups: `checkForUpdates()` always asks for `latest` / `en` — DROPPED (a release newer
than a pinned tag is true information; only `en` exists). A migration source that vanishes between
preview and run is silently skipped — DROPPED (needs the user to delete a file in that window;
nothing is lost; jest pins it). FILE Destination raw error — FOLDED into SC-700.

**O14. Answers to the phase A questions.**

- Q1 (`alwaysUpdateLinks`): AGREED. Drive both values, set at run time in the disposable copy.
  ON: the link in the outside note is rewritten and nothing else in that note changed. OFF: record
  exactly what happens (note untouched? an Obsidian prompt? per file?). If OFF leaves links broken
  while the window promises they are updated, that is a new bug: batch it (O16).
- Q2 (`mapOverride` page-side with recomputed hash prefixes for the "no backup needed" scenario):
  YES. Test-side only.
- Q3 (dismissal ids): follow the existing modal manifests (`reset-encounter-modal.ts`,
  `montage-remove-hero-modal.ts`): `'modal.close': ['click', 'press:Escape']` and
  `'modal.backdrop': ['click']`, the ids `DseModal` already stamps. Keep the per-phase coverage:
  one manifest surface per phase if the manifest type allows it. If it cannot express that, keep
  per-phase ids but use only kind strings that already exist (`click`, `press:Escape`), and say why
  in the manifest header. No new kind strings (`click:X`, `click:Backdrop`).
- Q4: keys in O13. e2e twins (`knownBug`) for SC-694, SC-695, SC-357, SC-698, SC-653 (BUG-9),
  SC-696 (the running-phase Escape pair is driven anyway), SC-700 and SC-701. SC-697 and SC-699:
  jest `test.failing` only, unless an e2e twin is cheap and does not destabilise the session.
- Q5: CONFIRMED. `trashOption: 'none'` ("Permanently delete") is driven in the disposable vault,
  after the O2 guard. `'system'` is never driven.
- Q6: footer buttons are `click` + `press:Enter` only, as the existing modal manifests declare.
  Drop the `press:Space` pairs. ~~brief r1 item 3 "(Enter / Space on the focused button)"~~
  superseded by this.

**O15. Two additions for phase B.**

- **Trash canary.** Before the first scenario that can trash anything, in every spec session:
  create a throwaway file in the disposable vault, trash it through the same
  `app.fileManager.trashFile`, and assert it is now under `<vault>/.trash/`. Throw (and run no
  trash scenario) otherwise. If `vault.setConfig('trashOption', …)` does not work in real Obsidian,
  STOP and return NEEDS_CONTEXT — do not run a trash scenario on a guess.
- **Focus on open.** For each window and each phase, assert which control has keyboard focus when
  it opens, and that pressing Enter straight away does only what that focused button does. Report
  the focused control per phase. A window that opens with focus on a button that trashes or moves
  files is a bug: batch it (O16).

**O16. New bugs found in phase B (real Obsidian).** Finish every spec, commit, then return
`NEEDS_CONTEXT` ONCE with the new bugs BEFORE the final full battery (targeted runs of the new
specs are enough at that point). The owner files and resumes with keys; the full battery then runs
once. With no new bug: run the full battery and return DONE.

## Cross-effort notes (for the dispatcher at landing)

- SC-653's owner must, when it lands: flip this ticket's `knownBug('SC-653')` markers (the
  user-notes folder scenario and the "Permanently delete" scenario) and update the plain
  "Existing compendium folder found" tests to the new window. SC-701 could be folded into SC-653.
- Whoever fixes SC-694, SC-695, SC-357, SC-696..SC-701 flips its markers (jest `test.failing` in
  `test/dom/framework/syncCompendiumBugs.test.ts`, e2e `knownBug` in `e2e/specs/sync/`). SC-694's
  fixer also changes the "F1 pin" test in `test/unit/data/compendiumSync.test.ts`.

## Round log (continued)

- 2026-11-24 r2 (phase B): implementer `a635d9206297b6682` resumed. Brief
  `sc441-brief-r2-implementer-phaseB.md`.
- 2026-11-24/26: r2 implementer stopped twice on usage limits. Branch head `867574ce` (4 phase B
  commits on `874a5b95`: guard + canary, driver + sync-run scenarios, legacy window + migration
  preview scenarios). No `## Phase B` report section written yet.
- 2026-11-26: fresh owner (Opus 5.5, replacing the Fable owner per Scott's in-session request to
  the dispatcher; same session id). **O17. Rebase now onto dse `develop` @ `23f3e61b`** (SC-687,
  SC-690, SC-682 landed; develop touched `e2e/README.md`, `e2e/driver/authoring.ts`,
  `e2e/specs/authoring/*`). Baselines at `23f3e61b`: jest 14724 passed / 2 skipped fresh;
  lifecycle 64/64; e2e `OBSIDIAN-E2E done: 841/851 ok, 0 failed, 10 known-bug, coverage: 486/486
  pairs`; shots 592; freeze 280/280; parity 0 / 0 / 24. Supersedes r2 brief §1's "do NOT rebase
  on your own". r2 implementer `a635d9206297b6682` resumed with this.

## Owner rulings after the phase B O16 stop (2026-11-26, Opus 5.5 owner)

- r2 implementer returned NEEDS_CONTEXT at head `7112341f` (13 commits on `23f3e61b`, rebase
  clean); `--element=sync` x3 `84/93 ok, 0 failed, 9 known-bug, coverage: 59/539 pairs`.

**O18. New tickets (filed 2026-11-26, Backlog, DSE 7.0.0, Bug + DSE Plugin, related SC-441).**

| Id | Ticket | Priority | What |
|---|---|---|---|
| NB-1 | **SC-702** | Medium | With "Automatically update internal links" OFF the migration waits on Obsidian's per-file prompt; "Do not update" breaks folder-path links; the summary still says "links updated by Obsidian". e2e `knownBug('SC-702')` asserting the correct behaviour (the window warns before the run when the setting is OFF, and the summary does not claim an update that did not happen). |
| focus | **SC-703** | Low | RUNNING / SUMMARY / STOPPED / ERROR open with focus on the page body (focused button removed on the phase change); Enter does nothing until Tab. ~~implementer's "not a bug, a11y nicety"~~ superseded: filed as a bug, same family as SC-626/639/642. ONE e2e `knownBug('SC-703')` scenario asserting focus is inside the window after a phase change (the complete summary is enough); add more phases only if cheap. |

**O19.** Census in its own file `e2e/specs/sync/census.e2e.ts` (SC-443 precedent) instead of
`_census.e2e.ts`: ACCEPTED as is.

**O20.** SC-700 gets the real-Obsidian facts as a comment from the owner (`.obsidian` / `.trash`
accepted and written into; FILE Destination raw `ENOTDIR` carrying the absolute disk path).

Next: implementer resumed to add the SC-702 / SC-703 markers, then the full battery once (O16).
Expected full e2e: `OBSIDIAN-E2E done: 925/946 ok, 0 failed, 21 known-bug, coverage: 539/539 pairs`
if exactly two knownBug tests are added (scale with what is added).

**O21 (2026-11-26).** Base moved: SC-688 landed, dse `origin/develop` = `4b233886` (5 commits on
`23f3e61b`, `src/authoring/schemaSuggest.ts` + tests). Rebase onto `4b233886` BEFORE the full
battery; supersedes O17's `23f3e61b`. Baselines at `4b233886`: jest 14730 passed / 2 skipped fresh;
lifecycle 64/64; e2e `OBSIDIAN-E2E done: 843/852 ok, 0 failed, 9 known-bug, coverage: 486/486
pairs`; shots 592; freeze 280/280; parity 0 / 0 / 24. Workspace origin/main `6d5c3811`.
Expected full e2e for SC-441 = 852 + 93 + new markers total, known-bug 9 + 9 + new markers,
coverage 539/539.
- 2026-11-27 r2 DONE: head `88ea9c87` (16 commits on `4b233886`), tree clean. jest 14913 / 2 fresh;
  lifecycle 64/64; e2e `927/947 ok, 0 failed, 20 known-bug, coverage: 539/539 pairs` (421 s);
  shots 592; freeze 280/280; parity 0 / 0 / 24. SYNC-M18 flake (report-note name carries the
  minute) fixed in the test, sync x3 clean after. Product diff: the 2 window files, attributes only
  (per implementer; reviewer verifies).
- 2026-11-27 r3: independent review dispatched (orchestration:reviewer, fresh identity; the
  implementer `a635d9206297b6682` authored everything). Brief `sc441-brief-r3-reviewer.md`.
  r3 reviewer agent id aa0558d6ea9a19a73.

## Owner rulings after the r3 review (2026-11-27)

r3 verdict FIX REQUIRED: 0 CRITICAL, 1 HIGH, 5 MEDIUM, 5 LOW, 4 INFO; safety A1-A3 pass; all 11
mutation classes caught; one new product bug. Report `sc441-r3-review-report.md`.

**O22. New ticket: SC-706** (High, Backlog, DSE 7.0.0, Bug + DSE Plugin, related SC-441 / SC-653 /
SC-694) = review's NB-R3-1: after a first Sync, changing the Destination and syncing again
overwrites the user's own notes in the new folder, no window, no copy. e2e `knownBug('SC-706')`
asserting the correct behaviour, quoted from the review: "a Sync into a changed Destination never
overwrites a file the plugin did not install there, and asks first if the folder holds files".

**O23. Fix round r4 scope: FOLD every HIGH, MEDIUM and LOW finding (H1, M1-M5, L1-L5) with the
review's prescribed fixes, plus I1** (the fixture stub THROWS on an unknown URL instead of
answering 404 — r2 brief: "a request that falls through throws"). DROPPED: I2 (`os.tmpdir()`
fallback outside `run.mjs`; every other guard check still applies), I3 (equivalent mutant), I4
(bounded polls, no finding). M1 note: E09 going red under SC-653's plan is expected — it is the
plain current-behaviour test the SC-653 fixer updates (cross-effort note above). No product
change in the fix round. Then a scoped re-review of the r4 delta by the r3 reviewer
`aa0558d6ea9a19a73` (not the author).
- 2026-11-27 r4 fix round: implementer a635d9206297b6682 resumed with sc441-brief-r4-implementer-fix.md.
- 2026-11-27 r4 DONE: head 4b455727 on 4b233886; all of H1 M1-M5 L1-L5 I1 folded + SC-706 marker [SYNC-K12] + jest twin + canary metadata-wait harness fix. jest 14916/1 (cache) = 14915/2 fresh; sync x3 84/96 ok 12 known-bug; full e2e 927/948 ok, 0 failed, 21 known-bug, 539/539 (486 s). r5 scoped re-review: r3 reviewer aa0558d6ea9a19a73 resumed on 88ea9c87..4b455727.

**O24 (2026-11-27).** Base moved: SC-391 landed, dse `origin/develop` = `44bab481` (7 commits on
`4b233886`: `ds-scc` prose card for nine compendium types + one `styles.css` rule scoped to it).
Workspace origin/main `a9bc0105`. Baselines at `44bab481`: jest 14806 passed / 1 skipped (shots
cache); lifecycle 64/64; e2e `OBSIDIAN-E2E done: 845/854 ok, 0 failed, 9 known-bug, coverage:
487/487 pairs` (adds PROSE-C01/C02, one pair); shots 636; freeze 280/280; parity 0 / 0 / 24.
Plan: the r5 re-review (already running on `4b455727`) finishes; then r6 = rebase onto `44bab481`
+ full battery (check CENSUS id / manifest collisions with SC-391). Expected e2e after rebase:
total 854 + 96 = 950, known-bug 9 + 12 = 21, ok 929, coverage 540/540.
- 2026-11-27 r5 re-review: LAND-READY at `4b455727`; all r3 findings fixed by probe; SC-706 marker
  sound; full e2e 927/948, 0 failed, 21 known-bug, 539/539. New: 3 LOW, 2 INFO
  (`sc441-r5-rereview-report.md`).

**O25. r5 rulings.** FOLD r5-L1 (`app.json` write caught by the scenario that makes it; restore
`app.json` in `resetSyncTree`), r5-L2 (compare `trashOption` / `alwaysUpdateLinks` against the
values `startSyncTest` set, instead of dropping them), r5-L3 (K01/K02 take the "no window" branch
only when a Notice was seen), r5-I1 (restore the SC-701 header comment) — with the review's
prescribed fixes, into r6 together with the O24 rebase. DROP r5-I2 (~0.5 s per sync scenario for
quiescence is the price of M5's fix). r7 = scoped re-check of the r6 delta by the r3/r5 reviewer
`aa0558d6ea9a19a73`.
- 2026-11-27 r6 DONE: head e783b068 on 44bab481 (rebase clean). r5-L1/L2/L3/I1 folded, proven by appkey/appharness/silent mutants. jest 14991/1 (cache); lifecycle 64/64; e2e 929/950 ok, 0 failed, 21 known-bug, 540/540; shots 636; freeze 280/280; parity 0/0/24. r7 scoped re-check of e783b068 by aa0558d6ea9a19a73.
- 2026-11-27 r7 re-check: LAND-READY at `e783b068`; appkey / appharness fail in the scenario that
  makes the change; silent no longer "appears fixed"; `--element=sync` 84/96 ok, 0 failed, 12
  known-bug. Residual LOW (after a real `app.json` write the NEXT scenario also fails its pristine
  check, the file on disk catching up late): DROPPED — the scenario that made the change now fails
  first and names the setting; the follow-on red only appears after a real red.
- **LAND-READY** reported to the dispatcher 2026-11-27: dse `e783b068` on `develop` `44bab481`.
- 2026-11-27 LANDED: dse develop e783b068, workspace a8d29703 (bookkeeping 018c2d24). Owner posted the close ask; ticket In Progress + Needs Review. Owner stopped.
