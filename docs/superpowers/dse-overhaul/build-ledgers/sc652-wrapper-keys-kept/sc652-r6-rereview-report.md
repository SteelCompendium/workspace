# SC-652 r6 scoped re-review — dse `bab0dbb2` (delta `f4448454..bab0dbb2`), superproject `a5aa9700`

## Executive summary
- **Verdict: LAND.** Counts: 0 CRITICAL / 0 HIGH / 0 MEDIUM / 1 LOW / 2 INFO.
- N-1 is fixed exactly as prescribed, at `montage/view.ts:130` and `initiative/view.ts:209` (`ser: serializeModel(model)`).
  The r4 jsdom probes now show, for all five reserved-line cases: window open, 0 Notices, lines written once. A
  genuine edit still closes the window with 1 Notice. The new tests are non-vacuous: 12 of 25 fail on the `f4448454`
  view files (the 8 montage and 4 initiative reserved-line echo/elsewhere cases).
- Real path, through the real pinned sidebar including `SidebarBlockHost`'s self-echo guard, for montage AND
  initiative × 5 cases × 3 edits (30 tests). The echo and "edit elsewhere" are filtered by the host, as the
  implementer said. The reachable trigger is an edit INSIDE the block that the model drops (a comment, a reformat,
  an edit to the reserved line itself). On `f4448454` it closed the window with a Notice in all 8 reserved-line
  cases; on `bab0dbb2` the window stays, 0 Notices. Genuine edits close the window on both.
- SC-662 relay (real Obsidian): RV-R03 (sidebar), RV-R03RV (Reading view) and RV-R03C (sidebar), each two Catch
  breaths. Head: the all-rejected `prefs:` map is **kept, one line, after the first and the second write**. Base
  `42c26272`: the map is gone after the first write in all three.
- Gates at `bab0dbb2`: tsc incl. `-p e2e` clean, lint clean, jest **13607 passed / 1 skipped** (= r5). Superproject
  as specified; origin/main is still `2945c3ea`.

## Findings

### LOW

**L-3 — the new N-1 tests drive `prepareModel` + `update()` directly, so the path the real sidebar actually reaches is
not pinned.** `test/dom/elements/montage-outside-edit.test.ts` (the SC-652 describe at the end) and
`test/dom/elements/initiative-outside-edit.test.ts` (same).
- The tests pin the right mechanism: the compare in `update()`, which is the exact call
  `SidebarPanel.handleExternalChange` makes.
- But the scenarios they describe ("the echo of the view's own write", "an edit elsewhere in the note") never reach
  `update()` in the real sidebar. `SidebarBlockHost.applyFreshContent` drops any body equal to `lastWritten`
  (`src/framework/host/SidebarBlockHost.ts:443`).
- What does reach it is an outside edit inside the block that leaves the model unchanged. For example, a YAML
  comment line added under `malice:` / before `current_round:`, or a hand edit of the kept `prefs:` value.
- Measured through the real sidebar harness (`sidebarInitiative.test.ts`'s `setup` / `sendToSidebar` / `fireModify`):

| case (montage and initiative alike) | `f4448454` | `bab0dbb2` |
|---|---|---|
| own write, window open, comment added in the block — no reserved line | stays, 0 Notices | stays, 0 Notices |
| same, with unknown-only `prefs:` / `collapsed: yes` / `collapsed: true` / an applied pref | **closes, 1 Notice** (8 of 8) | stays, 0 Notices (8 of 8) |
| own write, window open, edit elsewhere in the note (all 5 cases) | stays (host filter) | stays |
| own write, window open, genuine edit to the block (all 5 cases) | closes, 1 Notice | closes, 1 Notice |

- So the initiative has no real-path gap in behaviour: the fix holds on the real path for both elements. The gap is
  test coverage only.
- Fix (optional, non-blocking): add one real-sidebar test per element for "own write, window open, a comment added
  inside the block → window stays, no Notice", for example `r6rev-probe5`'s cases. It fails on `f4448454` and passes on
  `bab0dbb2`. Optionally, reword the two new describe comments so they do not imply the echo reaches `update()` in
  the real sidebar.

### INFO

- **I-9 — the ds-stamina-bar write moves `prefs:` above `collapsible:`.** RV-R03 head writes `prefs:` /
  `staminaRecoveryPopover: false` / `collapsible: true` / …, where the note had `collapsible: true` first. This is
  the placement ruling (`prefs:` first; `collapsible:` is model-owned on stamina, so it stays in the body). Values are
  kept, one line each. Formatting is SC-599's question. No action.
- **I-10 — my r4 N-1 description over-stated the real trigger.** I said the self-echo was the trigger; the real
  sidebar filters it. The trigger is an in-block edit the model drops. N-1 was still real and is now fixed. Owner
  may want to correct the ledger wording; no code action.

## Scope items

1. **N-1.**
   - The diff `f4448454..bab0dbb2` touches only `src/elements/{montage,initiative}/view.ts` (one line each, plus a
     comment) and the two test files. Both lines are the prescribed `this.disk = { raw: normalizeBlockText(out), ser:
     serializeModel(model) }`.
   - `r4rev-probe3` at `bab0dbb2`: OW26 (echo) and OW24 (no own write) stay open with 0 Notices in all five cases;
     reserved lines are written once; "edited" and Reading-view redraw keep the lines once.
   - With the view files put back to `f4448454`: OW26 closes with 1 Notice in the four reserved-line cases (= the r4
     result).
   - New tests on the `f4448454` view files: 12 failed / 13 passed of 25 (`-t SC-652`). The failures are the montage
     echo + elsewhere cases × 4 reserved lines and the initiative echo case × 4. The no-reserved-line cases and every
     "genuine outside edit" case pass on both, as they should.
   - Initiative real-path judgment: see L-3. The fix is effective on the real path; only the committed test does
     not go through `SidebarBlockHost`.
2. **SC-662 relay.** The spec was copied (helpers verbatim, the three tests changed only to record after each write)
   to `r6rev-zz-sc652-r03.e2e.ts`. It ran as `npm run e2e -- --only=RV-R03,RV-R03C,RV-R03RV --shards=1` in the
   throwaway trees, with experimental on as in SC-662's `before` hook. SC-662's files were not touched.

| probe | view | head `bab0dbb2`: after write 1 / write 2 | base `42c26272`: after write 1 / write 2 |
|---|---|---|---|
| RV-R03 `prefs: {staminaRecoveryPopover: false}` + `collapsible: true` | sidebar | kept, 1 `prefs:` line / kept, 1 line; `collapsible` kept; stamina 22 → 30, recoveries 2 → 1 | **dropped** / dropped; `collapsible` kept |
| RV-R03RV same block, no anchor | Reading view | kept, 1 line / kept, 1 line | **dropped** / dropped |
| RV-R03C `prefs: {collapsibleDefault: false}` | sidebar | kept, 1 line / kept, 1 line | **dropped** / dropped |

   - Both runs: `OBSIDIAN-E2E done: 3/3 ok, 0 failed`, ABOVE/BELOW kept, only the Catch-breath toast Notice. Load
     was about 6-7.
3. **Superproject** `/home/scott/code/steelCompendium/worktrees/sc652-wrapper-keys-kept`:
   - Re-fetched; `ls-remote` shows origin/main still `2945c3ea`. HEAD `a5aa9700`, HEAD~2 `2945c3ea`, clean.
   - `7f7f3eeb` touches only `CHANGELOG.md` (unchanged from r4: the bullet is first under `## Unreleased` and matches
     the draft).
   - `a5aa9700` touches only the `draw-steel-elements` gitlink, which is `bab0dbb2f273…`.
   - No trailers on either commit.
4. **Gates** at `bab0dbb2` (branch worktree): tsc incl. `-p e2e` EXIT=0 clean; lint EXIT=0 clean; jest 13607
   passed / 1 skipped / 13608. No lifecycle or full e2e run: no probe showed a problem.

## Artifacts
Everything is in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc652-r2-review/`:
- Gates: `r6rev-quick.sh`, `r6rev-tsc.log`, `r6rev-lint.log`, `r6rev-jest.log`.
- N-1: `r6rev-n1.sh`, `r6rev-probe5.test.ts` (= `sidebarInitiative.test.ts` + `r6rev-probe5-tail.ts`),
  `r6rev-out-{fix,mut}-p5.json`, `r6rev-p5-{fix,mut}.log`, `r6rev-out-{fix,mut}-p3.json`, `r6rev-p3-{fix,mut}.log`,
  `r6rev-newtests-{fix,mut}.log`, `r6rev-wthead-status.txt`.
- SC-662 relay: `r6rev-zz-sc652-r03.e2e.ts` (+ `r6rev-e2e-tail.ts`), `r6rev-e2e.sh`, `r6rev-e2e-{head,base}.log`,
  `r6rev-e2e-{head,base}.jsonl`, `r6rev-e2e.meta`.

The throwaway trees `wt-head` (`bab0dbb2`, view files restored) and `wt-base` (`42c26272`) hold untracked probe files
only. Branch worktree: `bab0dbb2`, clean.
