# SC-537 r5: scoped re-review of the r4 fix round (plugin aca83702 on dse 88cb7db9, superproject 4380db57 on origin/main 07710b0f)

## Executive summary
1. **Verdict: LAND-READY.** There are no HIGH or MEDIUM findings. LOW-1 is reduced but not gone: about 8 ms per update is left for a callout holding 40 blocks. There are 3 INFO items.
2. **HIGH-1 and MEDIUM-1 are fixed in real Obsidian 1.15.0 Live Preview.**
   - My r3 probes that failed now pass on HEAD: `far`, `far-nopark`, `far-up-from-low`, `far-form` and `raw-lower-100`.
   - A scroll through far-apart twins, one step per frame, shows the stale value in 0 frames. On 88cb7db9 it shows it in 10 frames, and the lower + writes [7,5].
3. **G-S57 (f) and (g) are red on the 4e3de39c bundle and green on HEAD.**
   - On 4e3de39c: (f) lower 6 with disk [6,5], then [7,5]; form Save gives [Twin,Twin] / [6,5]; (g) cards [6,6] with disk [6,5], then [7,5]. Phases (a)–(e) pass.
   - On HEAD every phase passes.
4. **No false remounts:**
   - 30 identical callouts: scrolled down and up (79 + 79 frames, each card checked against disk) and the cursor walked over 363 lines. 0 `reused-by-twin` releases, 0 mismatches.
   - After two writes: exactly 2 releases, and the cards match disk in every frame.
5. **Gates on aca83702:**
   - tsc, `tsc -p e2e` and lint are clean.
   - jest: **6255 / 1 skipped / 249 of 250**.
   - lifecycle: **46/46** as 21 + 16 + 9 (187 s, 329 s, 361 s). G-S57 runs before G-S56.
   - e2e: **124/124, 0 failed, 0 known-bug, 87/87**, with the "pointer parked" line.
6. **Mutants:**
   - r4's mutants 1–5 give 7 / 8 / 2 / 2 / 1 jest reds. G-S57 FAILs on mutant 4 (docChanged only).
   - My mutant 7 (no `viewportChanged`) gives 1 jest red, and G-S57 (f) FAILs.
   - My mutant 6 (no `selectionSet`) gives 1 jest red, but G-S57 and my probe still pass. That is INFO-1.
7. **LOW-1 in real Obsidian, 40-block callout** (the editor pass only):
   - **7.8 ms per keystroke**. It was 18.0 ms on 4e3de39c; base 88cb7db9 runs no pass. A full keystroke costs 9.3 ms, against 19.4 on 4e3de39c and 1.35 on base.
   - 9.5 ms per pass on cursor moves; 42 of 100 moves ran one.
   - 8.5 ms per pass while scrolling; 66 passes in 120 frames. Frames averaged 24.7 ms against 19.7 on base (p95 41.7 against 29.6).
8. **Large note** (125 KB, 14 cards drawn): 1.3 ms per keystroke, 2.4 ms per cursor move, 1.45 ms per scroll pass (32 passes in 150 frames).
9. **LOW-2 and the test assertion:**
   - The CHANGELOG wording is accurate. It does not mention the rapid-click case, which is SC-544, as ruled.
   - The scroll-hold wiring test now checks that the scroll-hold extension is registered, not how many extensions are.
   - The range-diff is clean: the r2 commits differ only by conflict resolution.
10. **Tree:** I made no commits. Plugin `git status --porcelain` was empty before and after; the superproject shows ` M draw-steel-elements`, unchanged from the start (the pointer is unbumped).

## 1. Range-diff (`git range-diff f81a277..4e3de39c 88cb7db9..HEAD`)
- **The four r2 commits:**
  - `162f412b = 0f980037` and `4e3de39c = 02e9ec0c`: identical.
  - `1f1bbc64 ! 2411a0ac`: only the context line of the scroll-hold wiring test changed. SC-522's `expect.any(Function)` line comes in from develop.
  - `2f2ea4da ! 00e76df0`: only the harness header comment changed, plus the placement of G-S57 before G-S56 (develop's G-S52/G-S56 code arrives in the context).
- **The r4 delta, four new commits:**
  - `f6d10fbb`: tests.
  - `346386b8`, the fix:
    - `livePreviewReconcile.ts:28` changes the guard to `docChanged || viewportChanged || selectionSet`;
    - `quoteOrdinal` (`ReadingModeBlockHost.ts:304`) gains a narrowed selector and a per-pass cache;
    - `remountReused.ts` carries `blocks: new Map()` in the pass scope;
    - the scroll-hold wiring test checks that the scroll-hold extension is registered.
  - `9189c00e`: G-S57 (f) and (g), plus the `Lifecycle/twin-callouts-far.md` fixture.
  - `aca83702`: architecture docs.
- **Behaviour check of the narrowed selector:** `div.block-language-X, pre > code.language-X`, still filtered by `[data-dse-element]`, picks the same elements in the same order as the old `div, code` filter. The aliases are plain `ds-*` names, so the selector needs no escaping.
- **Scenario order:** … G-S53, G-S54, G-S52, **G-S57, G-S56**. G-S57 opens its own notes in `LC_LEAF` and never relies on G-S56's leaf replacement.

## 2. Real-Obsidian probes on HEAD (bundle sha256 `aa4efdf6…`, the same `main.js` every lifecycle part built)
| Probe | HEAD aca83702 | Control |
|---|---|---|
| `far`, `far-nopark`, `far-up-from-low` (twins 150 paragraphs apart) | clean: lower card 5, lower + gives [6,6] | 4e3de39c in r3: lower shows 6, + gives [7,5] |
| `far-form` (form Save on the upper, scroll down, + on the lower) | clean: names [Edited,Twin], [5,6] | r3: names [Twin,Twin], [6,5] |
| `raw-lower-100` (+ on the upper, then the lower title 100 ms later) | clean | r3: lower shows 6, then [7,5] |
| `far-frames` (+ on the upper, park, scroll down 150 px per frame for 49 frames, check every drawn card each frame) | 0 bad frames; 1 `reused-by-twin`; lower + gives [6,6] | 88cb7db9: 10 bad frames (lower R36 = 6 with disk 5), lower + gives [7,5] |
| `many-scroll` (30 identical callouts; 200 px per frame down then up; cursor walk every 2nd line over 363 steps) | 0 releases, 0 card/disk mismatches; 438 passes, mean 0.30 ms (≤ 4 entries) | – |
| `many-write` (+ on callout 14, scroll through; + on callout 15, scroll and cursor walk) | releases exactly R76 and R78 (one per write), 0 mismatches, disk exact, text outside the quotes unchanged | – |
| `seq2-01`, `panes-lplp`, `type-value-back`, `undo` | clean | – |
| `scroll-real` / `scroll-stop` (tall note) | scrollTop 1850 in all 171 / 170 frames; lower card top 349→390 (real click: the upper callout turns into source, SC-540) / 349 | 88cb7db9: the same numbers |

The scroll probes flagged a few "scroll jumps" of 27–81 px (600→573, 8173→8254). I see the same jumps on 88cb7db9, so they come from CodeMirror correcting its height estimates, not from SC-537.

## 3. LOW-1 cost in real Obsidian
- **Method:**
  - I patched `reusedBlockBody` on the prototype to time each real editor pass (keyed by the pass's scope object).
  - In the same run I timed 200 real keystrokes (`cm.dispatch`), 100 cursor moves across the drawn lines, and scrolls of 120 or 150 frames at one step per frame.
  - Each bundle ran in its own Obsidian. Load average was 2–3.

| Note | Measure | aca83702 | 4e3de39c (r2) | 88cb7db9 (base) |
|---|---|---|---|---|
| `bigcallout.md` (40 counters in one callout, all drawn) | editor pass per keystroke, mean / p95 / max | **7.8 / 11.2 / 13.9 ms** | 18.0 / 26.3 / 36.7 | no pass |
| | full keystroke dispatch, mean | 9.3 ms | 19.4 | 1.35 |
| | cursor moves: passes / per pass | 42 of 100 / **9.5 ms** (p95 12.2) | 0 | 0 |
| | cursor move dispatch, mean | 8.3 ms | 3.4 | 2.9 |
| | scroll at 40 px per frame, 120 frames: passes / per pass | 66 / **8.5 ms** (p95 13.1, max 20.8) | 0 | 0 |
| | frame time, mean / p95 | 24.7 / 41.7 ms | 20.2 / 35.3 | 19.7 / 29.6 |
| `large.md` (125,619 chars, 3003 lines, 14 callout cards in the DOM) | editor pass per keystroke, mean / p95 | 1.29 / 2.3 ms | 1.76 / 3.3 | no pass |
| | cursor moves: passes / per pass | 100 of 100 / 2.4 ms | 0 | 0 |
| | scroll at 120 px per frame, 150 frames: passes / per pass | 32 / 1.45 ms | 0 | 0 |
| | frame time, mean / p95 | 26.7 / 69.6 ms | 25.8 / 61.2 | 28.6 / 71.8 (noise) |

- **Reading the table:**
  - The per-keystroke cost of a 40-block callout fell about 2.3 times, from 18 to 7.8 ms, but it is still not small.
  - The pass now also runs on scroll and cursor updates, at about the same cost per pass.
  - In a normal note (≤ 4 cards per callout) a pass costs ≤ 0.3 ms in `many-scroll`, and about 1.3–2.4 ms in a 125 KB note with 14 cards.
- **Severity: LOW, does not block landing.**
- **Remaining cost and how to cut it (follow-up, optional):**
  - Per entry, `fenceOnElement` → `locateInSectionLines` rescans the callout window (`ReadingModeBlockHost.ts:359`), so the cost still grows with the square of the number of blocks in a callout. The r4 report says the same; I did not profile it further.
  - Fix: build the window's fence list once per widget per pass, next to `scope.blocks`.
  - An optional extra: skip a `selectionSet`-only update whose selection did not enter or leave a callout. See INFO-1.

## 4. Mutants (jest = `twin-reuse` + `livePreviewScrollHold`, 68 tests; lifecycle on bundles built from each mutant)
| # | Mutation | jest | G-S57 |
|---|---|---|---|
| 1 | `reusedBlockBody` without the LP section | 7 red | – |
| 2 | `reconcile(path)` without the editor | 8 red | – |
| 3 | no `lastWriteLine` skip | 2 red | – |
| 4 | guard `docChanged` only | 2 red (viewport case, selection case) | **FAIL** (f) and (g) |
| 5 | no per-pass block-list cache | 1 red | – |
| 6 (mine) | guard `docChanged \|\| viewportChanged` (no `selectionSet`) | 1 red (selection case) | **ok**; my `raw-lower-100`, `far` and `seq2-01` probes also clean |
| 7 (mine) | guard `docChanged \|\| selectionSet` (no `viewportChanged`) | 1 red (viewport case) | **FAIL** (f) |

After each mutant the source was restored and `git status --porcelain` was empty.

## 5. Findings
- **LOW-1 (reduced, does not block): the pass costs grow with the square of the number of blocks in one callout.**
  - Where: `ReadingModeBlockHost.ts:359` (`locateInSectionLines` for each entry), now reached on every scroll and cursor update as well (`livePreviewReconcile.ts:28`).
  - Measured: 40-block callout at 7.8 ms per keystroke, 9.5 ms per cursor-move pass, 8.5 ms per scroll pass (frames 24.7 against 19.7 ms on base).
  - Fix: build each callout window's fence list once per pass. Optional; a follow-up ticket if the owner wants one.
- **INFO-1: real Obsidian does not need the `selectionSet` term in any case I measured.**
  - Where: `livePreviewReconcile.ts:28`.
  - Mutant 6 (no `selectionSet`) passes G-S57 (g) and my `raw-lower-100`. When the raw lower callout is drawn again, its height changes, so the `viewportChanged` update already judges it.
  - Only the jest selection-only case pins the term. It is also the trigger that runs a pass on cursor moves.
  - Keeping it is the safe choice: CodeMirror does not promise a viewport change there. Measuring it again and dropping it is the owner's call. No action needed.
- **INFO-2: two header comments in `visual-harness/obsidian-lifecycle.mjs` say "45 scenarios in all".** They are line 103 (G-S57) and line 111 (G-S52). The file now has 46. This is a comment-only nit.
- **INFO-3: the probe's "scroll jumps" of 27–81 px also happen on 88cb7db9.** They are CodeMirror height corrections, not SC-537.
- **Checked and fine:**
  - The CHANGELOG bullet (superproject `CHANGELOG.md:40-43`) is accurate after the fix.
  - The scroll-hold test assertion (`livePreviewScrollHold.test.ts:542-548`) checks the extension is among the registrations, with the matching `mockRestore`.
  - Scroll in a tall note is unchanged.
  - Two panes, undo and typing are clean.
  - The SC-540 click-opens-source symptom is unchanged (out of scope).

## 6. Gates (aca83702; logs in the ledger dir)
| Gate | Result | Log |
|---|---|---|
| tsc (incl. `-p e2e`), `npx tsc -p e2e`, lint | rc 0 / 0 / 0 | `sc537-r5-gate-tsc-lint.log` |
| jest (`main.js` removed first; load 21, green anyway) | `Tests: 1 skipped, 6255 passed, 6256 total`; `249 passed, 249 of 250` | `sc537-r5-gate-jest.log` |
| lifecycle 1 (G-S7a…G-S9a) | 21/21 ok, 187 s | `sc537-r5-gate-lifecycle-1.log` |
| lifecycle 2 (G-S9b…G-S40) | 16/16 ok, 329 s | `sc537-r5-gate-lifecycle-2.log` |
| lifecycle 3 (G-S45, G-S44, G-S42, G-S50, G-S53, G-S54, G-S52, G-S57, G-S56) | 9/9 ok, 361 s | `sc537-r5-gate-lifecycle-3.log` |
| e2e | `124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`; `pointer parked at 0,0 on :200`; 68 s | `sc537-r5-gate-e2e.log` |

I did not rerun shots, freeze or parity. r4 changed no CSS and no part of the shots harness, so the implementer's 592 / 0 FAIL, freeze 280/280 and parity 0/0/24 stand.

## 7. Artifacts
- **Ledger directory:** `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc537-lp-callout-twins/`
  - Report: `sc537-r5-rereview-report.md`
  - Gate logs: `sc537-r5-gate-tsc-lint.log`, `sc537-r5-gate-jest.log`, `sc537-r5-gate-lifecycle-1.log`, `-2.log`, `-3.log`, `sc537-r5-gate-e2e.log`
  - Red/green: `sc537-r5-red-gs57-on-4e3de39c.log`, `sc537-r5-green-gs57-on-head.log`
  - Mutants: `sc537-r5-mutants.log`
  - Probes and cost: `sc537-r5-probes.log`
- **Scratch:** `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc537-r5-review-a1c8475e199b5ef3f/`
  - Probe sources: `r3-instr.js` (with the r5 pass timer), `r3-scenario.mjs`, `mkharness.py`.
  - Runner scripts: `probe.sh`, `lc.sh`, `gate-*.sh`, `mut.py`, `mut-jest.sh`.
  - Bundles: `bundle-head`, `bundle-4e3de39c`, `bundle-88cb7db9`, `bundle-mut{4,6,7}`.
  - Probe output: `runs/<run>/r537.json`.
