# SC-600 r1 — implementation brief (implementer)

## 1. Context loading

- Read first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc600-group-amount-mismatch-conditions/decisions.md` (the ledger — Scott's ruling and the code facts). It is the only source of the ruling; do NOT read the Linear ticket.
- **Workers never call the tracker** (Linear) — not to read history, not to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc600-group-amount-mismatch-conditions`. The plugin is in `…/draw-steel-elements/` on branch `sc600-group-amount-mismatch-conditions`, currently at dse develop `dcc53f0f`. Verify `pwd`/`git -C <abs> rev-parse HEAD` before any write. All edits happen in that worktree, never under `/home/scott/code/steelCompendium/workspace/`.
- First: `git -C <worktree>/draw-steel-elements fetch origin` and confirm `origin/develop` is still `dcc53f0f`. If develop moved, rebase onto it and record the new sha in your report. Run `npm ci` if `package.json` changed (adapter footgun 2).
- Prior art for this element (landed; ledgers in `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/`): SC-592 (changed condition writes in `src/elements/initiative/model.ts`), SC-575, SC-466. Skim only if you need them.
- Concurrent effort: SC-605 is editing `src/elements/initiative/view.ts`. Do NOT edit `view.ts`. If you find you must, stop and return STATUS: NEEDS_CONTEXT.
- The main checkout's dse dirt (`demo-vault/Welcome.md` modified, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, not yours, do not touch or report it.

## 2. The task

Scott's ruling, verbatim from the ledger (2026-11-12): **"A"**. Option A as it was posted to him:

> **A. Keep and adjust (recommended).** Keep the existing instances as they are. If `amount` goes up, add new instances at the end (full stamina, no conditions). If `amount` goes down, remove instances from the end of the list. Only the removed instances lose their state.

Scope statement Scott accepted with A:

> This applies the same way to squad minions (which only keep conditions per minion; their shared stamina pool is not touched by this change) and to regular creatures and captains.

Owner reading (ledger): trim from the END. No defeated-first logic.

Code today (dse `dcc53f0f`; line numbers may have shifted since `79da77f8`): `src/elements/initiative/model.ts` has two blocks — squad minions (`if (!creature.instances || creature.instances.length !== creature.amount) { creature.instances = []; … }`) and regular creatures/captains (same shape, plus `current_stamina: creature.max_stamina, temp_stamina: 0`). Both throw away the whole list on any length mismatch.

Required behaviour:
1. `instances` missing (or not an array) → build a fresh list exactly as today (ids 1..amount). Byte-identical output for that case.
2. `instances.length === amount` → unchanged from today.
3. `instances.length > amount` → keep the first `amount` entries in order, drop the rest. Trim BEFORE validating, so a malformed trimmed entry does not throw.
4. `instances.length < amount` → keep every existing entry; append new ones at the end. New ids = (max existing numeric id) + 1, +2, … (ids may not be sequential; never reuse an id). New regular/captain instances get the same fields as today's fresh path (`current_stamina: creature.max_stamina`, `temp_stamina: 0`, `conditions: []`; key order identical to today's fresh path). New minion instances get today's minion shape (`id`, `conditions: []`).
5. After adjusting, the kept instances go through the SAME validation/normalization as today's "Validate existing instances" branch (id must be a number, `normalizeConditions`, regulars' `?? max_stamina` / `?? 0` fills, `noteAbsent`). Appended instances must not break `noteAbsent` bookkeeping.
6. Squad minion pool: untouched. Do not re-initialize or rescale it. `reconcileOrphanedCaptainBonus` still runs after instance materialization.
7. `amount: 0` with existing instances → empty list.
8. Factor the shared logic into one helper rather than duplicating it in both branches if that stays readable.

Other sites:
- `src/drawSteelAdmonition/EncounterData.ts` has the same rebuild logic (~two sites). Find out whether it is a live code path, or an oracle some test compares `model.ts` against (the model.ts comment mentions "verbatim with the async oracle"). If a test compares the two on mismatch inputs, keep them in step (change both). If it is dead/legacy and untested on this path, change it too only if it is a live path; otherwise leave it and say so. Report which.
- `git grep -n "instances.length" src/` for any other mismatch-rebuild site (e.g. the post-merge `resolveRefs` pass, encounter element). Report each and whether it needed the same change.

Tests (jest, follow the existing initiative model tests' conventions):
- grow and shrink, for BOTH a squad minion and a regular creature, and a captain if the captain path is distinct: existing conditions and stamina (regulars) on kept instances survive; appended instances are fresh; trimmed instances are gone; ids as specified (include a non-sequential-id case, e.g. ids 1,3 → grow to 3 gives 1,3,4).
- missing `instances` → identical to today.
- a malformed entry beyond the new amount is trimmed without throwing; a malformed kept entry still throws as today.
- **Integrity probes (this writes into user notes):** a full parse → serialize round trip of a block with two groups, where only one group's amount was hand-edited: the other group's bytes are unchanged; the edited group's kept instances keep their conditions (including SC-592 plain-name condition format) and stamina; content above/below the block in the note is untouched if a test seam for that exists.
- Minion pool value unchanged after grow/shrink.

e2e (real Obsidian, required gate): add ONE scenario (or one grow + one shrink) that writes a note with a group of 3 regular creatures where instance 2 has a condition and reduced stamina, hand-edits the file `amount: 3` → `amount: 4` (and separately → 2), triggers a save through a normal UI action on a DIFFERENT instance, then reads the file and asserts instance 2 kept its condition and stamina and the instance count matches `amount`. Follow the e2e conventions and coverage-pair bookkeeping in `dse-verify`. **Never put a bracketed ticket id (like `[SC-600]`) in an e2e test title** — the runner reads test titles for scenario ids. If the e2e harness cannot do a file edit followed by a UI action, stop and return STATUS: NEEDS_CONTEXT explaining what it can do.

Lifecycle: do NOT add lifecycle phases (part 3 sits near its time limit). If you believe a lifecycle phase is needed, say so in Follow-ups; the id G-S89 is reserved for this effort.

Docs:
- Add a bullet under `## Unreleased` in the WORKSPACE `CHANGELOG.md` **in YOUR worktree's superproject** at `/home/scott/code/steelCompendium/worktrees/sc600-group-amount-mismatch-conditions/CHANGELOG.md` — never under `/home/scott/code/steelCompendium/workspace/`. Plain words, e.g. "Initiative tracker: hand-editing a creature's `amount` now keeps the existing creatures' conditions and stamina; new creatures are added at the end and extra ones are removed from the end." Look at the SC-592 bullet for style. Commit it in the superproject (`docs: changelog entry for SC-600 …`). Do NOT commit a submodule pointer bump — the owner handles that.
- If the user-facing docs for `ds-initiative` (search the dse repo docs / README for `amount` and `instances`) describe this behaviour, update them.

Commit inside `draw-steel-elements` after each coherent step (code, tests, e2e). Plain commit messages; do NOT add any Co-Authored-By or Claude/AI attribution trailer. Do not push.

## 3. Gates

Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (about 400 KB — read it in parts: "The battery, in order", "Devbox wrapping", "THE exit-code footgun", "Lifecycle and e2e notes", and "Current expected numbers") before running anything. Run the full battery, in order, against the worktree.

Expected numbers at `dcc53f0f` (CURRENT):
- tsc clean, lint clean.
- jest **10787 passed / 2 skipped** in a fresh worktree (one more passed / one fewer skipped after a shots run caches the CSS) — plus your new tests. Report the exact delta.
- lifecycle **60/60** in SIX `--only` parts, comma-separated `--only=`: `G-S7a … G-S9a` 21; `G-S9b … G-S40` 16; `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` 9; `G-S57,G-S62,G-S61,G-S56` 4 (G-S56 stays LAST in its part); `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` 7; `G-S92,G-S96,G-S97` 3. Take the exact id lists for parts 1 and 2 from dse-verify. G-S91 has a known Reading-view hover-timing flake — re-run that part once before calling it a failure.
- e2e **`304/307 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`** (known bugs SC-257, SC-355, SC-384) — plus your new scenario(s) and their pairs. Must end `0 failed` with `coverage: Y/Y pairs`.
- shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147.
- freeze **280/280** (a model-only change must not move a frozen byte; if it does, STOP and report — do not touch the baseline).
- parity **0/0/24**, last.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc600-group-amount-mismatch-conditions/sc600-r1-impl-report.md`. Open it with a ≤10-line executive summary.

## 5. Return contract

Your final text goes to the ticket-owner, not a human: raw facts, no prose — STATUS (DONE / NEEDS_CONTEXT / BLOCKED), dse branch head sha, superproject changelog commit sha, every gate's measured number vs expected, the list of changed files, the EncounterData.ts / other-sites finding, `Drive-by fixes:` and `Follow-ups:` lists, and the absolute path of every evidence artifact (report, gate logs).

## 6. Footguns (all apply)

- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — scratch dirs are pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Run every gate as one blocking FOREGROUND call (split lifecycle into its six parts, e2e and shots into separate calls, each under the 10-minute tool timeout). No `run_in_background`, no Monitor, no waiting for a notification — a job you start never wakes you.
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc600-group-amount-mismatch-conditions/draw-steel-elements -- bash <script-file>`. Never `cd` inside a compound command. Devbox eats `$?`/`$PIPESTATUS` and piping a gate through `tail` eats failures: record exit codes from inside a script FILE and read each gate's own summary line.
- Scripts and logs go in a private subfolder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc600-r1-impl/` with uniquely named files. Create files with the Write tool.
- Every git command as `git -C <absolute path> …`, never `cd X; git …`.
- **Never `rm -rf` a glob, and especially never a `/tmp` glob** (e.g. `/tmp/dse-obsidian-lifecycle-*`): other efforts' lifecycle vaults and kept FAIL dirs live there; a worker wiped them yesterday. Delete only a literal path you created and recorded. No `rm` with a shell-variable target (it hangs on a permission prompt). Never `rm -rf` anything under `.superpowers/`.
- Never `pkill`/`killall` by pattern. Kill only by PID, and only a PID whose cwd (`readlink /proc/<pid>/cwd`) or command line is inside YOUR worktree.
- Never touch `.superpowers/sdd/freeze-baseline.sha256`.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher, not me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report; I will resume you. If you ever send a message anyway, its FIRST WORD must be `SC-600:`.
