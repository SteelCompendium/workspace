# SC-679 decisions ledger

Ticket: SC-679 — DSE: accepting an in-block suggestion with nothing typed leaves the cursor before the
text and the list open, so the next Enter writes a second value.
Worktree: `/home/scott/code/steelCompendium/worktrees/sc679-suggest-enter-double-value` (branch
`sc679-suggest-enter-double-value` in every submodule). Plugin clone:
`/home/scott/code/steelCompendium/worktrees/sc679-suggest-enter-double-value/draw-steel-elements`.
Base: dse `origin/develop` @ `129beb18af27c641cca026ec519090af20372715` (2026-11-20).
Owner session: `5812b474-3aec-46a6-8f06-0ef85cf1e10a` (Fable ticket-owner).

## Scott rulings (verbatim, dated)

- **2026-11-20 (via dispatcher, wave scope):** "Data loss or broken on shipping elements" — SC-671,
  SC-672, SC-675, SC-679.
- **Ticket description (Scott, 2026-11-15), the expected behaviour:** "Expected: after any accept, the
  cursor sits after the inserted text and the list closes (or re-filters for the new position)."
- **Ticket description, agent note:** "Check whether the shipped key lists (`ds-stam`, `ds-skills`,
  accepted on an empty line) hit the same path."

No comments on the ticket as of 2026-11-20.

## Facts established by the owner (2026-11-20)

- The defect is `src/authoring/schemaSuggest.ts` `selectSuggestion` (lines 123-126 at `129beb18`):
  `replaceRange` only, no `setCursor`, no `close()`. The `/ds` suggester (`src/authoring/suggest.ts:64-70`)
  already sets the cursor after its insert; the schema suggester is the outlier.
- **The shipped key list reproduces it** (SC-443 r1 implementer, e2e marker AUTH-K09 on `ds-stam`: open the
  key list on an empty line with nothing typed by typing a letter and deleting it, pick a key: the cursor
  stays in front of the key and the next Enter writes `collapsiblecollapsible`). So this is a bug on a
  shipping element, not only behind the experimental switch.
- **SC-443 has NOT landed.** Its branch `sc443-e2e-editor-insert` @ `ae9025ea` (6 commits on `129beb18`,
  clone at `/home/scott/code/steelCompendium/worktrees/sc443-e2e-editor-insert/draw-steel-elements`, READ-ONLY
  for this effort) carries everything SC-679's ticket says SC-443 "adds":
  - e2e `knownBug('SC-679')` markers AUTH-G13, AUTH-G14 (`e2e/specs/authoring/gate-on.e2e.ts`) and AUTH-K09
    (`e2e/specs/authoring/schema-suggest.e2e.ts`);
  - the jsdom `test.failing` marker in `test/dom/authoring/authoringKnownBugs.test.ts` ("SC-679: accepting a
    suggestion with nothing typed");
  - the authoring e2e driver (`e2e/driver/authoring.ts`, `authoringTrips.ts`, `authoringAssert.ts`) and the
    `CmEditor` jest helper. None of these exist on `develop`.
  - a 3-line change to `src/authoring/schemaSuggest.ts` (`stampControl` in `renderSuggestion`, directly above
    `selectSuggestion`): a textual conflict with this fix is likely and trivial.

## Owner rulings

- **2026-11-20, branch base:** the land branch is cut from `develop` (`129beb18`), NOT stacked on SC-443.
  Landing SC-443's unreviewed commits through this ticket is not acceptable. Real-Obsidian proof comes
  from a scratch tree = SC-443 tip `ae9025ea` + this fix (never pushed, never landed), where the three
  e2e markers and the jsdom marker are flipped to plain tests. The flips plus any new authoring e2e tests
  are kept as a patch file in this ledger dir (`sc679-on-sc443.patch`). Whichever of SC-443 / SC-679 lands
  second applies it. To be reported to the dispatcher at land-ready.
- **2026-11-20, target behaviour (owner's call, Scott may overrule; stated on the ticket at the end):**
  - R1. After any accept (mouse click, Enter or Tab on a row; key list or value list; with or without a
    typed prefix) the cursor is directly after the inserted text.
  - R2. After any accept no suggestion list is on screen: not the stale rows, and not a re-opened
    one-row list that only repeats the word just accepted. Visible consequence: Enter right after an
    accept starts a new line and the accepted line stays whole; no Escape needed.
  - R3. Typing on after an accept behaves as before (after a key accept, typing `: ` opens the value list
    where that key has listed values; letters that still prefix-match other keys re-open the list).
- **2026-11-20, out of scope:** SC-678 (a mid-word accept doubles the rest of the word) stays its own
  ticket: do not fix it here, do not make it worse. "No `: ` after a key accept" and "already-present keys
  are offered again" are rough edges noted on SC-678's ticket: not here.

## Rounds

- **r1 implementer (2026-11-20)** — agent `a39ba1ed31c818e6b` (orchestration:implementer); brief `sc679-brief-r1-implementer.md`; report
  `sc679-r1-implementer-report.md`.
  **Result (2026-11-20): DONE.** Plugin head `c1181989b7eb8711d8a15e6065ee56cfcae8c35b` (commits `d3ca4e93`,
  `3ae85ce3`, `45f546e5`, `c1181989` on `129beb18`); superproject `ffa0feb9` (CHANGELOG only, pointer bump
  not staged). R2 mechanism: `selectSuggestion` = `replaceRange` + `setCursor(start.ch + value.length)` +
  remember `{line, ch, line text}` + `this.close()`; `onTrigger` returns null at exactly that cursor and
  line text; the first `onTrigger` anywhere else clears the memory. "Only match equals the query" rule
  rejected (`recoveries` / `recoveries_max` on ds-stam would re-open two rows). Measured in Obsidian 1.14.4:
  `onTrigger` re-fires after the cursor move; with `setCursor` alone a one-row list re-opens from t+100 ms
  and swallows Enter. Tab does not accept a row (only Enter and a click).
  Gates: tsc / lint clean; jest 13711 passed / 2 skipped (fresh; base 13702 + 9); lifecycle 63/64 (G-S61
  torn-read line, red alone and red on a clean `129beb18` build: SC-668); e2e `658/667 ok, 0 failed,
  9 known-bug, coverage: 418/418 pairs`; `styles.css` sha256 `18730938…f1f9` identical base / head, so shots
  592, freeze 280/280, parity 0 / 0 / 24 carry. Scratch tree (SC-443 `ae9025ea` + fix): authoring e2e
  `77/79 ok, 0 failed, 2 known-bug` (SC-675's two), markers AUTH-G13 / G14 / K09 + jsdom marker flipped, new
  AUTH-G15..G18, AUTH-K10..K14; patch `sc679-on-sc443.patch` (one commit on top of the cherry-picked fix
  commits + the land test commit, which the jsdom flip needs for the mock `close()`).
- **Owner rulings on r1 follow-ups (2026-11-20):**
  - G-S61 red on base → **drop**: already SC-668. Tell the dispatcher the land numbers are 63/64 with G-S61.
  - A key / value typed in full by hand still shows a one-row list and Enter picks it → **ticket: SC-681**
    (Low, Backlog, related SC-679 / SC-678; needs a taste decision, most editors behave this way). Out of
    scope for fix rounds here.
  - AUTH-G17 pins "Tab does not accept a row" → reviewer asked whether that is sound; no ticket.
  - No `press:ArrowDown` manifest pair for `authoring.schema.value` → **drop** here: the manifest is
    SC-443's and unlanded; goes in the hand-off note with the patch.
- **r2 reviewer (2026-11-20)** — agent `a473b4eae3bedb400` (orchestration:reviewer); brief
  `sc679-brief-r2-reviewer.md`; report `sc679-r2-reviewer-report.md`.
  **Result (2026-11-20): APPROVE-WITH-FIXES** at `c1181989`. 0 CRITICAL, 0 HIGH, 1 MEDIUM, 4 LOW, 8 INFO.
  Reviewer gates: tsc / lint clean; jest 13711 / 2; land full e2e 657/667 with INIT-W10 (listed flake)
  passing alone = 658/667, 9 known-bug, 418/418; scratch authoring e2e 77/79, 0 failed, 2 known-bug; the 13
  SC-679 e2e tests are 0/13 on the unfixed SC-443 tip; `styles.css` sha identical. No list is on screen
  after any accept (no `.suggestion-container` in the DOM at t0 and t+400 ms, every combination).
- **~~R2 mechanism: the `accepted` memory in `onTrigger` suppresses the re-opened one-row list~~ superseded
  by the r2 review (MEDIUM-1), 2026-11-20:** `close()` alone delivers R2. Obsidian 1.14.4 re-runs
  `onTrigger` after an accept but opens a closed list only on typed input. r1 never measured `close()`
  without the memory. The memory is dead weight and has its own bug (LOW-1).
- **Owner rulings on r2 findings (2026-11-20):**
  - MEDIUM-1 → **fix, option (a)**: delete the `accepted` field, the `onTrigger` check and the recording
    line. The fix is `replaceRange` + `setCursor` + `close()`. Correct the source comment.
  - LOW-1 (memory shared across editors) → resolved by MEDIUM-1 (a).
  - LOW-2 (no e2e presses Enter right after the accept; all 13 pass with `close()` removed) → **fold**:
    burst e2e tests in the patch, proven to fail with `close()` removed.
  - LOW-3 (jest leaves the memory's comparisons unpinned) → moot under (a); the four jest tests that assert
    `onTrigger === null` are rewritten.
  - LOW-4 (fixed `browser.pause(300)` in AUTH-G17, AUTH-K13) → **fold**: bounded polls.
  - INFO 2 → **fold**: a one-line comment on AUTH-G17 marking it a host-behaviour canary. R1's "Tab" clause
    is vacuous: Obsidian 1.14.4 has no Tab accept (Tab with the list open does nothing, base and head).
  - INFO 3 (an accept collapses a second cursor to one; base kept both) → **drop**: same as the `/ds`
    suggester's `setCursor`, the key was only ever written at the main cursor.
  - Follow-up, the `/ds` list keeps its row after an Enter accept and swallows the next Enter until Escape
    (`src/authoring/suggest.ts`, identical on base) → **ticket: SC-682** (Medium, Backlog, DSE 7.0.0,
    related SC-679 / SC-675 / SC-443). Out of scope for fix rounds here: `suggest.ts` is not touched.
  - SC-681 → the reviewer's measurement added to its description (base: every Enter swallowed until
    Escape; head: the first only).
- **r3 fix round (2026-11-20)** — implementer `a39ba1ed31c818e6b` resumed; brief
  `sc679-brief-r3-fix.md`; report `sc679-r3-fix-report.md`.
- **Dispatcher course correction (2026-11-20, during r3):** dse `origin/develop` moved `129beb18` →
  `3b47e55b` (SC-675 landed: all four block-insert paths go through new `src/authoring/blockInsert.ts`; it
  touched dsSuggest-related tests). Workspace `origin/main` is now `49ac1c10`. "Rebase your dse branch onto
  3b47e55b before reporting land-ready." New base numbers as SC-675 reported them: jest 13855 passed /
  2 skipped; e2e `658/667 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs`; lifecycle 63/64 (G-S61
  torn-read line, same on base = SC-668). Sent to the r3 implementer by message; the superproject branch
  rebases onto `49ac1c10` too (CHANGELOG bullet kept beside SC-675's).
- **r3 outcome as found on resume (2026-11-23, new owner, dispatcher session `e255a3cd-5cdb-4dc4-83be-b58e80eb1057`):**
  the r3 implementer was cut off by a usage limit. NO r3 report exists and NO r3 gate result was recorded.
  On disk: land clone clean at `6a3cf95c` = 6 commits on `3b47e55b` (F1 `63cb6e8c`, F2 `6a3cf95c` present);
  scratch branch `sc679-on-sc443` @ `ed71aeff` (SC-443 `ae9025ea` + 6 cherry-picks + one commit with the
  marker flips and AUTH-G15..G20 / AUTH-K10..K16) lives in the land clone's refs, its worktree dir is gone
  (old session scratchpad deleted); `sc679-on-sc443.patch` was regenerated from `ed71aeff` (no
  `browser.pause(300)` left in it). Superproject branch still `ffa0feb9` on `3a517cdf` (never rebased).
  Ticket: no comments, state Awaiting, labels DSE Plugin + Bug. SC-443 still unlanded at `ae9025ea`.
- **Base moved again (2026-11-23):** dse `origin/develop` = `fefd902922c42f2e93fc8756d26be6549463f294` (SC-434, SC-641,
  SC-644 landed on `3b47e55b`; none touches `src/authoring/` or `test/dom/authoring/`); workspace
  `origin/main` = `b79eef2ba67a6cf8cc808ba7bae339ddf0fcc831`. Base numbers at `fefd9029` (dse-verify CURRENT): jest
  13902 passed / 2 skipped fresh (13903 / 1 with the shots cache); lifecycle 64/64 (G-S61 green); e2e
  `664/669 ok, 0 failed, 5 known-bug, coverage: 418/418 pairs`; shots 592, freeze 280/280, parity 0 / 0 / 24.
- **r3b completion round (2026-11-23)** — agent `a3bda5d4165a6de7f` (fresh orchestration:implementer; the r1/r3 implementer `a39ba1ed31c818e6b` has no transcript in this session); brief `sc679-brief-r3b-complete.md`;
  report `sc679-r3-fix-report.md`. Rebase both branches, verify F1-F5, burst-test vacuity proof, full gates.
- **Dispatcher course correction (2026-11-23, during r3b):** "SC-671 landed — dse origin/develop is now d582e7ff (was fefd9029; 6 commits: a Counter write keeps the YAML keys the counter does not use). Workspace origin/main c5d38e9b (CHANGELOG.md gained SC-671 bullets). New dse-verify CURRENT @ d582e7ff: jest 13936/2 fresh, lifecycle 64/64, e2e 668/673 ok, 0 failed, 5 known-bug, 418/418 pairs; shots 592 / freeze 280/280 / parity 0/0/24. Rebase onto d582e7ff before reporting land-ready."
  ~~Rebase targets dse `fefd9029` / workspace `b79eef2b` and the base numbers in the "Base moved again" entry~~ superseded by this entry: targets are dse `d582e7ff` / workspace `c5d38e9b`; expected land numbers jest 13936 / 2 fresh + this branch's added tests, lifecycle 64/64, e2e `668/673 ok, 0 failed, 5 known-bug, coverage: 418/418 pairs`. Sent to the r3b implementer `a3bda5d4165a6de7f` by message.
  **r3b result (2026-11-23): DONE.** Plugin land head `1412820dd6b16f9db2afcd1e91bf333169417ade` = 6 commits on dse `d582e7ff5aa4aeb179558bb990b654ef381dbae0` (range-diff vs `3b47e55b..6a3cf95c`: all six `=`; no conflicts; F1 = `5b476d17`, F2 = `1412820d`). Superproject `3b201d0fecda0a1b192f376f103e3bc0f7a1f844` on `c5d38e9b` (pointer bump unstaged; `origin/main` is `0ec2f4f9`, one docs-only commit above). F1-F5 complete as found, no new commit. Gates at `1412820d`: tsc / lint clean; jest `2 skipped, 13944 passed` (13936 + 8); lifecycle 64/64 (seven parts, G-S61 green); e2e `668/673 ok, 0 failed, 5 known-bug, coverage: 418/418 pairs` (owner read the log line); `styles.css` sha256 `18730938…f1f9`, no CSS in the diff, so shots 592 / freeze 280/280 / parity 0 / 0 / 24 carry. Scratch `sc679-on-sc443` @ `ed71aeff` (patch unchanged, applies on `0d04a019` = `ae9025ea` + the six land commits): authoring e2e `81/83 ok, 0 failed, 2 known-bug`; with `close()` removed `66/83 ok, 15 failed` incl. the burst tests AUTH-G19, G20, K15, K16 (doubled word each). Logs: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc679-r3b-impl/land2-*.log`, `scratch-*.log`.
- **Owner rulings on r3b follow-ups (2026-11-23):**
  - NEGO-R08 timed out once in a full e2e at the superseded head `a65ab360` (passed alone; absent from the final-head run) → **drop, no ticket**: one sighting, not this branch's area. Passed to the dispatcher as a note for the dse-verify flake list.
  - The implementer's stray `sed -i` hit the main checkout's `CHANGELOG.md` and was restored with `git checkout`; owner verified the main checkout at `0ec2f4f9` with only the expected ` m draw-steel-elements`. Reported to the dispatcher; nothing to fix.
- **r4b scoped re-review (2026-11-23)** — agent `aa49faf70bcbbca8e` (fresh orchestration:reviewer; the r2 reviewer `a473b4eae3bedb400` has no transcript in this session; a different identity from both implementers); brief `sc679-brief-r4b-rereview.md`; report `sc679-r4-rereview-report.md`.
  r4b was cut off by a usage limit mid-run (2026-11-23) and resumed by message (same agent, transcript intact) after the reset; no orphaned process; bases unchanged (dse `d582e7ff`, workspace `origin/main` `0ec2f4f9`, docs-only above `c5d38e9b`).
  **r4b result (2026-11-23): APPROVE-WITH-FIXES** at land `1412820d` / scratch `ed71aeff`. 0 CRITICAL, 0 HIGH, 0 MEDIUM, 1 LOW, 2 INFO. r2 MEDIUM-1, LOW-1..4, INFO 2 all RESOLVED. Reviewer gates: tsc / lint rc 0; jest `4 skipped, 13942 passed, 13946 total` in a `/tmp` worktree (2 extra skips: `token-coverage.test.ts` has no workspace beside it there; implementer in place: 13944 / 2); jest mutants: no `close()` 1 red, no `setCursor` 2 red, memory re-added 1 red; scratch authoring e2e as is `81/83 ok, 0 failed, 2 known-bug`, with `close()` removed `66/83 ok, 15 failed` (AUTH-G13, G15-G20, K09-K16; the four burst tests on a doubled word); implementer full e2e and lifecycle logs checked at `1412820d`; patch applies; no CSS; docs true; no attribution.
- **Owner rulings on r4b findings (2026-11-23):**
  - LOW-A (`src/authoring/schemaSuggest.ts:130-131`: the comment's "until its next editor update (about 100 ms)" is false without the memory; without `close()` the list stays up as a one-row list for 6 s+) → **fix, comment only**, the reviewer's wording verbatim. r5 = implementer `a3bda5d4165a6de7f` resumed; r6 = reviewer `aa49faf70bcbbca8e` resumed to confirm the delta is comment-only.
  - INFO (private `CmDoc` in `test/dom/authoring/schemaSuggest.test.ts:275-311` duplicates develop's `_cmEditor.ts` `CmEditor`) → **drop**: test-only duplication with no behaviour at stake; swapping it would reopen jest tests the mutants just pinned.
  - INFO (2 extra jest skips in a `/tmp` worktree) → **drop**: environment, explained.
- **r5 fix (2026-11-23)** — implementer `a3bda5d4165a6de7f` resumed; report `sc679-r5-fix-report.md`. **DONE:** land head `8c08bce201ef23c32fa1bec7a28fea219c3151cb` = one comment-only commit on `1412820d` (7 commits on dse `d582e7ff`); built `main.js` sha256 `e66078e8…e1d1` identical at both heads, `styles.css` `18730938…f1f9`; tsc / lint clean; jest `test/dom/authoring` 578 passed. Full jest 13944 / 2, lifecycle 64/64, e2e `668/673 ok, 0 failed, 5 known-bug, coverage: 418/418 pairs` carry from `1412820d` (byte-identical bundle).
- **r6 scoped re-review (2026-11-23)** — reviewer `aa49faf70bcbbca8e` resumed; r6 section appended to `sc679-r4-rereview-report.md`. **APPROVE**, LOW-A RESOLVED, 0 blocking.
  - INFO-r6 ("a one-row list repeating the accepted word" is not exact for `recoveries`, where the refreshed list is `[recoveries, recoveries_max]`) → **drop**: comment nuance; the cited doubled word is still what Enter writes.
- **LAND-READY (2026-11-23):** dse `8c08bce2` on `d582e7ff`; superproject `3b201d0f` on `c5d38e9b` (CHANGELOG bullet; pointer bump unstaged). Hand-off: `sc679-on-sc443.patch` (applies on SC-443 `ae9025ea` + the land diff) goes to whichever of SC-443 / SC-679 lands second; preserve it with the ledger.
- **LANDED + Done (2026-11-23):** dispatcher landed dse `origin/develop` = `8c08bce2` (fast-forward from `d582e7ff`, 7 commits); workspace pointer bump `39e0a565`, merge `440cb7c7`, bookkeeping `66b1e5ec`; worktree removed; ledger preserved to `docs/superpowers/dse-overhaul/build-ledgers/sc679-suggest-enter-double-value/`. Owner verified on origin (develop sha, superproject pin, CHANGELOG bullet). SC-443 hand-off relayed by the dispatcher: the SC-443 owner applies `sc679-on-sc443.patch`. Closing comment posted; ticket Done. No reply from Scott on the two behaviour calls (list closes after a pick; Tab does not pick) as of closing. Open follow-ups: SC-681, SC-682.
