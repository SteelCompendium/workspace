# SC-605 r2 implementation report (I1)

## Executive summary
- STATUS DONE. dse branch `sc605-lp-quickadd-draft-on-save`, rebased onto origin/develop `dcc53f0f` (SC-582; base moved from `711844f3` mid-round). dse HEAD `54e37fed`.
- dse commits (base..HEAD): feat `46163756` · jest `5500d93b` · e2e `9d652765` · docs `b2042b82` · jest pipeline/wiring `54e37fed`.
- Superproject: `2ab866bc` (one CHANGELOG commit) on workspace origin/main `f108e5e9`; dse pointer left UNSTAGED (` M draw-steel-elements`).
- Gates on `dcc53f0f`+branch: tsc (incl. -p e2e) and lint clean · jest 10814 passed / 2 skipped (268 suites passed, 1 skipped; 10787 + 27) · e2e `313/316 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs` (187 s) · lifecycle 60/60 (21+16+9+4+7+3; walls 184/326/408/298/401/240 s) · styles.css sha256 `5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27`, identical to the 711844f3 build and no `*.css` diff vs `dcc53f0f` -> shots/freeze/parity carry (skipped).
- Same gates on the first base `711844f3`: jest 10808/2 (+24, before my 3 extra tests), e2e 313/316 174/174 (161 s), lifecycle parts 1-2 21/21 (188 s) and 16/16 (337 s) then stopped at the rebase notice.
- Vacuity (measured on 711844f3 src): e2e with src reverted: L09-L13, L15, L17 red (7), L14 and L16 green; L14 red under "no ticket check", L16 red under "take not one-shot". Jest: 16 mutations, each red (1 test each; oneshot 2, ticket 2, validate 5, cached 2).

## Deviations from R1's prototype / diffs
- Src: the prototype applied unchanged; I only rewrote comments (header of `livePreviewStateCarry.ts`, TTL doc, `takeCarriedState` doc, pipeline comment) to cover each required funky-logic point.
- Tests: R1's jest diff applied unchanged (S01-S15, Q19-Q23). Added 3 tests R1 listed in its report but left out of the diff: P01/P02 in `livePreviewStateCarry.test.ts` (a real `ElementPipeline` + real `ReadingModeBlockHost` run takes the carry before `onMount`, only for a view that opts in; a root outside `.cm-content` takes nothing) and the wiring test in `register-framework-elements.test.ts` (extension registered on the registry the wiring returns; `beforeRelease` runs both carries). Jest total +27 over a fresh base.
- e2e spec and fixture unchanged from R1; README row added for `Initiative/twins.md`.
- dse CHANGELOG has no `## Unreleased` heading; the bullet went at the top of `## 7.0.0 (unreleased; previously numbered 6.0.0)`. Stale sentences edited (SC-602 "Not covered" keeps SC-384; SC-589 now "Since SC-605 this holds in Live Preview too."), in both CHANGELOGs. The SC-605 bullet says plainly that a twin / second-pane copy still loses its own draft (SC-620).
- Docs: `.repo-docs/architecture.md` gets a table row for `livePreviewStateCarry.ts` and a paragraph next to the SC-602 note (seam `carryState()` / `receiveCarriedState()`, only the tracker opts in); the SC-602 note's "Not carried ... SC-605" clause removed.
- A first version of the wiring test failed `tsc` (`beforeRelease` takes `(entry, reason)`); fixed and squashed before the gates below.
- The dse CHANGELOG conflicted at the rebase with SC-582's entry (kept both, SC-605 first); the workspace CHANGELOG likewise.
- No off-limits file touched (`ReadingModeBlockHost.ts`, `hoverLinks.ts`, `lineMap.ts`, `obsidian-lifecycle.mjs`, `ConditionsModal.ts`, `initiative/model.ts`); no CSS; no lifecycle scenario.

## Vacuity detail
- e2e on base src (`711844f3`, five modified src files reverted, new module unused): `OBSIDIAN-E2E done: 2/9 ok, 7 failed`; ok = INIT-L14, INIT-L16. Log: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc605-r2-impl/e2e-base.log`.
- Guards: `e2e-M4.log` (ticket check removed -> INIT-L14 FAIL, 0/1), `e2e-M3.log` (take not one-shot -> INIT-L16 FAIL, 0/1).
- Jest mutations (files: livePreviewStateCarry, initiative-matrix, register-framework-elements; 225 tests): scope S09 · livekey S08 · oneshot S01 + P01 · ticket S03, S04 · armempty S06 · cmcapture S02 · cmtake S11 · ttl S12 · setfilter S15 · usedset S04 · validate Q22 x5 · cached Q19, Q20 · emptycarry Q19 · wire-ext (wiring test) · wire-hook (wiring test) · pipe-take P01 · pipe-optin P02. Counts: `jest-mutations.txt` (its failed-names column is empty, a regex slip; names above are from the `jm-M-*.log` files), logs `jm-M-*.log` in the scratch folder. Not re-run after the rebase (the changed upstream files are Conditions-only).
- e2e-only inexpressible (jest-only): pane-scope check and editor-update capture (R1 §1.5).

## Drive-by fixes:
None.

## Follow-ups:
- SC-620 (already filed): other copies' drafts.
- R1 risk 2 (hidden display:none copy takes the carry) and risk 5 (popouts) remain for the r3 reviewer; risk 2 is documented in the module header and architecture.md.
- Lifecycle part 2 wall 326-337 s and part 3 408 s, part 5 401 s are all inside their usual ceilings.

## Artifacts
- Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc605-r2-impl/` (first-base logs at top level: `jest-full-1.log`, `e2e-full.log`, `lifecycle-part1.log`, `lifecycle-part2.log`; rebased-base logs in `rb/`: `tsc.log`, `tsc-e2e.log`, `lint.log`, `jest-full.log`, `e2e-full.log`, `lifecycle-part1..6.log`).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc605-lp-quickadd-draft-on-save` (dse `draw-steel-elements/`).
