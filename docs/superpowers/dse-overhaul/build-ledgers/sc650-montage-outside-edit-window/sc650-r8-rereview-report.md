# SC-650 r8: scoped re-review of the r7 fix delta (landing head)

## Executive summary
- **Verdict: LAND.** Reviewed dse `42c26272` on `fcc7278e`. `git range-diff a9f0af1d..1bceaabf fcc7278e..2d874ec9~1` shows all 12 earlier commits as `=`. Delta: `2d874ec9` (`WindowSlot.beforeContents`), `b165f44f` (OW18h), `42c26272` (docs). Counts: 0 CRITICAL, 0 HIGH, 0 MEDIUM, 1 LOW (pre-existing, not introduced by the delta), 3 INFO.
- (1) The own save in a callout gives no Notice now. Initiative, two trackers in one Live Preview callout, siblings redrawn (`NEW, NEW`): 0 Notices at normal speed (MPRG-14) and with a 700 ms delay (MPRG-15; it was 1 at r6). The montage callout path (MPRG-10/11) was inconclusive in real Obsidian, 4 of 4 runs: after the Log the callout shows as source, so the second window never opens. It is covered by jest OW18i and by the shared code through the initiative probes.
- (2) The snapshot can hide real news, but only in an unrealistic case: one edit deletes block A and turns the open block B into a byte copy of A's at-open content. That gives no Notice and focus on `<body>` (MPRH-01, INFO-1); with new content the control gives Notice 1 (MPRH-01b).
- (2) LOW-E (pre-existing): in a callout, an outside edit to the SIBLING closes the open window. The open card comes back with the same content, so there is normally no Notice (MPRH-02 LP, MPRH-04 RV, MPRH-05 RV slow). There is one only when the sibling arrives first (MPRH-03 LP 700 ms: Notice at 792 ms), so the outcome depends on order.
- (3) MPRE-12: 0 Notices (normal and 700 ms). MPRE-14: 1 (100 ms normal / 847 ms slow). MPRB-21, MPRC-04, MPRC-05: 1 each, focus `<body>`.
- (4) Mutants: H1 (no content snapshot) killed by O20c and OW18i. H3 (`act` without `!noticed`) killed by OW18h. H8 (empty snapshot) killed by O20c and OW18i.
- (5) **NEGO-R05: did not reproduce.** The full e2e at `42c26272` is clean: `622/631 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs`, with NEGO-R05 ok (3014 ms), and this was with the host at load average ~21 from other efforts when the run started. That points to a load flake, as the implementer reported; there was no need to run a clean `fcc7278e` full e2e.
- Battery at `42c26272`: tsc 0, lint 0, jest 13448/1, e2e as above, lifecycle 64/64 (21, 16, 9, 4, 7, 4, 3), shots 592 / host-leak 163/978 / modal 40/240 / clip 147, freeze 280/280, parity 0/0/24.

## Findings

### LOW-E (pre-existing; owner call): in a callout, an outside edit to a sibling closes the open window, and the Notice depends on redraw order
- **Where:** `src/framework/chrome/windowHandoff.ts:177` (`act`: the first successor gets the Notice only if its content differs from the closing view's). The new rule at `:202` is not the cause.
- **Scenario:** two montages in one Live Preview or Reading-view callout. The user is typing in a window on the second. A Sync edits only the first. The callout is rebuilt as a whole, so the second card's view unloads and its window closes, dropping what was typed. The second's successor has the same content, so it is treated as "a re-render" and gets no Notice, although the window closed because of an outside edit. The Notice appears only when the edited sibling's new root is published before the open card's (the fallback finds content that is new since open).
- **Evidence:** MPRH-02 (LP, normal speed): window closed, Notice 0, focus `montage.bar.log`. MPRH-04 (RV) and MPRH-05 (RV, 700 ms): the same. MPRH-03 (LP, 700 ms): Notice 1 at 792 ms. Plain fences are not affected; the window stays open (r2 MPRB-22).
- **Why LOW:** nothing is written over anything, and focus returns. It needs two blocks of one element in the same callout (or embed) and an outside edit to the other. It predates SC-650's r5 to r7 rounds (it is SC-608's "same content = re-render" rule).
- **Possible fix (follow-up, not required to land):** use the same news test on the main path. Show the Notice once when any root of the note that is new since open carries content that is neither among `beforeContents` nor equal to `ownContent`, checked at the claim and on each later mutation until the TTL. Own saves stay silent: unchanged siblings keep their old content, and the own successor equals `ownContent`. The sibling-edit case gets its Notice whatever the redraw order.

### INFO
- **INFO-1 (snapshot suppression, judged unrealistic):** the only way the new rule hides real news is when the delete-above case also makes the open block a byte copy of a sibling's at-open content (MPRH-01). It needs one outside edit that removes a block and rewrites the open block into an exact copy of the removed one, which is not a plausible Sync or edit pattern. The twin case does not trigger it: twins that are both unchanged, or the own block deleted, are silent by ruling.
- **INFO-2 (unverified observation):** in the montage callout probes, after the Log (focus on the Log button, then submit), focus ended in the editor (`cm-content`) and the Live Preview callout opened as source in 4 of 4 runs at `42c26272` (1 of 4 at r6 kept the cards). That looks like a gap in the SC-626 / SC-602 focus carry inside callouts, separate from SC-650. I did not check it on the base. The owner may want a separate look.
- **INFO-3:** the content snapshot is taken in `slotOf` at window open (`windowHandoff.ts:84-93`). Calling `content()` serializes once per root of the pane at open; this is negligible.

## Probe table (real Obsidian 1.14.4; `dseW` = `42c26272` as-is, `dseX` = plus the scratch delay at `pipeline.ts:468`)
| Probe | Build | Case | Measured | Verdict |
|---|---|---|---|---|
| MPRG-14 | X, 0 ms | LP callout, two trackers, Conditions add (own write) | siblings `NEW,NEW`, Notice 0 | ok |
| MPRG-15 | X, 700 ms | same | siblings `NEW,NEW`, **Notice 0** (r6: 1) | fixed |
| MPRG-10 / 11 (x4) | X | LP callout, two montages, own save | second window never opened (callout shown as source) | inconclusive (INFO-2) |
| MPRE-12 | W / X 700 | LP plain two montages, own save | 0 / 0 | ok |
| MPRE-14 | W / X 700 | LP delete-above + change | 1 at 100 ms / 1 at 847 ms | ok |
| MPRB-21, MPRC-04, MPRC-05 | W | delete-above + change, RV / LP / initiative | 1 each, focus `<body>` | ok |
| MPRH-01 | X, 0 ms | delete A, B becomes A's at-open copy | Notice 0, focus `<body>` | INFO-1 |
| MPRH-01b | X, 0 ms | delete A, B new content | Notice 1 at 185 ms | ok |
| MPRH-02 / 03 | X 0 / 700 | LP callout, outside edit to the SIBLING only | window closed; Notice 0 / Notice 1 at 792 ms | LOW-E |
| MPRH-04 / 05 | X 0 / 700 | RV callout, same | window closed; Notice 0 / 0 | LOW-E |

## Battery (dse `42c26272`, review worktree)
| Gate | Measured | Expected |
|---|---|---|
| tsc / lint | rc 0 / rc 0 | clean |
| jest | 13448 passed / 1 skipped, rc 0 | 13448/1 |
| e2e full | `622/631 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs`, rc 0 (NEGO-R05 ok; INIT-W 13/13; MONT-OW 9/9) | same |
| lifecycle | 21/21, 16/16, 9/9, 4/4, 7/7, 4/4, 3/3 = 64/64, all rc 0 | 64/64 |
| shots | rc 0: 592 PNGs, host-leak 163/978, modal host-leak 40/240, capture clip 147 | 592, 163/978, 40/240, clip 147 |
| freeze | `freeze OK (280/280)`, rc 0 | 280/280 |
| parity | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc 0 | 0/0/24 |

## Mutants (jest `montage-outside-edit` + `initiative-outside-edit`, 69 tests, worktree `dseY`)
H1 (no `beforeContents` check): 2 red (O20c, OW18i). H3 (`act` ignores `noticed`): 1 red (OW18h). H8 (snapshot always empty): 2 red (O20c, OW18i). All killed.

## Evidence (under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc650-r2-R1/`)
- Battery: `r8-head.txt`, `r8-tsc.log`, `r8-lint.log`, `r8-jest.log`, `r8-e2e-run1.log`, `r8-life-part1..7.log`, `r8-shots.log`, `r8-freeze.log`, `r8-parity.log` (each with `.rc`); scripts `r8-a.sh`, `r8-b.sh`, `r8-c.sh`.
- Probes: spec `zz-r8-probes.e2e.ts` (plus `zz-r6b-probes.e2e.ts`, `zz-r4-probes.e2e.ts`, `zz-r2-probes.e2e.ts`); results `probe-results-r8x.jsonl`, `probe-results-r8w.jsonl`, `probe-results-r8g1..3.jsonl`; runs `probe-run-r8*.log`.
- Mutants: `r8-mutants.py`, `r8-mutants.out`, `r8-mut-H1-*.log`, `r8-mut-H3-*.log`, `r8-mut-H8-*.log`.
- Scratch worktrees at `42c26272` (detached, registered in the dse git dir; `git worktree prune` once the scratchpad goes): `dseW`, `dseX` (uncommitted delay instrumentation), `dseY` (mutants, restored). Earlier ones: dseP, dseR, dseM, dseQ, dseS, dseN, dseT, dseU, dseV. The review worktree was left as found.

## r9: is INFO-2 (after a write in a Live Preview callout, focus lands in the editor and the callout shows raw source) a regression?

**Verdict: SAME-ON-BASE (pre-existing).** The symptom shows on dse origin/develop `fcc7278e` exactly as on head `42c26272`. The original probe hits it 3 of 3 on base and 3 of 3 on head. A cleaner probe hits it once on base (1 of 8) and never on head (0 of 8). No variant is worse at head than at base, so there is no evidence that `cee04235` (or any SC-650 commit) causes it. The trigger is intermittent and not isolated: the original r6b probe hits it every time, and a separate step-by-step probe almost never does.

Setup: a runtime note with two montages in one `[!note]` callout, opened in Live Preview with the cursor on line 0, acting on the second card. Measured 1.5 s and 3.5 s after the action: `document.activeElement`, the visible montage cards in the leaf, whether the `.cm-callout` widget is drawn, whether any `.cm-line` shows `ds-montage` source, and the cursor line. Base worktree: `dseZ` (fresh, detached at `fcc7278e`). Head worktree: `dseW` (`42c26272`, unmodified).

| Variant | Probe | sha | Runs showing the symptom | When it shows | When it does not |
|---|---|---|---|---|---|
| window, the original r6b probe (one page eval: focus + click Log, click Submit, try Add a hero 30 ms later, wait 3 s) | MPRG-10 | base `fcc7278e` | **3 / 3** | focus `DIV.cm-content`, 0 cards visible (callout as source) | n/a |
| same | MPRG-10 | head `42c26272` | **3 / 3** (plus 4 / 4 at r8) | same | n/a |
| window, script (focus + click Log, click Submit) | MPRJ-01 | base | **1 / 8** | run 1: focus `DIV.cm-content`, cards 0, callout widget gone, raw source shown, cursor line 4 (at 1.5 s and 3.5 s) | `ctl:montage.bar.log` on card 1, 2 cards, callout drawn |
| same | MPRJ-01 | head | 0 / 8 | n/a | `ctl:montage.bar.log` on card 1, 2 cards, callout drawn, cursor line 0 |
| window, real keys (Enter on Log, Enter on Submit) | MPRJ-02 | base | 0 / 4 | n/a | `ctl:montage.bar.log` on card 1, callout drawn |
| same | MPRJ-02 | head | 0 / 4 | n/a | same |
| no window, script (focus + click End round) | MPRJ-03 | base | 0 / 8 | n/a | `ctl:montage.bar.end-round` on card 1, callout drawn |
| same | MPRJ-03 | head | 0 / 8 | n/a | same |
| no window, real key (Enter on End round) | MPRJ-04 | base | 0 / 4 | n/a | `ctl:montage.bar.end-round` on card 1, callout drawn |
| same | MPRJ-04 | head | 0 / 4 | n/a | same |

In every run where the symptom did not show, the write landed, focus returned to the rebuilt control on the same card with the ring, and the callout stayed drawn.

Notes:
- The symptom is the editor taking focus with the cursor inside the callout (line 4), which makes Live Preview reveal the callout's source. It happens on base, so it is not SC-650's.
- Why the original probe always hits it was not isolated. That probe does every step inside one long page eval, including a lookup of the Add a hero chrome item 30 ms after Submit; the step-by-step probe does each step in its own eval.
- If the owner wants it tracked, it belongs with the Live Preview own-save focus carry for callouts (SC-602 / SC-626), as a separate ticket.

Evidence (under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc650-r2-R1/`):
- Spec: `zz-r9-probes.e2e.ts`.
- Results: `probe-results-r9base.jsonl`, `probe-results-r9base2.jsonl`, `probe-results-r9head.jsonl`, `probe-results-r9head2.jsonl` (MPRJ); `probe-results-r9gbase1..3.jsonl`, `probe-results-r9ghead1..3.jsonl` (MPRG-10).
- Runs: `probe-run-r9*.log`.
- Base worktree: `dseZ` (detached at `fcc7278e`, registered in the dse git dir; prune later). The existing scratch worktrees were left as they were, apart from probe spec files copied into `dseW` and `dseZ`.
