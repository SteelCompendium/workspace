# SC-481 r7 — scoped re-review: rebase onto 34f46cf + the two r5 test pins

You (R3) last reviewed `2c5887f` on `4deb8cf` (LAND-READY, LOW 2). The implementer rebased onto dse develop `34f46cf` (SC-525: `src/framework/view.ts` adds `ElementView.isUnloaded()`; `src/elements/shared/RefUnwrapView.ts` in-flight reference guard keyed by owning view) and added test-only pins for your r5 LOW-1 and LOW-2. Final text goes to the ticket-owner. **Workers never call the tracker.**

## Context
- Ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc481-twin-block-vanish/decisions.md` (2026-11-01 entries).
- Rebase brief `sc481-brief-r6-rebase.md`, report `sc481-r6-rebase-report.md`; your `sc481-r5-rereview-report.md`.
- Worktree `/home/scott/code/steelCompendium/worktrees/sc481-twin-block-vanish`, plugin `458abe3` on `34f46cf`, superproject `6b2f6a28` (on origin/main 8174d816). Do not commit; leave the tree as found (superproject ` M draw-steel-elements` is expected).

## Task
1. `git range-diff 4deb8cf..2c5887f 34f46cf..458abe3`: the pre-existing commits must be equivalent; only the new test commit(s) differ.
2. Confirm the new tests: red under your mutants `ord` and `vac`, green on HEAD. Note: for LOW-2 the implementer CHANGED the existing r4 callout/quote "UPPER one clicked" fixtures to draw each block inside a `div.callout` / `blockquote` element — check that change models real Obsidian and does not weaken anything those cases pinned before.
3. SC-525 interaction: read SC-525's diff (`git -C <plugin> diff 4deb8cf 34f46cf -- src/`) and judge whether a view released by `reconcile` (`reused-by-twin`) or vacated by `remountVacated` while a reference load is in flight could break (error, stale draw into a released root, guard keyed to the wrong owner). Probe in real Obsidian if a RefUnwrapView-backed block type makes it practical; check the implementer's probe result.
4. Re-run tsc, lint, jest, both lifecycle halves on HEAD; spot-check the implementer's r6 e2e/shots/freeze/parity logs. Expected: tsc/lint clean · jest 6201 / 1 skipped / 249 of 250 · lifecycle 42/42 · e2e 124/124 87/87 · shots 592 0 FAIL 157/942 · freeze 280/280 · parity 0/0/24.
5. Superproject: CHANGELOG commit on current `origin/main`, every other bullet kept, no pointer bump.

## Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc481-twin-block-vanish/sc481-r7-rereview-report.md`, ≤10-line executive summary (LAND-READY / NOT), findings by severity with file:line, logs `sc481-r7-*.log`. Return raw facts + absolute paths.

## Footguns
Same as `sc481-brief-r3-review.md` "Footguns" — all apply; private scratch `sc481-r7-review-<agentId>/`.
