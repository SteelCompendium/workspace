# SC-679 r4b scoped re-review (delta 5b476d17 + 1412820d, scratch ed71aeff)

## Executive summary

- VERDICT: **APPROVE-WITH-FIXES**. Counts: CRITICAL 0 / HIGH 0 / MEDIUM 0 / LOW 1 / INFO 2. The code is correct. The one fix is to the wording of a comment.
- r2 findings: MEDIUM-1 RESOLVED; LOW-1 RESOLVED (no state survives an accept); LOW-2 RESOLVED (G19/G20/K15/K16 fail without `close()`); LOW-3 RESOLVED (moot; the rewritten jest goes red under all 3 mutants); LOW-4 RESOLVED; INFO 2 RESOLVED.
- NEW LOW-A `src/authoring/schemaSuggest.ts:130-131`. The comment says that without `close()` the old rows stay "until its next editor update (about 100 ms)". I measured this on the current code (no memory): without `close()` the list never goes away. Obsidian refreshes the OPEN list into a one-row list that repeats the word, and it is still up after `waitNoList`'s 6 s. 11 tests fail with "a suggestion list is still open". The "about 100 ms" holds only for r1's code, where the memory suppressed the re-trigger. Fix: reword (the text is in section 1).
- NEW INFO: the private `CmDoc` in `test/dom/authoring/schemaSuggest.test.ts:275-311` duplicates develop's `test/dom/authoring/_cmEditor.ts` `CmEditor` (SC-675). Optional cleanup.
- Gate land (own worktree @1412820d): tsc clean; lint clean; jest `Tests: 4 skipped, 13942 passed, 13946 total`. The difference from the expected line is the 2 `token-coverage` tests, which skip because a `/tmp` worktree has no workspace beside it. The implementer's in-place log reads `Tests: 2 skipped, 13944 passed, 13946 total`.
- Gate scratch (own worktree @ed71aeff) `--element=authoring`: `OBSIDIAN-E2E done: 81/83 ok, 0 failed, 2 known-bug, coverage: 46/464 pairs (partial run: gate skipped)` (known-bug AUTH-S09, AUTH-I21 = SC-675). With `close()` removed: `OBSIDIAN-E2E done: 66/83 ok, 15 failed, 2 known-bug`.
- Implementer logs at 1412820d (head created 01:48:56; the logs are 01:54-02:31, and the reflog shows no move since): e2e `OBSIDIAN-E2E done: 668/673 ok, 0 failed, 5 known-bug, coverage: 418/418 pairs`; lifecycle 21+16+9+4+7+4+3 = 64/64, each part prints only its own ids, union 64 distinct. Not re-run.
- `styles.css`: the land diff touches no CSS (only CHANGELOG.md, docs/writing-blocks.md, schemaSuggest.ts, schemaSuggest.test.ts, obsidian-core.ts mock), so shots / freeze / parity carry over.

## 1. F1 (MEDIUM-1, option (a)): RESOLVED; LOW-1: RESOLVED

- `git diff d582e7ff..1412820d -- src/authoring/schemaSuggest.ts` has ONE hunk, in `selectSuggestion` only. No other difference from base. `grep accepted` finds nothing in the class: the field, the `onTrigger` check and the recording line are all gone.
- `selectSuggestion` = `replaceRange` + `setCursor({line, ch: start.ch + value.length})` + `this.close()` (`:123-135`).
- `src/authoring/suggest.ts` is not in the land diff.
- No state survives an accept. The class fields are `mode` (overwritten by every non-null `onTrigger`, and not written by `selectSuggestion`; unchanged from base) and `schemaCache` (per element id, unchanged from base). LOW-1 is gone by construction, and jest pins it: the memory mutant below turns red.
- The mock `test/mocks/obsidian-core.ts:563-564` adds a no-op `close()` to `EditorSuggest`. Harmless.
- Is the comment true?
  - Bullet 1 (cursor) is true.
  - Bullet 2: "close() takes them down at once" and "onTrigger runs again but only opens a CLOSED list on typed input" are true. This matches r2 MEDIUM-1 "What I measured", and the noclose run below shows that Obsidian refreshes an OPEN list.
  - "Obsidian leaves the old rows on screen after an accept until its next editor update (about 100 ms)" is NOT true of the current code. See LOW-A.

### LOW-A: the `selectSuggestion` comment still describes the r1 code's no-close behaviour

- Where: `src/authoring/schemaSuggest.ts:130-131`. The r3 fix brief, section 2 F1, prescribed the same wording.
- Measured: scratch tree with `this.close();` deleted and no memory, real Obsidian 1.14.4.
  - AUTH-G13, G15, G16, G17, G18, K09, K10, K11, K12, K13 and K14 all fail in `waitNoList` with "a suggestion list is still open". That wait polls for 6 s.
  - The AUTH-K11 failure screenshot shows a one-row `current_stamina` list over `current_stamina|` after the accept.
  - So without `close()` the stale rows are not taken down at the next update. The re-trigger at the new cursor refreshes the still-open list into a one-row list that repeats the accepted word, and it stays up. The r2 "about 100 ms" window was measured on r1's code, where the memory made that re-trigger return null and Obsidian then closed the list.
- Failure scenario: a future reader trusts "the rows go away on their own in about 100 ms" and judges `close()` to be a micro-optimisation for a 100 ms race. Removing it actually leaves a persistent one-row list that swallows the next Enter (`recoveriesoveries`). This is the same class of misleading "funky logic" comment that MEDIUM-1 was about. No user-visible defect.
- Prescribed fix (comment only; then tsc and lint, no other gate is affected). Replace the second bullet with: "Without close() the list stays up after an accept: Obsidian runs onTrigger again at the new cursor and refreshes the still-OPEN list (a one-row list repeating the accepted word), so the next Enter accepts it again (`heightheight`, `recoveriesoveries`). close() takes it down at once; Obsidian opens a CLOSED list again only on typed input, so nothing else is needed."

## 2. F2 (LOW-3 under F1): RESOLVED

The SC-679 describe block has 8 tests (`schemaSuggest.test.ts:275-408`). Each title matches its body. No test asserts the removed memory; the old `:381` "edited line" title is gone.

Jest mutants (own worktree @1412820d, `npx jest test/dom/authoring`; the base run reads 578/578):

| Mutant | Result | Red tests |
|---|---|---|
| `this.close();` deleted | 1 failed / 577 | "the accept closes the list once (key list and value list)" |
| `setCursor` line deleted | 2 failed / 576 | "key list, nothing typed: …"; "value list, nothing typed: …". The typed-prefix test stays green: CodeMirror maps a cursor at `to` behind the insert, so `setCursor` matters only when start == end. This is expected. |
| (extra) r1 memory re-added (field, check, recording) | 1 failed / 577 | "after an accept onTrigger answers as it does for the same text and cursor without one …" |

The file was restored after each mutant (`git status --porcelain` empty).

## 3. F3 (LOW-2): RESOLVED

- AUTH-G19: `clickRow` (`dse.click`: a wdio click plus `recordDrive`, no wait after it), then `browser.keys('Enter')` directly.
- AUTH-G20, AUTH-K15 and AUTH-K16: `browser.keys(['Enter', 'Enter'])` in one call.
- None of the four waits between the accept and the next Enter. Each asserts the editor value and the cursor `{line: 2, ch: 0}`.
- As is: `81/83 ok, 0 failed, 2 known-bug`.
- With `this.close();` deleted: `66/83 ok, 15 failed, 2 known-bug`. The 15 failing ids are AUTH-G13, G15, G16, G17, G18, G19, G20, K09, K10, K11, K12, K13, K14, K15, K16. The four burst tests fail on the doubled word:

  | Test | Received |
  |---|---|
  | G19 | `mode: opposedopposed` |
  | G20 | `mode: power-rollpower-roll` |
  | K15 | `collapsiblecollapsible` |
  | K16 | `recoveriesoveries` |

  The other 11 fail on "list still open" (LOW-A). These numbers match the implementer's.
- `close()` is now pinned by 15 real-Obsidian tests. In r2 it was pinned by 0.

## 4. F4 / F5 (LOW-4, INFO 2): RESOLVED

- No `browser.pause(300)` is left in the patch (count 0).
- AUTH-G17: after Tab, 5 reads 80 ms apart, each asserting value == `mode: ` and 4 rows. A Tab accept would change the value and close the list, so the first read would fail. The test then shows Enter writes `power-roll` (the list was still open with row 0 selected). The window grows with host slowness, since each read is a page round trip.
- AUTH-G17 carries a 2-line comment above it marking it a host-behaviour canary that guards "Enter or a click".
- AUTH-K13: `dse.waitFor(value === STAM)`, a bounded positive wait that times out red if the undo does not restore the note, then `waitNoList()`, value and rows asserted. It cannot pass vacuously.

## 5. Rebase safety: harmless (empty)

- `git diff 129beb18..d582e7ff -- schemaSuggest.ts schemaSuggest.test.ts obsidian-core.ts` is EMPTY.
- In the same window SC-675 changed `suggest.ts` and `test/dom/authoring/*`, including the new `_cmEditor.ts`. None of these touch this fix.
- Patch: `sc679-on-sc443.patch` is byte-identical to `git format-patch -1 ed71aeff`.
- In a private index, `read-tree ae9025ea` + `apply --cached` of the land diff `d582e7ff..1412820d` (rc 0) gives tree `de0dd394…`. That equals `0d04a019^{tree}` = `ed71aeff~1^{tree}`.
- `git apply --cached --check` of the patch on it: rc 0.

## 6. Docs

- `docs/writing-blocks.md:40-41` ("Pick a suggestion with Enter or a click. The cursor lands right after it and the list closes, even when you had typed nothing yet, so the next Enter starts a new line.") is true for the current code. G13-G20 and K09-K16 are green; G17 shows Tab does not accept.
- Plugin `CHANGELOG.md` `[FIX]` bullet and workspace `CHANGELOG.md` `DSE plugin:` bullet (superproject `3b201d0f`, +7 lines vs `c5d38e9b`): true. "Keep typing and the list comes back" is shown by K12 and by jest "typing on after an accept". "Not covered: … SC-678" is correct.
- Attribution: grep for co-authored / claude / generated / anthropic across the 6 land commit messages and superproject `c5d38e9b..3b201d0f` finds no matches.

## 7. New breakage from the delta

- None found beyond LOW-A.
- INFO: `schemaSuggest.test.ts:275-311` defines a private `CmDoc` over a real CM6 `EditorState`. Develop now ships `test/dom/authoring/_cmEditor.ts` `CmEditor` (SC-675, used by `insertOwnLines.test.ts`), which has the same surface plus `replaceSelection`; it lacks only `type` / `backspace`. Optional reuse; not required.
- INFO: the 2 extra jest skips in my run are environment-only (`token-coverage.test.ts:56` `describe.skip` when no workspace map sits beside the worktree).
- Out of scope, not re-reported: SC-681, SC-682, SC-678, SC-668.

## Worktrees and state

- I registered and then removed (`worktree remove --force`, literal paths) `…/sc679-r4b-review/land` (@1412820d) and `…/sc679-r4b-review/scr` (@ed71aeff).
- Still registered and not mine: the land clone itself and the implementer's `…/sc679-r3b-impl/on-sc443`.
- Land clone `git status --porcelain` is empty before and after; HEAD is `1412820d`; `sc679-on-sc443` is `ed71aeff`.
- The main checkout shows only the expected ` M draw-steel-elements`.
- The AUTH-K11 screenshot was in the removed `scr` worktree's `e2e/.out`. Its content is described in LOW-A.

## Artifacts (scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc679-r4b-review/`)

- Logs:
  - `r4b-land-tsc.log`, `r4b-land-lint.log`, `r4b-land-jest-full.log`
  - `r4b-jmut-base.log`, `r4b-jmut-noclose.log`, `r4b-jmut-nocursor.log`, `r4b-jmut-memory.log`, `r4b-jmut-final-status.log`
  - `r4b-scr-e2e-asis-run1.log`, `r4b-scr-e2e-noclose-run1.log`
  - `r4b-patchcheck.log`, `r4b-land-npmci.log`, `r4b-scr-npmci.log`
- Scripts: `r4b-npmci.sh`, `r4b-static.sh`, `r4b-jest.sh`, `r4b-jest-mutants.sh`, `r4b-e2e-auth.sh`, `r4b-patchcheck.sh`.
- Data: `r4b-ed71aeff.patch`, `r4b-land.diff`, `r4b-patchcheck.index`.

## r6: LOW-A fix delta `1412820d..8c08bce2` (checked by reading; no builds or gate runs)

- VERDICT: **APPROVE**. LOW-A: **RESOLVED**. New findings: 0 blocking, 1 INFO.
- **Delta.** `8c08bce201ef23c32fa1bec7a28fea219c3151cb` has parent `1412820d`.
  - It changes `src/authoring/schemaSuggest.ts` only, 3 lines in and 3 out, at `:130-132`. All six are `//` comment lines in the second bullet of `selectSuggestion`.
  - No code token changed (`setCursor` and `close()` are at `:133-134`, unchanged). The first bullet (`:128-129`) is intact.
- **Attribution.** The commit message is one line, `docs(SC-679): the close() comment says what happens without it (the list stays up as one row)`. The grep for co-authored / claude / anthropic / generated returns 0.
- **Is the comment true?** It is the r4b prescribed wording, word for word. It matches the r4b noclose measurements:
  - 11 tests stay red on "list still open" through `waitNoList`'s 6 s.
  - The AUTH-K11 screenshot shows the one-row `current_stamina` list after the accept.
  - The four burst tests show the doubled words.
- **Implementer logs** (`…/sc679-r3b-impl/`):

  | Log | Line |
  |---|---|
  | `r5-build-before.log` (09:19:58, before the 09:20:04 commit in the reflog) | `e66078e8e476774a77ad6fbe7041c5601ead11292cb87568bcfbc034e262e1d1  main.js` |
  | `r5-build-after.log` (09:20:04.99, after the commit) | the same `main.js` sha |
  | `r5-tsc.log` | GATE-RC=0, no output |
  | `r5-lint.log` | GATE-RC=0; only the known `.eslintignore` warning |
  | `r5-jest-authoring.log` | `Tests: 578 passed, 578 total`, `Test Suites: 15 passed` |

  Both builds give `styles.css` `18730938…f1f9`. The logs do not print HEAD; I placed each build before or after the commit by timestamp against the reflog.
- **Land clone.** `git status --porcelain` is empty.
- **INFO-r6** (`src/authoring/schemaSuggest.ts:131`, non-blocking; the imprecision comes from my own r4b wording). The parenthetical "(a one-row list repeating the accepted word)" is exact for a word that starts no longer key (`collapsible`, `opposed`, `current_stamina`). It is not exact for `recoveries`, which the same line cites: the refreshed list is `[recoveries, recoveries_max]` (jest "after an accept onTrigger answers as it does…" pins this). Optional rewording: "(the accepted word again, at the top of the list)". There is no behaviour impact.
