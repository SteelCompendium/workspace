# SC-482 r4 report (MEDIUM-2 fix, rebase onto ea56712, full battery)

## Executive summary

- STATUS: DONE. Plugin head `5e9a852` (13 commits) on origin/develop `ea56712` (SC-356; was 54f8f88 when I started, rebased once). Superproject head `0b2f4f2` on origin/main `e5f329a` (CHANGELOG only; the plugin pointer is unstaged for landing).
- Hand-resolved conflict: one, superproject `CHANGELOG.md` `## Unreleased` (SC-482 bullet vs SC-356's chip bullet; SC-432 and SC-483 bullets also present). Kept all, no markers (grep 0). The 13 plugin commits rebased with no conflicts.
- MEDIUM-2 fixed: when a body is exactly `{}`, the `prefs:` and collapse-key wrappers drop it and `trimEnd()`, so the block no longer gets `prefs:\n  x: y\n{}` (invalid YAML).
- Red-first commit `3435773` (3 failed on the base); fix commit `5e9a852` (`src/framework/prefOverrides.ts` + `src/framework/chrome/collapsedKey.ts`).
- Gates on the ea56712-based head, one run each (`l-*`): tsc (+e2e) clean; lint clean; jest 5693 passed / 1 skipped / 237 of 238 suites (before and after shots; = 5607 base + 81 branch + 5 r4); lifecycle 31/31 (port 9343); e2e `95/98 ok, 0 failed, 3 known-bug, coverage: 66/66 pairs`, run `20261022-040210-c751`; shots 580, 0 FAIL, `text scale OK (1626 ...)`, `text scale once OK (104184 ...)`, `modal button host-leak OK (10 modal scenarios ... = 228 comparisons ...)`; freeze `freeze OK (280/280 ...)`; parity 0 gaps / 0 undeclared / 24 declared.
- All gates on 54f8f88 (the `k-*` logs) are superseded; the `l-*` logs are the evidence of record.

## The fix

- New exported `emitAhead(head, body)` in `src/framework/prefOverrides.ts`: `body === '{}' ? head.trimEnd() : head + body`. Used by both `withPrefOverrides` branches (plain and passthrough) and by `withCollapseKeys` (`src/framework/chrome/collapsedKey.ts`, which now imports it). Anything other than exactly `{}` is concatenated byte-for-byte as before.
- Wrapper stacking works either way: whichever wrapper is innermost gets `{}`, drops it, and the outer one then prepends to a non-`{}` body.
- No edit to `FormModal.ts` (it uses `withPrefOverrides` and gets the fix for free), `src/framework/host/`, initiative or hero.

## Tests (`test/dom/elements/wrapperDefaultKeys.test.ts`, 5 new; real pipeline + ReadingModeBlockHost; then a re-mount with the error card as the failure signal)

1. counter `prefs:\n  sbDensity: compact\ntitle: Deaths`, + then -: `current_value: 1` appears after the prefs lines, then the body is exactly the prefs lines and the block re-renders. (red)
2. montage with only a `prefs:` map, End round then Back: `prefs…\ncurrent_round: 2`, then back to just the prefs lines, re-renders. (red)
3. montage `collapsed: false` alone, End round then Back: body `collapsed: false`. (red)
4. Confirmation: a block with neither `prefs:` nor a collapse key still returns to `{}` (MEDIUM-1 unchanged). (green throughout)
5. Confirmation: a fully-authored counter with a `prefs:` map writes the same bytes as before (prefs lines, then the old body). (green throughout)

## Gate logs

`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc482-r1-impl-a23f8c687d4289a3e/`: `l-tsc`, `l-lint`, `l-jest-pre`, `l-life`, `l-e2e`, `l-shots`, `l-freeze`, `l-jest-post`, `l-parity` (each `.log` + `.rc`, all rc 0). Earlier this round: `k-red` (3 failed), `k-green`, and `k-*` full-gate logs on 54f8f88 (discarded).

Shots outlasts the Bash tool's 600 s limit, so the tool moved it to the background; it was a single run and its log (rc 0, lines above) is the evidence.

## Drive-by fixes

None.

## Follow-ups

None new (SC-493, the empty raw textarea in the block edit form, is out of scope per the ruling).
