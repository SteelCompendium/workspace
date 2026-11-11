# SC-480 r4 fix round report (partial: MEDIUM-1, LOW-3, LOW-1 done; LOW-2 needs a ruling)

## Executive summary
- STATUS NEEDS_CONTEXT, only for LOW-2 (design below). MEDIUM-1, LOW-3 and LOW-1 are done, committed and verified as far as stated; the full battery is NOT re-run (it must be re-run after LOW-2 or after you drop it).
- Base unchanged: origin/develop 97a9c93b (fetched). dse HEAD 478c54fc; superproject HEAD 6152e66e.
- MEDIUM-1: `landsOnOtherBlock` (reviewer's reverse-map guard with the fenceAt(pin.text, pin.lineStart) condition; skipped for partial embed pins; count rule kept). Pin suite 68/68; 7 write-path suites 332/332. New jest test red on cb665989 (1 failed / 67 passed), green now; mutants m6 (guard off), m7 (no fenceAt condition), m8 (back===null refuses) each red (1 test).
- LOW-3 + the MEDIUM-1 trial: G-S73 now 16 trials (+ sync-del-bump, dup-move; RV + LP, leave). Mine 16/16 ok; cb665989 bundle FAILS the 2 sync-del-bump trials; mutant Mb (no `now` count) FAILS the 2 dup-move trials.
- LOW-1: both CHANGELOG entries rewritten (bumped-neighbour case; cut/paste-move refusal; >400-line refusal; blank-line-only twin limit, SC-556 wording). They do not claim the card shows the on-disk value; adjust after your LOW-2 ruling.
- tsc rc=0, lint rc=0 (r4). Not run: full jest, 5 lifecycle parts, e2e, styles.css compare (no CSS touched; src change is one host file).

## Commits (dse, on 97a9c93b)
- da861611 fix(SC-480 r4): reverse-map guard `landsOnOtherBlock` (ReadingModeBlockHost.ts +16/-1) + 2 jest tests (bumped neighbour -> refused; cut/paste move, no twin -> lands).
- 580af578 test(SC-480 r4): G-S73 trials sync-del-bump and dup-move (+ header comment).
- 478c54fc docs(SC-480 r4): dse CHANGELOG. Superproject: 6152e66e docs(SC-480 r4): CHANGELOG.

## Evidence (ledger dir unless noted)
- sc480-r4-red-on-cb665989-jest.log: unpatched (cb665989) host source + new tests: 1 failed (bumped neighbour), 67 passed.
- sc480-r4-red-on-cb665989-lifecycle-G-S73.log: cb665989 bundle: FAIL sync-del-bump (Reading view, leave) and (Live Preview, leave), nothing else.
- sc480-r4-red-on-mutant-mb-lifecycle-G-S73.log: bundle without the `now` count: FAIL dup-move RV + LP, nothing else.
- sc480-r4-lifecycle-G-S73-mine.log: `G-S73 ok (16 trials ...)`.
- sc480-r4-gate-tsc.log, sc480-r4-gate-lint.log: rc=0. Mutation logs: scratch .../sc480-r2-implementer/mut-m6.log, mut-m7.log, mut-m8.log.

## LOW-2: needs your ruling (NEEDS_CONTEXT)
Why: after a refused card write whose block is still on disk and unchanged, nothing writes, so Obsidian does not rebuild the section; the card keeps the model the user clicked. Fixing that means re-rendering the card, which is view lifecycle (release a view, draw another), not only the host/view write path.
Options:
- A (my recommendation): `ViewRegistry` gets a `redraw(entry, body)` hook, set in registerFrameworkElements.ts to `registry.release(entry, 'refused-write'); el.replaceChildren(); remounter.mount(el, ctx, alias, body)` (the existing SC-481 `ReusedElementRemounter` path). The host calls it at the end of `replaceSource` after a dropped CARD write when the element still sits on a section whose fence body equals `knownBody` (`readSection()` non-null and `reusedBlockBody()` null; so a deleted block, or an element handed to a twin, is left to the existing rebuild / SC-481 reconcile). About 25-30 source lines + ~3 jest tests + the G-S73 trial (refuse, then click again -> disk exactly +1). Costs: release flushes any edit already pending (a click made during the refusal is written first through its own pin) and the card is rebuilt (scroll pin / modal state of that card reset); Live Preview callout widgets unverified until probed.
- B: the pipeline gives the view a re-parse function and the host asks the view to `update(model)` from `knownBody`: no release/remount, but touches pipeline.ts + view.ts + host (~35 lines) and every element's `onUpdate`.
- C: do not fix; the CHANGELOG limit gets a sentence ("the card may keep showing your click; reopen the note"). Zero code; the Notice stays accurate only until the next click.
Tell me A, B or C; for A or B I then add the code, jest, the G-S73 trial, re-run the full battery on the final head (jest, lifecycle x5, e2e, styles.css 4295ca33) and refresh the proposal; for C I only add the CHANGELOG sentence and run the full battery.

## Drive-by fixes:
- None.

## Follow-ups:
- None new.

## Final (LOW-2 ruling C applied; full battery on the final head)
- Base 97a9c93b (fetched, unchanged). dse HEAD 63492c9a, superproject HEAD bbfbeade. LOW-2: no code; one sentence added to both CHANGELOG entries (a refused click whose block is still in the note stays on the card; the next click saves it with the new one; leaving the note first drops it).
- New commits since the partial report: 63492c9a docs(SC-480 r4): dse CHANGELOG sentence; bbfbeade (superproject) the same.
- tsc rc=0; lint rc=0 (sc480-r4-gate-tsc.log, sc480-r4-gate-lint.log).
- jest: `Test Suites: 2 failed, 1 skipped, 258 passed, 260 of 261 total` / `Tests: 2 failed, 2 skipped, 7062 passed, 7066 total` (sc480-r4-gate-jest.log); the 2 failures are the SC-568 timeouts (initiative-default-keys, twin-reuse); alone `Tests: 78 passed, 78 total` (sc480-r4-gate-jest-sc568-alone.log). 7049 baseline + 15 = 7064 non-skipped.
- lifecycle (five parts): `21/21 ok` (190 s), `16/16` (356 s), `9/9` (405 s), `4/4` (306 s), `3/3` (G-S59 G-S49 G-S73, 217 s; `G-S73 ok (16 trials ...)`) = 53/53. Logs sc480-r4-gate-lifecycle-part{1..5}.log.
- e2e: `OBSIDIAN-E2E done: 249/260 ok, 0 failed, 11 known-bug, coverage: 161/161 pairs`, rc=0, 348 s (sc480-r4-gate-e2e.log), the 4th full run. Runs 1-3 (…-run1/run2/run3-….log) failed `RECOV-R07` (run 2 also `CENSUS-07` timeout) at loadavg 20-30 caused by other agents' e2e/jest runs. Attribution: `--only=RECOV-R07` x3 on this head: pass, FAIL, pass; x3 on a clean 97a9c93b source tree at the same load: pass, FAIL, FAIL, same message "Expected: 1 Received: 2" (sc480-r4-recov-r07-flake-mine-vs-base.txt). The 3 base failures show it is a load flake independent of this change.
- styles.css sha256 4295ca33cd77d5c337035c332dcf635b82072693... (e2e build of the final head) == clean 97a9c93b; shots/freeze/parity carry, not run.
- Proposal refreshed: sc480-dse-verify-proposal.md (CURRENT block with these numbers, G-S73 16 trials, RECOV-R07 flake footgun).
