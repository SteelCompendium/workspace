# SC-477 implementer report (round 3b rebase onto e8f6a14 supersedes the summaries below; c0e761b results do not count)

**Executive summary (after round 3b, rebase only)**
- Verdict: DONE. No code change; range-diff `e4c5cf6..c692849` vs `e8f6a14..HEAD` shows all 5 dse commits `=`.
- dse head `d152ea4` on `origin/develop` e8f6a14 (SC-465). Superproject head `7d468ed` on `origin/main` 40334fb, pointer at d152ea4.
- Gates on d152ea4: tsc clean (incl. e2e) · lint clean · jest 5769 passed / 1 skipped / 238 of 239 (before and after shots) · lifecycle 32/32 · e2e `OBSIDIAN-E2E done: 104/104 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs` · shots 592, 0 FAIL, no ALLOWLISTED · freeze `OK (280/280)` · parity 0 gaps / 0 undeclared / 24 declared.
- Conflicts: dse none. Superproject: only the `draw-steel-elements` pointer on the first bump commit (CHANGELOG merged cleanly, both bullets kept); second commit applied clean. No package.json/lock change (no `npm ci`).

## Round 3b (rebase onto e8f6a14)
dse range-diff `e4c5cf6..c692849` vs `e8f6a14..HEAD`:
```
1:  a77dd13 = 1:  9d61040 test(SC-477): pin the durable unterminated-fence write to the in-place output (red on base: trailing newline dropped)
2:  97f7473 = 2:  115556f fix(SC-477): a durable write to an unterminated trailing fence keeps the note's trailing newline(s)
3:  910a38b = 3:  649f335 test(SC-477): G-S6u proves real Obsidian keeps the trailing newline on a durable write; changelog
4:  4ab4d8b = 4:  540c2c8 test(SC-477): in-place write must keep the tail too - real Obsidian section range in jest, lifecycle G-S28 (red on base)
5:  c692849 = 5:  d152ea4 fix(SC-477): the in-place write to an unterminated trailing fence also keeps the note's trailing newline(s)
```
Superproject range-diff: `sc477-r3b-range-diff-superproject.txt`. Gate logs: `sc477-r3b-gate-{tsc,tsc-e2e,lint,jest,lc,e2e,shots,freeze,parity}.log` in this folder.

---
# SC-477 implementer report (round 3 rebase supersedes the summaries below)

**Executive summary (after round 3, rebase only)**
- Verdict: DONE. No code change beyond conflict resolution; range-diff shows all 5 dse commits `=` (identical patches).
- dse branch `sc477-unterminated-newline` head `6a4c0a1`, rebased onto `origin/develop` c0e761b (SC-279). Superproject head `719c3ff`, rebased onto `origin/main` 636c122, pointer at 6a4c0a1.
- Gates on 6a4c0a1: tsc clean (incl. e2e) · lint clean · jest 5763 passed / 1 skipped / 238 of 239 (re-run after shots, same) · lifecycle 32/32 · e2e `OBSIDIAN-E2E done: 101/101 ok, 0 failed, 0 known-bug, coverage: 66/66 pairs` · shots 592, 0 FAIL, no ALLOWLISTED · freeze `OK (280/280)` · parity 0 gaps / 0 undeclared / 24 declared.
- Conflicts: dse none. Superproject: see Round 3 section (CHANGELOG hunk kept both bullets; submodule pointer hunks x2).

## Round 3 (rebase)
- dse: `git rebase origin/develop` (c0e761b) applied all 5 commits with no conflicts; package.json/lock unchanged (no `npm ci`). New shas: dc8cec8, b10ae6f, 159c937, dc5c197, 6a4c0a1.
- Superproject: `git rebase origin/main` (636c122). Conflict hunks, in order:
  1. commit "chore: bump draw-steel-elements (SC-477 ...)": `CHANGELOG.md` `## Unreleased` (HEAD held SC-279's roll-controls bullet; mine held the SC-477 bullet) - resolved by keeping both (SC-279 first, then SC-477, blank line between); `draw-steel-elements` pointer - set to the rebased dse head.
  2. commit "chore: bump ... (SC-477 r2 ...)": `draw-steel-elements` pointer only (CHANGELOG merged cleanly, reworded bullet intact) - set to the rebased dse head 6a4c0a1.
- Final superproject pointer: 6a4c0a1. Freeze baseline untouched; freeze reads 280/280 (the 2 roll lines are SC-279's, already in the base).
- range-diff files: `sc477-r3-range-diff-dse.txt` (dse, `e4c5cf6..c692849` vs `c0e761b..HEAD`), `sc477-r3-range-diff-superproject.txt`. dse output:

```
1:  a77dd13 = 1:  dc8cec8 test(SC-477): pin the durable unterminated-fence write to the in-place output (red on base: trailing newline dropped)
2:  97f7473 = 2:  b10ae6f fix(SC-477): a durable write to an unterminated trailing fence keeps the note's trailing newline(s)
3:  910a38b = 3:  159c937 test(SC-477): G-S6u proves real Obsidian keeps the trailing newline on a durable write; changelog
4:  4ab4d8b = 4:  dc5c197 test(SC-477): in-place write must keep the tail too - real Obsidian section range in jest, lifecycle G-S28 (red on base)
5:  c692849 = 5:  6a4c0a1 fix(SC-477): the in-place write to an unterminated trailing fence also keeps the note's trailing newline(s)
```

- Gate logs: `sc477-r3-gate-{tsc,tsc-e2e,lint,jest,lc,e2e,shots,freeze,parity}.log` in this folder.

---
# SC-477 implementer report (fix round 2 supersedes the R1 summary below)

**Executive summary (after fix round 2)**
- Verdict: DONE. Both the in-place and the durable write to an unterminated trailing fence now keep the note's trailing newline(s)/blank/whitespace-only lines, byte-identical (owner-approved in-place clamp; review r1 HIGH-1/MEDIUM-1/MEDIUM-2/LOW-1/LOW-2 all folded).
- dse branch `sc477-unterminated-newline` head `c692849`, rebased onto `origin/develop` e4c5cf6 (SC-433). Superproject head `376eb7a`, rebased onto `origin/main` 07f6e22, pointer at c692849.
- Gates on c692849: tsc clean (incl. e2e) · lint clean · jest 5737 passed / 1 skipped / 238 of 239 suites (base 5711 + 26 new) · lifecycle 32/32 (G-S28 new) · e2e `OBSIDIAN-E2E done: 101/101 ok, 0 failed, 0 known-bug, coverage: 66/66 pairs` · shots 580, 0 FAIL, no ALLOWLISTED · freeze `OK (280/280)` · parity 0 gaps / 0 undeclared / 24 declared.
- New in-place tests and G-S28 were red on e4c5cf6+durable-fix (logs below), green after the clamp.

## Fix round 2
- **Rebase.** dse rebased onto e4c5cf6 with no conflicts (package.json/lock unchanged, no `npm ci`). Superproject rebased onto 07f6e22; the only conflict was the submodule pointer, resolved to the dse head and re-pointed at c692849.
- **HIGH-1 fix** (`c692849`): in `resolveWriteTarget`, when `unterminatedAtEof` the returned range is clamped to the last non-blank line via a shared `lastNonBlankLine(lines, from, to)` helper, also used by `locateUnterminatedTrailingFence`. Closed-fence path unchanged.
- **MEDIUM-1** (`4ab4d8b`): the SC-343 in-place tests (trailing newline, blank lines, CRLF unterminated) and the SC-477 `writeOnce` helper now give the section `lineEnd = splitLines(live).length - 1`; a new table test also runs every shape with the short range (`lineEnd: 4`) as the tolerance case (8 new in-place tests).
- **MEDIUM-2** (`4ab4d8b`): lifecycle G-S28 added (in place, stay on the note); G-S6u and G-S28 share `unterminatedTailCase` over three fixtures: `\n`, `\n\n\n` (two blank lines) and CRLF. The R1 follow-up "multi-blank/whitespace/CRLF jest-only" is closed for LF/blank/CRLF; whitespace-only tails remain jest-only.
- **LOW-1**: both CHANGELOG bullets reworded (both saves keep the tail). **LOW-2**: both code comments now state the measured Obsidian 1.14.4 behaviour (lineEnd = the note's last line, tail included).
- **Red proof** (against e4c5cf6 + the R1 durable fix, before the clamp): jest 17 failed / 130 passed in the two host test files (`sc477-r2-red-on-e4c5cf6-jest.log`: 7 in-place table rows, 7 parity rows, 3 re-pinned SC-343 in-place tests); lifecycle `G-S28 FAIL: Lifecycle/unterminated.md: trailing newline(s) not kept … got "alue: 0\nname: Health\n```"` while G-S6u stayed ok (`sc477-r2-red-on-e4c5cf6-lifecycle.log`). Green after `c692849`: those two files 147/147; lifecycle G-S6u and G-S28 ok.
- Commits: dse `4ab4d8b` (tests, red), `c692849` (clamp, comments, changelogs); superproject `376eb7a`.
- Drive-by fixes: none. Follow-ups: whitespace-only tails (`\n  \n`, `\n\t`) are covered in jest only; real Obsidian covers LF, two blank lines, CRLF.
- Gate logs (this round): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc477-unterminated-newline/sc477-r2-gate-{tsc,tsc-e2e,lint,jest,lc,e2e,shots,freeze,parity}.log`.

---
# R1 report (historical; its in-place premise was superseded by review r1)

# SC-477 implementer report

**Executive summary**
- Verdict: DONE. Durable (relocate-by-body) write to an unterminated trailing fence now writes byte-identical output to the in-place path; the note's trailing newline(s)/blank/whitespace-only lines survive after the new close fence.
- dse branch `sc477-unterminated-newline` head `53b11ac` (base `develop` 424f47b, unmoved on fetch); superproject head `2070c88`.
- Gates: tsc clean (incl. e2e) · lint clean · jest 5721 passed / 1 skipped / 238 of 239 suites (after shots; base 5703 + 18 new) · lifecycle 31/31 · e2e `96/99 ok, 0 failed, 3 known-bug, coverage: 66/66 pairs` · shots 580 PNG, 0 FAIL, no ALLOWLISTED · freeze `OK (280/280)` · parity 0 gaps / 0 undeclared / 24 declared.
- New tests red on base (18 failed on base incl. 2 re-pinned SC-343 tests), green after the fix. G-S6u red on base in real Obsidian, green after.
- No in-place behaviour changed; the in-place path did not drop bytes in any tested shape.

## Root cause
`draw-steel-elements/src/framework/host/ReadingModeBlockHost.ts` `locateUnterminatedTrailingFence` (~line 136) set `lineEnd: lines.length - 1`. When the note ends `\n`, the last "line" is an empty string, so the replaced range [lineStart, lineEnd] included the trailing blank lines. `replaceFenceBlock` (fenceLine.ts:91) gives the new close fence the terminator of the line at `lineEnd` (none at EOF) and drops the rest of the range, so the note's trailing newline(s)/blank lines were deleted. The in-place path uses Obsidian's section range (ends at the last block line; `unterminatedAtEof` tolerates blanks below it), so the same bytes survived there.

## Fix
`locateUnterminatedTrailingFence` now sets `lineEnd` to the last non-blank line (`trim() === ''` is blank, same notion as the in-place `unterminatedAtEof`), floored at the fence-open line for an empty body. `locateByBody` body comparison is unchanged in effect (normalizeBody already trimmed trailing whitespace). Doc comment updated. `resolveWriteTarget` and `replaceFenceBlock` untouched.

## Before / after (durable path, note body `…current_value: 1`, new body `…current_value: 2`)
| note tail | base durable | after durable = in-place |
|---|---|---|
| (none) | `…\n```` | same |
| `\n` | `…\n```` (newline lost) | `…\n```\n` |
| `\n\n\n` | `…\n```` (all lost) | `…\n```\n\n\n` |
| `\n  \n` | lost | kept |
| `\n\t` | lost | kept |
| `\n\n  \n\t\n` | lost | kept |
| CRLF `\r\n` | lost | `\r\n` kept, all-CRLF |
| CRLF `\r\n\r\n` | lost | kept |

## Tests (`test/dom/framework/reading-mode-host-durable.test.ts`)
- Re-pinned the two SC-343 navigate-away tests (trailing newline; trailing blank lines) to the in-place outputs.
- New nested describe "SC-477": table of 8 shapes x { durable output pinned to whole-note bytes (8), durable === in-place === expected (8) } + CRLF all-CRLF test + integrity test (text above survives, new body lands, exactly one close fence, tail kept, no Notice) = 18 new tests; shape "no trailing newline" is the unchanged-behaviour check (passes on base).
- Red on base: commit `fb927a8` (tests only) -> `sc477-red-on-base.log`: 18 failed / 121 passed in the two touched host test files (16 new + 2 re-pinned). Green after `dca48c7`: 139/139.
- `reading-mode-host-spaced-fence.test.ts` unterminated cases (no trailing newline) unchanged and green.

## Lifecycle
G-S6u (`visual-harness/obsidian-lifecycle.mjs`) now also asserts the note ends exactly one `\n` after the close fence. Base: `OBSIDIAN-LIFECYCLE G-S6u FAIL: trailing newline was not kept` (`sc477-lifecycle-G-S6u-red-on-base.log`, run with src reverted to the tests commit). After fix: `G-S6u ok (… trailing newline kept)`, 31/31.

## Commits
dse: `fb927a8` tests (red), `dca48c7` fix, `53b11ac` lifecycle + dse CHANGELOG. Superproject: `2070c88` (CHANGELOG bullet + submodule pointer).

Drive-by fixes: none.

Follow-ups:
- The lifecycle fixture only covers a single trailing `\n` (real Obsidian); multi-blank-line and CRLF shapes are jest-only (real Obsidian's section range for those shapes was not measured).
- `npm run tsc` already includes `tsc -p e2e`; the separate `tsc -p e2e` run in the brief is redundant.

## Gate logs
All under /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc477-unterminated-newline/: sc477-gate-tsc.log, sc477-gate-tsc-e2e.log, sc477-gate-lint.log, sc477-gate-jest.log (post-shots), sc477-gate-lc.log, sc477-gate-e2e.log, sc477-gate-shots.log, sc477-gate-freeze.log, sc477-gate-parity.log, sc477-red-on-base.log, sc477-lifecycle-G-S6u-red-on-base.log.
