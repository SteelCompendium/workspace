# SC-505 r4 fix-round brief (implementer A, resumed)

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc505-collapse-pin-focus/decisions.md` (read the r3 re-review entry). Findings in full (file:line, measured scenario, prescribed fix): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc505-collapse-pin-focus/sc505-r3-rereview-report.md` sections LOW-C, LOW-D, LOW-E. Same worktree, branch, scratch folder and section-4 footguns as `sc505-brief-r1-impl.md`. Head at start: dse `ec354f4` on `7046eb0`; superproject `cce808f` on `aa57411`. You never call the tracker.
- First: fetch dse origin. If `origin/develop` moved past `7046eb0`, rebase (and the superproject onto origin/main) and report the range-diff; stop with NEEDS_CONTEXT on any hand-resolved conflict in src/ or test/.

## Task — owner rulings verbatim from the ledger

> - LOW-C (guard treats ANY Pin in the same pane as ours; RV-P19: Pin on bar 1, focus jumped directly to bar 2's Pin, outside edit to bar 2 -> focus to bar 1's Pin at 21 ms; needs a direct focus jump, not Tab/mouse) -> FOLD as prescribed: per-request WeakSet of the pressed button + every button the claim focused; the guard keeps the request only for those. jest test.
> - LOW-D (K2 `:172` `!btn?.isConnected` dead -> simplify to `if (!btn || doc.activeElement === btn) return;`; K9 `:134` no-write drop and K10 `:133` 3 s shorten untested at both layers) -> FOLD: simplify K2; add the two jest tests as prescribed, each red with its branch removed.
> - LOW-E (`focusHandoff.ts:72` trips obsidianmd/prefer-active-doc; came in with r2) -> FOLD: `?? activeDocument`; lint must be silent.

Failing test first (LOW-C test red on ec354f4; K9 and K10 tests red with their branch removed — show it); one commit per finding with its id. Nothing else; SC-511 out of scope.

## Gates — full dse-verify battery, each one blocking foreground call

Expected: tsc clean; lint **silent (0 warnings)**; jest **6048 + r4 new / 1 skipped / 244 of 245**; lifecycle **36/36**; e2e **123/123 ok, 0 failed, 0 known-bug, coverage 84/84** (+ any new); shots **592, 0 FAIL**; freeze **280/280**; parity **0/0/24**. Report each gate's own summary line.

## Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc505-collapse-pin-focus/sc505-r4-fix-report.md`, ≤10-line summary first (shas, per-finding commit, red evidence, every gate line). Inline if the write is blocked. Return raw facts + artifact paths. Cannot message me; NEEDS_CONTEXT to ask.
