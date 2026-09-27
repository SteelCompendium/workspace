# SC-243 implementer brief — round 1

## 1. Context loading

- Read first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc243-sync-busy/decisions.md`
  (the ledger — current-state rulings; it overrides anything else).
- Read: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (the gate
  battery, devbox command shapes, exit-code footgun, stale-main.js footgun, load-sensitive jest
  suites) and `draw-steel-elements/AGENTS.md` in the worktree.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc243-sync-busy`. DSE is at
  `/home/scott/code/steelCompendium/worktrees/sc243-sync-busy/draw-steel-elements`, branch
  `sc243-sync-busy`. **Verify `pwd` and `git branch --show-current` before every write.** Never
  touch `/home/scott/code/steelCompendium/workspace/draw-steel-elements` (the shared main checkout).
- Fetch-and-rebase first, inside the DSE clone: `git fetch origin && git rebase origin/develop`.
  Expected base: `6c4f6aa` (or newer on origin/develop). DSE tracks `develop`; never touch `main`.
  **Never create a tag or release.** Never run `just deploy*`.
- You never call Linear/the tracker — not to read, not to post.
- Commit after every coherent step (nothing sits uncommitted through a gate).

## 2. The task

Ticket text (Scott, verbatim):

> **What:** The settings' Sync and Check-for-updates buttons stay enabled while a sync is
> in flight — a double-click starts a second run. Wants a disabled/busy affordance driven
> by the sync service's in-flight state (the SC-140 ManifestStore.onChange seam plus a
> sync-service busy signal would carry it).

Implement owner rulings O1–O6 in the ledger exactly. Key code:
- `src/data/CompendiumSyncService.ts` — `sync()`, `checkForUpdates()`.
- `main.ts` — `syncCompendium()` (prelude: reconcile, manifest load, migration detection;
  hands off to `offerMigration` / `LegacyCompendiumModal`), the modal callbacks in
  `offerMigration` that call `syncService.sync` directly, and the two `addCommand` sync commands.
- `src/views/SettingsTab.ts` — the `opRow('Sync compendium', …)` buttons and
  `checkForCompendiumUpdates()`; `mountCompendiumStatus()` is the live-subscription pattern to copy
  (subscribe in the row render, return the unsubscribe as the row's cleanup — read the BLOCK BODY
  comment above the opRow: the render callback's return value is called on teardown).

Required behaviour (acceptance):
- B1. From the moment Sync is clicked (including the `syncCompendium` prelude) until the run
  finishes / fails / hands off to a modal: both buttons disabled; Sync reads `Syncing…`.
- B2. During check-for-updates: both disabled; Check reads `Checking…`.
- B3. A second sync request while one is in flight (any entry point: button, both commands,
  modal callbacks) starts NO second run; it shows a Notice (wording:
  `Draw Steel Elements: a compendium sync is already running.`) and returns. A check request
  while anything is in flight also does not start (same style of Notice, your wording).
  Design the lock so `syncCompendium` holding it and then calling `syncService.sync` does not
  refuse itself (no self-deadlock / self-refusal) — e.g. an internal unguarded path, or a
  re-entrant token; your call, but explain it in a code comment.
- B4. Busy clears on success, on a thrown error (from the prelude or from sync), and on hand-off
  to the migration/legacy modal. Later syncs from modal callbacks are busy for their own run.
- B5. Live: settings opened mid-sync render disabled; a sync that finishes with settings open
  re-enables without reopening; the listener is removed on row teardown (test that no listener
  remains after teardown).
- B6. Non-busy render unchanged.

Tests (jest): unit tests for the service busy state + listener + guard (including error path and
the no-self-refusal path through `syncCompendium`); DOM tests in `test/dom/views/settings-tab.test.ts`
for disabled/label toggling, mid-sync mount, re-enable, and teardown unsubscribe. Tests must fail
on the pre-change code (state which ones you confirmed red first).

Docs: add one bullet under `## Unreleased` in the worktree's workspace `CHANGELOG.md`
(`/home/scott/code/steelCompendium/worktrees/sc243-sync-busy/CHANGELOG.md`); if DSE has its own
changelog convention for unreleased work, follow it too. Commit the workspace change on the
superproject worktree branch `sc243-sync-busy` (do not commit a submodule pointer bump — landing does that).

Out of scope: any change to migration/legacy modal flows beyond the busy/guard wiring; new CSS.

## 3. Gates (dse-verify battery, in order, expected numbers)

1. `npm run tsc` clean. 2. `npm run lint` clean, exit 0. 3. `rm -f main.js styles.css && npx jest`
— baseline on develop is roughly 3969 passed / 1 skipped / 204 of 205 suites (verify on the base
before your change; report before/after). 4. `npm run obsidian-lifecycle` →
`OBSIDIAN-LIFECYCLE done: 6/6 ok, 0 failed`. 5. `npm run shots` → 524 PNGs, 0 FAIL.
6. `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh <dse>/visual-harness/shots`
→ `freeze OK (260/260 …)`. 7. `npm run parity` → 0 GAPs / 0 undeclared / 16 DECLARED.
Never edit the freeze baseline. Any freeze move is a red — report it, don't rebaseline.

## 4. Evidence (for Scott — real Obsidian)

Use (or copy into an `sc243`-named one-off) `visual-harness/settings-evidence.mjs` to capture the
settings Compendium section in a real Obsidian: (a) at rest, (b) mid-sync (hold a sync in flight,
e.g. stub `syncService`'s download to a never-resolving promise via CDP, or drive the busy state
through the real service), (c) mid-check. Dark theme required, light too if cheap. Crop to the
Compendium sync row + status line so the buttons are legible. Do not commit a one-off evidence
script unless it is reusable; save PNGs under
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc243-sync-busy/evidence/` with
`sc243-` prefixed names.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc243-sync-busy/sc243-impl-r1-report.md`,
opening with a ≤10-line executive summary. Include: final DSE sha, workspace worktree sha, every
gate's measured line, which tests went red first, the lock design in 3 lines, and the paths of
every evidence PNG and log. List `Drive-by fixes:` (made) and `Follow-ups:` (left alone) separately.

## 6. Return contract & footguns

- Your final text goes to the ticket-owner, not a human: raw facts (verdict, shas, measured
  numbers, evidence paths), no prose.
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated
  across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills
  silent agents. Run every gate in the FOREGROUND; never background a gate and wait for a
  notification (it never comes).
- Never `rm -rf` anything under `.superpowers/` except your own `sc243-*` files.
- You cannot `SendMessage` me. If you need input, end your turn with `STATUS: NEEDS_CONTEXT` and the
  question. If you message anyway, the first word must be `SC-243:`.
