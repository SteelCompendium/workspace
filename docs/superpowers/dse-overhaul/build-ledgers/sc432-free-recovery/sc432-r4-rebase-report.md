# SC-432 r4 rebase report (final)

## Executive summary
- Verdict: DONE. Full battery run ONCE on the final dse base; every log below was produced after the final dse rebase.
- dse: rebased onto origin/develop `8d075db` (SC-422); head `95981f1` (4 commits: `ce7d614` feat, `b31356d` e2e, `b8f93e9` docs, `95981f1` r2 fix). No conflicts in dse across all rebases (71ac43a -> bc4a0c5 -> 772c3cd -> 8d075db); the SC-466 `stamina-bar/model.ts` touch-point needed no assertion changes.
- Superproject: rebased onto origin/main `060c9de` (it moved 4fe13d0 -> 8f914ec -> c18d561 -> b4d65c3 -> 060c9de during the round); CHANGELOG commit `606eee3`, SC-432 bullet first under `## Unreleased`. One conflict: CHANGELOG.md `## Unreleased` on the intermediate base 4fe13d0 (upstream added bullets at the same spot), resolved by keeping both, ours first; later rebases clean. dse pointer not bumped (` M draw-steel-elements`). The last two superproject rebases (onto b4d65c3 and 060c9de) were docs/handoff-only upstream; dse base unchanged, so no re-gate.
- No package.json / package-lock change: no `npm ci`.
- Gates (all on dse 95981f1 / develop 8d075db): tsc 0 · lint 0 · jest 5582 passed / 1 skipped / 234 of 235 suites · lifecycle 31/31 · e2e `95/98 ok, 0 failed, 3 known-bug, coverage: 66/66 pairs`, run id 20261021-223302-c4f6 · shots 580 with `text scale OK (1626 comparisons …)`, `text scale once OK (104184 comparisons over 208 loads …)`, `pressed toggle parity OK` · freeze 280/280 · parity 0 gap(s) / 0 undeclared / 24 declared.
- Lifecycle note: the first lifecycle attempt in the final-base battery exited rc 2 (`environment: MutationObserver.observe parameter 1 is not of type 'Node'`, page-eval race while the host was under load ~21); the immediate re-run was green 31/31. Failing log kept at sc432-r4-impl-scripts/sc432-r4-lifecycle-attempt1-rc2.log.
- All numbers match the expected (jest ~5582, lifecycle 31, e2e 3 known-bug / ~66, shots 580, freeze 280, parity 0/0/24).
