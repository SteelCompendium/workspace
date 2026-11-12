# SC-610 r1 implementer report

## Executive summary
- Verdict: DONE. A montage `participants` item that is not a hero (null, scalar, bare string, no `name`, `name: ''`, `name: 7`) no longer throws or draws a row; the board skips it and a write leaves it as typed, in place.
- dse head `3a0f3079` (tests-first `7bd2ea25`, fix `3a0f3079`) on base `7866426e` (rebase: already up to date, develop unmoved). Superproject worktree head `2bd2a2f6` (CHANGELOG only; the submodule pointer is left unstaged, as the land step bumps it).
- tsc clean (incl. e2e project), lint clean. jest 7747 passed / 2 skipped (7707 + 40 new); after shots 7748 passed / 1 skipped.
- lifecycle 58/58 ok, 0 failed (six parts 21 + 16 + 9 + 4 + 7 + 1). e2e `278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`.
- shots 592; button host-leak OK (163 kinds, 978 comparisons); modal button host-leak OK (39 kinds, 234 comparisons); capture clip OK (147). freeze `280/280`, 0 FAILED (no shot moved). parity `0 gap(s), 0 undeclared warning(s), 24 declared`.
- Real Obsidian 1.15.1 probe: base (`- ` item) the card shows "failed to render ... Cannot read properties of null (reading 'name')"; base (other shapes) draws rows `undefined`/``/`7` and the Log an action button is disabled. Head: board shows Kira and Bram only, no page error, write lands, each bad item's text unchanged and in place (the empty `- ` is dropped).
- No SKILL.md edit, no lifecycle scenario added (O4/O5). No drive-by fixes.

## Survey (base `7866426e`)
Scratch survey (uncommitted jest test; JSON at `.../scratchpad/sc610-r1-impl/survey-base.json`, head at `survey-head.json`, test source at `zzscratch-sc610-survey.test.ts.txt`). Participants were `[bad, Kira, Vex]` with Kira having acted in round 2.

Sites that read a participant (grep of every `participants` / `.name` / `findParticipant` use in `src/`; nothing outside `src/elements/montage/` reads montage participants — party / FormModal / pipeline only mention montage in comments):
`model.ts`: `findParticipant` (used by `addSkillOccurrence`, `removeSkillOccurrence`, `wouldReuseSkill`), `nextHeroToAct`, `resetMontageProgress`, `addMontageHero`, `parseModel`, `serialize`. `BoardView.build`, `HeadView.build` (hero count), `OutcomeBandView.build` (party count + roster set) and `buildNotes` (`rosterIndex`). `view.ts` and `LogActionModal` only call the model helpers (the sheet has no hero picker: the hero is fixed at open from the clicked cell / row button / `nextHeroToAct`).

| bad shape | render (board/head/outcome) | `findParticipant` sites (log / correct / remove / undo / reuse warning) | `nextHeroToAct` (bar pre-fill) | reset | add hero | write (serialize) |
|---|---|---|---|---|---|---|
| null (`- `) | THROWS (BoardView `p.name`; the card shows "failed to render") | THROWS when it precedes the hero looked up (`find` short-circuits) | THROWS | THROWS (`p.skills_used`) | fine | n/a (throws first) |
| scalar `- 7` | misbehaves: row labelled `undefined`, head says 3 heroes | fine | returns `undefined`: Log an action button disabled with Kira/Vex still to act | fine | fine | kept verbatim |
| bare string `- Ash` | same as `- 7` | fine | same | fine | fine | kept verbatim |
| `{}` | same (`undefined` row) | fine | same | fine | fine | kept (`- {}`) |
| no name (`nmae: Ash`, `skills_used: [Climb]`) | same | fine | same | fine | fine | kept verbatim |
| `name: ''` | misbehaves: blank row label, counted | fine | returns `''`: button disabled | fine | fine | kept (`name: ""`) |
| `name: 7` | misbehaves: row `data-hero="7"` (a non-string key), counted | fine | returns the number `7`: the bar opens a sheet titled "7 · round 2" | clears its `skills_used` | fine | kept |

Base write behaviour: every non-null bad item was already written back verbatim and in place (no churn on base). The fix keeps that, except items that carry nothing.

## The fix (`src/elements/montage/model.ts` plus three one-line read-site changes)
Option (b): the raw list stays on `model.participants` and every read goes through one exported helper, `montageRoster(m)` (items that are an object with a non-empty string `name`). Chosen over (a) (a usable/unusable split re-merged on serialize) because it needs no hidden side list or position bookkeeping: `serialize` emits the same list objects, so an item the user typed comes back in its place by construction, and `addMontageHero` simply appends. Read sites switched to `montageRoster`: `findParticipant`, `nextHeroToAct`, `resetMontageProgress`, `BoardView.build`, `HeadView.build`, `OutcomeBandView.build` + `buildNotes`. `model.participants` keeps its `MontageParticipant[]` type (existing tests index it) with a doc comment that its items may not be heroes.

- Parse: new `sanitizeParticipants` beside `sanitizeEntries`. One `console.warn` per parse listing the skipped items (if any), in the `sanitizeEntries` style. A non-list `participants` is warned about and ignored (as before it was dropped on write; a string value used to throw).
- Bare scalar string `- Ash` / `name: 7` are NOT read as hero names (O2 exception not taken): simpler, and no skills can attach to a scalar.
- O3: content-bearing bad items (`- 7`, `- Ash`, `- nmae: Ash`, `- skills_used: [Climb]`, `name: ''`, `name: 7`) round-trip parse -> any write -> serialize intact and in position. Items with nothing in them (`- `, `- {}`, `- ''`, `- []`) ARE dropped on write (O3 allows it): without that the null item would be written back as `- null`. A list made only of empty items reads as no participants and writes no `participants` key (L-3 rule). `serialize` is untouched (§B.5 order).

## Tests (40 new, none with a bracketed ticket id in a title)
`test/unit/model/montage-tally.test.ts` (new describe "a participants item that is not a hero with a name works at every read/write site"): per shape x 8: parse warns once and roster is [Kira, Vex]; `nextHeroToAct`/`wouldReuseSkill` read past it; log/correct/remove/undo keep the item as typed; reset + add hero keep it in place. Plus: empty items not written as `null` and content item keeps its place; list with no real hero (roster empty, kept, still takes a hero); list of only empties not written back. (35 cases)
`test/dom/elements/montage.test.ts` (new describe "a Montage block whose participants list holds items that are not a hero with a name"), one block mixing all shapes: board draws Kira/Vex rows only, head "2 heroes", no page error; the bar's Log an action… opens "Vex · round 2"; logging for Vex writes the entry and every skipped item is as typed in place; editing then removing Kira's actions leaves them intact; an all-skipped list draws "No heroes yet". (5 cases)
Red on base: `7bd2ea25` run on base source gave `34 failed, 6 passed` of the 40 (log `.../scratchpad/sc610-r1-impl/red-base.log`). The 6 that pass on base are the log/correct/remove/undo no-churn guards for the 6 non-empty, non-null shapes (base already kept those); they pin the behaviour the fix must not lose. Green after the fix: the same files plus `test/unit/model` and `wrapperDefaultKeys` 769 passed.

## Gates (logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc610-r1-impl/`)
tsc.log, lint.log (rc 0 each; first lint run had one `no-unnecessary-type-assertion` in my helper, fixed and amended into the fix commit); jest-full1.log (7747 / 2 skipped, 264 of 265 suites); lc1..lc6.log (21/21, 16/16, 9/9, 4/4, 7/7, 1/1); e2e.log; shots.log; freeze.log; jest-postshots.log (7748 passed / 1 skipped); parity.log.

## Real-Obsidian probe (uncommitted; Obsidian 1.15.1, Reading view, `DSE_LIFECYCLE_BUNDLE`; base built from `git archive 7866426e`, head from `3a0f3079`, same styles.css sha)
Scripts: `.../sc610-r1-impl/probe/{scenario.js,make-probe.py,run.sh,setup.sh}`. Logs: `probe-base-raw.log`, `probe-head-raw.log` (the `SC610 TRIAL` lines). Trial a: `[- , Kira, - nmae: Ash, Bram]`; trial b: `[- 7, Kira, - Ash, - skills_used:[Climb], Bram, name: '', name: 7]`; click Bram's open round-2 cell, Log, read the note.
- Base a: no board; the card reads "Montage Test tracker: failed to render (render) Cannot read properties of null (reading 'name')" (a caught render error, not a window error). Nothing to click.
- Base b: board draws rows `undefined, Kira, undefined, undefined, Bram, "", 7`, head "7 heroes", Log an action button disabled; clicking Bram's cell works and the write lands, items verbatim.
- Head a: rows `Kira, Bram`, head "2 heroes", button enabled, no page errors; after Log the file has `successes: 1`, `hero: Bram` entry, `- name: Kira / - nmae: Ash / - name: Bram` in that order, the empty `- ` gone, no `null`.
- Head b: rows `Kira, Bram`, 2 heroes, no errors; after Log all of `- 7`, `- Ash`, `- skills_used: [Climb]` (as a block list), `name: ""`, `name: 7` are present in original positions.

Drive-by fixes: none.

Follow-ups:
- A non-list `participants` value (`participants: Ash`) is warned about and dropped on the next write (as a numeric one already was); it carries content, so a stricter no-churn would keep it. Not in O1's list; left.
- The log sheet has no hero picker (hero fixed at open), so ledger O2's "not offered in the log window's hero picker" is satisfied via `nextHeroToAct` (the bar's pre-fill) and the board rows; nothing else to change.
- A `participants` item with trailing whitespace-only `name: ' '` counts as a hero (unchanged behaviour, not in O1).
- `node_modules` in the worktree is a symlink to the main checkout's (git-ignored), made because the fresh worktree had none.
