# SC-688 independent review, round 1

Executive summary
- Verdict: APPROVE. Head 4b233886 (branch sc688-suggest-after-colon-no-space, base dse develop 23f3e61b). Findings: 0 CRITICAL, 0 HIGH, 0 MEDIUM, 1 LOW, 4 INFO.
- All three owner rulings hold. (1) `mode:` + accept writes `mode: power-roll`. The list still opens on `mode:`, and matrix row :81 is untouched. (2) An enum accept mid-word replaces the whole non-whitespace run. (3) Key path behaves the same; the SC-678 marker is still `test.failing` and still fails.
- Re-measured: tsc + lint clean (exit 0), jest 14730 passed / 2 skipped (no shots cache), the same as the implementer. Full e2e: `OBSIDIAN-E2E done: 843/852 ok, 0 failed, 9 known-bug, coverage: 486/486 pairs` (run 20261127-042612-4712, 94 specs, 4 shards, 480 s; AUTH-G21/G22 ok; the 9 known-bug: COND-C04, COND-N04, COND-N05, CTR-V01, CTR-V02, CTR-Q01, CTR-N01, SET-L02, SET-L03 -- no AUTH id).
- styles.css: my own git-archive builds of 23f3e61b and 4b233886 are both sha256 a4dfc387...c83423d, matching the worktree build. Shots, freeze and parity may CARRY.
- Probes: 25 jsdom probe tests, all pass at head. Against base 23f3e61b source, 15 of them fail, and so do 7 of the implementer's 8 new tests (22 in all), so the tests are not vacuous. 7 real-Obsidian probes (AUTH-ZR01..ZR07) all pass, plus AUTH-G10..G22 (11 ids) green.
- Obsidian 1.14.4 internals (app.js): `EditorSuggest.trigger` builds `context` from onTrigger's return value. The fix widens `end` only inside `selectSuggestion`, so the query, the filter and the popover position do not change.
- LOW: with the cursor right after the colon and an old value behind a space (`mode:| test`), the accept gives `mode: flat test`. Base gave `mode:flat test`. This bug already existed on base and is outside the ruling's wording.

## Scope reviewed

`git -C <plugin> diff 23f3e61b..4b233886`: src/authoring/schemaSuggest.ts (+20/-6, only in `selectSuggestion`), test/dom/authoring/schemaSuggestMatrix.test.ts, test/dom/authoring/authoringKnownBugs.test.ts, e2e/specs/authoring/gate-on.e2e.ts, CHANGELOG.md.

Key branch: when `this.mode?.kind !== 'enum'`, `text === value` and `end === this.context.end`. `setCursor(start.ch + text.length)` is the old `start.ch + value.length`, so key behaviour does not change. Probe "key accept mid-word still doubles" confirms `max|_stamina: 5` + `max_stamina` -> `max_stamina_stamina: 5`, the same as base, and the SC-678 `test.failing` (authoringKnownBugs.test.ts:165) passes as an expected failure.

## Findings

### LOW-1: cursor right after the colon with an old value behind whitespace
- Where: src/authoring/schemaSuggest.ts:138-141.
- Scenario: the line is `mode: test` and the cursor is placed right after the colon (`mode:| test`). Accepting `flat` gives `mode: flat test`; base gave `mode:flat test`. `mode: | test` gives `mode: flat test`, the same as base. The run of non-whitespace after the cursor is empty, so nothing is replaced, and the YAML value becomes the string `flat test`, which the schema rejects.
- This is not a regression (base was worse: a parse error). It also follows the literal ruling ("the run of non-whitespace characters after the cursor"). It is reported so the owner can decide whether to file it.
- Prescribed fix (optional, owner's call): when `start == end` and the characters after the cursor are whitespace and then a value word, either skip the whitespace and replace that word, or leave it. Otherwise record it as a Backlog follow-up, or accept it. No change is needed for SC-688.

### INFO-1: an extended `end` and Obsidian's EditorSuggest
In Obsidian 1.14.4 app.js (extracted from ~/.cache/dse-e2e-obsidian/obsidian-app/obsidian-1.14.4.asar, around offset 1813214), `trigger(e,t,n)` reads the cursor, calls `onTrigger`, and stores `this.context={editor,file,start,end,query}` from its result. obsidian.d.ts says `start` and `end` are "used to position the popover". The fix does not change the trigger info. `end` is widened in a local variable inside `selectSuggestion` (probe: `onTrigger` returns `{start:6,end:8,query:'op'}` for `mode: op|posed`, and `s.context.end` is still `{1,8}` after the accept). So the query, the filtering (`getSuggestions`), the popover anchor and re-triggering behave as before. Widening `end` in the trigger info instead would have moved the popover anchor and would not have changed the query. The e2e evidence agrees: AUTH-G22 and ZR03 show the list with exactly `['opposed']` mid-word, and the accept replaces the whole word.

### INFO-2: undo grouping
One Ctrl+Z straight after typing `mode:` and pressing Enter takes back both the typing and the accept (the line is empty again). This is CodeMirror's undo group delay, not this diff: with a 1.2 s pause before Enter (AUTH-ZR06), one Ctrl+Z gives back exactly `mode:`. The `replaceRange` + `setCursor` is a single history step.

### INFO-3: what counts as whitespace
`/\s/` stops the run at Unicode whitespace, including NBSP, which YAML treats as part of a plain scalar. In practice this does not matter. No action.

### INFO-4: the dse-verify inventory
The workspace `.claude/skills/dse-verify/SKILL.md` (line 1568 area, a PREVIOUS entry) lists `AUTH-G21` (SC-688) and "SC-688 ×2" among the open markers. That entry is history. The new CURRENT entry at landing should read 9 known-bug, AUTH-G21 a plain test, and +1 e2e id (AUTH-G22). This is owner work, outside the dse diff.

## Probes (all at head 4b233886)

jsdom, against the real `DsSchemaSuggest` and the `CmEditor` double (`zzSc688ReviewProbe.test.ts`, run as a temporary file in the worktree and then deleted). A copy is in scratch. Each row is: doc with `|` as the cursor, accepted value, line 1 after the accept, cursor ch.

| Probe | Result |
|---|---|
| `mode:\|` + power-roll -> `mode: power-roll`, ch 16, 1 write | PASS |
| `mode:po\|` + power-roll -> `mode: power-roll`, ch 16 | PASS |
| `mode: \|` + power-roll -> `mode: power-roll` (no double space) | PASS |
| `mode: po\|` -> `mode: power-roll` | PASS |
| `mode:  \|` + flat -> `mode:  flat` (the spacing is kept) | PASS |
| `mode:\t\|` + flat -> `mode:\tflat` (a tab counts as the separator; no extra space) | PASS |
| `mode: op\|posed` + opposed -> `mode: opposed`, ch 13 | PASS |
| `mode:op\|posed` + opposed -> `mode: opposed`, ch 13 | PASS |
| `mode: op\|p # comment` -> `mode: opposed # comment` | PASS |
| `mode: te\|st  ` -> `mode: test  ` (trailing spaces kept) | PASS |
| `mode: te\|st\tx` -> `mode: test\tx` (stops at the tab) | PASS |
| `mode: \|test`, `mode:\|test` + test -> `mode: test` | PASS |
| `difficulty:\|` + easy, `difficulty:m\|ed` + medium | PASS |
| `mode: te\|st😀x` (surrogate pair) -> `mode: test` | PASS |
| every accepted line parses (js-yaml) as a mapping with the value | PASS |
| end of document with no trailing newline; last line before the closing fence; fence + `after` kept; the next line `difficulty: easy` kept | PASS |
| integrity: frontmatter, prose, `middle:value`, a second identical ds-roll block (both orders) and `tail mode:x` byte-identical | PASS |
| CRLF doc (CodeMirror splits it; getLine has no `\r`) | PASS |
| trigger info is not changed by the accept | PASS |
| key path: mid-word still doubles (SC-678); `mo\|` -> `mode` with no space; an empty line; `mo\| x` -> `mode x` | PASS (unchanged) |
| `mode:\| test` and `mode: \| test` + flat -> `mode: flat test` | recorded (LOW-1) |

Anti-vacuity: the HEAD tests and the probe file were copied into a `git archive 23f3e61b` export and run there: 22 failed / 101 passed. Every new SC-688 test fails on base, and so does every no-space or mid-word probe. The spaced-only guards pass on base, as they should.

Real Obsidian 1.14.4 (`npm run e2e -- --only=...`, temporary spec `e2e/specs/authoring/zz-sc688-review.e2e.ts`, deleted afterwards):
- AUTH-G10, G13-G22 (11): all ok. AUTH-G21 asserts the exact saved text `'```ds-roll\nname: x\nmode: power-roll\n```\n'`, cursor {2,16}, list rows `[power-roll,test,opposed,flat]`. AUTH-G22 asserts the exact saved text `'```ds-roll\nmode: opposed\n```\n'`, cursor {1,13}, the list `['opposed']`.
- ZR01: a click on a row after `mode:` gives `mode: opposed`, cursor 13. ok
- ZR02: `mode:te` + Enter gives `mode: test`, cursor 10. ok
- ZR03: `mode: oppos|ed # c` + Enter gives `mode: opposed # c`. ok
- ZR04: integrity, with the mid-word no-space accept on the last line before the fence, prose above and below and a second ds-roll block: byte-identical. ok
- ZR05: Source mode, `mode:` + Enter gives `mode: power-roll`. ok
- ZR06: undo is one step (see INFO-2). ok, after a pause
- ZR07: Enter, Enter burst after `mode:` gives `mode: power-roll` plus a new line, cursor {2,0}. ok

## Gates measured (reviewer)

- `npm run tsc`: rc 0, clean. `npm run lint`: rc 0. The only output is the ESLintIgnoreWarning, which the base log shows too.
- `npx jest`: rc 0, 315 suites passed / 1 skipped, **14730 passed / 2 skipped** (no shots cache). That is 14724 + 6, the same as the implementer.
- Full `npm run e2e`: `OBSIDIAN-E2E done: 843/852 ok, 0 failed, 9 known-bug, coverage: 486/486 pairs` (run 20261127-042612-4712, 94 specs, 4 shards, 480 s; AUTH-G21/G22 ok; the 9 known-bug: COND-C04, COND-N04, COND-N05, CTR-V01, CTR-V02, CTR-Q01, CTR-N01, SET-L02, SET-L03 -- no AUTH id).
- styles.css sha256: base 23f3e61b export, head 4b233886 export and worktree are all `a4dfc387dba23dfa78e422a2bc1ed882c1a459a89608266e0244cbb02c83423d`.
- Lifecycle: not re-run. The implementer's logs show 64/64 over 7 parts, and the src diff is limited to `selectSuggestion`.
- The implementer's timeline holds: the full e2e (run 20261127-033521) started the same second as commit 4b233886. tsc, lint and jest ran before 370b31e4 and 4b233886, but those two commits are CHANGELOG plus one e2e literal, and my tsc (incl. `-p e2e`) and lint at head are clean.

## Artifacts

Scratch: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc688-review-r1/
- zzSc688ReviewProbe.test.ts (jsdom probes), zz-sc688-review.e2e.ts (real-Obsidian probes)
- probe-jest-v2.log, base-antivac.log, rv-tsc.log, rv-lint.log, rv-jest.log, rv-gates.rc, rv-e2e-ids.log, rv-e2e-zr06.log, rv-e2e-full.log, rv-e2e-full.rc, styles-sha.txt, base-build.log, head-build.log
- base-23f3e61b/, head-4b233886/ (git archive exports, node_modules symlinked), asar/app.js (extracted Obsidian 1.14.4)
