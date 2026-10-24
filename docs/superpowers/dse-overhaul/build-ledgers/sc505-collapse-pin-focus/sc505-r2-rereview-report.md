# SC-505 r2 scoped re-review (reviewer B)

## Executive summary
- **Verdict: LAND-READY.** All four r1 findings (HIGH-1, MEDIUM-1, LOW-1, LOW-2) are closed. The only two new findings are LOW and do not block landing: a note that embeds the same block twice, and no committed e2e for the `focusin` guard.
- Counts: CRITICAL 0 / HIGH 0 / MEDIUM 0 / LOW 2 / INFO 4.
- Shas: dse 3717849 on efc17de, superproject 6e7f67d on 7e45f8d. Both r1 commits are `=` in the range-diff (5f9f3af = a823560, 37da2f2 = 081ee27), with no hand-resolved conflicts in src/ or test/.
- Gates on 3717849: tsc rc 0; lint rc 0; jest 6020 passed / 1 skipped, 243 of 244 suites; e2e full 120/120 ok, 0 failed, 0 known-bug, coverage 84/84; lifecycle 36/36.
  - Lifecycle was run because `registration.ts` (the sidebar pin path, covered by G-S33) is outside the r1 files.
  - Shots, freeze and parity were not run: the delta touches no CSS, rendering or harness code.
- HIGH-1 is fixed in real Obsidian. RV-P07B (press in the later pane) keeps focus on that pane's new Pin. The r1 twin-pane mutation (claim-time disarm removed) still keeps focus in the pressed pane. Removing the new leaf check sends focus to the twin, and both CHR-F06 and jest catch that.
- MEDIUM-1 is fixed. RV-P13 (a second press that writes nothing, then Tab to Collapse, then an outside edit) now ends on `<body>`, not Pin. RV-P16 (the same after a real Pin that writes) also ends on `<body>`.
- The new `focusin` guard does not regress anything:
  - A real Pin still lands on the final Pin across its rebuilds (body 45 ms → pin 82 ms → body 195 ms → pin 211 ms).
  - Collapse/Expand are unchanged on all 19 chrome elements, in Live Preview and in the sidebar copy.
  - Pointer clicks still move nothing, two bars in one note still never hit the twin, and second-press / ds-scc no-write cases leave focus in place.
- Red proofs: the r2 tests run against the r1 source give 5/5 new jest tests red and CHR-F06 red. The neutralised hand-off makes CHR-F05 red at Pin.

## Findings

### LOW-A (new): twin copies of one block in the SAME pane (a note that embeds the same note twice)
- Where: `src/framework/chrome/focusHandoff.ts:72` (scope = `.workspace-leaf` only), `:176` and `:178`.
- Scenario (measured, RV-P17A/B, note `Review/embed2.md` = `![[Stamina/basic]]` twice):
  - Pin on embed 1: focus moves to **embed 0's Pin** at 52 ms. That is the twin.
  - Pin on embed 0: body → embed 0's Pin at 83 ms → body at 193 ms, and focus stays on `<body>`. The twin's rebuild arrives while focus is on the Pin button just claimed, which is not `req.pressed`, so the claim-time disarm fires. The later re-insertion then loses focus.
- This is the same-pane variant of r1 HIGH-1. It is rare: both copies have to be in one view with the same block key, and the hidden Live Preview copy has no Pin item, so it does not count.
- Fix, if folded (otherwise a Backlog ticket):
  - Narrow the scope below the pane: record `pressed.closest('.internal-embed, .markdown-embed')` (or the pressed copy's position among the same-key copies in its pane), and only that copy may claim.
  - Count focus on any Pin button this request has already claimed as "ours" at `:178`, not as the user leaving.
  - Add a jest test with two same-key hosts inside one fake leaf.

### LOW-B (new): the MEDIUM-1(b) `focusin` guard has no committed real-Obsidian test
- Where: `focusHandoff.ts:87` / `:93-103`.
- Mutation RC (no `addEventListener('focusin', …)`): jest has 1 red; every committed e2e (CHR-F01..F06) stays green. Only reviewer probe RV-P16 shows the regression in real Obsidian. After a real Pin, Tab to Collapse, then an outside edit 300 ms later, focus goes Collapse → **Pin** at 328 ms (head: `<body>`).
- Fix: add a committed e2e (CHR-F07) in RV-P16's shape:
  1. Tab to Pin, press Enter, wait for the write.
  2. Tab once to Collapse.
  3. Run `dse.externalEdit` inside the 1.5 s settle window.
  4. Expect focus not on `chrome.pin`.

### INFO
- INFO-1: the "focus still on the pressed button counts as ours" branch (`:178`) is covered by neither layer. Mutation RE puts r1's unconditional disarm back, and jest plus e2e stay green: the leaf check at `:176` returns first in every tested two-pane case. Mutation RB (no claim-time disarm at all) is also green at both layers; the `focusin` guard now does that job. Neither is a defect, but the branch only matters for same-pane copies, where LOW-A shows it is not enough.
- INFO-2: mutation RD (pipeline always passes `wrote: true`) is caught by jest only. In real Obsidian the `focusin` guard (b) also protects RV-P13, so (a) and (b) overlap as defence in depth.
- INFO-3: the LOW-1 removal reasoning holds:
  - Adoption needs a claim ticket recorded by `host.replaceSource` (`viewRegistry.ts:109-118`, consumed through `registerFrameworkElements.ts:78`).
  - `bindBlockToSidebar` writes through `vault.process` with an anchored body that no ticket can match.
  - r1's ME mutation already showed nothing relied on the claim.
  - `adoptView.ts` is byte-identical to base.
- INFO-4: dse develop has since moved to 054c9c5 (SC-501, harness-only). I did not rebase, as instructed.

## r1 findings: closure
| r1 finding | closed by | evidence |
|---|---|---|
| HIGH-1 two panes | 41f7327 | RV-P07B head: focus stays on pane B's new Pin. RV-P07 (press in A) stays on A. jest "OTHER pane rebuilding first…" and "with focus already free…" red on r1 source, green on head. CHR-F06 red on r1 source, green on head. |
| MEDIUM-1 armed request | f4068c5 | RV-P13 head: Collapse → body (r1: → Pin). RV-P16: Collapse → body. RV-P10 / RV-P15 scc: no write, focus stays. 3 new jest tests red on r1 source. `requestPinToSidebar` true only on a write (registration test). |
| LOW-1 adoptView claim | cfb95d2 (removed) | reasoning verified (INFO-3) |
| LOW-2 F04 / F02 | 3717849 | neutralised hand-off: CHR-F05 red `Expected "chrome.pin" Received "body"`. CHR-F02 now reaches Expand with `dse.tabTo` and goes red at the Collapse assertion. |
| CHANGELOG two-pane | — | the bullet is now true (the two-pane case holds). It is still technically false for LOW-A's double-embed case, which is not worth a CHANGELOG qualifier. |
| follow-up 5 | fdd3bb7 | `e2e/README.md` bullet, accurate |

## Mutation table (throwaway detached worktree at 3717849; jest = chromeFocusHandoff + registration, 70 tests; e2e = CHR-F01..F06 + RV-P02, P07, P07B, P13, P16)
| id | mutation | jest | committed e2e | reviewer probes |
|---|---|---|---|---|
| r1src | r2 tests against r1 source (081ee27 focusHandoff/pipeline/registration/adoptView) | 5 red | CHR-F06 red | — |
| RZ | `isKeyboardClick` → false | 10 red | F01, F02, F04, F05, F06 red | — |
| RA | drop the leaf check (`:176`) | 2 red | CHR-F06 red | P07B: pane B Pin → pane A Pin (twin) at 44 ms |
| RB | drop the claim-time disarm (the r1 twin-pane mutation) | green | green | P07B: focus stays in pane B; P13/P16 → body |
| RC | `focusin` guard off | 1 red | **green** | P16: Collapse → **Pin** at 328 ms (LOW-B) |
| RD | pipeline passes `wrote: true` | 1 red | green | P13 → body (guard masks it, INFO-2) |
| RE | unconditional disarm (r1 behaviour) | green | green | P07B fine (INFO-1) |

## Real-Obsidian probes on head (1.14.4; activeElement polled every 5 ms)
| probe | head result |
|---|---|
| P01 RV keyboard Collapse / Expand | → Expand fv at 10 ms; → Collapse fv at 13 ms |
| P02 real Pin, 3 rebuilds | pin → body 45 → pin 82 → body 195 → pin 211 ms; final copy live, connected, visible. Tab → Collapse; outside edit after the window → body |
| P03 pointer Collapse / Expand / Pin | nothing focused, no ring in the block |
| P04 Live Preview | items [collapse, expand]; both hand-offs fv; editor text unchanged |
| P05 sidebar copy | Collapse → Expand → Collapse, fv |
| P06 two bars | bar 2 Collapse/Expand/Pin stay on bar 2 (new node); bar 1 Pin on bar 1 |
| P07 / P07B two panes | press in A → A's new Pin; press in B → B's new Pin (no body gap) |
| P08 keyboard Collapse, then an outside edit | Expand → body at 234 ms (pre-existing G-S5 behaviour, ruled DROP) |
| P09 Tab order | bar → Collapse → Obsidian header (as r1) |
| P10 second Pin (no write) + blank click + outside edit | no write; blank click → preview view; no steal |
| P11 / P11X | all 19 chrome elements hand off with a ring. (P11X FAIL = the probe note's ds-encounter `_computed` write tripping the e2e integrity check, as in r1; not a product finding) |
| P12 Pin, Shift+Tab out, outside edit | stays on "More options" |
| P13 second Pin, Tab → Collapse, outside edit | → body at 324 ms (fixed) |
| P15 counter / scc Pin | counter: focus on Pin; scc: no write, stays |
| P16 real Pin, Tab → Collapse, outside edit within settle | → body at 321 ms |
| P17A / P17B double embed in one pane | A: final body; B: the twin embed's Pin (LOW-A) |

## Gate summary lines (logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc505-r2-rereview-m4w8/`)
- `g-tsc.log`: rc=0. `g-lint.log`: rc=0.
- `g-jest.log`: `Test Suites: 1 skipped, 243 passed, 243 of 244 total` / `Tests: 1 skipped, 6020 passed, 6021 total`, rc=0.
- `g-e2e.log`: `OBSIDIAN-E2E done: 120/120 ok, 0 failed, 0 known-bug, coverage: 84/84 pairs`, rc=0.
- `g-lc.log`: `OBSIDIAN-LIFECYCLE done: 36/36 ok, 0 failed`, rc=0.
- All five runs completed (each log ends with the gate's own summary line and `rc=`). They were run before the 429 interruption and re-verified afterwards.

## Scope and tree
- The delta touches no `visual-harness/`, `stepper.ts`, `FormModal.ts` or `styles-source.css`. Superproject: the CHANGELOG bullet, kept above SC-493's.
- dse branch `sc505-collapse-pin-focus` is at 3717849 with a clean tree. Superproject 6e7f67d (` M draw-steel-elements`, unbumped as before). The throwaway worktree has been removed (`git worktree list` shows only the branch).
