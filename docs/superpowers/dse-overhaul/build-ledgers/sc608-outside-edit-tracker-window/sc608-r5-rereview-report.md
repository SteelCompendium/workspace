# SC-608 r5: scoped re-review of the r4 fix round (reviewer R1)

**Executive summary**
- **Verdict: LAND.** 0 HIGH, 0 MEDIUM, 1 LOW (documentation drift), 4 INFO. L1, L2, L3, L4, L5 and I7 are each fixed as ruled, and I checked every one by running my r3 probe again in real Obsidian. Re-running the full r3 matrix shows no regression: 21 probes give the same result as at r2, and the 8 that differ all moved the way the rulings asked.
- Gates re-run on dse `eb46d58d`:
  - tsc and lint: rc 0.
  - jest: **11683 passed / 1 skipped** (warm), rc 0. That is the 11682 / 2 fresh count the report gives, which is 11648 + 34 new.
  - e2e: **`328/331 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`**, rc 0 (315 at the base + 13 new).
  - The implementer's own gate logs (`sc608-r4-fix/gate-*`) all finished at or after the final commit's time (06:16:58). Lifecycle 61/61, shots, freeze and parity were therefore run on the final HEAD.
- Superproject `3751eef8` is ONE commit on `origin/main` `bbcd1d41` (fetched today). It changes CHANGELOG and moves the pointer to `eb46d58d`. dse `eb46d58d` sits on `origin/develop` `63e00d7e`. SC-605's additions in initiative `view.ts` survived the rebase: the carry/quick-add hooks are counted 10 at base and 10 at HEAD, and no SC-605 line was removed.
- Red without each fix: 8 mutants of mine, all killed. Jest: L1 (S08), L2 (O20, O21), L3 (O22), L4 focus gate (O09, O25), L4 raw text (O19), I7 (O24), and my r3 R3 mutant (now O18). e2e: L1 (INIT-W13) and L3 (INIT-W09, W10).
- Implementer follow-up ("`disk` can be ahead of the note after a dropped write"): **harmless.** In a simulated drop, the sidebar closes the window with the Notice on the next outside edit, and the tracker then matches the note. That is better than keeping a model the note does not have. Nothing is lost silently, and no Notice is missing.
- LOW: the `.repo-docs/architecture.md` row for `windowHandoff.ts` and the doc comment at `view.ts:207-208` still describe the r2 rules.

## 1. Each r3 finding, probed on HEAD

| Finding | Probe | r2 (r3 run) | r4 HEAD |
|---|---|---|---|
| L1 (sidebar: condition added, then an edit elsewhere in the note) | ZR-28 "out"; ZN-07 (delays 350, 390, 410, 430, 470 ms) | window closed, Notice, Dazed lost | **window stays open, no Notice, Dazed in the note** at every delay; a second add (Bleeding) also reaches the note |
| L1 (in-block counterpart) | ZR-28 "in"; ZN-06 | closed with Notice | closed with Notice at every delay. At 410 ms and later Dazed and Malice 9 are both in the note (our write landed first); at 350 and 390 ms Dazed was dropped, with the Notice. Base `63e00d7e`: the window stays open and everything after that is lost |
| L2 (a tracker inserted above the open one) | ZX-01 (valid inserted tracker), ZR-18 (invalid one) | focus went to the inserted "Newt" / silent 3 s stall | **Notice, focus on BODY**, in both |
| L2 (no false positive) | ZN-01 / ZN-02 (window on the 1st of two, the edit changes BOTH blocks, Reading view and Live Preview), ZN-03 (window on the 2nd) | — | Notice, focus on the right tracker (Alice / Bob) |
| L3 (burst) | ZR-22 Reading view, ZR-23 Live Preview + sidebar (five edits 30 ms apart) | Reading view: BODY | **focus on `init.detail.stamina` +ring** in all three; Notice once |
| L3 (no theft) | ZN-04: after the first hand-off, focus moved into an editor in another pane, then three more redraws inside 1.5 s | — | the editor keeps focus |
| L4 (YAML comment only) | ZR-26 | BODY, no Notice | **Notice + focus on `init.hero.stamina`** |
| L4 (own saves stay quiet) | ZR-11, 13, 14; ZR-12 (Live Preview own Conditions add); ZN-09 to ZN-12 (tracker in a callout, and an embedded tracker, in Reading view and Live Preview) | — | no Notice anywhere. ZR-12: the window still closes (SC-384), but focus now returns to `init.cond.add` (r2: BODY). An outside edit in a callout or embed: Notice + focus |
| L5 | jest mutant R3 (the free-focus check removed) | survived (44/44) | **killed by O18** |
| I7 | jest mutant Q5 (`holder.register(finish)` removed) | — | killed by O24. ZR-29 (plugin off/on with a window open): no errors, no Notice |

Regression matrix: the r3 probes ZR-01 to 11, 13 to 17, 20, 21, 24, 25 and 29 give results identical to the r3 run. ZR-19 differs only in losing the timing-dependent "not saved" Notice (r3 I8). ZX-04 (popout) is unchanged: the Notice shows in the popout, and the popout keeps focus.

## 2. Findings

### LOW

**R5-L1: the architecture row and one doc comment describe the r2 rules.**
- `.repo-docs/architecture.md`, the `chrome/windowHandoff.ts` row, last changed in `429912cc`, the r2 docs commit. It still says "acts only when the successor's serialized content differs…", that the sidebar compares "the block's serialization", and "Gate: … e2e `INIT-W01..W08`". The r4 rules it is missing: focus is decoupled from the content check; the comparison is raw block text against what the view last loaded or wrote; the count rule; the settle period; plugin ownership; and W09..W13.
- `src/elements/initiative/view.ts:207-208` says that focus is handed "when the block that comes back differs". Focus is now handed regardless.
- The `windowHandoff.ts` header (`9adac152`) is up to date.
- Fix: refresh the row and the comment. This is docs only and needs no re-gate.

### INFO

- **I1: the dropped-write follow-up is harmless.** Two simulations, done by stubbing the host's `replaceSource` to return false:
  - ZN-13, sidebar: Dazed is "written" but dropped, then an edit outside the block. The window closes with the Notice, and the sidebar and note agree (no Dazed). The cause is that `disk.ser` holds the dropped write, so the comparison sees a change.
  - ZN-14, Reading view: an in-block edit gives Notice + focus. An edit elsewhere leaves the window open, as before.
  - A real SC-343 drop shows its own "not saved" Notice, so the user is told twice, which is consistent. Treating the note as the truth instead would leave the window open and quietly re-write the dropped condition on the next write. r4's behaviour is the better of the two.
- **I2: a separate pre-existing silent drop.** On base `63e00d7e`, Reading view, ZN-08 at 390 ms: a condition added about 10 ms before the debounce, then an outside in-block edit. Dazed is lost with **no Notice at all**; SC-343's Notice fires only at 350 ms. At HEAD the SC-608 Notice now covers that case. This is outside SC-608; the owner may want to file it.
- **I3: the settle re-claim follows a blur that raises no focusin.** ZN-05: after the first hand-off, `blur()` by script (focus on BODY, no focusin), then a redraw inside 1.5 s puts focus back on the tracker control. This matches the ruling ("re-claim only while focus is on BODY") and is a small, bounded window. No theft was seen when the user moved focus (ZN-04).
- **I4: `windowHandoff.ts:101` reads Obsidian's internal `Component._loaded`.** It is untyped and works on Obsidian 1.14.4. The same applies to the duck-typed `lastKnownBody` the implementer already listed.

## 3. Evidence

All files are under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc608-r5-rereview/`:

| What | Files |
|---|---|
| Gates | `r5-jest.log/.rc`, `r5-e2e.log/.rc`, `r5-tsc.log/.rc`, `r5-lint.log/.rc`, `r5gate.sh` |
| Jest mutants | `r5-jestmut.sh`, `r5-jestmut.rc`, `r5-jestmut-Q1..Q6-*.log`, `r5-jestmut2.sh`, `r5-jestmut2.rc`, `r5-jestmut-R3-free-check.log` |
| e2e mutants | `r5-e2emut.sh`, `r5-e2emut.rc`, `r5-e2emut-E1-L1-live-model.log`, `r5-e2emut-E2-L3-no-settle.log` |
| Probe specs (never committed) | `zr-probe608.e2e.ts.txt` (r3 matrix, Live Preview selector fixed), `zr-extra608.e2e.ts.txt`, `zn-probe608.e2e.ts.txt` (ZN-01..14); runner `zr-run.sh` (its base mode is now `63e00d7e`) |
| Probe data | `zr-head1.jsonl` (r3 matrix on HEAD; compared with `../sc608-r3-review/zr-head1.jsonl`), `zr-extra1.jsonl`, `zr-zn1.jsonl` … `zr-zn6.jsonl`, `zr-znbase.jsonl` (base `63e00d7e`); logs `zr-e2e-*.log/.rc` |

The FAILs in the probe logs are the harness's note-integrity invariants, which these probes trip on purpose because they edit notes from outside. Worktree state: dse `eb46d58d` and superproject `3751eef8`, both `git status --porcelain` empty before and after; no `zz-*` spec directory left behind.
