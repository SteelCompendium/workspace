# SC-441 round 2 — implementer brief (phase B)

You continue SC-441: the real-Obsidian e2e specs for the compendium sync and its two windows,
then the full battery. Your final text goes to the SC-441 ticket-owner, not a human. This brief
is self-contained: a fresh worker can pick it up from the files alone.

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc441-e2e-sync-migration-modals/decisions.md`.
  Re-read it from "Owner rulings after phase A" down: **O13** (ticket keys per bug), **O14**
  (answers to the six questions), **O15** (trash canary, focus on open), **O16** (new-bug flow).
  O1-O12 still bind. **Workers never call the tracker.**
- Phase A report (yours): `…/sc441-e2e-sync-migration-modals/sc441-r1-implementer-report.md`.
- Round 1 brief, for the footguns (§4) and command shapes (§3), which all still apply:
  `…/sc441-e2e-sync-migration-modals/sc441-brief-r1-implementer.md`.
- Worktree `/home/scott/code/steelCompendium/worktrees/sc441-e2e-sync-migration-modals`, dse
  branch `sc441-e2e-sync-migration-modals`, head `874a5b95` on `develop` @ `a0e55f6b`. First:
  `git -C <worktree>/draw-steel-elements fetch origin`. If `origin/develop` moved off `a0e55f6b`,
  do NOT rebase on your own — note the new sha in the report and carry on at the current base
  (the owner orders rebases with a named sha).
- Never edit the shared main checkout (`/home/scott/code/steelCompendium/workspace/`) except your
  report file. Its dse dirt is Scott's live vault: never run anything against it.
- dse-verify skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
  Do not read it whole. Battery table lines 20-35 (`cut -c1-6000` on row 4 for the seven lifecycle
  `--only=` parts and their timings; row 4b for e2e), "Lifecycle and e2e notes" at line 207,
  "In-run gates inside `npm run shots`" at 267, "Freeze semantics" at 627, "Current expected
  numbers" at 1551 (CURRENT only).

## 2. The task

### 2a. Apply the phase A rulings first (jest side)

- Cite the ticket keys from ledger **O13** in the `test.failing` titles in
  `test/dom/framework/syncCompendiumBugs.test.ts` (BUG-1 SC-694, BUG-2 SC-695, BUG-3 SC-357,
  BUG-4 SC-696, BUG-5 SC-697, BUG-6 SC-698, BUG-7 SC-699, BUG-8 SC-700, BUG-9 SC-653, BUG-10
  SC-701), in the style the repo's other `test.failing` markers use.
- Manifest changes per ledger **O14** Q3 and Q6, quoted:

> - Q3 (dismissal ids): follow the existing modal manifests (`reset-encounter-modal.ts`,
>   `montage-remove-hero-modal.ts`): `'modal.close': ['click', 'press:Escape']` and
>   `'modal.backdrop': ['click']`, the ids `DseModal` already stamps. Keep the per-phase coverage:
>   one manifest surface per phase if the manifest type allows it. If it cannot express that, keep
>   per-phase ids but use only kind strings that already exist (`click`, `press:Escape`), and say why
>   in the manifest header. No new kind strings (`click:X`, `click:Backdrop`).
> - Q6: footer buttons are `click` + `press:Enter` only, as the existing modal manifests declare.
>   Drop the `press:Space` pairs.

  Update the jsdom census tests to match. Report the new pair count.

### 2b. The e2e specs

`e2e/driver/sync.ts` (new) and `e2e/specs/sync/*.e2e.ts` (new), as your phase A mechanics answers
(a)-(f) describe, with these binding points:

1. **`startSyncTest()` runs first in every scenario** and does, in order: the O2 disposable-vault
   guard (throws), the O3 trash setting (`'local'`, asserted; `'none'` only in the named
   "Permanently delete" scenarios; never `'system'`), the network guard / fixture release,
   `resetSyncTree()`, and the pristine-tree assertion. Quoted from the ledger:

> **Trash canary.** Before the first scenario that can trash anything, in every spec session:
> create a throwaway file in the disposable vault, trash it through the same
> `app.fileManager.trashFile`, and assert it is now under `<vault>/.trash/`. Throw (and run no
> trash scenario) otherwise. If `vault.setConfig('trashOption', …)` does not work in real Obsidian,
> STOP and return NEEDS_CONTEXT — do not run a trash scenario on a guess.

   Build and run the guard + canary FIRST, alone, before writing any scenario that trashes or
   moves files. Put the canary's result in the report.
2. **Every scenario asserts the file tree before and after (ledger O4)**: exact created / moved /
   trashed / modified sets with bytes, and everything else byte-identical. Cancel, close, Escape,
   backdrop and refused runs assert an empty difference apart from named plugin-state keys.
   "The window closed" or "a Notice appeared" alone is not a driver.
3. **Every manifest pair gets at least one plain driver** through real input (pointer click, real
   key press on the focused control). The palette commands run through the real palette.
4. **Confirm / cancel / close on every window and phase, and the nothing-to-do re-runs** — ledger
   O5, all of it.
5. **Focus on open**, quoted:

> **Focus on open.** For each window and each phase, assert which control has keyboard focus when
> it opens, and that pressing Enter straight away does only what that focused button does. Report
> the focused control per phase. A window that opens with focus on a button that trashes or moves
> files is a bug: batch it (O16).

6. **Links (O14 Q1)**: drive `alwaysUpdateLinks` ON and OFF, set at run time in the disposable
   copy. ON: the outside note's link is rewritten and nothing else in it changed. OFF: record
   exactly what happens. A broken promise is a new bug (O16).
7. **Sync file effects in real Obsidian** (O1): first sync (created + manifest), same tag again
   (nothing created / updated / trashed; which Notice), tag A → B (updated, new, removed-upstream
   trashed into `.trash/`, user-modified removed-upstream kept), a user's own note inside the
   Destination untouched throughout, failure paths (lookup 503 / 404, download failure, broken
   zip: tree untouched, busy released, no "Uncaught (in promise)" — SC-646), the busy guard
   (SC-243), the destination guard (SC-643: blank, vault root, outside the vault).
8. **Known-bug scenarios** (`knownBug('SC-…')`, each asserting the CORRECT behaviour so it turns
   green when the ticket is fixed): SC-653 ×2 (a folder of the user's own notes is not offered the
   trash button; under "Permanently delete" the trashed folder is recoverable or the window says
   it is permanent), SC-694, SC-695, SC-357, SC-696, SC-698, SC-700, SC-701. SC-697 / SC-699 stay
   jest-only unless an e2e twin is cheap and safe. For SC-700 confirm in real Obsidian what a
   `.obsidian` / `.trash` Destination actually does and report it (the reset must clean whatever
   it writes there). Each knownBug scenario's side effects stay inside the disposable vault.
9. **Real-Obsidian census** (`e2e/specs/_census.e2e.ts`, ids from `[CENSUS-35]`): each window in
   each phase, container-scoped.
10. Ids `SYNC-*`, literal strings in titles; never a bracketed ticket id in a title.
11. Product source: attributes and census plumbing only. If a scenario cannot be driven without
    a product change, say so and leave it out — do not change behaviour.
12. If `e2e/README.md` lists the covered surfaces, add this one.

### 2c. New bugs in real Obsidian — ledger O16, quoted

> **O16. New bugs found in phase B (real Obsidian).** Finish every spec, commit, then return
> `NEEDS_CONTEXT` ONCE with the new bugs BEFORE the final full battery (targeted runs of the new
> specs are enough at that point). The owner files and resumes with keys; the full battery then runs
> once. With no new bug: run the full battery and return DONE.

A bug that can lose or trash a user's file is reported as High with an exact repro, and is never
worked around in the test.

Commit inside `draw-steel-elements/` after every coherent step (`test(SC-441): …`), no AI
attribution or co-author trailers, no push, no superproject commit.

## 3. Gates (full dse-verify battery, in order, against the worktree)

Baseline at `a0e55f6b`: jest 14716 passed / 1 skipped with the shots cache (14715 / 2 fresh) ·
lifecycle 64/64 · e2e `OBSIDIAN-E2E done: 833/843 ok, 0 failed, 10 known-bug, coverage: 486/486 pairs`
· shots 592 · freeze 280/280 · parity 0 / 0 / 24.

Expected from you:

- tsc (incl. `tsc -p e2e`) and lint: clean.
- jest: 0 failed; report passed / skipped (phase A was 14898 / 2 fresh; yours moves with the
  manifest change — after `npm run shots` it reads one more passed and 1 skipped).
- lifecycle: `64/64 ok, 0 failed` as the union of the seven `--only=` parts (one part per call).
- e2e, a FULL run: `OBSIDIAN-E2E done: N/M ok, 0 failed, K known-bug, coverage: Y/Y pairs` with
  Y = 486 + your pair count, K = 10 + your knownBug scenarios. Report the wall time and how much
  the `SYNC-*` specs add. Run the new specs alone 3 times as well and report any test that did not
  pass all 3 (a flaky test in a file-moving suite is a finding, not noise).
- shots 592 with its in-run gates green; freeze **280/280, 0 FAILED** via
  `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh <worktree>/draw-steel-elements/visual-harness/shots`
  (attribute-only changes must not move print bytes — if one moves, stop and report; never touch
  the baseline); parity `0 GAPs / 0 undeclared WARNs / 24 declared deferrals`, run LAST.
- Known flakes under load, not this surface: INIT-W09 / INIT-W10 (SC-654), SET-X03 / SET-X04
  (SC-657), NEGO-R05 / NEGO-R08. Re-run alone before believing; report either way.

Command shapes and every footgun: round 1 brief §3-§4, unchanged. In particular: one blocking
foreground call per gate with output to a uniquely named log and rc file under
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc441-impl-r1/`
(reuse the folder, fresh file names prefixed `sc441r2-`); for gates over 180 s start with output
to a log and wait with `timeout 175 tail --pid=<pid> -f /dev/null` on your own pid (check
`readlink /proc/<pid>/cwd`); no `run_in_background`, no Monitor; never key a wait-loop on a
scratch filename or its contents (stale logs from other branches match); a private
`DSE_CAMERA_TMP` per lifecycle / e2e / shots run; never set `DSE_LIFECYCLE_PORT`; no `rm` in
`/tmp` or the scratchpad, no glob or variable `rm`; kill only by literal PID whose cwd is inside
your worktree (SC-682 runs the same gates in another worktree); `git -C` and `devbox run -c`
with absolute paths, no compound `cd`.

## 4. Report

Append to `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc441-e2e-sync-migration-modals/sc441-r1-implementer-report.md`
under a `## Phase B` heading that itself opens with a ≤10-line executive summary: status, head
sha, every gate's summary line vs baseline, pair count, `SYNC-*` test count, knownBug count and
keys, new bugs (count, highest severity), the trash canary result, the `alwaysUpdateLinks` OFF
finding, and the focused control per window phase. Then: commits; the scenario list by id (one
line each: what it drives, what it asserts); the manifest diff from phase A; what `.obsidian` /
`.trash` Destination did in real Obsidian; new bugs (plain-words title, exact repro, file:line,
severity, what the user loses); `Drive-by fixes:` and `Follow-ups:`; every gate's log path and
summary line. If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Final text goes to the ticket-owner, not a human — raw facts, no prose:
`STATUS: DONE | NEEDS_CONTEXT | BLOCKED`, head sha, each gate's summary numbers, pair count,
`SYNC-*` test count, knownBug keys, new bugs (title + severity + file:line), canary result, the
report path, and the filesystem path of every evidence artifact (logs, rc files).

You cannot `SendMessage` the ticket-owner — `to: "main"` reaches the dispatcher, not me. If you
need input, end your turn with `STATUS: NEEDS_CONTEXT` and the question in the report; I will
resume you. If you ever do send a message anyway, its FIRST WORD must be `SC-441:`.
