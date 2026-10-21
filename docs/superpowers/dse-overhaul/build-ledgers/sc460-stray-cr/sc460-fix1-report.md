# SC-460 fix round 1 report

**Executive summary**
- STATUS DONE. Rebased onto `origin/develop` = `ba20072`; head `84636a9`. Commits: `6863bd9` (tests, failing first) `3aae5b2` (MEDIUM-1 fix) `37a0ba6` (G-S12 CR-only) `84636a9` (stub typing). Earlier commits rewritten by the rebase: `4b85e2d d822c7d 3605831 7f7e3d4`. Not pushed, no tag.
- MEDIUM-1: `Eol` now `'\r\n' | '\n' | '\r'`; `detectEol` returns `'\r'` for a note whose only breaks are lone CRs (a stray CR in an LF/CRLF note still casts no vote); `toEol` re-terminates with the given ending. A CR-only note stays CR-only on Reading view, Live Preview, the sidebar stamp/write and the encounter append.
- MEDIUM-2: the reviewer's 5 stale-section cases are in `reading-mode-host-durable.test.ts`; each of the 3 reverts (`:80`, `:636`, `:215`) now fails >=1 test (below).
- LOW-1: an encounter hand-off test; reverting `encounter/view.ts:496` to `split('\n')` fails it.
- Gates on head: tsc (incl. -p e2e) + lint clean · jest **5329 passed / 1 skipped / 230 of 231** (base 5260; +69 over base: ~+50 round-1 and +19 this round) · lifecycle **28/28** · e2e `83/87 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs` · shots 572 / 0 FAIL / `pressed toggle parity OK (96 …)` · freeze `276/276` · parity 0 gap / 0 undeclared / 24 declared.
- FAIL-first: 11 genuine CR-only tests failed before the fix (lineEnding 6, sidebarBlockHost 1, host 2, registration 1, encounter 1). G-S12 (with CR-only) FAILS on the pre-fix bundle ("a CR-only note picked up an LF") and passes on head.

## Changes
- `src/framework/host/lineEnding.ts`: `Eol` widened; `detectEol`: `if (crlf === 0 && lf === 0) return text.includes('\r') ? '\r' : '\n'` (the reviewer's rule, exactly "only lone-CR breaks -> CR"); `toEol` uses `eol` as the replacement; comments updated. `fenceLine.ts` unchanged (its `stripCr(newSource)` branch and close-terminator rule already work for `'\r'`). `SC-453` test row `lineEnding.test.ts:29` rewritten to expect `'\r'`.
- Tests added (+19 jest): lineEnding (detectEol rows x4, toEol CR, replaceFenceBlock/Body CR-only x4), host (CR-only write, identical-content byte no-op), sidebar host (CR-only write), registration (CR-only stamp), encounter hand-off (CR-only append; line-hint LOW-1), 5 stale-section cases. Lifecycle G-S12 extended with `Lifecycle/straycr-cronly.md`: Reading view click, Live Preview click, sidebar pin + panel write; asserts no `\n` anywhere and outside text identical.

## FAIL-first
`logs/sc460-fix1/failfirst.log` + `failfirst-medium1-low1.json`: 13 failed before the fix = 11 CR-only tests + 2 of my own mis-adapted expected values in the stale cases (argument order of the `CTR` helper; fixed in the same commit, then `stale-head.log`: only the 2 CR-only host tests failed, as expected before the src fix). The LOW-1 line-hint test and the 5 stale cases are guards on head (pass), proven by mutation below.

## Mutation kills (`logs/sc460-fix1/mutation-summary.txt`, runner `sc460-fix1-mutate.sh`, tree restored after each)
| Mutant | Result |
|---|---|
| M2 `parseOpenFence` -> `text.split('\n')` (`:80`) | 1 failed: stale case "lone CRs inside the bodies and on fence lines, three blocks" |
| M3 `resolveWriteTarget` lines -> `content.split('\n')` (`:636`) | 1 failed: stale case "mixed terminators, three blocks, the last one written" |
| M5 `locateInSection` lines -> `content.split('\n')` (`:215`) | 2 failed: "CRLF note, lone CRs above both blocks" and "one line inserted" |
| M17 `encounter/view.ts:496` -> `trimmed.split('\n').length + 1` | 1 failed: "the appended tracker is handed over at its Obsidian-numbered fence line" |
| M18 `detectEol` without the CR-only rule | 10 failed (all the CR-only tests) |

## Gates (head 84636a9, logs `logs/sc460-fix1/final/`)
tsc rc 0, lint rc 0, `jest.log` 5329 passed / 1 skipped / 230 of 231, `lifecycle.log` 28/28 ok 0 failed, `e2e.log` 83/87 ok 0 failed 4 known-bug 57/57 pairs, `shots.log` 572 / 0 FAIL / pressed toggle parity OK (96), `freeze.log` 276/276, `parity.log` 0 gap(s), 0 undeclared, 24 declared.

Out of scope, untouched: SC-471 (`aliasAtLine`). Drive-by fixes: none. Follow-ups: none new (the round-1 "pure-CR notes get LF" follow-up is now closed by MEDIUM-1; remove it from the list).
