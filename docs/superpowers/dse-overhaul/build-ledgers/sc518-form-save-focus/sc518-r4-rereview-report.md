# SC-518 r4: scoped re-review of the r3 fix round (reviewer C1)

## Executive summary
- Verdict: **LAND-READY**. Reviewed dse `9be397e` on base `71437da` (r3 delta `ace522b..9be397e`). Superproject CHANGELOG `259ff49`.
- Range-diff: r1 `958932e 88ced3f 6386a8f` match `4e8d1a4 49c7ccf ace522b` (`=`, `=`, `!` context lines only, from the G-S42 neighbourhood in the harness).
- All four r2 findings are fixed. Real-Obsidian probes on 9be397e:
  - MEDIUM-1: editing the upper twin puts focus in the edited card (index 0), with the ring.
  - LOW-1: a mouse open with focus on `<body>` stays `<body>` and the panel hides (`none/0`), for both Save and Cancel. This now matches pre-SC-509 `a0365a4` exactly.
- Jest mutations: M6 (LOW-3), M9 (LOW-2), MA (no stale-opener clause), MB (no hadFocus gate) and MD (hadFocus always true) are each caught. MC (drop `!root.contains`) survives; that term is already covered by an earlier check (INFO-2).
- Keyboard opens still restore focus with the ring: Reading (montage, stamina), sidebar, Live Preview (stamina, montage), hero Reading and Live Preview, the pending-write path in Reading view and the sidebar. One-shot behaviour unchanged.
- SC-479 scroll: my tall-note probe gives scrollTop 1594 → 1594, card top 163.7 → 163.7. G-S50's own tall phase gives 2794 → 2794.
- New findings: 0 HIGH, 0 MEDIUM, 0 LOW, 2 INFO.
- Gates I re-ran on 9be397e:
  - tsc/lint rc 0;
  - jest 6145 passed / 4 skipped pre-shots (the same scratch-location offset of 3 as r2, so it equals the implementer's 6148 / 1);
  - G-S50 ok, including the twin, mouse and tall phases.
- The implementer's lifecycle 20+21 = 41/41, e2e 124/124, shots, freeze and parity logs postdate the 9be397e commit and carry the expected numbers.

## Method
- Scratch worktrees `head` and `mut` at 9be397e under `.../scratchpad/sc518-r2-review-C1/`, removed at the end.
- I re-applied the r2 probe scenarios (R2-READ/TWIN/MOUSE/PEND/HERO/MCLICK) to 9be397e's harness with the same splice and patch scripts, saved as `sc518-r4-probe-harness-spliced.mjs.txt`. I restored the pristine harness before the gates.
- Review-tree `git status --porcelain`: before, plugin clean at 9be397e and superproject ` M draw-steel-elements`; after, the same.

## Per-finding confirmation
| r2 finding | Fix (file:line at 9be397e) | Evidence |
|---|---|---|
| MEDIUM-1 twins | `focusHandoff.ts` `Request.opener` (`:66-68`); `staleOpener` clause in the claim (`:246-249`) | R2-TWIN `edit0`: `focusInRootIndex 0, onOpener true, ring true, onTwin false`; old section still reused (`oldRootIndexNow 1`). `edit1` unchanged. G-S50 twin phase ok. Jest MA → 1 failed (the twin case). |
| LOW-1 mouse | `formOpenerOf` records `hadFocus` (`:105-110`); `armFormFocus` returns when `!hadFocus` (`:119`) | R2-MCLICK `reading_blurred`: `body`, panel `none/0` (r2 HEAD: pencil, `auto/1`; pre509: `body`, `none/0`). `reading_mouseCancel`: `body`, `none/0`. clickedNote and sidebar: back to `.markdown-preview-view`. Live Preview: `.cm-content`. Hero mouse: `body` (r2 HEAD: the button). Jest MB → 1 failed; MD → 2 failed. |
| LOW-2 pending write | jest case `SC-518 r3 LOW-2` | M9 → 1 failed (that case). R2-PEND keyboard Reading and sidebar: new pencil with the ring; card 4; note bytes as in r2. |
| LOW-3 failed write | failed-Save test now changes the body on the same fence line and rebuilds afterwards | M6 → 1 failed (that case). |

## Keyboard paths and one-shot (R2-READ, R2-MOUSE, R2-PEND, R2-HERO on 9be397e)
- Escape, Cancel, no-change Save (0 modify events) and invalid YAML all return to the same pencil with the ring.
- Later redraws do not steal focus: Tab away then outside edit (`<body>`), click on text then outside edit (preview), outside edit 3.2 s later, switching notes, and closing before the redraw (reopened after 0.5 s and after 4 s).
- Live Preview keyboard on montage: pencil with the ring, scroll 0 → 0.
- Hero "Edit definition": Reading and Live Preview keyboard give the new button with the ring.
- Note bytes are unchanged from r2; no Notice, no page error.

## New findings (delta only)
- INFO-1: `visual-harness/obsidian-lifecycle.mjs:84` still says G-S50 makes "40 scenarios in all". After the rebase onto G-S42 there are 41, and line 79 (G-S42) also says 40. This is a comment only.
- INFO-2: the `!root.contains(req.opener)` term of `staleOpener` (`focusHandoff.ts:248`) is effectively redundant. The earlier `doc.activeElement === btn` return (`:240`) already covers an opener inside the claiming root, so mutation MC survives. It is a harmless defensive check; no action needed.
- The rest of the delta is clean:
  - G-S50 twin phase: whole-note, integrity and per-card checks.
  - Mouse phase: asserts `<body>` and that the panel hides.
  - Tall phase: the card is parked at 40–80 % of the pane with scrollTop > 500, and the scroll must not move by more than 1 px.
  - The `mode` refactor of `keyboardSave` keeps the old assertions for 'fresh' and 'sidebar'.
  - The CHANGELOG wording no longer promises any mouse behaviour.
  - Jest: the r3 cases model Obsidian's section reuse, and the failed-write test keeps the same block key.

## Gates (9be397e)
- Mine (scratch worktree):
  - tsc rc 0; lint rc 0;
  - jest pre-shots `Tests: 4 skipped, 6145 passed, 6149 total`, `248 passed, 248 of 249` (offset 3: 2 skips that depend on where the worktree sits, plus 1 shots-cache skip, the same as r2's 6127/4 vs 6130/1);
  - `OBSIDIAN-LIFECYCLE G-S50 ok (… tall note … scrollTop 2794->2794, card top 163.7->163.7; … identical twins (upper edited) … +ring …)`, `done: 1/1`.
- Implementer's logs (all written after the 9be397e commit):
  - jest 6148 / 1 skipped, before and after shots;
  - lifecycle `20/20` + `21/21`;
  - e2e `124/124 ok, 0 failed, 0 known-bug, coverage: 87/87`;
  - shots: host-leak 145/870, modal 228;
  - freeze `280/280`; parity `0 gap(s), 0 undeclared, 24 declared`.
- The full battery was not re-run: the delta touches only focusHandoff, a FormModal comment, tests and the lifecycle harness.

## Follow-ups
- INFO-1 comment fix: optional; can ride along at landing.
- FU4 (unchanged): dse-verify CURRENT needs lifecycle 41 and a G-S50 line at landing.
