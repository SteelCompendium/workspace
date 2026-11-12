# SC-610 r3 fix report

## Executive summary
- Status DONE. LOW-1, LOW-2, INFO-1, INFO-3 folded as ruled; INFO-2 untouched. Rebased onto dse develop `c6077860` with no conflicts.
- Plugin head `3ad68185`; commits on `c6077860`: `474ab25f` (r1 tests), `4eff6128` (r1 fix), `2b2e5009` (r3 tests, red), `3ad68185` (r3 fix). Superproject worktree head `f18fad5a` (CHANGELOG owner text; the submodule pointer is unstaged).
- tsc, lint clean. jest 10677 passed / 1 skipped, 265 of 266 suites (a shots cache from r1 was present, so the fresh form is 10676 / 2 = 10624 + 40 + 12); after this shots run the same 10677 / 1.
- lifecycle 59/59 (21 + 16 + 9 + 4 + 7 + 2, part 6 `--only=G-S92,G-S96`). e2e `278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`.
- shots 592; host-leak 163 kinds / 978; modal 39 / 234; capture clip 147. freeze 280/280, 0 FAILED. parity 0 gaps / 0 undeclared / 24 declared.

## Findings
- LOW-1 (non-list `participants`): `sanitizeParticipants` keeps a non-list value raw (warns once) and `serialize` writes it back as typed; `montageRoster` returns `[]` for it; `addMontageHero` wraps it as the first item (`[raw, {name, skills_used: []}]`; a typed `{name: Kira}` becomes a real hero). Tests (string / mapping / number, each x2): "no heroes on the board, and an unrelated write gives it back as typed" (add round, set limits, reset) and "add a hero wraps it as the first item of the list". Red before the fix (6 of 6), green after.
- LOW-2 (all-null items): `isEmptyItem` now treats a list of only nulls and a mapping of only nulls (`- name:`, `- name: ~`, `- {name: }`, `- skills_used:`, `- [~]`) as empty, dropped on write, so no `null` is written. Tests: one per shape ("dropped on a write, and no `null` is written", serialize contains no `null`), red before (5 of 5). Guard test: `0`, `false`, `" "`, `{nmae: 0}`, `[~, 1]` are never dropped (passes before and after, pins the rule).
- INFO-1: `participants?: unknown` (not `unknown[]`, because a non-list value is now kept raw). A `.name` read on it does not compile. Confined to `src/elements/montage/model.ts` and `test/unit/model/montage-tally.test.ts` (about 25 existing reads of `m.participants![i]` there became `montageRoster(m)[i]`); nothing outside the montage dir changed, tsc clean.
- INFO-3: CHANGELOG bullet replaced with the owner's exact text.
- Red-before proof: the 12 new tests were run against the pre-fix `model.ts` (stashed): 11 failed, 95 passed in the file (log `r3-red.log`). The one passing new test is the non-null guard.

## Rebase
`git rebase c6077860`: clean, no conflicts in `src/elements/montage/` (develop's package.json / package-lock / montage dir unchanged since 7866426e, so the `node_modules` symlink is still valid).

## Logs
Dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc610-r1-impl/`: `r3-red.log`, `r3/tsc.log`, `r3/lint.log`, `r3/jest-full.log`, `r3/lc1.log` .. `r3/lc6.log`, `r3/e2e.log`, `r3/shots.log`, `r3/freeze.log`, `r3/jest-postshots.log`, `r3/parity.log`.

Drive-by fixes: none.
Follow-ups: none new.
