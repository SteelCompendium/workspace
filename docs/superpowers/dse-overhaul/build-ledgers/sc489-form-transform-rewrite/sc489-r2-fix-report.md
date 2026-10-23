# SC-489 r2 fix round report (implementer A)

## Executive summary
- STATUS: DONE. dse tip `66f474b` on origin/develop `9f08f06` (unchanged). Superproject tip `21a9557` on origin/main `3c7f392` (rebased). Pointer not bumped, nothing pushed.
- LOW-1: CHANGELOG now says "Save no longer lowercases or trims values you did not edit (`Climb` stays `Climb`, `style: Chips` stays `Chips`)"; dropdown sentence kept.
- LOW-2: new test "the Default (…) label is derived from the normalised copy: style: Alpha names x, not y" (derived def exactly as ruled). Mutant `const absent = { ...this.working };` at FormModal.ts:338 -> RED (`Expected "Default (x)"`, `Received "Default (y)"`; 1 failed / 52 passed). Reverted; `git diff` shows only the intended comment change, `grep "const absent"` shows `{ ...this.checked }`.
- INFO-1: comment at FormModal.ts:210-214 reworded to "...all see the same keys (validation and the preview see the normalised copy)".
- Gates on the final tip: tsc (incl. -p e2e) / lint clean; jest 5859 passed / 1 skipped / 241 of 242 (after shots); lifecycle 34/34; e2e 108/108 ok, 0 failed, 0 known-bug, 69/69; shots 592 rc 0; freeze 280/280; parity 0/0/24.
- No flake this run (initiative-default-keys passed).

## Commits
- dse `66f474b` test(SC-489): pin the Default (…) label to the normalised copy; comment says the same keys (test + comment only; no red commit needed, code already passes)
- superproject `21a9557` docs(changelog): SC-489 wording says what changed (no lowercasing or trimming) (on top of `8131699`)
- Process note: my first superproject commit used `-a` and bumped the submodule pointer by mistake; I reset it and recommitted CHANGELOG only before pushing/reporting (final `21a9557` touches CHANGELOG.md alone).

## Gates (logs in /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc489-r1-impl-a-x7k2qp/)
tsc `r2a-tsc.log`, lint `r2a-lint.log`, jest `r2a-jest.log`, lifecycle `r2a-life.log`, e2e `r2a-e2e.log`, shots `r2a-shots.log` (host-copy pin OK, button host-leak 113/678, modal 10/228, no ALLOWLISTED, pressed toggle parity OK, pipette selected look OK, text scale + text scale once 107256/214, PIN DRIFT warning), freeze `r2a-freeze.log`, parity `r2a-parity.log`. Mutant run: `jest-fm-r2mut.log`; new-test green: `jest-fm-r2a.log` (53/53).

Drive-by fixes: none
Follow-ups: none new
