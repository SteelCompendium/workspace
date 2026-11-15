# SC-646 decisions ledger: failed Sync leaves "Uncaught (in promise)"

Ticket: SC-646 (Linear). Owner: ticket-owner (Opus 5.5). Worktree:
`/home/scott/code/steelCompendium/worktrees/sc646-sync-uncaught-promise` (branch
`sc646-sync-uncaught-promise` in every submodule), cut from dse develop `a9f0af1d`, workspace
origin/main `60a9df1d`.

## Scott rulings

None. The ticket is a plain bug with no open design question (2026-11-14: thread empty).

## Owner rulings (2026-11-14)

- Scope: the failed-Sync error path only. Fix every caller of `plugin.syncCompendium()` (and
  the Check button if it has the same dropped-promise shape) that leaves a rejection unhandled.
  The Notice and the designed `console.error("compendium sync failed: …")` stay exactly as they
  are (one each); the fix adds no second Notice and no second log line.
- `CompendiumSyncService.sync` keeps rethrowing (its doc contract). Do not change the service.
- The e2e marker `knownBug('SC-646', '[SET-C04] …')` in `e2e/specs/settings/compendium.e2e.ts`
  becomes a plain `test`, and its `allowPageErrors` drops the `rejection:` alternative, so the
  per-test "no page errors" invariant guards it too.
- Overlap check (2026-11-14): parked SC-644 touches `e2e/driver/dse.ts`,
  `e2e/specs/settings/{gate-on,live-behavioural}.e2e.ts`, `pipeline.ts`, `livePrefs.ts`,
  `focusHandoff.ts`, hero view. SC-653's worktree has no commits. Neither touches
  `SettingsTab.ts` or `compendium.e2e.ts`. If this effort must touch `main.ts`, record it here
  and tell the dispatcher.
- Lifecycle id G-S142 reserved but not expected to be needed (no lifecycle scenario for this).

## Rounds

- r1 implementer (2026-11-15): DONE. Plugin head `281f1f43` (fix `6f2dcc90`, tests `281f1f43`),
  superproject CHANGELOG `a434c174`, no pointer bump. **Touched `main.ts`** (+32/-6: command
  callback, `syncAfter`, `syncAnyway`, legacy-modal `onChoice`, helper `logUnlessSyncReported`);
  dispatcher told. Gates: jest 13359/2 fresh, lifecycle 64/64, e2e 608/620 ok 0 failed 12
  known-bug 417/417, styles.css identical (shots/freeze/parity carry). Follow-ups: (1) prelude
  failures in `syncCompendium` now silent (were an uncaught console error); (2) `markDeclined` /
  `finishRemaining` can still leave an unhandled rejection; (3) dse-verify numbers.
- Owner ruling on follow-ups (2026-11-15): (1) a failure that was visible before (even only as
  an uncaught console error) must not become silent: the reviewer probes and prescribes; it is
  folded into the fix round. (2) folded into the fix round if the reviewer confirms (same
  dropped-promise class, same files). (3) dispatcher's job at landing (numbers go in the
  land-ready report).
- r1 review (2026-11-15): FIX. 1 HIGH (prelude failures silent: follow-up 1 confirmed),
  1 MEDIUM (`declined`, `finishRemaining`, `migrate-compendium-layout` command can leave an
  unhandled rejection: follow-up 2 confirmed, pre-existing), 1 LOW (the
  `process.on('unhandledRejection')` listeners in the 3 new tests never record anything), 4 INFO
  (helper correct, keep; redundant `void` at main.ts:810/:927; audit complete; CHANGELOG fine).
  Report: `sc646-r1-review-report.md`; candidate diff
  `scratchpad/sc646-r1-review/rv-candidate-fix.diff`.
- Owner ruling (2026-11-15): fold HIGH, MEDIUM, LOW and the `void` nit into fix round r2 as the
  reviewer prescribed. No Backlog tickets needed. Full battery re-run at the final sha
  (lifecycle and e2e are required to land). r2 also commits the ONE pointer bump.
- Dispatcher baseline move (2026-11-15): SC-640 landed; dse develop `cefa9ca8`, workspace main
  `17af24be`. Numbers at cefa9ca8: jest fresh 13389 / 2 (13390 / 1 shots cache), lifecycle
  64/64, e2e `611/622 ok, 0 failed, 11 known-bug, coverage: 417/417 pairs`, shots 592,
  host-leak 163/978, modal host-leak 40/240, capture clip 147, freeze 280/280, parity 0/0/24.
  SC-653 main.ts overlap noted in the handoff: whichever lands second rebases. Relayed to the r2
  implementer: rebase both, expect e2e `612/622 ok, 0 failed, 10 known-bug, 417/417`.
- r2 fix round (2026-11-15): DONE. Plugin `975f0dcc` on `cefa9ca8` (2091c3d2 fix, 1a8efe3a
  tests, ee4d76d3 fix r2, 975f0dcc tests r2). Superproject on origin/main `c63ec316`: CHANGELOG
  `cd7e3d4b` + ONE pointer `972e5c6b` (-> 975f0dcc). Gates at 975f0dcc: tsc/lint rc=0, jest fresh
  13402 / 2, lifecycle 64/64, e2e `612/622 ok, 0 failed, 10 known-bug, coverage: 417/417 pairs`,
  styles.css 18730938…f1f9 identical to cefa9ca8 (shots/freeze/parity carry). Mutants: A 7 red,
  B 13 red.
- r2 scoped re-review (2026-11-15, fresh reviewer identity): LAND. LOW 1: `main.ts:794` (first
  `syncStarted = true`) has no guarding test; deleting it (M5) passes all tests but double-logs an
  already-reported failure. INFO 1: stale comment `main.ts:801-803` ("`void`-discarded async
  IIFE"). INFO 2: inner `syncStarted` shadow at :816 correct, no change.
- Owner ruling (2026-11-15): fold LOW 1 (the prescribed test, proven red under M5) and INFO 1
  (comment) into r3. Drop INFO 2 (correct as is). Gates for r3: tsc, lint, jest full; lifecycle
  and e2e carry only if the built `main.js` is byte-identical to the 975f0dcc build (comment-only
  source change), else re-run both. Amend the single pointer commit to the new sha (still ONE).
- r3 (2026-11-15): DONE. Plugin `ad21dc87` (test + comment), M5 red. jest fresh 13403 / 2;
  `main.js` sha256 5130878a… identical to 975f0dcc, so lifecycle 64/64 and e2e
  `612/622 ok, 0 failed, 10 known-bug, 417/417` carry. Superproject on origin/main `c63ec316`:
  CHANGELOG `cd7e3d4b` + ONE pointer `c9bc346f` (-> ad21dc87). Owner checked the r3 diff
  (test + comment only, no runtime change) and the branch state.
- LAND-READY reported to the dispatcher 2026-11-15.
