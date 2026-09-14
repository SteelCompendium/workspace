# SC-196 round-4 re-review — dse `638c657` / superproject `d9d238c`

## Executive summary

**Verdict: LAND-READY.** All six r3 findings fixed, each confirmed by execution (independent mount, not by reading the diff):
HIGH-1 fixed — the pressed cell's rendered `aria-label` (= the production hover text) is now `"Selected — Orc #2"`, and reverts to `"Select Orc #2"` when another cell is picked; HIGH-2 fixed — `IconButtonHandle.setTooltip` is gone, no `src/` caller remains, `setLabel` documents the physics; MEDIUM-1 fixed — `"Not rolled. ≤11: 3 + M damage"`, no run-together anywhere; MEDIUM-2 fixed — the false screen-reader claims are gone (roll rows + the temp badge, the latter a correct drive-by); LOW-1/LOW-2 fixed — the tests assert rendered `aria-label`.
Mutations: neutering `setTooltip` → **10 failed / 172 passed / 182** (exactly the report's number); the 2 surface-3 tests stay green there, and the implementer's "green by construction" reasoning **holds** — my second mutation (neutering `iconButton.setLabel`) turns both of them red (3 failed / 116 passed / 119).
Gates, re-run by me: tsc 0 · lint 0 · jest 3870 passed/1 skipped/202 of 203 suites/3 snapshots · shots 524 ok/0 FAIL (`host-copy pin OK`, `button host-leak OK … 678`) · `freeze OK (260/260 …)` exit 0 · parity 0 gaps/0 undeclared/16 declared exit 0 · `lightContrast.test.ts` 25/25. All 524 PNGs byte-identical to my r3 run; dark 0/132, print 0/130, realprint 0/130 changed vs the same develop reference.
Follow-up claim: **REAL and reproduced** — mounting `{label:'Remove condition: Grabbed', tooltip:'Grabbed'}` renders `aria-label="Remove condition: Grabbed"`, so the tooltip string is discarded; **10 call sites in 6 files** are affected. Worth its own ticket (owner's call).
Changelog: both bullets accurate, plain-language, colors named in words, no screen-reader claim. Two cosmetic nits below, non-blocking.
New findings: **0 blocking; 3 LOW/INFO.**

---

## Per-finding status (verified by execution)

| r3 finding | Status | How verified |
|---|---|---|
| HIGH-1 selection ring's tooltip never said "Selected" | **FIXED** | Mounted the initiative element through the REAL `ElementPipeline` in my own out-of-repo jest file: labels flip `Select Orc #2` → `Selected — Orc #2` → back on reselect (evidence log below). `view.ts:1313-1345` now writes the state into the accessible name via `setLabel`, which is the same attribute the hover renderer reads. |
| HIGH-2 dead `IconButtonHandle.setTooltip` | **FIXED** | Method removed (`iconButton.ts:45-62` interface, `:122-131` impl). `grep -rn "\.setTooltip(" src` → only `views/SettingsTab.ts:495`, which is Obsidian's `ButtonComponent.setTooltip`, a different API. The kit interface no longer promises it; `setLabel`'s JSDoc (`iconButton.ts:51-62`) now states the decompiled fact. tsc/lint clean. |
| MEDIUM-1 run-together label | **FIXED** | Built from parts with separators (`powerRollPanel.ts:251-268`, `querySelector('.dse-pr__text')` instead of `rowEl.textContent`). Rendered: `"Not rolled. ≤11: 3 + M damage"`, `"Rolled result — 14. 12-16: 6 + M damage"`, `"Not rolled. 17+: 9 + M damage"`, `"Not rolled. crit: extra main action"`, no-total variant `"Rolled result. 17+: 9 + M damage"`, cleared → `null`. Zero run-together across all five states. `tooltip()` is now called once, with the final string. |
| MEDIUM-2 false AT-exposure claim | **FIXED** | `powerRollPanel.ts:73-79` (JSDoc) and `:249-260` (impl comment) now say hover-only + name-prohibited; the same correction landed on `StaminaBarPanel.ts:273-277` as a declared drive-by. `grep "screen reader"` in the four touched files returns only those two corrected negative statements. No role was added anywhere (correctly out of scope). |
| LOW-1 / LOW-2 tests asserted the call, not the render | **FIXED** | Every rewritten test asserts `getAttribute('aria-label')` (`powerRollPanel.test.ts:498-525`, `iconButton.test.ts:193-208`, `initiative.test.ts:689-730`); spy assertions now only *supplement* the rendered check. Mutation-1 proves the surface-1/2 ones can fail; mutation-2 proves the surface-3 ones can fail. |

### Tooltip wording, per surface per state (all informative to a colorblind reader)
- Surface 1: `Not rolled. ≤11: 3 + M damage` / `Rolled result — 14. 12-16: 6 + M damage` — state word first, then range, then outcome. Nothing is carried by colour alone.
- Surface 2: `Temporary Stamina: 4` (absent at `temp == 0`).
- Surface 3: `Select Orc #2` ↔ `Selected — Orc #2`, and `aria-pressed` still carries the state to AT.

### Mutation analysis — the "green by construction" claim holds
- **Mutation 1** (`setTooltip` → no-op, my r3 config, unchanged): 10 failed / 172 passed / 182 — matches the r4 report exactly. Red: 4 `powerRollPanel` (surface 1), 2 `staminaBarPanel` (surface 2), 4 pre-existing.
- **Mutation 2** (`iconButton.setLabel` → no-op, mapped over the barrel so `view.ts` gets it too): **3 failed / 116 passed / 119** — red: `iconButton › setLabel IS the hover tooltip …`, `iconButton › setLabel updates the accessible name in place` (pre-existing), and `initiative › instance-cell select: rendered aria-label flips Select -> "Selected — <creature>" …`.
  So both surface-3 tests **are** can-fail under the mutation that matters; their greenness under mutation 1 is a consequence of the prescribed fix bypassing `setTooltip`, not a coverage gap. Claim accepted.

## Follow-up claim — verified REAL

Probe (executed, not reasoned): `iconButton(parent, {icon:'circle', label:'Remove condition: Grabbed', tooltip:'Grabbed', onClick})` renders
`aria-label="Remove condition: Grabbed"` — the `tooltip` string is written first (`iconButton.ts:106-112`) and overwritten by `opts.label` on the next line, and Obsidian reads the tooltip text off `aria-label` at hover time. A control whose `tooltip` equals its `label` is unaffected (control case in the same run).

What the user sees: the explanatory hover text never appears; the accessible label appears instead — usually terser, sometimes materially less informative.

Affected call sites (tooltip ≠ label), 10 in 6 files:
- `src/framework/kit/conditionIcons.ts:127-128` — shows "Remove condition: Grabbed" instead of "Grabbed"
- `src/elements/conditions/panel.ts:106-107`, `:121-122` — "Roll save (6+ ends)" and "Remove" both lost
- `src/elements/initiative/view.ts:329-333` (the `(+N Malice)` hint lost), `:528-530`, `:585-587`, `:665-667`, `:1019-1023`
- `src/elements/hero/view.ts:208-214` — the long Respite explanation ("Restore Stamina + Recoveries; clear Surges…") lost, hover shows "Respite"
- `src/drawSteelAdmonition/negotiation/ArgumentView.ts:246-250` — the "Requires Power Roll tier to be selected" explanation lost
- `src/views/CompendiumMigrationModal.ts:170-175` — the destructive-action explanation lost
Unaffected (tooltip === label): `mountChrome.ts:197-199,218-220,232`, `initiative/view.ts:316-317,1757-1758`.
The pre-existing test `iconButton.test.ts:169-183` asserts this discard as intended (spy called + final `aria-label` = label) — the LOW-2 pattern, older. A fix is a per-site wording decision, hence a ticket rather than a round-4 edit. Correctly out of scope here.

## New findings (none blocking)

### LOW-1 — the mount-time `tooltip?:` option is still documented as a working hover tooltip
`src/framework/kit/iconButton.ts:40` — `/** Native hover tooltip via kit tooltip() / Obsidian setTooltip (§2.5). */`.
The handle-level trap was removed this round, but the identical options-level trap keeps a doc comment that promises behaviour it cannot deliver whenever `tooltip !== label`. Any future caller repeats the bug. Prescribed fix (with the follow-up ticket, not necessarily now): add one sentence — "discarded unless it equals `label`; Obsidian's tooltip text IS `aria-label`" — or delete the option.

### LOW-2 — changelog counts/scope are slightly loose
`draw-steel-elements/CHANGELOG.md:18-28` and `CHANGELOG.md:11-22` (superproject worktree): "its own darker version of all ten" — SC-196's light block actually overrides **eleven** state tokens; the two unnamed ones are `--dse-turn-done` and `--dse-danger`. Also "the power-roll tier badges including the critical-hit gold" reads as if all four tier colours changed: low/mid/high already had light values before SC-196, only the crit gold is new. Both are cosmetic (no user-visible inaccuracy about what changed on screen). Prescribed fix: drop the count ("its own darker version of each") and say "the critical-hit gold" rather than the whole tier family.

### INFO-1 — a unit-test expectation carries raw markdown
`test/dom/kit/powerRollPanel.test.ts:512` expects `'Rolled result. 17+: 9 + M damage; **bleeding**'` — the asterisks appear only because that unit mount passes no `renderMd`; both production call sites do render markdown first, so the real tooltip reads "bleeding". No action needed; noted so a future reader does not "fix" the product for a fixture artefact.

## Gates — re-run by me, foreground, one log each

| Gate | My result | r4 report | Match |
|---|---|---|---|
| tsc | exit 0, clean | clean | yes |
| lint | exit 0, clean (pre-existing `.eslintignore` deprecation warning only) | clean | yes |
| jest | 3870 passed / 1 skipped / 3871 total, 202 of 203 suites, 3 snapshots, exit 0 | same | yes |
| shots | exit 0, 524 `ok` lines, 0 FAIL; `host-copy pin OK (… verbatim Obsidian 1.14.1 …)`; `button host-leak OK (113 × 3 × dark/light = 678)` | same | yes |
| freeze | `freeze OK (260/260 frozen print PNGs byte-identical …)`, exit 0, 0 mismatches | same | yes |
| parity (last) | `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`, exit 0, 16 DECLARED lines | same | yes |
| `lightContrast.test.ts` alone | 25 passed / 25 total, exit 0 | 25/25 | yes |
| mutation (setTooltip) | 10 failed / 172 passed / 182 | 10/182 | yes |

Pixels: my 524-PNG manifest is **byte-identical to my r3 manifest** (0 differing lines) — r4 touched no CSS (`git diff 068a2a6..638c657` lists no `styles-source.css`). Against the same develop reference used in r3 (`sc202-r6crerev2-allshots-run1.sha256`): `steel-dark` 0/132, `steel-print` 0/130, `steel-realprint` 0/130 changed; `steel-light` 50/132 (the approved palette).
Load average 2.4–9.1 during the runs; `rm -f main.js styles.css` before jest. Non-failure noise: the documented `OBSIDIAN APP.CSS PIN DRIFT` line (installed 1.14.1 vs pinned 1.13.7).

## Scope / hygiene
- r4 delta reviewed: `git diff 068a2a6..638c657` = 8 files (3 src kit/element, 3 test, 2 changelog); superproject `95c88a7..d9d238c` = the dse pointer + `CHANGELOG.md` only.
- Working tree: dse clone `git status --porcelain` empty before and after; superproject shows the same five pre-existing ` M` submodule entries (`data-gen`, `data-sdk-npm`, `steel-etl`, `steelCompendium.github.io`, `v2`) before and after. No repo file was created, edited or deleted by me — both mutation harnesses and the evidence test live in the session scratchpad.
- No tracker call, no push, no tag.

## Evidence paths
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc196-light-contrast/sc196-r4-review-gate1-tsc.log` (+ `.code`)
- `…/sc196-r4-review-gate2-lint.log` (+ `.code`)
- `…/sc196-r4-review-gate3-jest.log` (+ `.code`)
- `…/sc196-r4-review-gate4-shots.log` (+ `.code`)
- `…/sc196-r4-review-gate5-freeze.log`
- `…/sc196-r4-review-gate6-parity.log` (+ `.code`)
- `…/sc196-r4-review-lightcontrast.log` (+ `.code`)
- `…/sc196-r4-review-dom-evidence.log` (+ `.code`) — my independent mount of all three surfaces + the follow-up probe
- `…/sc196-r4-review-mutation1-setTooltip.log` (+ `…-mutation1.code`)
- `…/sc196-r4-review-mutation2-setLabel.log` (+ `…-mutation2.code`)
- `…/sc196-r4-review-allshots.sha256` (524-PNG manifest; compared against `…/sc196-r3-review-allshots.sha256` and `…/sc202-visual-harness-obsidian/sc202-r6crerev2-allshots-run1.sha256`)
- Scratchpad (outside the repo): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/aa65ef48-5b2f-47b4-b280-f736e1cbbfd6/scratchpad/{sc196r4-evidence.test.ts,jest.evidence.config.ts,jest.mutated.config.ts,obsidian-notooltip.ts,jest.mutated2.config.ts,iconbutton-nolabel.ts}`
