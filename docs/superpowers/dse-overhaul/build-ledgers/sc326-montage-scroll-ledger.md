# SC-326 decisions ledger — montage board clips instead of scrolling

Worktree: `/home/scott/code/steelCompendium/worktrees/sc326-montage-scroll` (branch `sc326-montage-scroll` in every submodule).
Base: dse `develop` @ `188755b`.

## Scott rulings (verbatim, dated)

None yet. The ticket body (filed by the SC-299 owner) asks: "decide the right behaviour (horizontal scroll inside the board wrap, a lower narrow-layout breakpoint that scales with round count, or a column-width floor that shrinks the trio first) and add a gate for \"every cell reachable\" at high round counts."

## Owner decisions (2026-10-20, ticket-owner, pending Scott's eye at land-ready)

1. **Behaviour: horizontal scroll inside the board.** The ticket title names the expected behaviour ("clips instead of scrolling"). Scroll keeps every column at its readable/touchable width; the other two options shrink touch targets (column floor) or switch to the stacked layout on wide panes (breakpoint), both larger design changes.
2. **Mechanism:** the board's frame clip (`.dse-mt__board { overflow: hidden }`, decoration tier, `styles-source.css` ~:4591) becomes `overflow-x: auto; overflow-y: hidden`, keeping border + radius on the visible frame. No change to the narrow (≤420px container) stacked layout.
3. **Zero pixel change when nothing overflows**: all frozen shots byte-identical, no rebaseline expected.
4. **Pinned (sticky) hero-name column while scrolling: NOT in this round.** Asked of Scott at land-ready as an optional follow-up (needs opaque cell backgrounds, a look change).
5. **Gate:** a real-Chromium "every cell reachable" check at high round counts, fine AND coarse pointer, with a can-fail proof (fails on the old `overflow: hidden`). Prefer a probe-local fixture over a new shot fixture so shot/freeze counts don't move.
6. Concurrent SC-422 (text-scale surfaces, CSS) — keep CSS edits scoped to the montage board rules.

## Worker roster (author-independence)

- r1 implementer (Sonnet) ad8465ae8eec8c530 — authored the fix; brief `sc326-r1-brief.md`. Must NOT review.

## Follow-up rulings (owner, 2026-10-20)

- r1 Follow-up 1 (board `scrollLeft` lost on every write — `view.ts` rebuilds the element incl. a fresh `BoardView`; a tap in a far column snaps back to round 1): **FOLD into round 2.** Without it the scroll fix is half a fix on touch. Measure first (real Chromium or Obsidian), then preserve horizontal scroll across the rebuild, with a can-fail test.
- r1 Follow-up 2 (pinned name column): stays decision 4 — asked of Scott at land-ready.
- r1 Follow-up 3 (per-cell check uses programmatic scrollIntoView): **DROP** — the computed-overflow + real-wheel assertions carry the real-input guarantee; the can-fail proved they fail on the old CSS.
- r2 (head `44186fe`): lifecycle now 28/28 (new G-S12); jest 5262/1 skipped/229 of 230.
- r2 Follow-up 1 (adoptView resets scroll of every scroller in an adopted block; montage repaired view-locally): **FILED SC-467** (Backlog, related to SC-326). OUT OF SCOPE for fix rounds here.
- r2 Follow-up 2 (dse-verify SKILL says 27/27): dispatcher bookkeeping at landing — reported in land-ready, no ticket.
- r2 Follow-up 3 (Live Preview not driven; fresh mount by design): **DROP** — nothing to carry.
- review1 (Opus) ad908ec2d65f5db2e — independent of the implementer; brief `sc326-review1-brief.md`.

## Review 1 rulings (owner, 2026-10-20) — review1 verdict FIX-ROUND at `44186fe`

- MED-1 (Tally track shrinks to 4.4em floor when overflowing; "× n" chip flush/clipped at max scroll): **FOLD** — Tally track `minmax(max-content, auto)` + content-inside-cell gate check. Frozen shots must stay byte-identical.
- MED-2 (Tab lands on a partly visible cell; Chromium doesn't scroll partly visible focus): **FOLD** — board `focusin` → `scrollIntoView({inline:'nearest', block:'nearest'})` + real-Tab walk gate (must fail at `44186fe`).
- LOW-1 (15px desktop scrollbar for 1px overflow at mount widths 488.5–490px): **DROP** — a 1.5px-wide window of pane widths, fine pointer only, content still reachable; moving the narrow breakpoint is a layout change outside this ticket.
- LOW-2 (gate hand-copies BoardView's track list): **FOLD** — the gate must render the real element with a genuine ≥12-round source (as review1's probes did) so the shipped track list is what's measured.
- LOW-3 (G-S12 only from the far end): **FOLD** — extend G-S12 with a mid-scroll tap and a second block in the same note (review1's scratch G-RV1 is the worked example); count stays 28.
- LOW-4 (CHANGELOG "mouse wheel" / "Tab"): **FOLD** — "Shift + mouse wheel"; Tab claim true after MED-2.
- INFO off-screen detach without the moving mark resets to 0: same class as SC-467 — **DROP here** (noted on SC-467 scope).
- r3 (head `c27e5a0`): MED-2 implemented as a horizontal-only `board.scrollLeft` adjust instead of the literal `scrollIntoView` (avoids scrolling the page vertically on a click). **ACCEPTED** — horizontally equivalent, strictly less disruptive. jest 5266/1 skipped/229 of 230; lifecycle 28/28.
- r3 Follow-ups 1–3 (probeSource montage-only; overflow threshold ~24px wider; slow shots from concurrent load): **DROP** — informational, no defect.

## Base move (dispatcher, 2026-10-21)

- dse develop moved `188755b` → `ba20072` (SC-366: `a.dse-ref-web-card__link` in link-colour rules ~:8901/8909 of styles-source.css; new test/dom/theme/notInstalledLinkColour.test.ts). New base baselines: jest 5260 / 1 skipped / 230 of 231; rest unchanged. **Land-ready must be on `ba20072`.** Plan: let rereview1 finish on `c27e5a0`, then implementer rebases + full battery; expected jest 5260 + 9 = 5269 / 1 skipped / 230 of 231, lifecycle 28/28; reviewer confirms `git range-diff` shows no content change in the branch's own commits.
- 2026-10-21: develop moved again `ba20072` → **`84636a9`** (SC-460: stray-CR write-back tolerance, **adds its own lifecycle scenario G-S12**). Base baselines: jest 5329 / 1 skipped / 230 of 231, lifecycle 28/28, e2e 83/87 4 known-bug 57/57, freeze 276/276, parity 0/0/24. **Land-ready must be on `84636a9`.** ID COLLISION: our montage scroll scenario must be renamed **G-S13** (SC-460 owns G-S12 on develop). Expected after rebase: jest 5329 + 9 = **5338** / 1 skipped / 230 of 231; lifecycle **29/29**.
- 2026-10-21: develop moved again `84636a9` → **`0267b8a`** (SC-459: lifecycle G-S8 + a previewScrollPin.ts comment; build byte-identical). Baselines unchanged (jest 5329/1, lifecycle 28/28, e2e 83/87 4kb 57/57, freeze 276/276, parity 0/0/24). **Land-ready must be on `0267b8a`.** Our expectations unchanged: jest 5338, lifecycle 29/29 (G-S13 rename stands).
- 2026-10-21: develop moved again `0267b8a` → **`3480231`** (SC-468: Conditions modal focus + e2e COND-E02/E03). Base baselines: jest 5336/1/230 of 231, e2e **85/89 ok, 0 failed, 4 known-bug, 63/63 pairs**, lifecycle 28/28, freeze 276/276, parity 0/0/24. **Land-ready must be on `3480231`.** Ours expected: jest **5345** / 1 / 230 of 231; lifecycle **29/29**; e2e 85/89 63/63. Dispatcher heads-up: SC-468's workspace CHANGELOG bullet is at the top of Unreleased — **rebase the superproject branch onto origin/main** before reporting. Owner ruling: add a workspace `CHANGELOG.md` Unreleased bullet for SC-326 in the WORKTREE's superproject (user-facing fix; routing table), committed on the superproject branch.
- 2026-10-21: rereview1 (ad908ec2d65f5db2e) was killed before writing anything (no report, no logs; worktree clean at `c27e5a0`). Re-ordered: r4 rebase first, then the scoped re-review covers r3 delta + rebase together on the rebased head.
- 2026-10-21: reviewer PAUSED cleanly (tsc at c27e5a0 clean; scope read OK). Raised a concern to probe on the rebased head: MED-2's focusin scroll may move the board under a mouse/touch press on a partly visible cell so the click lands elsewhere; candidate fix = act only on `:focus-visible`. r4 implementer resumed to finish the in-place rebase.
- 2026-10-21: develop moved again `3480231` → **`c03db7a`** (SC-456, test-only: stricter e2e note-integrity fence check). Base baselines: jest 5374/1/231 of 232 (fresh 5373/2), lifecycle 28/28, e2e 85/89 4kb 63/63, freeze 276/276, parity 0/0/24. **Land-ready must be on `c03db7a`.** Ours expected: jest **5383** / 1 / 231 of 232; lifecycle **29/29**; e2e 85/89 63/63.
- 2026-10-21 (dispatcher): lifecycle IDs — SC-326 keeps **G-S13**; SC-457 (in flight) takes G-S14. If SC-457 lands first, our expected lifecycle becomes 30/30 (dispatcher will say).
- 2026-10-21: develop moved again `c03db7a` → **`e31e1a0`** (SC-474: Conditions dropdown closes on click; e2e COND-E04/05/06, control id cond.icon-search). Base: jest 5384/1/231 of 232, lifecycle 28/28, e2e **88/92 ok, 0 failed, 4 known-bug, 64/64**, freeze 276/276, parity 0/0/24. **Land-ready on `e31e1a0`**, superproject rebased onto origin/main (CHANGELOG moved again). Ours expected: jest **5393** / 1 / 231 of 232; lifecycle 29/29; e2e 88/92 64/64.
- 2026-10-21 07:43Z: r4 implementer hung ~33 min on a battery call (glob `rm` + compound `cd` → likely permission prompt; adapter footgun 13). Dispatcher stopped + resumed it: fresh log folder, `devbox run -c`, one gate per call, rebase to current develop. State at stop: dse rebased onto `c03db7a` (head `9f7c8e5`), G-S12 (SC-460) / G-S13 (ours) correct, range-diff shows only CHANGELOG context + the rename; superproject not yet rebased/committed. Reviewer still PAUSED.
- 2026-10-21: r4 DONE — dse `c8880db` on develop `e31e1a0`; superproject `139cfd8` (CHANGELOG only) on main `2d4ece3`. Battery green at expected numbers (jest 5393/1/231 of 232, lifecycle 29/29, e2e 88/92 4kb 64/64, shots 572, freeze 276/276, parity 0/0/24). r2/r3 commit messages still say "G-S12" — **DROP** (history text only; content says G-S13). Reviewer resumed on `c8880db`.
- 2026-10-21: develop moved again `e31e1a0` → **`aaa88b7`** (SC-476: authoring autocomplete fenceScan.ts + schemaSuggest.test.ts, CHANGELOG bullet). Base: jest 5399/1/231 of 232, lifecycle 28/28, e2e 88/92 4kb 64/64, freeze 276/276, parity 0/0/24. **Land-ready on `aaa88b7` or newer**, superproject on origin/main. Plan: do NOT disturb the reviewer mid-run on `c8880db`; after its verdict (and any fix round), ONE final rebase onto the then-latest develop + full battery (ours expected at aaa88b7: jest **5408**/1/231 of 232, lifecycle 29/29, e2e 88/92 64/64).
- 2026-10-21: rereview1 verdict **LAND-READY** at `c8880db`. Reviewer's own press concern refuted (framework click shield cancels mousedown/pointerdown, so a press never moves focus). LOW (lifecycle header "SC-326 appends G-S13 (29 total)" violates superproject `2d4ece3` rule "Owners must not put a fixed total in a scenario header"): **FOLD** into the final rebase round — delete "(29 total)". INFOs (commit msgs say G-S12; SC-299 gate hard-codes track list at shoot.mjs:956; 0.28px padding past frame at 12 rounds): **DROP** — no defect / invisible.
- r5 (final): implementer — rebase onto latest develop (≥ `aaa88b7`), delete "(29 total)", superproject onto latest origin/main, full battery once.
- 2026-10-21: r5 DONE — dse `0ce76dd` on develop `aaa88b7`; superproject `58a1df5` on main `e0d3f47`. Delta vs reviewed `c8880db` = one comment line (owner-verified; range-diff commits 1–5 `=`). Battery green: jest 5408/1/231 of 232, lifecycle 29/29, e2e 88/92 4kb 64/64, shots 572 0 FAIL, freeze 276/276, parity 0/0/24. Land-ready comment posted (In Progress + Needs Review; ask = pinned name column follow-up, non-blocking). Reported LAND-READY to dispatcher.
