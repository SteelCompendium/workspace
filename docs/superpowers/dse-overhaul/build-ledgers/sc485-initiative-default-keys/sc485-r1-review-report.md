# SC-485 r1 independent review — ds-initiative default keys

## Executive summary

- **Verdict: FIX-REQUIRED (tests only; the src is correct on every probe).** Reviewed dse `bf0e678` on `d152ea4`; superproject `3f1adc1` on `00e2f37`.
- **Findings:** BLOCKER 0 / HIGH 0 / MEDIUM 1 / LOW 3 / INFO 5. MEDIUM-1 is a test gap. One pool-unit path is right in the code but no test covers it: the pool is back at its parse value while the captain-bonus trio has changed. If that path broke, the note would reload `18/18 (6)` where the live view shows `12/16 (6)`.
- **Byte-check grid:** 3051 model-level cases (160 sources × 30 mutations, all through the real `parse` → `resolveInitiativeRefs` → `serialize`). All 3051 pass each of these checks:
  - the contract matches an independent oracle;
  - every fully-authored source writes bytes identical to base `d152ea4` (base run on a `git archive` copy);
  - the live model is identical to base;
  - `serialize(parse(out)) === out`;
  - a re-parse gives the same model as base's re-parse (key order ignored).
- **jsdom pipeline / sidebar probes:** 8 of 8 behaviours as specified. Squad sequences under refs and ref-free (pool damage + kill → relieve → promote → heal → Reset): the reload readout equals the live readout and equals base at every step. The sidebar `prepareModel` path checks the statblock-only hero, the external edit and the second write.
- **Mutants:** 20 in total. The branch suite turns 17 of them red. **Survivors: M11 (group-level `groupKeep` ignored), M14 (authored minion instances not recorded), M20 (trio left out of the unit check).** My probes turn all 3 red, so 20/20 with the probes. The implementer's 3 named mutants were reproduced red: 4, 4 and 13 red tests.
- **Real-Obsidian probes:** 4/4 pass on head. On base, 3/4 fail and 1 passes, as expected, so the probes discriminate. They cover the ticket repro, two blocks in one note, a hand edit followed by a write, a statblock-only creature, and a squad pool write followed by reopening the note.
- **Gates:**
  - tsc rc 0; lint rc 0.
  - jest `5795 passed / 1 skipped`, `239 of 240` suites, rc 0.
  - lifecycle (port 9353) `32/32 ok, 0 failed`. G-S8 and G-S15 are not vacuous: the sizer fell to 2446px, below scrollTop 2779.
  - e2e `108/108 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs`, rc 0, run `20261023-141611-8e3d`.
  - Shots/freeze/parity: the implementer's logs were verified (592 PNGs, no FAIL, then the known `HOST COPY DRIFTED` stop; `freeze OK (280/280 …)`; `0 gap(s), 0 undeclared warning(s), 24 declared`). Not re-run, see INFO-4.
- Worktree left as found. Plugin `status --porcelain` is empty. Superproject shows ` M draw-steel-elements`, the implementer's unstaged pointer, present before I started.

Scratch folder (S): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc485-r1-review-w7n2qa/`. Every probe ran in `git archive` copies under S (`head/`, `base/`, `mut/`, with `node_modules` symlinked). No probe or mutant ever touched the worktree.

## Findings

### MEDIUM-1 — the pool-unit "pool back at its parse value, trio changed" path is unpinned (mutants M11, M20 survive)

- **Where:** `src/elements/initiative/model.ts:383` (the trio half of `poolUnitWritten`) and `:388-402` (`groupKeep`, which forces a group-home pool that is still at its parse value). Tests: `test/dom/elements/initiative-default-keys.test.ts:346-` (pool-unit describe). Every case there changes the pool itself.
- **Scenario (reachable in the UI, measured):** the source is a squad with no captain. The Goblin minions have `with_captain: "+2 bonus to Stamina"` and there is an `attached` Ogre.
  - Open the pool modal and deal 4 damage to 1 minion, ticking the kill. The pool goes 12 → 8, and 2 minions are alive.
  - Promote the Ogre. The transition adds 2 × 2 = 4, so the pool is back at **12, its parse value**. The trio changes: max 16, active true, n 2. The live readout is `12/16 (6)`.
  - Head writes `minion_stamina_pool: 12` along with the trio, and the reload reads `12/16 (6)`. Correct.
  - Under M11 (`groupKeep` dropped) or M20 (trio left out of the unit check), the pool is omitted. The re-parse then re-runs `initMinionPool` and the **reload reads `18/18 (6)`**.
  - Both mutants pass all 334 tests in the initiative and helper suites (`sc485-r-mut-M11-groupKeep-ignored.log`, `sc485-r-mut-M20-creature-trio-not-in-unit-check.log`). My probe `zzSc485RDom2.test.ts` turns both red (`sc485-r-zzSc485RDom2-mut-*.log`). The grid also turns them red: M11 fails 19 contract checks and 6 re-parse checks, M20 fails 20 and 7.
- **Fix:** add the scenario to the pool-unit describe in `initiative-default-keys.test.ts`. The steps: mount `ATTACHED_ONLY`, then `poolModal(root, 4, kill)`, then click `.dse-init__cell[data-squad-role="attached"]`, then `.dse-init__detail button.dse-init__captain`. Then assert that the last write contains `minion_stamina_pool: 12` and that the reload readout equals the live one (`12/16 (6)`). A working copy is in `S/zzSc485RDom2.test.ts`, first test. Prove it red under M11 and M20.

### LOW-1 — the per-key record on authored minion instances is unpinned (mutant M14 survives)

- **Where:** `model.ts:310` (`noteAbsent(instance, MINION_INSTANCE_KEYS)`).
- **Scenario:** a squad whose minion `instances` are authored as ids only (`- id: 1 / - id: 3`). With the record removed (M14), any write adds `conditions: []` to every such instance. All 334 suite tests pass.
- **Fix:** add a case: an authored ids-only minion list, then a group toggle, and the write equals the source plus `has_taken_turn: true` (modulo the pre-existing `- prone` → `- key: prone` normalisation). A copy is in `S/zzSc485RDom2.test.ts`, second test.

### LOW-2 — wrong number in the re-based E08 comment

- **Where:** `e2e/specs/initiative/stamina-entry.e2e.ts:56`. The comment says "(it was 25, then 30 = the default)". E08 deals 8 damage (30 → 22) and then heals back to 30. 25 is E07's value.
- **Fix:** "(it was 22, then 30 = the default)".

### LOW-3 — the CHANGELOG bullet overclaims "A save now changes only what you touched"

- **Where:** worktree `CHANGELOG.md` (the SC-485 bullet under `## Unreleased`).
- **Why it overclaims:** by the contract (SC-482 FU1 and the pool-unit ruling), damaging one goblin writes the whole `instances` list, including the untouched goblin's `current_stamina`, `temp_stamina` and `conditions: []`. A squad pool write also adds the captain-bonus trio. Both are correct, but a reader who damages one creature sees lines for the others too.
- **Fix:** plainer and accurate. For example: "A save now adds only what changed — damage one creature and its group's per-creature list is written; everything you wrote is kept as before." The statblock sentence is accurate.

### INFO-1 — the superproject base is behind origin/main

`3f1adc1` is on `00e2f37`. origin/main is now `21455cc`, which adds two handoff-only commits. Rebase at landing (land-stack); there is no conflict surface, since CHANGELOG is the only file.

### INFO-2 — `selectedInstanceKey` is written into the block on a roster click

Measured in the squad sequences: `selectedInstanceKey: 1-1`. This is pre-existing and base writes it identically. It is UI state, not a parser default, so it is outside this ticket's contract. It may be worth a Backlog ticket.

### INFO-3 — the implementer's deviations check out

- **(1) INIT-STAM-E08 re-base is the contract, not a masked regression.** The hero's absent `current_stamina` goes 30 → 22 → 30. Back at the parse snapshot it is dropped (the SC-466/SC-482 INFO-1 rule). The test still pins the bar repaint (`30`) and that the key is absent. My grid's `heroDamageHeal` case does the same on every hero variant (3051/3051).
- **(2) INIT-DEF-E01/E03/E04 still assert the note exactly.**
  - E01 and E04: `expectNoteBlock(...).toEqual` on the parsed block, an exact object.
  - E03: `noteText` before vs after, the raw whole note including ABOVE/BELOW.
  - Pressing the controls through wdio changes only coverage accounting (SC-500).
  - All four pass in my full e2e run.

### INFO-4 — shots/freeze/parity not re-run

The only src outside `src/elements/initiative/` is `src/elements/shared/undeclaredDefaults.ts`. Its change is an additive export plus an optional parameter that only `serialize` reaches, so no render path changes. The implementer's logs in `…/sc485-r1-impl-x4k7qp/` show:

- `sc485-i-shots.log`: 592 PNG lines, no FAIL, the known `HOST COPY DRIFTED` stop, rc 1;
- `sc485-i-freeze.log`: `freeze OK (280/280 …)`, rc 0;
- `sc485-i-parity.log`: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc 0.

Re-run them after the pin bump, as the ledger already rules.

### INFO-5 — a `null`-valued authored key counts as authored

For example `conditions:` with no value. It is written back filled (`conditions: []`), as SC-466 r2 defines (`=== undefined` only). This is consistent with SC-482. No change.

## Evidence

### Byte grid

Files: probe `S/zzSc485RGrid.test.ts`, runners `S/sc485-r-grid.sh` and `S/sc485-r-compare.js`, outputs `S/sc485-r-grid-{head,base}.json` and `S/sc485-r-grid-head-fails.json` (empty).

**Sources (160):**
- every subset of the 5 filled hero keys, at default and non-default values;
- group `has_taken_turn` / `is_squad`;
- creature `isHero` × 7 instance shapes: absent, full, ids-only, current-only, cond-only, partial-regenerated, too-many;
- top level: `malice` (4 shapes) × `round` × `name` × unknown keys (`_dse_from`, `notes`);
- statblock heroes and creatures, with and without authored overrides, plus the `statblock-refs.yaml` fixture;
- squads: the fixture, no captain, captain without a bonus, born-captained ref-free and from refs, attached creature, authored pool, authored trio only (FU2), captain down, multi-squad, authored minion instances, squad plus a regular group.

**Mutations (30):** none, hero turn / turn twice / damage / damage + heal / temp / condition add / add + remove, group turn, instance damage / heal / condition, malice ± and back, advance round, reset round, title set / clear, Reset encounter, Reset then toggle, pool damage / heal back, minion kill, promote, relieve, relieve + promote, captain down / up, pool damage + promote, relieve + pool heal.

**Oracle:** written independently of the implementation. A key is written iff it is present in the source, or its JSON differs from the untouched post-`resolveRefs` model, or it is in a pool unit (any of the 4 written → all written). Authored, aligned instances are compared per key; otherwise instances are compared whole. Name goes first.

**Results:**

| Check | Result |
|---|---|
| contract (head out == oracle) | 3051/3051 |
| fully-authored head == base bytes | 3051/3051 |
| model state == base | 3051/3051 |
| fixed point | 3051/3051 |
| re-parse == base re-parse (key order ignored) | 3051/3051 |
| head re-parse == live wherever base re-parse == live | 3051/3051 |

320 cases re-parse differently from the live model in **both** head and base, identically. These are Reset and squad-init cases and are pre-existing.

### jsdom pipeline / sidebar probes

Files: `S/zzSc485RDom.test.ts` and `S/zzSc485RDom2.test.ts`, outputs `S/sc485-r-zzSc485RDom*-{head,base}.{json,log}`.

| Probe | Head | Base |
|---|---|---|
| Squad sequence, free | pass; reload equals live at every step except the final Reset step | identical per-step live/reload readouts |
| Squad sequence, refs | pass; same as free | identical per-step live/reload readouts |
| Sidebar (prepareModel) | pass | fails (writes defaults) |
| User-deleted key + `collapsed:` + unknown key | pass | fails (writes defaults) |
| Pool unit with trio-only change (MEDIUM-1) | pass | — |
| Authored minion instances (LOW-1) | pass | — |

- **Squad sequences:** at the Reset step, base and head both show an empty live readout and the same reload. This is pre-existing.
- **Sidebar probe:**
  - First click on the statblock-only Frodo: the write is `{statblock: Frodo Baggins, has_taken_turn: true}`, with the prose above and below unchanged.
  - Then an external hand edit adds `temp_stamina: 0`.
  - Second click: the edit is kept and only the group's `has_taken_turn` is added.
- **Deleted-key probe:** the fully materialized hero with `current_stamina` deleted by hand rewrites the exact bytes, without regenerating the deleted key.
- **MEDIUM-1 probe:** red under M11 and M20.
- **LOW-1 probe:** red under M14.

### Mutants

Files: `S/sc485-r-mutate.py`, `S/sc485-r-mut.sh`, logs `S/sc485-r-mut-<id>.{log,rc}`. Suite: `test/dom/elements/initiative*`, `test/unit/model/initiative*`, `test/unit/elements/undeclaredDefaults`, `test/dom/framework/sidebarInitiative`, `turnEconomy`, `malicePanel` (11 suites, 334 tests, baseline green).

| Mutant | Red in the branch suite |
|---|---|
| M1 drop resolveRefs re-snapshot | 4 (C12, C13, M04, C21) |
| M2 pool unit off | 4 (C22, C23, SC-195 captained, M-1) |
| M3 undefined counts as changed | 4 (incl. C14 and the helper unit test) |
| M4 generated instances recorded per key | 13 |
| M5 drop name-first | 3 |
| M6 drop parse snapshot | 39 |
| M7 hero noteAbsent dropped | 20 |
| M8 isHero not a default | 20 |
| M9 malice not a default | 13 |
| M10 authored regular instance unrecorded | 2 |
| **M11 groupKeep ignored** | **0 — survivor** |
| M12 pool home inverted | 4 |
| M13 keep ignored in helper | 5 |
| **M14 authored minion instance unrecorded** | **0 — survivor** |
| M15 group has_taken_turn not a default | 12 |
| M16 hero temp_stamina not a default | 16 |
| M17 authored instances not filtered | 2 |
| M18 is_squad not a default | 14 |
| M19 merged name not a default | 3 |
| **M20 trio left out of the unit check** | **0 — survivor** |

`diff -r head/src mut/src` was clean after every batch.

### Real Obsidian

Files: spec `S/e2e-probe/zz-sc485r.e2e.ts`, fixtures `S/e2e-probe/SC485R/*.md`, runner `S/sc485-r-e2eprobe.sh`. They ran in the scratch copies only, never in the worktree. Logs: `S/sc485-r-e2eprobe-{head,base}.log`.

- **SC485R-01:** the ticket repro plus a second block in the same note. Each toggle changes exactly one line of its own block, and ABOVE/BETWEEN/BELOW are unchanged.
- **SC485R-02:** an external hand edit, then a re-render, then a group toggle. The edit is kept and one line is added.
- **SC485R-03:** a statblock-only creature (`SC485R Orc.md`, stamina 40, readout `40/40`). A group toggle adds only the group's `has_taken_turn`, with no merged name, max or instances.
- **SC485R-04:** a born-captained squad, pool damage 6 plus a kill in the real modal. The note gets the pool (12) and the trio (18 / true / 2). Reopening the note (same leaf, emptied then reloaded, no fixture reset) gives the same readout (`12/18 (6)`), and the note is not rewritten by the reopen.

Head 4/4. Base: 01–03 FAIL (it writes defaults), 04 ok.

### Gates (worktree)

Files: `S/sc485-r-gate.sh`, logs `S/sc485-r-gate-{tsc,lint,jest,life,e2e}.{log,rc}`.

- tsc rc 0; lint rc 0 (only the pre-existing `.eslintignore` warning).
- jest `Tests: 1 skipped, 5795 passed, 5796 total`, `Test Suites: 1 skipped, 239 passed, 239 of 240 total`, rc 0.
- lifecycle `OBSIDIAN-LIFECYCLE done: 32/32 ok, 0 failed`, rc 0.
- e2e `OBSIDIAN-E2E done: 108/108 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs`, rc 0.

### Scope

- The plugin diff touches only the brief's fence, plus `stamina-entry.e2e.ts`, which is disclosed and accepted as FU1.
- `git diff d152ea4 -- test/` shows that `undeclaredDefaults.test.ts` changed only its import line plus a new `describe`. No other SC-466/SC-482 test file is in the diff.
- `.repo-docs/architecture.md` describes the new mechanics accurately.
