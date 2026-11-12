# SC-607 r5 scoped re-review of the r4 delta (reviewer, resume of r3), dse c329ff35 on dcc53f0f

**Executive summary**
- **Verdict: LAND.** No blocking finding. The r4 delta matches every r3 ruling: F7 is the only product-code change and is behaviour-neutral apart from dropping an in-flight read on unload. r2's 8 commits came through the three rebases unchanged (range-diff: 7 identical, 1 differs only in CHANGELOG context lines). The host sources have no diff between 1daa7d8a and 7f8a0dc3.
- **Mutants re-run on c329ff35:** N6 killed (2: P19b hover + embed), M19 killed (6 move cells), N10 1, N14 1, N7 1, N2 1 (the unload test) killed; N1, N11, N15, N18 survive. N11 "equivalent" is sound: the early returns for a line in the common head or tail are symmetric, and the give-up happens exactly when the edit distance exceeds 400 in both maps.
- **LOW L1:** the reason given for N18 being "equivalent" is incomplete. The own-write-first branch with the link placing is also reached when a re-bind snapshot is discarded (`metaMatchesText`: the cache still lags this host's own write and the write changed the block's line count). My jest probe kills N18 in exactly that state. In real Obsidian, 6/6 re-bind snapshots were consistent, including 2 writes that changed the block's line count (a comment and a blank line dropped), so I did not see it reached. Fix: reword the reason in the proposal (and optionally add the probe as a test).
- **NIT N1:** the CHANGELOGs name F2 only as "timing races" and leave F4 unnamed. That is consistent with the ruling (F4 goes in the proposal only) and the headline now says "in the shapes below". **NIT N2:** "11595 / 2 fresh" has no log; the r4 logs show warm runs only (11596/1). It is consistent with the warm/fresh difference.
- **Docs are true to the measured behaviour:**
  - both CHANGELOGs: the headline is no longer absolute; they say rare timing races remain and name the move refusal (F1), the adjacent-block refusal (R-Q2a), the >400 lines with a twin, F3 and could-not-be-placed; the stale SC-594 "Known limit (SC-607 …)" sentence is gone;
  - the proposal names F1 as ruled, F2/F4 as residual writes base also makes, and F3 as a refusal.
- **Gates (on c329ff35):** jest 11596 passed / 1 skipped (warm, 112 s) · lifecycle part 6 `G-S92 G-S96 G-S97 G-S99` 4/4, 310 s (load 15 falling to 3). r4's logs match its report: tsc/lint rc 0, e2e `304/307 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`, p1-p6 21/16/9/4/7/4 at 187/327/408/298/395/298 s, G-S99 on the dcc53f0f bundle 7/7 cells red with the control green, red-on-base jest 201 failed of 816.

## 1. Rebase: r2 commits unchanged (`sc607-r5-range-diff.txt`)
- Range-diff of 622b0904..1daa7d8a against dcc53f0f..7f8a0dc3: 7 commits `=`. The 1 that differs (192cfdb1 -> c33d3bb3) differs only in the CHANGELOG context lines, from SC-602's edit to the neighbouring entry.
- `git diff 1daa7d8a 7f8a0dc3 -- ReadingModeBlockHost.ts hoverLinks.ts lineMap.ts` is empty.
- The base moved under `src/framework/host/` (livePreviewFocusCarry.ts, and a `beforeRelease` hook in viewRegistry.ts). I found no interaction with the snapshot or pin code.

## 2. F7 (`ReadingModeBlockHost.ts:578-580`)
- Unload now also clears `drawnRead` and `drawnToken`.
- `onRenderChildUnload` returns early when the unloading child is not the current one. A re-bind replaces `renderChild` first, so the old section's unload after an adoption is a no-op, and a re-bind always takes a new snapshot anyway.
- The only behaviour change: a pin taken during the 3-23 ms while the mount read is in flight, followed by an unload before that read resolves, now finds no drawn snapshot and is refused (unless this host's own write places it). Before F7 the late read filled `drawn` again. This is safe and negligible.
- Covered by the unload test, which also kills N2.

## 3. F6 tests (`sc607-r5-mutants.log`, suites drawn-pin / pin / hover-card / form-pin / lineMap, 4208 tests)

| mutant | result | killing tests |
|---|---|---|
| N6 | killed 2 | "a block form opened on the upper of two adjacent identical blocks (hover / embed)" |
| M19 | killed 6 | the move cells: hover / embed block link both moves, hover / embed heading link "to the end". The heading "below another section" cells stay refused under M19 too, because the strict map lands on Other's fence: a refusal either way. |
| N10 | killed 1 | the end-of-text cache check, through an embed |
| N14 | killed 1 | the part was the whole note as drawn |
| N7 | killed 1 | the form in an embed whose part is the whole note |
| N2 | killed 1 | the unload test |
| N11 | survived | equivalent: `mapLineOf` returns early for a line in the common head or tail. Without overlap both directions trim the same regions; with overlap the line falls in the trimmed region of both. Otherwise both run Myers on middles with the same edit distance D and give up exactly when D > 400 (max = min(n+m, 400), D <= n+m). |
| N1 | survived | defence in depth: no re-bind lands between a pin and the rebase's read of `drawn`, because the rebase starts at pin time and awaits only the in-flight read plus one `cachedRead` |
| N15 | survived | equivalent through the `?? ownFrom()` fallback |
| N18 | survived | **L1** (below) |

The new tests assert both the note text and the Notice, and r4 reports them red on base.

## 4. Re-modelled redraw tests and N18
- The 12 form-pin cells, hover-card J5, J17 and J18 now call `rebind`. They are still meaningful (all pass, and they now test the drawn-first path a real redraw takes).
- **L1 — N18 "equivalent" is not airtight.** `sc607-r5-n18-probe.test.ts.txt` / `.log`:
  - Scenario: a + whose write ADDS lines (the plugin re-serializes the YAML). The redraw re-binds while the metadata cache still describes the note before the +, so the re-bind snapshot is discarded, every heading below having shifted. Then a second +.
  - Head saves (own-write-first, the link placing). Under N18 it is refused. The control with the cache caught up passes under both.
  - Real Obsidian, instrumented c329ff35 bundle (`sc607-r5-obsidian-rebind-snapshot.log`):
    - In 6/6 re-binds (hover RV x2, hover LP, embed RV, plus 2 cells whose write dropped a comment and a blank line, 177 -> 164 chars) the re-bind snapshot came back consistent (`metaOk:true`).
    - The re-bind call came ~400 ms after the click and a few ms after the write; the cache had caught up.
    - Both + saved in every cell.
  - So the state is reachable only if the cache lags the re-bind processor call. I did not see it.
  - Fix (doc-level): in the proposal's mutant line, change the N18 reason to: "unreached in measured Obsidian runs (6/6 re-bind snapshots consistent, including writes that changed the block's line count). It is reachable only when a re-bind snapshot is discarded because the cache lags this host's own write; pinned by the r5 probe if added." Optionally add the probe as a test, which kills N18.

## 5. Docs
- **dse `CHANGELOG.md:46-57` and superproject `CHANGELOG.md:41-50`:**
  - headline "… in the shapes below";
  - "Rare timing races remain, as before: … within a few hundredths of a second of Obsidian drawing or redrawing a preview";
  - new refusals named: moved section (with "reopen the preview"), adjacent identical block, >400 lines with an identical counter, an outside edit within about a tenth of a second of opening a hover (refuses until reopened), could not be placed.
- The SC-594 entry now reads "placed the same way (SC-596; the preview-left-open case is fixed by SC-607)" (dse `:86-87`, superproject `:101-102`). The stale "Known limit" sentence is gone from both.
- **Proposal:**
  - residuals 1-6, with F2 as 3, F3 as 4 (a refusal) and F4 as 5;
  - new refusals with F1 first, giving the M19 reason;
  - mutants restated (41: 32/9), with no stale M9 anchor and no "M19 not constructible";
  - G-S91 tallies updated.
- Accurate except L1's N18 reason. NIT: "an unique counter" -> "a unique counter" (proposal §1, F1 bullet).

## 6. Gates
- Jest 11596 / 1 warm (`sc607-r5-gate-jest.log`).
- Lifecycle part 6: 4/4, 310 s (`sc607-r5-gate-lifecycle-p6.log`).
- Spot checks: as in the summary.
- The fresh 11595/2 is not in any r4 log (NIT N2).
- At the end: `git -C <dse> status --porcelain` empty, branch c329ff35, scratch worktrees removed. Superproject at 807cec69 on f108e5e9, which equals origin/main at review time.

## Findings
- **LOW L1** — `sc607-dse-verify-proposal.md` §4 mutant line, about `ReadingModeBlockHost.ts:1026-1031` (the own-write-first selection). The N18 equivalence reason omits the discarded-re-bind-snapshot state. Fix: reword as in §4; optionally add the r5 probe as a jest test.
- **NIT N1** — CHANGELOGs: F4 (a give-up residual write) is not named. Acceptable under the ruling and the "in the shapes below" headline; no change required.
- **NIT N2** — r4 report: "11595 / 2 fresh" has no log. Attach the fresh run or cite the warm number.
- **NIT N3** — proposal F1 bullet: "an unique" -> "a unique".
