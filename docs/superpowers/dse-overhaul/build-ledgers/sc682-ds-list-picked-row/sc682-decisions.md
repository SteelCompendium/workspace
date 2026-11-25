# SC-682 decisions ledger

Effort: `sc682-ds-list-picked-row` · worktree `/home/scott/code/steelCompendium/worktrees/sc682-ds-list-picked-row`
· plugin branch `sc682-ds-list-picked-row` cut from dse `develop` @ `bb3a3d10` · workspace `origin/main` @ `61af335e`.
Owner session `e255a3cd-5cdb-4dc4-83be-b58e80eb1057`. Workers read THIS file, never the tracker.

## Scott's rulings (verbatim, dated)

### R1 — the ticket text (SC-682, created 2026-11-20; no comments on the ticket as of 2026-11-24)

Title: "DSE: after picking a block from the `/ds` list with Enter, the picked row stays on screen and the next Enter does nothing until Escape"

> Typing `/ds…` in a note and picking a block with Enter inserts the block, but the picked row stays on screen. The next Enter does nothing: no new line, no second insert. Escape clears it.
>
> Picking the row with a mouse click closes the list as it should.
>
> Repro in Obsidian 1.14.4, shipped build:
>
> 1. On an empty line type `/dsstam`. One row is listed: "Stamina bar ds-stam".
> 2. Press Enter. The block is inserted, and the row is still shown.
> 3. Press Enter again. Nothing happens.
> 4. Press Escape. The row goes away and Enter works again.
>
> Expected: after any pick the list is closed, so the next Enter is a new line at the cursor.
>
> Not data loss: the note is never damaged.

Agent notes on the ticket (verbatim):

> * `src/authoring/suggest.ts` `selectSuggestion` (lines 64-70 at dse `129beb18`): `replaceRange` + `setCursor`, no `this.close()`. SC-679's fix for `src/authoring/schemaSuggest.ts` is `replaceRange` + `setCursor` + `this.close()`.
> * Measured by the SC-679 r2 reviewer, probes RTWO-28 / RTWO-29, identical before and after SC-679. Probe specs and logs are machine-local (session scratch); the template is "accept, then Enter with no wait between them, assert the note text".
> * An e2e test for this must send the accept and the next Enter with no wait in between. A test that first waits for the list to go away passes even without the fix (SC-679 review, LOW-2).
> * Needs the authoring e2e driver from SC-443.

## Owner calls (2026-11-24, ticket-owner; not Scott rulings — they implement R1)

- **O1 — the behaviour.** After any `/ds` pick (Enter or a mouse click; any of the thirteen advertised
  elements; Live Preview and Source mode; top level, list item, callout) no suggestion list of ANY
  kind is on screen, and the next Enter is a new line at the cursor. That is R1's "Expected" line.
- **O2 — the oracle for "a new line at the cursor".** The note text after "accept, Enter with no wait"
  must be byte-identical to the note text that "accept, Escape, Enter" produces on the unfixed
  `bb3a3d10` build (the path a user takes today). Whatever Obsidian itself does with Enter at that
  cursor (list / callout continuation included) is correct; the plugin adds nothing to it.
- **O3 — the fix shape.** `DsElementSuggest.selectSuggestion` closes the list on every path that had a
  context, as SC-679 did for `schemaSuggest.ts`. Since SC-687 (`bb3a3d10`) it already closes on a
  REFUSED pick; that behaviour (one Notice, token left as typed, list closed) must not change.
- **O4 — the in-block key list after a pick.** `e2e/driver/authoring.ts` `closeList()` says a key list
  can open over a freshly inserted block (Obsidian re-runs the triggers at the new cursor). After the
  fix no list opens by itself after a pick (O1); the key list opens when the user types, as it does
  anywhere else in a block. The implementer measures and reports what is on screen today 1.5 s after
  a pick (which list, which rows) for one element with a schema and one without, by Enter and by
  click, before and after the fix. The fix goes ahead either way; the owner decides from the
  measurement whether Scott needs to be told about a visible change.
- **O5 — the e2e workaround goes.** Where `e2e/specs/authoring/ds-suggest.e2e.ts` (or any other spec)
  calls `closeList()` directly after a `/ds` pick, replace it with an assertion that no list is on
  screen (no Escape sent), so those tests fail if the list ever stays up again. `closeList()` uses
  after anything other than a `/ds` pick are out of scope.
- **O6 — gates.** Full dse-verify battery. shots / freeze / parity carry (592, 280/280, 0/0/24) if the
  built `styles.css` is byte-identical to a clean `bb3a3d10` build and no CSS / rendering file is
  touched; otherwise run them. No freeze rebaseline is expected.
- **O7 — out of scope.** SC-676 (`/ds` offered inside blind-spot fences; its three `test.failing`
  markers stay as they are), SC-688, SC-692, any change to `blockInsert.ts` / `fenceScan.ts`
  behaviour, any change to `schemaSuggest.ts` behaviour.

## Rounds

| Round | Worker | Type | Status |
|---|---|---|---|
| r1 impl | ab78bbc0075258e0e | orchestration:implementer | DONE 2026-11-24: plugin `8b32ac9b`, superproject `f67003ad`; report `sc682-r1-impl-report.md`; jest 14682/2 skipped, lifecycle 64/64 (part 2 first run 12/16 under load, 16/16 alone), e2e 818/828 ok 0 failed 10 known-bug 476/476 pairs, styles.css identical |
| r2 review | ab4a9c717c99219c0 | orchestration:reviewer | DONE 2026-11-24: LAND-READY at `8b32ac9b`; 0 CRITICAL, 0 HIGH, 2 MEDIUM (pre-existing, same on base), 1 LOW, 4 INFO; all 12 new/changed e2e tests red on base; gates re-measured and matched; report `sc682-r2-review-report.md` |
| r3 fix + rebase | ab78bbc0075258e0e (resume) | orchestration:implementer | DONE 2026-11-24: plugin `23f3e61b` on `a0e55f6b`, superproject `bc01449e` on `0d6f4897`, no conflicts; jest 14724 / 2 skipped (no shots cache), lifecycle 64/64 first run, e2e `841/851 ok, 0 failed, 10 known-bug, coverage: 486/486 pairs`, styles.css `a4dfc387…` identical to clean `a0e55f6b`; report `sc682-r3-fix-report.md` |
| r4 scoped re-review | af3b9898fd17a57a1 (not the author) | orchestration:implementer | DONE 2026-11-24: LAND-READY at `23f3e61b`, no findings; range-diff r1 commits equal; tsc/lint clean, jest 14724 / 2 skipped, e2e `--only` 14/14, styles.css hash equal; report `sc682-r4-rereview-report.md` |

## Base moved (dispatcher message, 2026-11-24, during r2)

SC-690 landed. dse `origin/develop` is now `a0e55f6b` (was `bb3a3d10`, 8 commits, Montage Test
"Remove a hero"); workspace `origin/main` is `0d6f4897`. New CURRENT baselines: jest **14716 passed /
1 skipped** with the shots cache; lifecycle 64/64; e2e `OBSIDIAN-E2E done: 833/843 ok, 0 failed,
10 known-bug, coverage: 486/486 pairs`; shots 592, freeze 280/280, parity 0 / 0 / 24.
Owner call **O8**: the r2 review finishes at `8b32ac9b` undisturbed (no rebase under a running
reviewer). Then one round rebases the plugin branch onto `a0e55f6b` and the superproject branch onto
`0d6f4897`, folds any r2 fixes, and re-runs the full battery. Expected after rebase with the +8 tests:
jest 14724 / 1 skipped with the shots cache (14723 / 2 without), e2e `841/851 ok, 0 failed,
10 known-bug, coverage: 486/486 pairs`. Land-ready is reported only on the rebased head.

## Deferred findings / follow-up rulings

- r1 measurement (implementer, real Obsidian 1.14.4, base `bb3a3d10`), to be confirmed by r2:
  the stuck row shows for Stamina bar and Skills only (other eleven elements: no list at 1.5 s);
  a CLICK pick of Stamina bar also leaves the row (the ticket says a click closes it);
  a second Enter within ~20 ms of the pick picks again — under a list item it writes a second
  scaffold into the first block (note damage; the ticket says "Not data loss"). Same `close()` fixes it.
- Owner eyeballed `evidence/sc682-before.png` (row "Stamina bar / ds-stam" drawn over the new block)
  and `evidence/sc682-after.png` (block only, no list, cursor on the first body line): both correct.
- Follow-ups from r1, rulings pending the r2 reviewer's read:
  1. stale `[start, end)` range check in `selectSuggestion` — PENDING (reviewer asked to drive it).
  2. AUTH-I40 `waitNoList` → `expectNoList` — PENDING (fold into a fix round if there is one; else drop).
  3. `closeList()` 1 s wait premise not reproduced for `/ds` picks — DROP (helper still used after
     other accepts; comment already updated; no user effect).

## r2 findings — owner rulings (2026-11-24)

- **MEDIUM-1** (Enter within ~50 ms of the last typed letter picks with the old token range: stray
  letter, or the wrong block) and **MEDIUM-2** (an outside edit, then Enter within ~60 ms: 7 chars of
  user text deleted, or an uncaught RangeError): **FILED as SC-693 (Backlog), OUT OF SCOPE here.**
  Reason: pre-existing and byte-identical on `bb3a3d10`, a different defect from R1 (the list IS
  closed after the pick), needs a Scott decision (use the new token vs write nothing), needs its own
  timing-sensitive tests and review, and covers `schemaSuggest.ts` too.
- **MEDIUM-2, the `finally` part only: FOLD into r3.** `this.close()` moves into a `finally` so a
  throw from `insertBlock` cannot leave the list up (R1: "after any pick the list is closed"). The
  error still propagates; no stale-range guard (that is SC-693).
- **LOW-1** (changelog bullets and the code comment name "Stamina bar and Skills" as if the full
  list; "first few milliseconds" is 40-80 ms): **FOLD into r3.**
- **INFO-1** (AUTH-S03 and AUTH-I40 still use `waitNoList()` after a `/ds` pick): **FOLD into r3**
  (`expectNoList()`), which also settles r1 follow-up 2.
- **INFO-2** (jsdom refused / no-context cases pass on base): DROP — they pin SC-687 by design.
- **INFO-3** (one Ctrl+Z undoes block and typed token together): DROP — same on base, CodeMirror's
  undo grouping, not a defect.
- **INFO-4** (2-space list block gets no `/ds` list): DROP — correct behaviour; SC-676 is the 4-space form.
- r1 follow-up 1 (stale range check): superseded by SC-693.
- Reviewer's rule breach (`rm $B/node_modules`, its own scratch symlink; real `node_modules` intact): noted, no action.

- 2026-11-24, after r3: workspace `origin/main` moved `0d6f4897` → `2ebbdb1f` (one commit, `docs/handoffs/HANDOFF.md`
  only). No conflict with the branch's CHANGELOG commits; left for the landing's own rebase. dse `origin/develop` still `a0e55f6b`.

## LAND-READY (2026-11-24)

- Plugin `sc682-ds-list-picked-row` @ `23f3e61b` on dse `develop` @ `a0e55f6b` (8 commits; `origin/develop` re-checked at
  `a0e55f6b` at report time). Superproject branch @ `bc01449e` on `0d6f4897` (2 CHANGELOG-only commits, no pointer bump);
  workspace `origin/main` is `2ebbdb1f` (one HANDOFF.md-only commit ahead; no conflict; the landing rebases).
- Gates on `23f3e61b`: tsc (incl. `tsc -p e2e`) and lint clean · jest **14724 passed / 2 skipped** without the shots cache
  (r3 implementer and r4 re-reviewer both) · lifecycle **64/64** (seven parts, first run) · e2e
  `OBSIDIAN-E2E done: 841/851 ok, 0 failed, 10 known-bug, coverage: 486/486 pairs` (r3 implementer, full run; r4 ran the
  14 touched ids, 14/14) · `styles.css` sha256 `a4dfc387dba23dfa78e422a2bc1ed882c1a459a89608266e0244cbb02c83423d` identical to
  a clean `a0e55f6b` build → shots 592, freeze 280/280, parity 0 / 0 / 24 carry. No freeze rebaseline.
- New e2e ids AUTH-S10..AUTH-S17; no new coverage pair; no known-bug marker added or removed. Filed SC-693 (Backlog).
- Posted: SC-682 land-ready comment (2 images), state In Progress + `Needs Review` (ask: try it after landing and close).
  Comment source `sc682-comment-landready.md`, log `sc682-post-1.log`.
- For the dse-verify CURRENT line: SC-682 adds 9 jest tests and 8 e2e tests on `a0e55f6b`; the `/ds` list now closes after
  every pick; `expectNoList()` is a new e2e driver helper (asserts no list, sends no key).
