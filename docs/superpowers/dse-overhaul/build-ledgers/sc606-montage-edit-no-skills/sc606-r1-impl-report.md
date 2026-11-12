# SC-606 r1 implementer report

## Executive summary
- Verdict: DONE. Base unchanged: dse develop 8b84b635 (fetch + rebase was a no-op).
- Heads: dse df250b20 (tests 95ca46f0, fix df250b20); superproject worktree 7ab086d2 (changelog d12a014d, pointer bump 7ab086d2). Not pushed.
- tsc clean; lint clean; jest 7356 passed / 2 skipped before shots (7341 + 15 new), 7357 passed / 1 skipped after shots.
- lifecycle 57/57 ok, 0 failed (parts 21/16/9/4/7); e2e 272/276 ok, 0 failed, 4 known-bug, coverage 169/169 pairs.
- shots 592 files, host-leak 163 kinds/978 comparisons, modal host-leak 39/234, capture clip 147; freeze 280/280, 0 FAILED; parity 0 gaps / 0 undeclared / 24 declared.
- Probe (real Obsidian): base throws the onOpen TypeError, half-built sheet (2 fields, no Save/Remove), preview closes; head: full sheet, no error, preview kept.

## Survey (src/elements/montage/ and every other montage participant touch)
| Site | Crashed on base with a key-less hero |
|---|---|
| model.ts:341 removeSkillOccurrence `indexOf` (remove/correct an entry that has a skill) | yes (TypeError) |
| model.ts:348 addSkillOccurrence `push` (log or correct with a skill) | yes (TypeError; logMontageEntry throws AFTER pushing the entry and moving the tally, so the model is left half-written) |
| model.ts:367 wouldReuseSkill `slice` (LogActionModal.refreshSkillWarning: edit-mode onOpen with a skill on the entry; typing a skill in new mode) | yes (TypeError; this is the ticket's crash) |
| model.ts:464 resetMontageProgress `skills_used = []` | no crash, but adds the key to the note (O2 churn) |
| model.ts:438 addMontageHero writes `skills_used: []` for a NEW hero | no (a new roster entry, left as is) |
| parseModel: `participants` taken verbatim from YAML | no |
| BoardView.ts:86-121, HeadView.ts:29, OutcomeBandView.ts:32/42/175-177 read only `p.name` / length | no |
| everything else in src/ (hero, skills, statblock, display layouts) | unrelated `skills` fields, not participants |
Logging a NEW action for such a hero: with no skill it works; with a skill it throws at 348 (and typing the skill in the sheet throws at 367). Edit mode of an entry with NO skill did not crash (the warning short-circuits on an empty skill). `skills_used:` left empty in YAML parses to null, which crashed at the same sites; now handled the same as a missing key.

## Fix (model.ts only) and O2
- `skills_used` is now optional in `MontageParticipant`; reads go through `skillsOf(p)` (Array.isArray guard, frozen shared empty array).
- remove: no-op unless the list is an array (never creates the key). add: pushes onto an existing array, otherwise creates `skills_used = [skill]` (first skill creates the key; assigned after `name`, so key order stays name, skills_used). reset: only empties a hero that has an array.
- O2 holds because every write path either leaves the key-less participant object untouched or sets the key only when a skill is added. `serialize` was not touched (§B.5 order unchanged). Proven by the serialize tests (another hero's write leaves the key-less entries byte-identical; no key added on an unrelated write).

## Tests added (15; none with a bracketed id in the title)
- test/unit/model/montage-tally.test.ts, describe "a participant with no skills_used key works at every read/write site" (8): wouldReuseSkill key-less; wouldReuseSkill null list (and log onto it); remove; correct to a new skill; correct clearing the skill; log with skill; log without skill (control); reset. Red on base: 7 of 8 (log-without-skill passes on base by design).
- test/unit/model/montage-serialize.test.ts, "a participant with no skills_used key: no file churn" (3): another hero's write leaves key-less entries byte-identical; unrelated write adds no key; key-less hero logging a skill gets the key right after name. Red on base: 1 of 3 (the other two guard against a regression to a "default at parse" fix; they pass on base because the base has no churn on those paths).
- test/dom/elements/montage.test.ts, "the Montage sheet for a hero whose entry has no skills_used list" (4): edit opens a fully built sheet (Result/Skill/Note, sub line, skill value, Save, Remove, warning hidden and empty, no window error); typing a skill throws nothing and shows no warning; Save of a corrected skill writes the key with that skill; Remove writes no skills_used. Red on base: 4 of 4.
- Red-on-base run (12 failed / 222 passed of 234 in the three files): /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc606-r1-impl/jest-red.log was overwritten by the green rerun; the red result is reproduced in the commit 95ca46f0 state (tests only). Green after fix: 234 passed.

## Probe (real Obsidian 1.15.1, trial monttextns, hover preview; plus a plain Reading-view click)
Probe is the SC-598 r3 probe rebuilt in scratch (not committed), bundles built from git archive exports (base 8b84b635, head df250b20; styles.css identical, main.js differs), pinned with DSE_LIFECYCLE_BUNDLE. Trials: plain, monttextns:rv:0, monttextns:lp:0, monttextns:rv:400, control monttext:rv:0 (hero with a key).
- Base: plain edit: sheet open but half-built (labels Result, Skill only; Save and Remove absent; warning element not hidden), page error "Cannot read properties of undefined (reading 'slice')" at refreshSkillWarning <- renderSkillField <- onOpen. monttextns rv:0, lp:0, rv:400: same TypeError at onOpen; after the second click the popover is gone at +30 ms (pop=n) in all three. Control monttext:rv:0 fine. R3 PAGE_ERRORS: 4 TypeErrors.
- Head: plain edit: labels Result/Skill/Note, Save + Remove present, skill input "Nature", warning hidden, no error, Escape closes. monttextns rv:0, lp:0, rv:400: no error; the second click keeps the modal and the preview (pop=Y modals=1 foc=Y is-editing=Y at +30 and +700 ms); Escape closes only the modal; preview stays until an outside click. R3 PAGE_ERRORS: [].
- Logs: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc606-r1-impl/probe-base.log, /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc606-r1-impl/probe-head.log (summaries); raw: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc606-r1-impl/probe-base-raw.log, /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc606-r1-impl/probe-head-raw.log. Scripts: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc606-r1-impl/probe/ (scenario.js, make-probe.py, summarize.py, run.sh, final.sh, setup.sh). Build logs: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc606-r1-impl/base-build.log, /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc606-r1-impl/head-build.log.

## Gates (logs in /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc606-r1-impl)
tsc.log/lint.log (rc 0); gate-jest.log (rc 0); gate-lifecycle-part1..5.log (21/21 184 s, 16/16 332 s, 9/9 404 s, 4/4 297 s, 7/7 393 s); gate-e2e.log; gate-shots.log; gate-freeze.log; gate-jest-postshots.log; gate-parity.log. Notes: a fresh worktree had no node_modules, so I ran npm ci first (npmci.log).

Drive-by fixes: none.
Follow-ups:
- parseModel takes `participants` verbatim, so a participant item that is null / not an object, or a participant with no `name`, would still crash `findParticipant` (`p.name`). Not in scope of this ticket; a sanitizeParticipants (like sanitizeEntries) would close it.
- addMontageHero (the ⋯ menu) still writes `skills_used: []` for a hero it adds. That is a deliberate new entry, left as is; say so if you want it omitted too.
