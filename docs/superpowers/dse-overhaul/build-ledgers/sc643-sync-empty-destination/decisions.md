# SC-643 decisions ledger — empty Destination folder makes Sync offer to trash the vault

Ticket: SC-643 (Bug, High). Owner: ticket-owner (Opus 5.5), session be71a0a9-199f-4e14-967b-191935312b05.
Worktree: `/home/scott/code/steelCompendium/worktrees/sc643-sync-empty-destination` (branch
`sc643-sync-empty-destination` in every submodule). Cut from dse develop `8a81c5a7`, workspace main `c3f9b129`.

## Scott rulings (verbatim, dated)

None yet. The ticket's own "Expected" (filed by the SC-440 owner, 2026-11-14) is the spec:

> **Expected:** an empty (or `/`, or whitespace-only) destination is refused or ignored, and Sync never
> offers to trash the vault root.

## Owner decisions (2026-11-14) — within the ticket's "refused or ignored"; Scott may override

- **D1. Empty or whitespace-only Destination folder = the default folder `DS Compendium`** (the value the
  field's placeholder already shows, `DEFAULT_SETTINGS.compendiumDestinationDirectory`). Sync, the
  migration offer, the "Migrate compendium" command and every link/reference resolver that reads the
  setting use the SAME resolved folder, so links resolve where Sync wrote. The stored setting is not
  rewritten.
- **D2. A Destination that resolves to the vault root (`/`, `.`, `./`, `//`, ` / `, and anything else
  that normalizes to the root) is refused:** Sync and Migrate do nothing to the vault (no lookup, no
  window, no write, no trash) and show a Notice naming the setting.
- **D3. Defence in depth:** the vault root is never handed to `trashFile`, never offered in the
  "Existing compendium folder found" window, and never used as the migration root, whatever path reached
  it (guard at the trash site and in the service, not only in `syncOptions`).
- **D4. No Settings-tab UI change in this ticket** (no inline validation message): keeps shots/freeze
  untouched and stays out of SC-440's spec files.
- **D5. Never run a real Sync, move or trash against any vault but a throwaway test vault.** Tests use
  mocks / the lifecycle or e2e scratch vaults only; no network.

## Cross-effort

- SC-440 (in flight) carries e2e `knownBug('SC-643', '[SET-C03] …')` in
  `e2e/specs/settings/compendium.e2e.ts` (not on develop at cut). Its body waits for a release lookup OR the
  trash window, so D1 (empty → default → a lookup happens) flips it to "appears fixed". Whoever lands
  second converts it to a plain test.
- SC-441 (queued until SC-643 lands) owns real-Obsidian e2e for the sync / migration modals.
- SC-440's `test/dom/views/settings-matrix.test.ts:483` (`syncOptions().releaseTag`) breaks tsc against SC-643's
  nullable `syncOptions()`: whichever lands second writes `syncOptions()?.releaseTag` (r2 M1).

## Rounds

- **r1 (2026-11-14)** — implementer (orchestration:implementer, id adf8e341ee0e9a2d6), brief `sc643-brief-r1-implementer.md` → `sc643-r1-implementer-report.md`.
- **r1 result (2026-11-14)** — DONE at `9724c190` (a70cb489 fix, 9724c190 tests) on develop `8a81c5a7`. New
  `src/model/CompendiumDestination.ts` resolver (trims; blank → `DS Compendium`; refuses root forms and `..`
  climbing out); guards in main.ts, CompendiumSyncService, CompendiumMigrationService, LegacyCompendiumModal;
  readers use the resolver. Real `normalizePath` never trims, keeps `.`, doesn't resolve `..`; mock differs on
  `./` → resolver doesn't rely on it. jest fresh 12647 / 2 (+96; 62 red on base); lifecycle 64/64; e2e
  `478/500 ok, 0 failed, 22 known-bug, coverage: 287/287 pairs`; styles.css `18730938…f1f9` unchanged → shots,
  freeze, parity carry.
  - Follow-up 1 (`..` leaving the vault is refused) → **keep** (same class as D2: never act outside the folder).
  - Follow-up 2 (whole value trimmed) → **keep**; noted in the CHANGELOG bullet.
  - Follow-up 3 (old manifest `root: ""` after an earlier blank sync) → **reviewer probes in r2**; ruled after.
  - Follow-up 4 (`visual-harness/entry.ts:2049` reads the raw setting) → **drop**: harness seeding only, the
    harness never has a blank setting.
  - Follow-up 5 (SET-C03 flips) → as recorded under Cross-effort.
- **r2 (2026-11-14)** — independent review (orchestration:reviewer, id a00f1414c88491b2c, not the author), brief `sc643-brief-r2-reviewer.md` →
  `sc643-r2-review-report.md`.
- **Baseline move (2026-11-14, dispatcher)** — SC-625 landed (montage `model.ts` keeps unknown keys on write;
  e2e MONT-X11..X14; no sync code). dse develop `76520b1f`, workspace main `f9ebe6e8`. **Rebase target is now
  `76520b1f`** (supersedes `8a81c5a7`); superproject branch onto current workspace main, ONE pointer bump, before
  land-ready. New baseline: jest 12575 passed / 2 skipped fresh (12576 / 1 with the shots cache) · lifecycle 64/64
  · e2e `484/504 ok, 0 failed, 20 known-bug, coverage: 287/287 pairs` · shots 592, host-leak 163/978, modal
  host-leak 40/240, clip 147 · freeze 280/280 · parity 0/0/24. Expected on our rebased head: jest fresh about
  12671 / 2 (+96). New footgun: lifecycle filter is `--only=A,B` WITH the equals sign; a space runs the whole suite.
  The rebase goes into the fix round (r3), after r2 review reports.
- **r2 result (2026-11-14)** — LAND, 0 HIGH (reviewer a00f1414c88491b2c). Rulings:
  - M1 (SC-440 `test/dom/views/settings-matrix.test.ts:483` calls `syncOptions().releaseTag`; TS2531 against
    SC-643's nullable `syncOptions()`) → **cross-effort, no change here**: whichever lands second writes
    `syncOptions()?.releaseTag`. Added to Cross-effort; told to the dispatcher at land-ready.
  - L1 (setting changed to another real folder while the legacy window is open → trashes the captured folder,
    syncs into the new one without its first-sync check) → **fold**: if the re-resolved root differs from the
    one the window offered, Notice and do nothing (no trash, no sync).
  - L2 (untested guards) → **fold** tests for M12 (`syncAnyway` re-read), M13 (`syncAfter` re-read), M14
    (`offerMigration` guard). M19 (`detect` guard) → **drop**: redundant (`detect('')` counts 0 either way);
    keep the guard, no test.
  - L3 → **fold**: CHANGELOG bullet (`sc643-changelog-bullet.md`, in the WORKTREE superproject's
    `CHANGELOG.md` under `## Unreleased`), `draw-steel-elements/docs/compendium-sync.md` (blank = `DS Compendium`;
    root / outside-vault refused), and correct the false "always recoverable" comment at
    `LegacyCompendiumModal.ts:11-12` (real `trashFile` deletes permanently under "Permanently delete").
  - I1 (old manifest `root: ""`) → **drop**: safe; trashes only manifest-tracked unmodified files gone upstream;
    stale-root orphaning predates this branch and harms nothing.
  - I4 (INIT-W10 failed once under load ~30, unrelated) → **filed SC-654** (Low).
  - Judgment ("any non-empty folder" can be trashed, permanently under "Permanently delete") → **filed SC-653**
    (High, related SC-643, SC-441). OUT OF SCOPE here.
- **r3 (2026-11-14)** — fix round + rebase onto `76520b1f` (resume implementer adf8e341ee0e9a2d6), brief
  `sc643-brief-r3-implementer.md`; scoped re-review → reviewer a00f1414c88491b2c (not the author).
- **r3 result (2026-11-14)** — DONE. dse head `7b9e82cf` on develop `76520b1f` (9b6d918a, 19f2ed83 = r1 rebased;
  7e875bd6 L1 + modal comment; b5864e9c L1/L2 tests; 7b9e82cf docs). Superproject `39fc83d8` on origin/main
  `18f8043f`: 9d71038e changelog, 39fc83d8 ONE pointer bump. jest fresh 12681 / 2 (+106); lifecycle 64/64; e2e
  `484/504 ok, 0 failed, 20 known-bug, coverage: 287/287 pairs`; styles.css unchanged → shots/freeze/parity carry.
  Mutants L1/M12/M13/M14 each red. No new follow-ups.
- **r4 (2026-11-14)** — scoped re-review (reviewer a00f1414c88491b2c, not the author), brief
  `sc643-brief-r4-rereview.md` → `sc643-r4-rereview-report.md`.
- **r4 result (2026-11-14)** — LAND, 0 HIGH/MEDIUM/LOW. Rebase range-diff identical; L1/L2/L3 closed, all
  mutants but M19 (ruled drop) killed; superproject 39fc83d8 on origin/main 18f8043f, 2 commits, diff only
  CHANGELOG.md + draw-steel-elements. Gates on 7b9e82cf: tsc/lint 0; jest 12681/2 (reviewer's 12679/4 = +2
  location-only token-coverage skips); e2e `484/504 ok, 0 failed, 20 known-bug, coverage: 287/287 pairs`.
  - INFO `LegacyCompendiumModal.ts:10` "confirmed action" (it is one click) → **drop here**: SC-653's subject.
  - INFO bullet omits the changed-folder Notice → **drop**: edge case, fine.
- **LAND-READY (2026-11-14)** — dse `7b9e82cf` on develop `76520b1f`; superproject `39fc83d8` on main `18f8043f`.
- **DONE (2026-11-14)** — landed by the dispatcher: dse develop `7b9e82cf`, workspace main `8df833cb` (ledger
  preserved + dse-verify updated in `120cf676`; worktree removed via wt-rm). Ticket set Done via linear-post.py
  `--state Done`, verified Done. Follow-ups open: SC-653 (High), SC-654 (Low); SC-440 flips `[SET-C03]` and
  writes `syncOptions()?.releaseTag` on its rebase.
