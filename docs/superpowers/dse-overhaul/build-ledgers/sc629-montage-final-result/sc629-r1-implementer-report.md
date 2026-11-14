# SC-629 r1 implementer report

## Executive summary
- Verdict: DONE. origin/develop was still 10c271fe (no rebase).
- dse head `b68d6a0a` (branch sc629-montage-final-result); superproject head `17c6930e` (CHANGELOG commit `9ac501c5`, pointer bump `17c6930e`). Nothing pushed.
- tsc (incl. tsc -p e2e) clean, lint clean (rc 0).
- jest: 13315 passed / 2 skipped / 0 failed (baseline 13307; +8 new), fresh (main.js/styles.css removed first).
- lifecycle 64/64 (21+16+9+4+7+4+3, every part 0 failed, no flake).
- e2e: `OBSIDIAN-E2E done: 586/604 ok, 0 failed, 18 known-bug, coverage: 416/416 pairs` (MONT-W03 now a plain test, ok).
- shots 592; host-leak 163/978; modal host-leak 40/240; capture clip 147; freeze 280/280 (no rebaseline); parity 0 gaps / 0 undeclared / 24 declared.

## Diff summary (dse, commit b68d6a0a)
- `src/elements/montage/model.ts`: `montageOutcome` returns `pending` only when 0/0 AND `!montageTallies(m).complete`; a complete 0/0 falls through to `failure`. Doc comment rewritten (cites Draw Steel Heroes:21336).
- `src/elements/montage/OutcomeBandView.ts`, `styles-source.css`: comment-only (pending is live-only; complete 0/0 is failure). CSS comment only, no rule changed.
- `e2e/specs/montage/wrong-values.e2e.ts`: MONT-W03 `knownBug('SC-629', ...)` -> plain `it`, asserts eyebrow "Final result", word "Total Failure", rule "Total Failure — no Victories awarded."; removed the now-unused `knownBug` import. `e2e/README.md`: fixture-table line for `Montage/no-action.md` updated.
- `test/unit/model/montage-serialize.test.ts`: +5 tests; `montage-tally.test.ts`: +1; `test/dom/elements/montage.test.ts`: +2.
- Superproject: `CHANGELOG.md` one bullet under `## Unreleased` (above the SC-628 bullet).

## Readers of montageOutcome / BAND_WORD / BAND_ICON / data-band, for complete 0/0
- `OutcomeBandView`: `data-band="failure"`, eyebrow "Final result", word "Total Failure", skull crest, rule "Total Failure — no Victories awarded.", stat "N rounds used". Tracks/tails unchanged (still "no … limit set" or the tensed complete copy).
- `montageBandCopy` (via BAND_WORD in model.ts): word "Total Failure"; track tails unchanged.
- `HeadView.bandCrestIcon`: only `total` -> trophy, everything else hourglass; unchanged (complete 0/0 head crest stays hourglass, right eyebrow "Complete"). Same as every other complete failure/partial today.
- CSS `[data-band='failure']` -> `--dse-danger`; `[data-band='pending']` rule is now reachable only for live 0/0. No other reader (the `data-band` in `encounter/view.ts` is the encounter's own difficulty band, unrelated).
- Live (not complete) 0/0 unchanged: "This montage" / "Not started", hourglass, neutral.

## Tests added / changed
- Added unit (`montage-serialize`): live 0/0 stays pending (limits set or unset, last round); out-of-rounds 0/0 -> failure; same with both limits 0; `rounds: 0` at round 1 -> failure (rounds 0 = time already out); out of rounds 1/0 -> failure and 2/0 -> partial; limits set + live 0/0 -> pending.
- Added unit (`montage-tally`): `montageBandCopy` of out-of-rounds 0/0 reads band `failure`, word "Total Failure".
- Added jsdom: complete-0/0 board (data-band, eyebrow, word, skull crest, rule line, "rounds used"); Reopen on that board -> data-band pending, "This montage", "Not started".
- Changed: MONT-W03 e2e (knownBug -> plain, tightened). No existing test pinned the old behaviour (all prior pending tests are live 0/0 and still pass unchanged).

## Drive-by fixes:
- Removed the now-unused `knownBug` import from `wrong-values.e2e.ts` (needed for lint after the marker became a plain test); `e2e/README.md` row for `no-action.md` updated to match.

## Follow-ups:
- `.claude/skills/dse-verify/SKILL.md` "Current expected numbers" / e2e row still say 585/604, 19 known-bug and list SC-629 as a known bug; owner updates at landing (new numbers: 586/604, 18 known-bug, jest 13315).
- HeadView crest is hourglass for every complete non-total montage (including the failure band): a completed Total Failure/Partial montage keeps an hourglass in the card head. Pre-existing, decorative, not part of this ticket; a design call (skull/flag to match the band?).
- `rounds: 0` (hand-authored) now reads Total Failure at round 1 / 0/0 since `current_round (1) > rounds (0)` already made it "complete" with "Complete" in the head; consistent with the book (no round to play) but a Director who types `rounds: 0` gets a finished-looking card. Not changed.

## Evidence
Logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc629-r1-impl/`: `tsc.log`, `tsc-e2e.log`, `lint.log`, `jest2.log` (full jest, 13315 passed), `jest3.log` (serialize file re-run after a title-only edit), `lc1.log`..`lc7.log`, `e2e.log`, `shots.log`, `freeze.log`, `parity.log`. (`jest1.log` is the first run with one failing new test, a wrong crest selector in my own test; fixed before the commit.) lc1 was first run under `timeout 175` and killed by it; re-run clean.

---

# r3 (review nits + rebase)

## Executive summary
- Verdict: DONE. dse head `3e88b3f5` = rebased `74e2a649` (the original fix, was `b68d6a0a`) + the nits fixed in the same history (the nits commit was amended once for comment wrapping, before any gate ran). Based on dse develop `09c879f2`.
- Superproject head `fe42d4f8` = `ff5ad298` (CHANGELOG bullet; both SC-629 and SC-642 bullets kept under `## Unreleased`, SC-629 first) + `fe42d4f8` (one `chore: bump draw-steel-elements to 3e88b3f5` commit). Based on origin/main `7219b96d`. The old `17c6930e` bump was dropped. No pushes, no tags, no trailers. `package.json`/lock unchanged, so no `npm ci`.
- tsc (incl. `tsc -p e2e`) clean, lint clean. jest 13326 passed / 1 skipped / 0 failed (WITH the shots cache; the fresh-equivalent is 13325 / 2).
- lifecycle 64/64 (21+16+9+4+7+4+3, 0 failed). e2e `OBSIDIAN-E2E done: 592/608 ok, 0 failed, 16 known-bug, coverage: 416/416 pairs`.
- shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147; freeze 280/280; parity 0 / 0 / 24.

## Changes
- LOW-1 `src/elements/montage/model.ts` doc comment: dropped "(or whose limits were hit)"; now says a limit cannot end a 0/0 montage (a positive limit needs a tally, 0 means unset).
- LOW-2 `test/dom/elements/montage.test.ts` Reopen test: now asserts `data-band` is `failure` before the click.
- Delta vs `09c879f2` (8 files, +95/-19) is the r1 diff plus those two edits only.

## Drive-by fixes:
none.

## Follow-ups:
none new (SC-658 and the rest untouched).

## Evidence
Logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc629-r1-impl/`: `r3-tsc.log`, `r3-tsc-e2e.log`, `r3-lint.log`, `r3-jest2.log`, `r3-lc1.log`..`r3-lc7.log`, `r3-e2e.log`, `r3-shots.log`, `r3-freeze.log`, `r3-parity.log`, `changelog-r3.patch`.
