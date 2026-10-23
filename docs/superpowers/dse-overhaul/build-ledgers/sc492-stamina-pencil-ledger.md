# SC-492 decisions ledger

Ticket: SC-492 — Stamina bar "Edit" pencil opens the Stamina editor on top of the edit form.
Worktree: /home/scott/code/steelCompendium/worktrees/sc492-stamina-pencil (every submodule on branch `sc492-stamina-pencil`), cut at dse develop `e8f6a14`.
Owner: ticket-owner (Opus 5.5), session be71a0a9-199f-4e14-967b-191935312b05.

## Scott rulings (verbatim, dated)

None yet. The thread had no comments at start (2026-10-22). The ticket body (filed by Scott from the SC-483 review) states:

> **Expected:** the pencil opens only the edit form.

> **Fix direction:** stop the click from reaching the bar for chrome items, or have the bar's handler ignore clicks from inside `.dse-chrome`.

## Dispatcher constraints (2026-10-22, not Scott rulings)

- SC-488 (FormModal) is in flight — stay out of `FormModal.ts`.
- If a lifecycle scenario is added, use id **G-S32**.
- Owner reports land-ready to the dispatcher and stops; the dispatcher lands.

## Owner rulings

- 2026-10-22: pipeline = implementer (r1) -> independent reviewer -> fix rounds -> scoped re-review -> land-ready.
- 2026-10-22: Ticket moved Backlog -> Awaiting.
- 2026-10-22: Dispatcher relay — dse develop moved e8f6a14 -> d152ea4 (SC-477, adds lifecycle G-S28). Land-ready must be on d152ea4 or newer with the superproject rebased onto origin/main. New baselines: jest 5769 / 1 skipped / 238 of 239, lifecycle 32/32, e2e 104/104 0 known-bug 69/69, shots 592, freeze 280/280, parity 0/0/24. Implementer r1 told to rebase; G-S32 stays ours.
- 2026-10-23: Owner + implementer r1 killed by weekly-limit 429 (2026-10-22 ~10:45Z) after commits 35b64b8/7744ee3/1b9c973/01557ba (fix = bar ignores clicks from inside chrome panel; G-S32 added) but before the rebase onto d152ea4. Implementer resumed via SendMessage with rebase + full battery.
- 2026-10-23: Dispatcher relay: shots is red machine-wide (Obsidian auto-updated to 1.15.0; shoot.mjs host pin 1.14.0 reports HOST COPY DRIFTED; PNGs + freeze still OK, the host-leak and text-scale checks don't run). Do NOT patch shoot.mjs or the pin in-branch. The pin-bump ticket lands first; rebase onto it and re-run shots before land-ready. Implementer told.
- 2026-10-23: Implementer r1 DONE at dse `d41d19d` (on d152ea4), superproject `f9d8f23` (on origin/main 00e2f37). Fix: guard in StaminaBarPanel.ts bar click handler ignores targets inside `.dse-chrome`; also fixes the collapse button (that one is NOT behind experimental). G-S32 added. Gates: jest 5774/1/239 of 240, lifecycle 33/33, e2e 104/104 69/69, freeze 280/280, parity 0/0/24; shots plain run = HOST COPY DRIFTED (environmental), green 592/0 FAIL with HOME pointed at a 1.14.4 asar.
- 2026-10-23: Follow-up rulings: (a) bar has no keyboard path -> filed **SC-498** (Backlog, related to SC-492), out of scope here. (b) dse-verify CURRENT + G-S32 row -> landing bookkeeping, mention in land-ready report; no ticket. (c) shots host-pin bump -> dispatcher's pin ticket; no ticket from me. (d) optional e2e for collapse -> dropped, G-S32 already drives collapse in real Obsidian.
- 2026-10-23: r1 independent review dispatched (orchestration:reviewer) on d41d19d.
- 2026-10-23: r1 review LAND-READY on d41d19d: 0 HIGH / 0 MEDIUM / 1 LOW / 6 INFO. Rulings:
  - LOW-1 (lifecycle header says 32 scenarios, file has 33) -> FOLD into fix round 2.
  - INFO-1 (Pin to sidebar also double-opened; fixed but untested) -> FOLD: add a pin row to chromeInsideStaminaBar.test.ts.
  - INFO-2 (Live Preview: the menu panel overhangs the block's top edge so mouse clicks on pencil/collapse land on the CodeMirror line; pre-existing) -> filed **SC-502** (Backlog, related SC-492). OUT OF SCOPE here.
  - INFO-3 (style: sheet never had the bug) -> drop, informational.
  - INFO-4 (closest('.dse-chrome') not limited to bar) -> FOLD: add `bar.contains(c)` check.
  - INFO-5 (permanent cross-element sweep invariant) -> drop: only one element was exposed, it's covered by jest and G-S32, and a cross-element harness is new scope with no failure behind it.
  - INFO-6 (rebase superproject onto origin/main 21455cc; re-run shots after SC-497 pin bump) -> do in fix round 2 (superproject rebase) and the post-SC-497 rebase round.
- 2026-10-23: Fix round 2 -> implementer (author) resumed; scoped re-review of the delta -> r1 reviewer.
- 2026-10-23: Dispatcher relay: SC-497 landed, dse develop d152ea4 -> 907f55c (host pin 1.15.0). Expected on 907f55c: host-copy pin OK (1.15.0; 18 further rules), button host-leak OK (113/678, 20-record boundary), modal host-leak OK (10/228), both text-scale lines, expected OBSIDIAN APP.CSS PIN DRIFT warning with rc 0; jest 5769/1/238 of 239, lifecycle 32/32, e2e 104/104 69/69, freeze 280/280, parity 0/0/24. Fix round 2 widened: rebase onto 907f55c + full battery incl. plain shots.
- 2026-10-23: Dispatcher relay: dse develop 907f55c -> 2c61511 (SC-478, adds lifecycle G-S18). Land-ready must be on 2c61511 or newer, superproject on origin/main. Base: jest 5797/1/239 of 240, lifecycle 33/33 (34/34 with G-S32), e2e 104/104 69/69, shots 592 with text scale once OK (107256 / 214 loads), freeze 280/280, parity 0/0/24. Implementer told to rebase onto 2c61511 instead; LOW-1 count must be recounted (likely 34).
- 2026-10-23: Fix round 2 DONE: dse `04ab9dc` on 2c61511, superproject `76d22fa` on origin/main 2ba04a6. jest 5804/1/240 of 241, lifecycle 34/34, e2e 104/104 69/69, shots 592/0 FAIL plain, freeze 280/280, parity 0/0/24. Scoped re-review dispatched to the r1 reviewer.
- 2026-10-23: Dispatcher relay: dse develop 2c61511 -> 0dff966 (SC-488, FormModal.ts edit-form dropdown defaults). Land-ready must be on 0dff966 or newer, superproject on origin/main. Base: jest 5812/1/239 of 240, lifecycle 33/33 (34/34 with G-S32), e2e 104/104 69/69, shots 592, freeze 280/280, parity 0/0/24. Plan: the re-review finishes on 04ab9dc (the reviewer was asked whether SC-488 interacts with the G-S32 path). Then a rebase round onto 0dff966 runs the full battery, followed by a range-diff check.
- 2026-10-23: Dispatcher relay: dse develop 0dff966 -> 53e1e48 (SC-485, initiative tracker model writes, plus e2e and a fixture). Land-ready must be on 53e1e48 or newer. Base: jest 5840/1/240 of 241 (with branch: 5847, 241 of 242), lifecycle 33/33 (34/34 with G-S32), e2e 108/108 0 known-bug 69/69, shots 592, freeze 280/280, parity 0/0/24. The rebase round targets 53e1e48 or newer.
- 2026-10-23: r2 reviewer killed by session-limit 429 (~15:11Z) mid-probe after the tsc..shots gates; the worktree was found clean at 04ab9dc. Resumed via SendMessage. develop is 53e1e48.
- 2026-10-23: r2 scoped re-review LAND-READY on 04ab9dc: 0 HIGH/MEDIUM/LOW, 2 INFO. INFO-1 (the superproject CHANGELOG conflict with SC-485's bullet; keep both) -> fold into the rebase round. INFO-2 (SC-488/SC-485 don't interact) -> noted. Rebase round r3 -> implementer: rebase onto 53e1e48+ and origin/main 78ab8c2+, then the full battery. The owner checks the range-diff.
- 2026-10-23: Rebase round r3 DONE: dse `9f08f06` on origin/develop 53e1e48, superproject `56d798e` on origin/main 78ab8c2 (the SC-485 + SC-492 CHANGELOG bullets are both kept). Owner checked the range-diff: 2c61511..04ab9dc vs 53e1e48..9f08f06 shows all 7 commits `=`. Gates: jest 5847/1/241 of 242, lifecycle 34/34, e2e 108/108 0 known-bug 69/69, shots 592/0 FAIL plain, freeze 280/280, parity 0/0/24. Land-ready comment posted. LAND-READY reported to the dispatcher.
- Landing bookkeeping for the dispatcher: update the dse-verify CURRENT block (numbers above, plus the G-S32 lifecycle scenario), and preserve this ledger to docs/superpowers/dse-overhaul/build-ledgers/sc492-stamina-pencil/.
