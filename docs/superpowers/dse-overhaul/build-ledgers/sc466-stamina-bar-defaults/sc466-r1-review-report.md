# SC-466 r1 independent review (reviewer B)

## Executive summary
- VERDICT: LAND-READY. Reviewed dse `e0e2fdc` (3 commits on `0ce76dd`; origin/develop still `0ce76dd`, merge-base = `0ce76dd`) + superproject CHANGELOG `52a22fa`.
- Findings: BLOCKER 0 · HIGH 0 · MEDIUM 0 · LOW 2 · INFO 3. Neither LOW blocks landing. Both sit on the FormModal (opt-in authoring form) write path. Owner decides: fix now or file a follow-up.
- Gates (my runs): tsc and `tsc -p e2e` clean · lint (incl. e2e) clean · jest **5423 / 1 skipped / 232 of 233** · lifecycle **29/29 ok** (port 9297) · e2e **`89/93 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs`** run **20261021-123331-17cf** · shots **572**, 0 FAIL · freeze **276/276** (no delta) · parity **0 gaps / 0 undeclared / 24 declared**.
- Rule check, all combinations: 640 combinations (64 present/absent key masks × default or non-default values × 5 mutations) each equal (a) the ledger rule and (b) the 0ce76dd bytes with the omitted lines struck out. Every fully-declared case is byte-identical to 0ce76dd.
- Mutations: 10 of 10 non-equivalent mutations of model.ts turn the implementer's jest tests red. STAM-W11 goes red when model.ts is reverted to 0ce76dd (run 20261021-124957-1d2e).
- Real-Obsidian probes: 7 of 7 green on the fix and 7 of 7 red with model.ts reverted. They cover the 2nd and 3rd writes, a hand edit between writes, two blocks, Catch Breath then Undo then Catch Breath, and Live Preview.
- INFO-3 is about the gate procedure: the brief's `bash -c '…; echo rc=$? > file'` under devbox always records rc=0 (shown on a real failing run). Gate numbers here come from the summary lines.

## Findings

### LOW-1: a FormModal Save on a minimal block still adds `style: default`
- Where: `src/authoring/FormModal.ts:159` (select widget seeds `working[field.key] = fallback` on open). It reaches `src/authoring/FormModal.ts:183`, `serialize(this.def.parse(data, …))`. There `style` counts as declared, so `src/elements/stamina-bar/model.ts:60` keeps it.
- Scenario: authoring controls are on (pref `authoringControls`, default OFF). Open the form editor on `max_stamina: 20` + `current_stamina: 15`, change Max stamina to 25, Save. The write is `max_stamina: 25\ncurrent_stamina: 15\nstyle: default` (probe D1). Before the fix, this path added all six defaults. Now it adds one.
- The implementer's report §Writers item 6 says "FormModal Save … presence is recomputed from the new source/data, so it tracks the file". That is wrong for `style`.
- Prescribed fix (owner's call; it is in the generic FormModal, outside the stamina serialize path): file a Backlog follow-up next to SC-482. The fix would stop seeding an absent select field into `working`, or drop a seeded key at Save when the user never touched it and it still equals the fallback. Also correct the report's writer list. Not a landing blocker: the path is opt-in and much better than before.

### LOW-2: a key present but set to `undefined` counts as declared
- Where: `src/elements/stamina-bar/model.ts:60`, `!Object.prototype.hasOwnProperty.call(declared, key)`.
- Scenario: only FormModal's `working` can hold an `undefined` value. `parseYaml` never produces one. The cases are `FormModal.ts:149` (a cleared number field becomes `undefined`) and `FormModal.ts:129` (a cleared textarea). Example: type a Height, then clear it, then Save. `height: 1` is written, a key the user never kept (probe B4: `{…, height: undefined}` serializes to `…\nheight: 1`).
- Prescribed fix (optional, one line): treat `declared[key] === undefined` as absent, i.e. `.filter((key) => declared[key] === undefined)`. Mutation M6 (exactly this change) keeps all 89 implementer tests green, so it is safe. A test would need a FormModal clear-field case.

### INFO-1: "absent from the parsed source" means the source the view was built from
- In real Obsidian the view is kept (adopted) across its own write. So a key the PLUGIN wrote can disappear again on a later write once it returns to its default. Probe SCRP-02: on a minimal block, gaining 4 temp writes `temp_stamina: 4`. A Damage 4 then writes the block back to `max_stamina: 20\ncurrent_stamina: 15`, and the line is gone. After a reload or an external edit the view is rebuilt, so the same consume would write `temp_stamina: 0`.
- The value is the same either way, the behaviour matches the ruling's wording ("ABSENT from the parsed source"), and the result is arguably what the user wants (their original shape). No action unless the owner wants writes to be stable across rebuilds. In that case, serialize() would remove each key it actually writes from the record.

### INFO-2: `PARSER_DEFAULTS` copies the parser's defaults
- `src/elements/stamina-bar/model.ts` `PARSER_DEFAULTS` repeats the defaults in `StaminaBar.parse` and the `ComponentWrapper` constructor. Tests catch drift: each M2 mutation that removes one key goes red. One subtlety: dropping `current_stamina` is caught by only one test, the byte-compat "explicitly set" case. No action. Optionally derive the map from `StaminaBar.parse({})`.

### INFO-3: the brief's rc capture is always 0 under devbox
- `devbox run -c <dir> -- bash -c 'node -e "process.exit(1)"; echo rc=$?'` prints `rc=0`, because devbox's generated `.devbox/gen/scripts/.cmd.sh` runs `eval $DEVBOX_RUN_CMD` and expands `$?` early.
- Real evidence: STAM-W11 FAILED on reverted model.ts (`done: 0/1 ok, 1 failed`) and the brief-form rc file says `rc=0` (`e2e-mut-revert.rc`). The script-file form (`devbox run -- bash /abs/script.sh`) returns the real code (`e2e-probe-reverted.rc` = rc=1).
- The dse-verify skill already documents this footgun. The brief template still prescribes the broken form. Both the implementer's and my battery verdicts rest on summary lines, which I checked, so no gate result changes. Fix the brief template.

## Review checks that passed
- **Spec conformance:** model.ts implements the ledger rule exactly. A key absent from the source and still at its default is omitted. Declared keys are always written. An absent key whose value changed is written. Class order is kept, since `Object.entries(model)` gives insertion order. A fully-declared block takes the old `stringifyYaml(model).trim()` path, so it is byte-identical to 0ce76dd.
- **SC-169:** an authored `collapse_default: true`, `collapsible: true` (equal to the default) and `collapse_default: false` (equal to the default) each round-trip. The reserved `collapsed:` and `prefs:` keys still round-trip with no defaults added (probe C3: `prefs:\n  reduceMotion: true\ncollapsed: false\nmax_stamina: 20\ncurrent_stamina: 12`).
- **The record never serializes:** own keys, own property names, symbols, `JSON.stringify` and real `yaml` stringify of a parsed instance are all identical to a plain `StaminaBar.parse` (probe B1). The record is per instance: two parses of the same data object stay independent, and a full block parsed between them does not interfere (B2). A clone has no record and serializes whole (B3).
- **Writers traced:**
  - All of these mutate the same parsed instance in place: StaminaEditModal Apply (`StaminaEditModal.ts:618-623`), Catch Breath and its undo, the Recoveries marker and its undo, the popover, and `ElementView.persist()` (`framework/view.ts:303`).
  - The collapse-chrome toggle never writes.
  - SidebarPanel's external change goes through `prepareModel` and `def.parse`, which builds a fresh record. FormModal is the exception: see LOW-1 and LOW-2.
  - `hero/view.ts:368` `new StaminaBar` and `initiative/view.ts:1435/1879` `fromHero`/`fromCreature` never reach `stamina-bar/model.serialize`; it is imported only by `definition.ts`.
- **Changed fixtures** (stamina-bar.test.ts, staminaRecoveries.test.ts, pref-overrides.test.ts): every changed expectation has a source (`BASIC_YAML`, `RECOVERIES_YAML`, `BASIC_STAM_YAML`, the Kill note body, the "explicitly set" yaml) that omits exactly the removed keys. The pref-overrides `toContain('collapsible')` assertions became `not.toContain`, a correct inversion. No assertion was weakened beyond that.
- **Docs:** CHANGELOG bullet accurate, under `## Unreleased`. model.ts, view.ts, ComponentWrapper.ts and the architecture.md comments are accurate. No AI attribution in any commit.

## Probes and results
| # | Probe | Where | Result |
|---|---|---|---|
| A1 | 640 combinations vs. the ledger rule, plus an independent oracle (0ce76dd bytes with omitted lines struck out) | jest | pass |
| A2 | scrambled authored key order, fully declared, vs. 0ce76dd bytes | jest | pass (identical) |
| B1 | record not visible to keys, names, symbols, JSON or real yaml | jest | pass |
| B2 | per-instance; same data object parsed twice | jest | pass |
| B3 | spread/clone has no record and serializes whole | jest | pass (documented) |
| B4 | `height: undefined` in data | jest | writes `height: 1` (LOW-2) |
| C1 | 2nd and 3rd consecutive Damage on one view | jest | pass |
| C2 | temp gained then consumed on the same view | jest | line removed (INFO-1) |
| C3 | `prefs:` + `collapsed:` + minimal body | jest | pass |
| C4 | declared default `collapsible: true` kept | jest | pass |
| D1 | FormModal Save on a minimal block | jest | adds `style: default` (LOW-1) |
| SCRP-01 | Reading view: Damage, Damage, Heal; exact note bytes incl. ABOVE/BELOW | e2e | ok (red on revert) |
| SCRP-02 | temp gain then consume | e2e | line removed, same as C2 (red on revert) |
| SCRP-03 | hand edit between writes (`height: 2`, `style: default`), then Damage | e2e | ok, both kept |
| SCRP-04 | external edit adding default-valued `height: 1` before the first write | e2e | ok, kept |
| SCRP-05 | minimal + fully authored in one note, 3 writes across both | e2e | ok, no cross-talk, exact bytes |
| SCRP-06 | legacy `ds-stamina` with Recoveries: Catch Breath, Undo (exact original bytes), Catch Breath | e2e | ok |
| SCRP-07 | Live Preview, two Damages | e2e | ok |
e2e probe runs: fixed build 20261021-125218-680e (7/7 ok); reverted model.ts 20261021-125248-42a3 (0/7 ok, all 7 red).

## Mutations (each applied to model.ts alone; implementer's 4 suites, 89 tests)
| Mutation | Red? |
|---|---|
| M1 revert model.ts to 0ce76dd | red (22 failed) |
| M2 drop `collapsible` from PARSER_DEFAULTS | red (21) |
| M2 drop `collapse_default` | red (19) |
| M2 drop `current_stamina` | red (1: byte-compat "explicitly set") |
| M2 drop `temp_stamina` | red (13) |
| M2 drop `height` | red (21) |
| M2 drop `style` | red (21) |
| M3 omit absent keys even when changed | red (2: "current absent", "temp gain") |
| M4 ignore presence (omit every default-valued key) | red (9) |
| M5 shared record (last parse wins) | red (2: two-blocks, never-parsed) |
| M6 `declared[key] === undefined` in place of hasOwn (equivalent for YAML input) | green (expected; it is LOW-2's fix) |
| e2e: STAM-W11 with model.ts reverted | red (run 20261021-124957-1d2e) |

## Tree state
dse `git status --porcelain` is empty before and after. All probe files are deleted by exact path: `test/dom/elements/zzSc466ReviewProbe.test.ts`, `e2e/specs/stamina-bar/zz-sc466-probe.e2e.ts`, `e2e/vaults/shipped/Stamina/zz-sc466-{pair,minrec}.md`. model.ts was restored with `git checkout` after each mutation. The superproject shows ` M draw-steel-elements` before and after (the implementer's unstaged pointer, left for wt-finish). The gitignored build files `main.js` and `styles.css` were removed per the jest run rule and not rebuilt.

## Evidence (scratch: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc466-r1-review-a0851fcab83d49091/)
tsc.log, lint.log, jest-1.log, lifecycle.log, e2e.log, shots.log, freeze.log, parity.log, jest-probe-1.log, jest-probe-2.log, zzSc466ReviewProbe.test.ts (probe source), mutate.py, mutate.out, mutations.json, mut-*.log, e2e-mut-revert.log/.rc, e2e-probe-fixed.log/.rc, e2e-probe-reverted.log/.rc, e2eprobe/run-probe.sh, e2eprobe/20261021-123331-17cf/ and e2eprobe/20261021-125218-680e/ (copied e2e bundles), rcprobe.sh.
