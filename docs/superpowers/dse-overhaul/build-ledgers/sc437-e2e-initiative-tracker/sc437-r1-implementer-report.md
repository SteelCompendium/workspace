# SC-437 round 1 (Phase A) implementer report

## Executive summary
- STATUS: NEEDS_CONTEXT (Phase A done; stop for the pair list and bug list). Branch `sc437-e2e-initiative-tracker` in draw-steel-elements, head `6ff53d29` (two commits on `10db67e3`; origin/develop still `10db67e3`, no rebase). Nothing pushed, superproject pointer untouched.
- Gates: tsc clean; lint clean; jest 6712 passed / 2 skipped / 1 failed (258 of 260 suites passed, 1 skipped; the 1 failure is `twin-reuse` SC-568-class 5 s timeout, 46/46 green alone); jsdom census suite 22/22. Baseline 6591 passed / 1 skipped: +121 passed, +1 skipped (fresh worktree, no cached `obsidian-app.css`, expected).
- Controls: 20 new `data-dse-control` ids; the tracker now has 29 ids of its own (20 new + 9 existing: `init.hero.turn`, `init.reset-encounter`, `init.reset-encounter.confirm`, `init.hero.stamina`, `init.hero.bar`, `init.detail.stamina`, `init.detail.bar`, `init.cell.stamina`, `init.cond.add`) plus 2 reach rows.
- Pairs: 29 new (coverage 113 -> 142 expected: `142/142`; measured by loading every manifest and de-duplicating (control, kind)). 33 pairs listed under the two tracker manifests, 4 of them already counted.
- Bugs: 6 candidates (1 Medium confirmed in jsdom, 1 Medium-or-High needing a real-Obsidian check, 4 Low). Details below.
- Product change is attribute-only (ids) plus two optional `control` options on kit `collapsible` and `conditionIcons`.

## Commits (draw-steel-elements)
- `df8b7ed8` feat(SC-437): data-dse-control ids on every interactive node of the initiative tracker; manifests; both censuses scoped by the tracker root
- `6ff53d29` test(SC-437): jsdom matrix for the initiative tracker (title edit, round / turn, action pips, Malice, selection, captain, reset encounter)

## Controls added (20 new ids)
- Title: `init.title` (text span, role=button), `init.title.input` (textarea).
- Round / chrome: `init.round.advance`, `init.reset-turns` (chrome item; `init.reset-encounter` already existed).
- Malice: `init.malice.dec`, `init.malice.value` (tabindex -1 focus target, no interactions), `init.malice.inc` (stepper `control: 'init.malice'`), `init.malice.quickadd.amount`, `init.malice.quickadd.label`, `init.malice.quickadd.add`, `init.malice.log` (collapsible header; new kit `control` option).
- Turn: `init.hero.turnbox` (the checkbox; display:none on Steel screen, visible only with the Initiative portraits preference off), `init.group.turn` (enemy-group header button).
- Action checklists: `init.hero.action`, `init.detail.action`, `init.detail.squad-action` (repeated nodes, `nth`).
- Conditions: `init.cond.remove` (kit `conditionIcons` new `control` option; hero and creature rows).
- Captain: `init.captain.make`, `init.captain.relieve` (one badge button, id by state).
- ResetEncounterModal: `init.reset-encounter.cancel` (`init.reset-encounter.confirm` existed).
- Source files: `src/elements/initiative/view.ts` (+24/-3), `src/framework/kit/collapsible.ts`, `src/framework/kit/conditionIcons.ts`, `src/views/ResetEncounterModal.ts`.

## Manifest pairs
Files: `e2e/manifest/initiative.ts` (extended; existing ids kept, none renamed) and new `e2e/manifest/reset-encounter-modal.ts`. Not listed in mine (owned elsewhere, reach rows only): `init.hero.stamina`, `init.hero.bar`, `init.detail.stamina`, `init.detail.bar`, `init.cell.stamina` dblclick (stamina-edit-modal / minion-pool-modal manifests), `init.cond.add` (conditions-modal manifest, SC-436, untouched).

Total unique pairs 142 (baseline 113). The 29 NEW pairs:
1. init.title x click
2. init.title x press:Enter
3. init.title x press:Space
4. init.title.input x type
5. init.title.input x press:Enter
6. init.title.input x press:Shift+Enter
7. init.title.input x press:Escape
8. init.title.input x blur
9. init.round.advance x click
10. init.reset-turns x click
11. init.malice.dec x click
12. init.malice.inc x click
13. init.malice.quickadd.amount x type
14. init.malice.quickadd.amount x press:Enter
15. init.malice.quickadd.label x type
16. init.malice.quickadd.label x press:Enter
17. init.malice.quickadd.add x click
18. init.malice.log x click
19. init.hero.turnbox x click
20. init.group.turn x click
21. init.hero.action x click
22. init.detail.action x click
23. init.detail.squad-action x click
24. init.cond.remove x click
25. init.captain.make x click
26. init.captain.relieve x click
27. init.reset-encounter.cancel x click
28. init.reset-encounter.cancel x press:Enter
29. init.reset-encounter.confirm x press:Enter

Listed but already counted (no extra pair): init.hero.turn x click, init.reset-encounter x click, init.reset-encounter.confirm x click, init.cell.stamina x click (reach row of stamina-edit-modal), and the host controls `modal.close` (click, press:Escape) and `modal.backdrop` (click) in the reset manifest, plus reach `init.reset-encounter` x click.

Scenario-group annotations (`rows`): T title, R round, M Malice, N turn, A action checklist, C conditions, K captain, S selection, X reset. Phase B scenario ids are meant to be `[INIT-<group><nn>]`.

Deliberate choices to review:
- `hover` is not a pair: the chrome panel reveal is a prerequisite (`dse.hover(root.root)`), the driver records no `hover` kind, nothing else on the surface has a hover-only function (tooltips are aria-labels).
- `init.hero.turnbox` needs `dse.setPrefs({ portraits: 'off' })` in Phase B (CSS 12c); the portrait overlay `init.hero.turn` is the default.
- `init.title.input x blur` needs an additive `away` target on `dse.blur` (it is hard-wired to `.modal-container .dse-modal__title`); Phase B change to `e2e/driver/dse.ts`, kept small.
- `init.cell.stamina` keeps its SC-408 name though a click is selection; renaming would touch the stamina-edit-modal and pool manifests and specs (SC-436 rebase churn). Say if you want it renamed.
- `init.malice.value` is declared with no interaction (it is focus plumbing, nothing clicks it) so the census has an id for it.
- Squad checklist Main/Maneuver/Second-move exclusivity, the hero turn control choice and the other permutations are jsdom (matrix), not extra pairs.

## Census fix (R1 L-4)
- jsdom `test/dom/e2eCensus.test.ts`: the initiative describe no longer uses the CSS-class entry-point selector. Scope is the tracker root with the full interactive selector, chrome-panel items INCLUDED (new `skipChrome` param on `censusProblems`, default true so other surfaces are unchanged). Allowed ids: initiative + reset-encounter manifests, only the `reach` rows with `host: 'initiative'` of the stamina / pool / conditions manifests, and the chrome ids. 11 tests in the new describe: injected un-id'd `<button>` into a row, the grid and the detail row, a `div[tabindex]` in the enemies group and an id outside the manifest are each a finding (regression test); chrome panel inside scope; census over 5 variants (quick-start, `rich.md`, `captain.md`, `squad-hurt.md`, the squad.yaml fixture); every declared control is stamped by some variant (no dead manifest row); read-only host offers only the Malice log disclosure and chrome; SC-500 assertions kept.
- Real-Obsidian `e2e/specs/_census.e2e.ts`: CENSUS-04 now scans `.markdown-reading-view [data-dse-element="initiative"] *` on `Initiative/rich.md` with the chrome exclusion switched off (`eventfulNodes(selectors, excludeInside: string | null)` in `e2e/driver/census.ts`, additive), against the same allow-list; CENSUS-07 (title editor open + captained squad) and CENSUS-08 (open ResetEncounterModal) added. Not run (no e2e in Phase A); typed by `tsc -p e2e`.
- Finding while doing it: the Malice log disclosure and the framework chrome (expand/collapse) stay interactive on a read-only host; the census test pins that.

## jsdom matrix tests added
`test/dom/elements/initiative-matrix.test.ts` (114 tests, tables): T title edit (open gesture x 5, finish gesture x start title x typed text x 15 rows, focus return, 10 special-character titles surviving write + re-parse); R Advance round x starting round x round_gain (6 rows), Reset turns x round (3), the Advance label by gain (3); N hero turn control x starting state (4), group turn (2), two-hero scoping; A hero slot sequences (4), creature instance scoping, minion squad exclusivity sequences (10), shared squad state; M stepper sequences (5), rejected quick-add (7), valid quick-add (5), Enter in either field (2), flag clearing, log header count x disclosure (3), log open state across rebuild; S selection by cell kind (3), cross-group isolation, selection surviving Advance round (4), single-creature group; K captain badge by scenario (4), promote / relieve role rewrites (3), minion and read-only; X confirm clears live state and keeps authored setup, Cancel / X / Escape (via the Obsidian Scope) change and write nothing, button order and danger variant, read-only has no chrome items.
Fixtures: `e2e/vaults/shipped/Initiative/rich.md` (title, round 2, two heroes with a condition and a spent turn, Ogres x3 with a condition on #1, a single-creature Troll group, Malice 4 with round_gain 2 and a log entry) and `captain.md` (3 Goblins, Goblin Captain selected, an attached Warg Rider); both added to the e2e README table and rendered by the census tests.

## Bugs found (candidates; none filed; no product fix made)
1. **Reset encounter leaves a minion squad's shared checklist set** (Medium, confirmed in jsdom). Repro: squad block, press the squad's `Move` pip, chrome Reset encounter state -> Yes, Reset: the written block still has `actions: { move: true, ... }` on the Goblin creature entry, and the pip is pressed on reload. Cause: `resetEncounter` clears `hero.actions` and drops `instances` (the per-instance `actions` go with them) but never clears the squad's `creature.actions` (SC-278). `src/drawSteelAdmonition/EncounterData.ts:622-665` (squad branch :633-651; the clear belongs in the `squad_role === "minion"` loop). Not a known ticket.
2. **After Reset encounter the rebuilt tracker paints no enemy rows** (Medium or High; jsdom-confirmed, needs a real-Obsidian check). `resetEncounter` sets every `creature.instances = undefined`; `rebuildAndPersist()` then `update(this.model)` rebuilds from that model without `parse()` re-materializing instances. jsdom after confirm: roster cells 3 -> 0, detail rows 4 -> 0 (a squad group likewise loses its pool bar). The note write is correct (INIT-DEF-E04 asserts that); whether the user sees an empty enemies section until the note re-renders depends on whether the write's echo re-parses the block (an adopted view is kept, SC-340). Repro: any tracker with an enemy group, Reset encounter state -> Yes, Reset. `src/elements/initiative/view.ts:224-227` (confirm callback) + `:162-169` (`rebuildAndPersist`); `EncounterData.ts:652-657`. Phase B will assert the screen after reset; if it is empty, severity High. Not a known ticket.
3. **Malice can go negative** (Low). The Malice stepper has no `min` (`view.ts:412-424`): from 0 the `-` button writes `malice: { value: -1 }` and shows "Malice: -1" (quick-add clamps at 0, `view.ts:596`). A negative `round_gain` does the same through `advanceRound` (`model.ts:473-477`) and labels the button "Advance round (+-3 Malice)" (`view.ts:458-461`). Not a known ticket.
4. **Quick-add log records the typed amount, not the applied change** (Low; may be intended). Malice 2, quick-add `-5` "Spend": pool clamps to 0, the log keeps `amount: -5` (`view.ts:596-597`).
5. **Quick-add rejects a typed `+3` with "Amount required"** (Low). `<input type=number>` sanitizes a leading `+` to an empty value, so the check at `view.ts:574-579` reports the field as empty (the log itself displays amounts as "+3"). Not a known ticket.
6. **No-op actions write identical bytes** (Low; verify the real-host effect in Phase B by counting vault writes). Re-clicking the already-selected roster cell, and Reset turns on a tracker with nothing marked, each call `replaceSource` with the same bytes as the previous write (`view.ts:1652-1653`, `:190-193`). SC-340 sets the "no change, no write" rule for modals.
- No reproduction of the known tickets (SC-291, 292, 270, 250, 384, 393, 506/568, 569, 572-574) except SC-568: `twin-reuse` timed out once in the full jest run and is green alone. Nothing looked like SC-556.
- Probed and fine (no bug): title round trip of special strings (quoted by `stringifyYaml`), whitespace-only title, Escape, captain promote / relieve incl. multi-squad `captain_of`, squad exclusive trio, Reset turns vs Advance round independence, selection persistence, zero-hero / zero-amount mounts. Probe scratch (not committed): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc437-impl-r1-a/zz-probe-sc437.test.ts.txt`.

## Drive-by fixes:
none.

## Follow-ups:
- `init.cell.stamina` is a misnomer for the selection click (kept; see above).
- `dse.blur` away-target is modal-only; Phase B needs an optional `away` argument.
- SC-436 overlap: I added `init.cond.remove` (the tracker's condition-icon buttons, kit `conditionIcons` option) and left `init.cond.add` and the conditions manifest untouched; if SC-436 also stamps the remove icons the two ids need reconciling at rebase. Shared files touched additively: `e2eCensus.test.ts`, `_census.e2e.ts`, `e2e/driver/census.ts`.
- `docs`: nothing updated yet (CHANGELOG is for user-facing changes; this ticket has none so far). e2e README fixture table updated.

## Gates (Phase A)
All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc437-impl-r1-a/`:
- `npm ci`: `npmci-r1a.log` (rc 0).
- tsc (`tsc --noEmit && tsc --noEmit -p e2e`): `tsc2.log`, rc 0, no output.
- lint (`eslint src main.ts e2e`): `lint1.log`, rc 0 (only the `.eslintignore` deprecation notice, pre-existing).
- jest full: `jestfull1.log`: `Test Suites: 1 failed, 1 skipped, 258 passed, 259 of 260 total` / `Tests: 1 failed, 2 skipped, 6712 passed, 6715 total` / `Time: 139.135 s`. The failure: `twin-reuse` SC-547 test, 5 s timeout. Alone: `twin-alone.log`: `Tests: 46 passed, 46 total`.
- jsdom census alone: `census2.log`: `Tests: 22 passed, 22 total` (also green inside the full run). Matrix alone: `matrix3.log`: `Tests: 114 passed, 114 total`.
- Pair count: `pairs-r1a.out` (`unique pairs 142`).
- No e2e, lifecycle, shots, freeze or parity run (Phase A).
- Fresh worktree: jest reads one fewer passed and 2 skipped until `npm run shots` caches `visual-harness/dist/obsidian-app.css` (the log's `findDriftedTokens` message is that same missing cache).

## Phase B
(appended after the owner resumes me)

## Phase B

### Executive summary
- STATUS: DONE_WITH_CONCERNS. Rebased onto origin/develop `f69b8fd6` (SC-556; clean, no conflicts). Head `09644511` (3 commits: `2ca49d44`, `d56974bb`, `09644511`). All gates below are on the rebased head.
- Gates: tsc clean; lint clean; jest 6762 passed / 1 skipped / 1 failed (`twin-reuse` SC-568 timeout, 53/53 green alone; baseline 6634); lifecycle 52/52 (21+16+9+4+2); e2e `199/205 ok, 0 failed, 6 known-bug, coverage: 142/142 pairs`; shots 592 / 0 FAIL / host-leak 163/978 / capture clip 147; freeze 280/280; parity 0/0/24.
- e2e: 42 new scenarios in 7 spec files under `e2e/specs/initiative/`, every one of the 29 new pairs driven by at least one plain test; 6 known-bug markers (SC-572 existing; new: SC-575, SC-576 x2, SC-577, SC-578). Real census run: CENSUS-01..08 8/8.
- Candidate 6 resolved: real Obsidian skips identical bytes (plain `expectNoWrite` tests pass). Not a bug.
- SC-576 is REAL in Obsidian and worse than filed: after Reset -> Yes the screen shows NO enemy roster / detail rows AND both heroes at "0 / 30 / 0 / 40" with the DYING chip (see below). Evidence screenshot.
- SC-579 does NOT reproduce in real Obsidian: typing "+3" is accepted (Malice 3 -> 6). It is a jsdom artifact (jsdom's number-input sanitizer rejects a leading plus; Chromium accepts it). Plain test `[INIT-M08]` pins the good behaviour; no jsdom `test.failing`. The owner should close SC-579 as not reproducible.

### Findings for the owner
- **SC-576 severity (real Obsidian):** High. After "Reset encounter state" -> "Yes, Reset" the rebuilt tracker (screenshot `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc437-impl-r1-a/sc576-after-reset-real-obsidian.png`) shows: the title, round 1, Malice 0, BOTH heroes at `0 / 30` and `0 / 40` with a red DYING chip, and the two enemy groups as bare headers with no roster cells and no detail row. It stays that way after the write settles (no echo re-render repairs it). Cause for the heroes: `resetEncounter` sets `current_stamina = undefined` and the view paints `?? 0`; for the enemies: `instances = undefined`. The note itself is written correctly (INIT-X01). Markers: e2e `[INIT-X05]` (rows) and `[INIT-X06]` (hero `30/30`) are `knownBug('SC-576')`; jsdom `[X05]` is `test.failing`.
- **SC-575** (squad pips survive Reset): e2e `[INIT-X07]` knownBug, jsdom `[X07]` `test.failing`.
- **SC-577** (Malice negative): e2e `[INIT-M07]` knownBug (4 x `-` from 3 must read "Malice: 0"); jsdom `[M07]` and `[R01]` (negative round_gain, `+-` label) `test.failing`.
- **SC-578** (quick-add log vs clamp): e2e `[INIT-M09]` knownBug, jsdom `[M09]` `test.failing`; both assert only "entry amount equals the pool change OR the label no longer reads 'Spend'" (true under either fix; the label clause is my reading of "entry shows the clamp" - adjust if you want another).
- **SC-579:** see above; no marker.
- Reset turns on a clean tracker: the FIRST press rewrites the fixture's hand-formatted YAML (the quotes go) so it is a real write; a second press writes nothing. Re-clicking the selected cell writes nothing.

### What was added (Phase B)
- `e2e/specs/initiative/`: `title-edit.e2e.ts` (T01-T07), `round-turns.e2e.ts` (R01, R02, N01, N02 with portraits off, N03), `malice.e2e.ts` (M01-M09 incl. SC-577/578 markers, log disclosure M06), `actions-conditions.e2e.ts` (A01-A04, C01-C02), `captain-selection.e2e.ts` (S01, K01, K02), `reset-encounter.e2e.ts` (X01-X04 plain, X05-X07 known bugs), `no-op-writes.e2e.ts` (NOOP-E01/E02). Existing SC-485 / stamina specs untouched and green.
- `e2e/driver/dse.ts`: `blur(el, awayTarget?)`, additive (approved).
- jsdom: `test.failing` markers appended to `test/dom/elements/initiative-matrix.test.ts` (119 tests there now; 5 are `test.failing`).
- Pair count measured: 142 unique (control, kind) pairs, run reports `coverage: 142/142 pairs`; none driven only by known-bug tests.

### Gates on the rebased head `09644511` (logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc437-impl-r1-a/`)
- tsc `tsc4.log` rc 0; lint `lint3.log` rc 0.
- jest `jestfull3.log`: `Test Suites: 1 failed, 1 skipped, 258 passed, 259 of 260 total` / `Tests: 1 failed, 1 skipped, 6762 passed, 6764 total`; the failure is the SC-547 5 s timeout in `twin-reuse`; alone `twin-alone3.log` `Tests: 53 passed, 53 total`.
- lifecycle: `rlife1.log` 21/21, `rlife2.log` 16/16, `rlife3.log` 9/9, `rlife4.log` 4/4, `rlife5.log` 2/2 = 52/52. (On the pre-rebase head `G-S42` failed once under load, "(d) another pane: pin never seen released within 5090ms", and passed alone; it passed first time on the rebased head.)
- e2e `e2efull2.log`: `OBSIDIAN-E2E done: 199/205 ok, 0 failed, 6 known-bug, coverage: 142/142 pairs`. Census alone (`cen1.log`, pre-rebase): 8/8.
- shots `shots2.log`: 592 shots, 0 FAIL, host-leak button 163 kinds / 978 comparisons, capture clip OK (147), freeze `freeze1.log`: `freeze OK (280/280 ...)`, parity `parity1.log`: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`. No move in any host-leak or DOM number.

### Drive-by fixes:
none.

### Follow-ups:
- jsdom's `<input type=number>` sanitizer disagrees with Chromium on a leading "+": any jsdom matrix of number-input text should not be trusted for that case.
- The e2e `.out` bundle for the pre-marker SC-576 run: `draw-steel-elements/e2e/.out/20261110-203851-6cf5/INIT-X05/` (gitignored, newest 12 runs kept; screenshot copied to `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc437-impl-r1-a/sc576-after-reset-real-obsidian.png`).

## r3

### Summary
- STATUS: DONE. Head `df5009ec` (one commit on `09644511`; origin/develop still `f69b8fd6`, no rebase). Tests only: `src/` untouched this round (the census mutation probe edited `view.ts` and was reverted; `git status` clean).
- All 5 MEDIUM and 3 LOW folded; I-2 folded as a one-line change (the re-select before the assertion removed). SC-588 (e2e `knownBug` + jsdom `test.failing`) and SC-589 (jsdom `test.failing`) markers added. SC-590: no marker, nothing asserts either behaviour.
- Gates: tsc, lint clean; jest 6765 passed / 1 skipped, 259 of 260 suites, rc 0; e2e `199/206 ok, 0 failed, 7 known-bug, coverage: 142/142 pairs` (known-bug +1: SC-588). Lifecycle / shots / freeze / parity not re-run (no `src/` change, no rebase).
- Each jsdom marker was run once as a plain test: all 7 fail today for their stated reason (SC-575 Expected false/Received true; SC-576 0 cells; SC-577 "Malice: -1" and "+-3"; SC-578 Expected true/Received false; SC-589 amount "" not "2"; SC-588 focus outside the tracker).

### Fix map (all in one commit, "test(SC-437): r3 review fixes ...")
- M-1: `reset-encounter.e2e.ts` `[INIT-X05]` reads `toHaveElementProperty('textContent', '60/60')`; `failsWith: /Index out of bounds/` kept.
- M-2: jsdom `[M07]` asserts the screen reads "Malice: 0" and no written value is negative (no `last()`), so a disabled button with no write also passes.
- M-3: the `['-9','Spend',2,0]` row is dropped from the plain table; a separate plain test asserts only Malice 0, one entry, label still starting "Spend".
- M-4: SC-578 clause is positive in e2e `[INIT-M09]` and jsdom `[M09]`: the entry keeps a label starting "Spend" AND (records the applied change in a field OR the label says cap/clamp/limit), or its amount equals the applied change.
- M-5: CENSUS-07 now selects Goblin #1 (cell nth 0) and rescans for `init.detail.squad-action`, then selects the Warg Rider (nth 4) and rescans for `init.captain.make`, each time requiring zero findings. Mutation probe: a listener-only div added to `buildSquadActionChecklist` turns CENSUS-07 red (`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc437-impl-r1-a/r3mut.log`: `no data-dse-control: <div class="zz-mut"> listens for click`); reverted.
- L-1: `[INIT-C02]` asserts the Dazed icon is gone from the detail row and Alice's Grabbed icon remains; `[INIT-M08]` asserts `Malice: 6` and the log header "Malice log · 1 entry".
- L-2: the two README fixture rows are indented two spaces.
- L-3: `censusFindings(nodes, allowed, inert)` (e2e/driver/census.ts) reports an eventful node carrying an id the manifest declares with zero interactions; `_census.e2e.ts` passes the initiative manifest's zero-kind ids on every tracker scan (the jsdom side still accepts them).
- I-2: jsdom K01-K02 no longer re-selects the cell before asserting the flipped badge; it passes, so a missing captain rebuild now fails there too.
- SC-588: e2e `[INIT-F01]` (`knownBug`): Enter in the quick-add label, then focus must be inside the tracker (`failsWith: /Expected: true/`); jsdom `[M04] ... SC-588` `test.failing`. SC-589: jsdom `[M10]` `test.failing` (half-typed amount and label survive Advance round).

### Gates (logs in /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc437-impl-r1-a/)
- tsc `tsc5.log` rc 0; lint `lint4.log` rc 0; jest `jestfull4.log` (6765 passed / 1 skipped, 259 of 260 suites; no twin-reuse timeout this run); matrix alone `matrix5.log` 121/121; plain-marker probe `plainmk.log` (7 failed as intended).
- e2e targeted `r3a.log` (9 tests, 0 failed); full `e2efull3.log`: `OBSIDIAN-E2E done: 199/206 ok, 0 failed, 7 known-bug, coverage: 142/142 pairs`.

## r5

### Summary
- STATUS: DONE. Head `32441332` (one commit on `df5009ec`; origin/develop unchanged at `f69b8fd6`). Tests only; `src/` untouched.
- Fix: r4-M1. The two SC-578 markers (e2e `[INIT-M09]`, jsdom `[M09]`) now use the reviewer's snippet: the label must contain "spend" anywhere, and the clamp clause also accepts the applied amount written into the label (digit test on the label minus "spend"). The plain jsdom clamp test no longer pins a label prefix (`toMatch(/Spend/i)`).
- Reword probes (reviewer's `mutate4b.py`, applied in a scratch git worktree off this head, since removed): B1 ("Capped at 0: Spend", typed amount kept) and B4 (applied -2, "Capped: Spend"). Under both, the jsdom `[M09]` flips ("Failing test passed ...", the only red) and every plain test stays green; e2e `[INIT-M09]` reports "known bug SC-578 appears fixed" while `[INIT-M03]` / `[INIT-M04]` stay ok.
- Gates: tsc, lint clean; jest 6765 passed / 1 skipped, 259 of 260 suites, rc 0; e2e `199/206 ok, 0 failed, 7 known-bug, coverage: 142/142 pairs`. Lifecycle / shots / freeze / parity not re-run (no `src/` change).

### Evidence (/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc437-impl-r1-a)
- `b1jest.log`, `b4jest.log`, `b1e2e.log`, `b4e2e.log` (reword probes); `tsc6.log`, `lint5.log`, `jestfull5.log`, `e2efull4.log`.
