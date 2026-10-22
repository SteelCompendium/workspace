# SC-483 r1 independent review (reviewer B) — dse b6f73ed on bc4a0c5

**Executive summary**
- Verdict: **LAND-READY** (after the r2 rebase onto 772c3cd that the owner has already ruled). No BLOCKER, HIGH or MEDIUM findings.
- Findings: 0 BLOCKER / 0 HIGH / 0 MEDIUM / 1 LOW (an untouched form on an empty schema'd block writes `{}`) / 6 INFO (3 of them are pre-existing out-of-scope follow-ups, including the chrome pencil also opening the Stamina editor).
- Real Obsidian (e2e harness, pinned 1.14.4, private Xvfb, `experimental: true` + `authoringControls: true`), 8 Reading-view probe scenarios: **base bc4a0c5 RED 2/8** (P01 repro writes `style: default`); **fix b6f73ed GREEN 8/8**. Harness invariants also held: other fences byte-identical, no page errors, no orphan modal.
- Jest probes (real definitions, real FormModal), base vs fix: stamina, skills and roll untouched/touched writes match the owner rule. Mutation testing: 7 of 7 mutants were killed by the new tests.
- Gates on b6f73ed, run before the narrowing: tsc (incl. e2e) clean · lint clean · jest **5469 passed / 1 skipped / 232 of 233** · lifecycle **30/30** (port 9298) · e2e **`89/93 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs`**, run `20261021-181308-1e3b`. Shots were stopped mid-run on the owner's course correction, and freeze and parity were not run (out of scope after the narrowing). Targeted `formModal.test.ts`: 22/22.
- SC-457 (bc4a0c5..772c3cd): it does not change how FormModal's Save reaches the file, so the fix needs nothing for it. No file overlap with this branch.

## Findings

### LOW-1 — an empty schema'd block saved untouched writes `{}`
- `src/authoring/FormModal.ts:217-224` (`withoutUntouchedSeeds` → `stringifyWorking`).
- Scenario: an empty ` ```ds-roll ``` ` block (or `~`). Open the form and click Save without changing anything. Fix writes `{}\n` as the body. Base wrote `mode: power-roll\ndifficulty: easy\n`, which was worse, so this is not a regression. It still writes something the user never typed.
- Fix: in `stringifyWorking`, when `Object.keys(data).length === 0`, emit `''` for the body (keep the `prefs:` prefix if there is one). Add a jest case: an empty-source schema'd element with only optional selects, saved untouched, writes `''`.

### INFO-1 (pre-existing, out of scope — owner to triage or file) — the stamina-bar "Edit Stamina bar" pencil also opens the Stamina editor
- Observed in real Obsidian on **both** base and fix: on 9 of 9 stamina opens (including a `style: sheet` block), clicking the chrome pencil opened the Edit form **and** the "Stamina" modal on top of it. Skills and Roll opened only their form.
- Likely cause: `src/framework/kit/StaminaBarPanel.ts:133` registers `click` on `bar`. The chrome anchor is `.dse-stamina__cluster` inside `bar` (`src/elements/stamina-bar/view.ts:132`), so the pencil's click bubbles to the bar handler.
- Fix direction: stop propagation in chrome item clicks, or have the bar handler ignore events from inside `.dse-chrome`.
- Only reachable with `experimental` + `authoringControls` on.

### INFO-2 (pre-existing, out of scope) — elements without `serialize` get a blank line before the closing fence
- Real Obsidian, base and fix alike: skills writes `skills:\n  - climb\n\n```` and roll writes `roll: Might test\nedges: 2\n\n````.
- `stringifyYaml` output ends in `\n` (`FormModal.ts:223`), and the host splice adds the line break before the fence as well. Stamina (which has `serialize`) is clean.
- Fix direction: `trimEnd()` the body on the stringify path. This is a follow-up, not SC-483.

### INFO-3 — SC-489 confirmed; it rewrites EVERY field with a `transform`, not only the ones the user edited
- Untouched skills Save: `Climb` → `climb`.
- Skills block with `style: Chips` where only "Only show selected" was toggled: written as `style: chips`.
- Stamina `style: Sheet` (declared, untouched): written as `style: sheet`.
- The cause is validation's ajv-keywords `transform` mutating `working` at open (`revalidate()` → `validation.validate(..., this.working)`). The SC-483 fix neither worsens nor improves this. Stripped seeds are unaffected.

### INFO-4 — the required-select guard (A's judgment call) is unreachable by built-ins and causes no wrong write
- Survey of all 22 registered elements through `fieldsFromSchema` and `shapeFromSchemaYaml().required`: there are 4 top-level selects (stamina-bar `style`, skills `style`, roll `mode`/`difficulty`), all optional.
- No built-in schema has a required select, so the guard only ever affects third-party or test schemas. There it keeps a schema-valid block, which is correct.
- Caveat: Save writes the stripped data but validation ran on the seeded data. The guard covers top-level and allOf `required` only, not `if/then`, `dependentRequired` or `oneOf` that names a select. No built-in uses those, so this is acceptable. The guard's doc comment could say so.

### INFO-5 — the re-asserted "Minor" test hides nothing
- The diff changes only the title and one assertion (`toContain('style: default')` → `not.toContain('style')`). `canSave()` is still asserted.
- That test no longer proves the seed lands in `working`, because `canSave()` passes without it (no required fields). The seed is still covered by the new "validation and the live preview still see the seeded value" test (`required: [style]` + mounted model `style: 'default'`).
- This is the ticket's intended reversal, and nothing else was dropped.

### INFO-6 — reachability and probe scope
- `authoringControls` exists only with the SC-406 release gate open (`experimental: true` in data.json). With the shipped default the pref is withheld and there is no pencil, so the bug and the fix are both experimental-only.
- Live Preview was **not** probed in real Obsidian: the harness could not make the hover-revealed pencil interactable there. Reading view was probed. LP shares the same FormModal → `replaceSource` path.

## Probe evidence

### 1. Real Obsidian (e2e harness, throwaway spec + fixtures, copied in and removed by the script)
| id | scenario | base bc4a0c5 | fix b6f73ed |
|---|---|---|---|
| P01 | repro: 20/15, Max → 25, Save | `max_stamina: 25\ncurrent_stamina: 15\nstyle: default` RED | `max_stamina: 25\ncurrent_stamina: 15` GREEN; note text byte-exact incl. ABOVE/BELOW |
| P02 | two blocks, Save on block 2 | block 2 gets `style: default` RED | block 1 byte-identical, block 2 `max 12 / current 8` only GREEN |
| P03 | declared `style: default` | kept | kept |
| P04 | Style → sheet, Save; reopen on same view; Max → 30, Save | `style: sheet` both saves; reopen shows `sheet` | same |
| P05 | untouched Save, reopen (form shows Max 25 = NEW source), Current → 10, Save | `style: default` written RED | `max_stamina: 25\ncurrent_stamina: 10` GREEN |
| P06 | hand comments + order (`# hand comment`, `current_stamina: 15 # inline`, `max_stamina: 20`) | comments dropped, order canonical, + `style: default` | comments dropped, order canonical, no style (comment and order loss pre-exists, not a regression) |
| P07 | skills untouched Save | `style: list` added (changes layout) RED | no style GREEN |
| P08 | roll Edges → 2 | `mode: power-roll`, `difficulty: easy` added RED | `roll: Might test\nedges: 2` GREEN |

- The harness's per-test invariants (other fences byte-identical to the fixture, edited fence lines intact, no page errors, no orphan modal, registry collisions 0) passed for all 8 tests on the fix.
- Logs: `e2e-probe-fix.log` (run `20261021-184005-4a93`), `e2e-probe-base.log` (run `20261021-184045-742d`, from a scratch `git worktree` at bc4a0c5 that has since been removed).

### 2. Jest probe (real definitions, real FormModal), base → fix
- `stam-repro`: `…\nstyle: default` → `max_stamina: 25\ncurrent_stamina: 15`
- `stam-untouched` and `stam-prefs`: style dropped. The `prefs:` map is still re-emitted first.
- `stam-declared-default`: unchanged. `stam-null-style` (`style:`): `style: default` in both, as the rule says.
- `stam-touch-sheet` / `stam-touch-back`: `style: sheet` / `style: default` in both.
- `skills-untouched`: `style: list` → no style. `skills-touch-ledger`: `style: ledger` in both.
- `roll-untouched`: `mode` and `difficulty` dropped. `roll-edges`: `roll + edges` only. `roll-touch-diff-hard`: `difficulty: hard` only.
- `roll-empty` and `roll-null-source`: `{}` (LOW-1).

### 3. Callers of `currentBody` / `working`
- `save()` uses stripped data (`:296`).
- `renderPreview()` passes seeded `working` plus `currentBody(false)` (`:256`).
- `revalidate()` validates seeded `working` (`:237`).
- Raw mode returns `rawText` verbatim (`:201`).
- There is no other raw or copy path in FormModal.
- The pipeline (`pipeline.ts:723,774`) and hero (`hero/view.ts:257`, `serializeStateSplice()`, which has no select) only hand in the source. A fresh `FormModal` is built per open, so `untouchedSeeds` cannot go stale.
- P04/P05 show that a reopen reads the new on-disk body (`lastKnownBody` on the adopted Reading view).

### 4. Mutation testing (`formModal.test.ts`, 22 tests; unmutated 22/22)
| mutant | result |
|---|---|
| M1 base FormModal | 7 failed |
| M2 Save passes `false` | 7 failed |
| M3 onChange keeps the seed | 3 failed |
| M4 no required guard | 1 failed |
| M5 no absent-from-source check | 1 failed |
| M6 preview stripped | 2 failed |
| M7 serialize parses `working` | 2 failed |

All 7 were killed. `FormModal.ts` was restored to b6f73ed after each mutant.

### 5. SC-457 (bc4a0c5..772c3cd, `src/` only)
- What changed: the new shared `fenceLanguage()` (`blockPrefix.ts`), used by `fenceLine.parseOpenFenceLine`, `anchor.fenceAlias`/`matchFenceLine` and `fenceScan`. It skips leading spaces and tabs before the language.
- What stays the same: the body contract of `replaceSource` and the splice in `replaceFenceBlock`. FormModal only supplies the body.
- Effect: blocks written as ` ``` ds-x ` (with a space before the name) now also locate, which helps the form's Save rather than needing any change in it.
- 772c3cd does not touch `FormModal.ts` or `formModal.test.ts`, so the rebase should be conflict-free.

## Housekeeping
- Plugin tree: `git status --porcelain` was empty before and after. HEAD b6f73ed. The superproject's ` M draw-steel-elements` is pre-existing (A's unbumped pointer).
- Scratch git worktree at bc4a0c5: created, then removed (`git worktree remove` + `prune`).
- Leftover gitignored run folders, kept per the dispatcher's instruction for the owner to decide:
  - In `draw-steel-elements/e2e/.out/`: my full e2e run `20261021-181308-1e3b`, six failed probe-debug runs (`20261021-183015-f84d`, `-183222-8540`, `-183433-283d`, `-183648-0847`, `-183705-0389`, `-183832-9f79`) and the green probe run `20261021-184005-4a93`.
  - `e2e/.out/coverage.json` was last written by a partial probe run.
  - A's evidence run `20261021-174047-db37` is still present.
- The shots run I started was stopped by the course correction. It wrote into the gitignored `visual-harness/shots/` (partial), so a shots run is needed before freeze. The r2 battery does that anyway.

## Artifacts (all under the scratchpad `sc483-r1-review-b/`)
- `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc483-r1-review-b/`
  - Gate logs: `tsc.log`, `lint.log`, `jest.log`, `life.log`, `e2e.log`, `shots.log` (partial)
  - Jest probe: `zzSc483ProbeB.test.ts`, `probe-fix.log`, `probe-base.log`
  - Mutation testing: `mutants.txt`, `mut-*.log`
  - Real-Obsidian probe: `e2e-probe/spec/form.e2e.ts`, `e2e-probe/fixtures/SC483/*.md`, `e2e-probe/results-fix-final.jsonl`, `e2e-probe/results-base.jsonl`, `e2e-probe/fix-run-bundle/`, `e2e-probe/base-run-bundle/`, `e2e-probe-fix.log`, `e2e-probe-base.log`
  - Scripts: `run-probe.sh`, `run-mutants.sh`, `run-e2e-probe.sh`, `gate-*.sh`
