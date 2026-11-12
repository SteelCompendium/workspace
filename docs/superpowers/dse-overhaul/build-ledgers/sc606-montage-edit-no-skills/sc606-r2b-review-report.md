# SC-606 r2b review report (replacement reviewer a39ccd19a0e73e279)

## Executive summary
- Verdict: **FIX** (one MEDIUM against the binding O2 ruling and the CHANGELOG wording; one cheap fix closes it). The ticket's crash is fixed at every site; tests are real.
- Reviewed dse df250b20 on 8b84b635 (superproject wt 7ab086d2). Findings: 0 CRITICAL, 0 HIGH, 1 MEDIUM, 2 LOW, 3 INFO.
- MEDIUM-1: editing a logged action for a hero with no `skills_used` list (note-only edit, result-only edit, or Save with nothing changed) writes `skills_used: [<the action's skill>]` into the note. The hero's skills did not change.
- Gates on head (fresh `git archive` exports): tsc 0, lint 0; jest 7354 passed / 4 skipped / 263 of 264 suites (= 7356 / 2 in-workspace: the 2 extra skips are token-coverage's workspace-map block, which skips outside the workspace); e2e `272/276 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs` (130 s); lifecycle part 5 (G-S59 G-S49 G-S73 G-S77 G-S83 G-S87 G-S91) `7/7 ok, 0 failed` (399 s, loadavg 1-4).
- Real Obsidian 1.15.1 (`monttextns` probe + a plain Reading-view edit): base red (TypeError `reading 'slice'` at `refreshSkillWarning <- renderSkillField <- onOpen`, half-built sheet with only Result and Skill, no Save or Remove, preview gone at +30 ms in rv:0, lp:0, rv:400; 4 page errors). Head green (full sheet, no error, modal and preview kept at +30 and +700 ms; Escape closes only the modal; PAGE_ERRORS []).
- Tests are not vacuous: base src + head tests gives 12 failed of 234 in the three files. Each of 5 mutations of the fix is caught (6 / 1 / 5 / 5 / 3 failures).
- Scalar `skills_used: Climb` (reserved probe): no crash on head (base crashed on any log with a skill), but the hand-typed skill is ignored. The reuse warning for it stops firing, the first logged skill replaces it, and Reset leaves it in the note. Rated LOW.

## Method
All probes ran in private `git archive` exports under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc606-r2b-a39ccd19a0e73e279/` (base 8b84b635, testsonly 95ca46f0, head df250b20, headjest df250b20 fresh for the full jest run, mutA..mutE, basebld/headbld for bundles). Each had a symlink to the worktree's node_modules. The worktree, the main checkout and the previous reviewer's scratch were not written to. Command shape: `devbox run -c <export> -- bash <script>`, with scripts written by the Write tool, no `rm`, and every log in a file.

- Model probe: `zzsc606r2bprobe.test.ts.txt`. This is the previous reviewer's probe re-run by me (its saved JSON predates its last edit), plus r2b cases. It covers 6 shapes (KEYLESS, NULLKEY `skills_used:`, NULLLIT `null`, SCALAR `Climb`, ORPHAN in entries but not in participants, NOPART no `participants`) × 23 operations (146 cases) (log with and without a skill, correct skill change/clear/move/same skill/note only, remove, undo, reset, end round/back, tally/band/next hero, add hero, add round/limits, O2 other-hero write, log then undo/remove, reuse warning).
- DOM probe: `dom-append-r2b.ts.txt`, appended to head's `montage.test.ts` and run with `-t "r2b probe"` in base and head. It drives the real sheet, ⋯ menu, action bar and quick trio for KEYLESS / NULLKEY / SCALAR / KEYED2.
- Real Obsidian: the implementer's SC-598 r3 probe (`scenario.js`, `make-probe.py`, `summarize.py`), copied unmodified. `run.sh`/`final.sh` were rewritten for my paths. Trials: `plain,monttextns:rv:0,monttextns:lp:0,monttextns:rv:400,monttext:rv:0`, bundles pinned via `DSE_LIFECYCLE_BUNDLE` (base main.js 07bb7ea2…, head 499479e2…, styles.css identical 5e5ff488…).

## Survey (O1): every `skills_used` read/write
Sites: `model.ts:53-55` `skillsOf`, `:349-357` remove, `:359-366` add, `:384` `wouldReuseSkill`, `:455` `addMontageHero`, `:480-483` reset. `parseModel` takes `participants` verbatim (`:177`), and `serialize` passes it through (`:212`). BoardView/HeadView/OutcomeBandView read only `name` and length. Nothing else in src/ touches participant skills (`fixture-*.yaml`, `example.yaml`, `docs/gm-trackers.md`, `visual-harness` only author lists). Head throws nothing in any of the 146 model cases or 24 DOM cases. Base throws in 57 model cases and in 11 of 24 DOM cases (every one that reaches a skill read or write) (`model-probe-cmp.txt`, `dom-probe-cmp.txt`). ORPHAN and NOPART behave the same on base and head (no crash on either).

## Findings

### MEDIUM-1: an edit that leaves the skill unchanged writes `skills_used` into a key-less hero's entry (O2, CHANGELOG)
- Where: `src/elements/montage/model.ts:420-432` (`correctMontageEntry`: always undoes, then re-applies), combined with `:359-366` (`addSkillOccurrence` creates the key) and `:349-357` (remove is a no-op without a list).
- Scenario: a roster `- name: Kira` (no list) and an entry `hero: Kira, round: 1, result: success, skill: Nature`. Click the action, fix a typo in the Note (or change only the Result, or press Save without changing anything), then Save. The note now reads `- name: Kira\n    skills_used:\n      - Nature`. Measured in the real sheet: DOM probe `KEYLESS.edit-save-unchanged` and `KEYLESS.edit-note-only`, with the same result for NULLKEY and SCALAR. Model probe `*.correct-note-only` and `*.correct-result-only-same-skill`. A later Remove of that action then leaves `skills_used: []` (`*.correct-note-only-then-remove`).
- Why it matters: O2 reads "a write that does not change a hero's skills must not add `skills_used: []` (or any new key)". The CHANGELOG bullet says "your note only gains a `skills_used` list for a hero once a skill is logged for them". Both are false for this path. The same undo-then-reapply also reorders a keyed hero's list on a note-only edit (`[Nature, Alertness]` becomes `[Alertness, Nature]`; `KEYED2.*` in both probes). That reorder is identical on base and is pre-existing.
- Fix: in `correctMontageEntry`, record `const sameSkill = existing.hero === next.hero && existing.skill === next.skill;` before mutating `existing`. Then run `removeSkillOccurrence` / `addSkillOccurrence` only when `!sameSkill`. The tally delta stays as is. The net effect on every list is the same, and it also removes the pre-existing reorder. Add tests: (a) DOM, key-less hero, edit, change only the Note, Save; the write keeps `  - name: Kira\n` with no `skills_used`. (b) Model, keyed `[Nature, Alertness]`, note-only correction of the Nature entry; the order is unchanged. The existing "correct to a new skill creates the key" test is unaffected.
- Owner judgment: if you prefer that an edit materializes the action's skill (consistent game state), keep the code and reword the CHANGELOG sentence and O2 instead.

### LOW-1: a hand-typed scalar `skills_used: Climb` is ignored and then overwritten
- Where: `model.ts:53-55` (`skillsOf`: not an array means no skills), `:362-365` (add: replaces a non-array with `[skill]`), `:350-354` (remove: no-op), `:480-483` (reset: leaves a non-array alone).
- Measured: the head sheet shows no reuse warning for Climb. The base did show it ("Kira already used Climb in this montage", though base also matched the substring `Cl`). Logging Insight writes `skills_used: [Insight]`, so Climb is lost. Any edit of Kira's Nature action writes `[Nature]`. Reset writes `skills_used: Climb` back, where base wrote `[]`. The base crashed (`p.skills_used.push is not a function`) on every log or correction with a skill, so head is strictly better on crashes. This is a data-fidelity edge on malformed input.
- Fix (if wanted): treat a non-empty string as a one-item list. In `skillsOf`, `typeof v === 'string' && v !== '' ? [v] : …`. In add and remove, first normalize: `if (typeof p.skills_used === 'string') p.skills_used = [p.skills_used];` (only reached when the hero's skills actually change, so O2 holds). In reset, also empty a string value. One model test per site. Otherwise accept and record it as a known limit.

### LOW-2: fake timers can leak out of the new DOM tests
- Where: `test/dom/elements/montage.test.ts`, the new describe "the Montage sheet for a hero whose entry has no skills_used list": tests 3 and 4 (`montage.test.ts:2476`, `:2490`) call `jest.useRealTimers()` as the last statement of the test body.
- Scenario: if an assertion above it fails, fake timers stay installed for every later test in the file, which hides the real failure under unrelated timeouts.
- Fix: move `jest.useRealTimers()` into the describe's `afterEach`.

### INFO-1: `skills_used:` (empty, null) is written back as `skills_used: null`
Any write (Reset, Undo, quick-log) re-serializes it as `skills_used: null`. Base does the same on the writes that did not crash (`NULLKEY.quick-success` SAME). This is the plugin's normal YAML normalization, like flow lists becoming block lists, not churn from this diff. Head Reset keeps `null` where base wrote `[]`. No action.

### INFO-2: logging a skill for a key-less hero, then removing that action, leaves `skills_used: []`
`*.log-then-undo`, `*.log-skill-then-remove-entry`. The user changed the hero's skills twice, and the empty list is the schema shape. Not churn on an untouched note. No action.

### INFO-3: jest counts in an export
The 2 extra skips are `test/dom/framework/token-coverage.test.ts`'s workspace-map block, which skips by design when no workspace sits beside the plugin. The 1 skipped suite matches CURRENT's "264 of 265 suites". 7354 + 2 = 7356 = 7341 + 15 new.

## Tests are not vacuous (three changed files, 234 tests)
| Tree | Result | Caught by |
|---|---|---|
| testsonly (base src + head tests) | 12 failed | 7/8 tally (log-without-skill passes by design), 1/3 serialize, 4/4 DOM |
| head | 0 failed | |
| mutA: `wouldReuseSkill` unguarded (the ticket's crash site) | 6 failed | 2 tally + 4 DOM |
| mutB: reset unconditional | 1 failed | reset test |
| mutC: add back to base `push` | 5 failed | 3 tally, 1 serialize, 1 DOM |
| mutD: remove guard dropped | 5 failed | 3 tally, 2 DOM |
| mutE: alternative "default at parse" fix | 3 failed | 2 serialize O2 tests, 1 DOM Remove test |

## CHANGELOG (superproject d12a014d)
The bullet is plain and user-facing, with no internal jargon beyond the `skills_used` key the user types. Its last clause is inaccurate until MEDIUM-1 is fixed (see above). Otherwise it is accurate. Commits carry no AI or co-author trailers.

## Follow-ups (out of scope)
- If MEDIUM-1 is not taken: the pre-existing reorder of a keyed hero's `skills_used` on a note-only or result-only edit (base and head) deserves a Backlog ticket.
- Already ruled: SC-610 (null or nameless participant), F2 (`addMontageHero` writes `skills_used: []`).

## Evidence (all under /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc606-r2b-a39ccd19a0e73e279/)
- status-before.txt / status-after.txt: git status of worktree, plugin and main checkout before and after
- setup.sh, mutate.py, setup.log, basebld-build.log, headbld-build.log: exports, the five mutations, bundle builds and sha256
- zzsc606r2bprobe.test.ts.txt, probe-model.sh, cmp.py, model-probe-base.json, model-probe-head.json, model-probe-cmp.txt: model probe
- dom-append-r2b.ts.txt, probe-dom.sh, dom-probe-base.json, dom-probe-head.json, dom-probe-cmp.txt, dom-probe-base.log, dom-probe-head.log: DOM probe
- probe-vacuity.sh, vac-summary.py, vac-summary.txt, vac-<tree>.json/.log: red-on-base and mutation runs
- probe/ (scenario.js, make-probe.py, summarize.py, run.sh, final.sh), probe-base.log, probe-head.log, probe-base-raw.log, probe-head-raw.log: real-Obsidian probe
- gate-tsc.log, gate-lint.log, gate-jest.log, gate-jest-prestate.log, gate-e2e.log, gate-lifecycle-p5.log: gates
