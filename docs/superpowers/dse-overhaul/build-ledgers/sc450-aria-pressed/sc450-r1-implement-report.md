# SC-450 R1 implement report

## Executive summary
- Verdict: DONE. Base `f818002` (origin/develop; rebased from 8ab5e91), head `99ae762`, branch `sc450-aria-pressed`, 4 commits, not pushed.
- AUDIT RESULT: NO site drifts. Every `aria-pressed` write outside initiative is on a non-`.dse-btn` (`.dse-optchip` / `.dse-swatch`) whose pressed look is keyed on `[aria-pressed='true']` alone; no `data-pressed` selector can match them. Computed-style probe (toggled vs rendered, both directions, dark+light) is identical on UNFIXED 8ab5e91 code. So there is no visible before/after pair; no crops were produced.
- Because nothing drifted, the "fix" is a behaviour-neutral consolidation: one exported `setPressedState(el, pressed)` in `src/framework/kit/iconButton.ts` (writes aria-pressed + data-pressed together). `iconButton.setPressed`, the initiative `repaintTurn` hand copies (SC-423), and all 9 other hand-written sites now use it. Chips/swatches gain an inert `[data-pressed]` attribute (no computed-style change; freeze 276/276).
- Guard: `test/unit/build/ariaPressedWriters.test.ts` fails on any `aria-pressed`/`data-pressed` write in `src/` outside iconButton.ts (allowlist: 2 read-only `<span>` display writes in initiative/view.ts). Proved red by a temporary bare write.
- Harness gate: `assertPressedToggleParity` in `visual-harness/shoot.mjs`, prints `pressed toggle parity OK (... 32 comparisons across 8 sites x dark/light ...)`. Proved red with a mutation (SC-423-shaped: in-place write forgets data-pressed + a rule keyed on its absence).
- Gates at f818002: tsc/lint clean; jest 4817 passed / 1 skipped / 228 of 229 suites (+7 tests); lifecycle 25/25; e2e 63/73 ok, 0 failed, 10 known-bug, 47/47 pairs; shots 572 PNGs, 0 FAIL; freeze 276/276; parity 0 gaps / 0 undeclared / 24 declared.
- No CHANGELOG bullet: nothing user-visible changed (DSE CHANGELOG has no `## Unreleased`; it is user-facing only).

## Audit table (every `aria-pressed`/`data-pressed` write in `src/` at base)
CSS that matches `[data-pressed]`/`:not([data-pressed])` (styles-source.css): sheen rule ~11311 (`.dse-btn, .dse-tabs__tab` only), `.dse-btn[data-pressed]` ~14380 and ~17139, `span.dse-init__action-toggle[data-pressed]` ~1278, `.dse-init__action-toggle:is([data-pressed],[aria-pressed='true'])` ~13830. None targets `.dse-optchip` / `.dse-swatch`. Their pressed look: `.dse-optchip[aria-pressed='true']` ~2143/2147, `.dse-swatch[aria-pressed='true']` ~2184, `.dse-nt__chip[aria-pressed=...]` ~2787/2808/11680.

| Site | file:line (base) | Element | Path | Stamps data-pressed at base? | Verdict |
|---|---|---|---|---|---|
| iconButton setPressed | framework/kit/iconButton.ts:106 | `.dse-btn` | build + in-place handle | yes | source of truth; unchanged semantics |
| Initiative turn button repaint | initiative/view.ts:737 | `.dse-btn` (iconButton) | in-place `repaintTurn` | yes (hand copy, SC-423 R3) | no drift; now `setPressedState` |
| Initiative portrait toggle repaint | initiative/view.ts:744 | `.dse-btn` portrait toggle | in-place `repaintTurn` | yes (hand copy, SC-423) | no drift; now `setPressedState`; existing turn/portrait parity gates still OK |
| Negotiation ArgumentView motivation chip | negotiation/ArgumentView.ts:167 | `button.dse-optchip.dse-nt__chip` | in-place (`chip.empty()` + repaint, same node) | no | NO DRIFT |
| Negotiation ArgumentView pitfall chip | ArgumentView.ts:185 | same | in-place | no | NO DRIFT |
| Negotiation dossier "Mark spent" chip | MotivationsPitfallsView.ts:98 | same, `data-kind=spent` | in-place | no | NO DRIFT |
| Montage LogActionModal result chips | montage/LogActionModal.ts:210 | `.dse-optchip` | in-place (`reflectResult`; initial render calls the same fn) | no | NO DRIFT |
| ConditionsModal icon choices | views/ConditionsModal.ts:304 | `.dse-optchip` | rebuilt (`grid.empty()`+`render()`), never toggled in place | no | NO DRIFT (rebuild only) |
| ConditionsModal duration chips | ConditionsModal.ts:344 | `.dse-optchip` | rebuilt (`renderList`) | no | NO DRIFT |
| ConditionsModal colour swatches | ConditionsModal.ts:383 | `.dse-swatch` | rebuilt | no | NO DRIFT |
| ConditionsModal effect chips | ConditionsModal.ts:412 | `.dse-optchip` | rebuilt | no | NO DRIFT |

Not aria-pressed writes (noted): initiative/view.ts:873 and :951 `toggleAttribute('data-pressed')` on read-only `<span class="dse-init__action-toggle">` (static display; matches `span.dse-init__action-toggle[data-pressed]`) - left bare, allowlisted in the guard with the reason. iconButton-built action toggles / stamina cells / rollBar already use `handle.setPressed`.

Probe evidence (computed style, keys backgroundColor, backgroundImage, boxShadow, borderTopColor, borderTopWidth, color, outline*; transitions off, hover excluded, focus blurred): on UNFIXED 8ab5e91 code, `logs/sc450-gate-on-base-8ab5e91.log` = `pressed toggle parity OK (... 32 comparisons across 8 sites x dark/light ...)`. In-place pressed chip paints e.g. `bg-image linear-gradient(rgba(255,255,255,.035),...)`, `border rgb(77,184,199)`, bevel box-shadow, identical to a rendered-pressed chip; idle returns to `none`/`rgba(220,226,230,.12)`. Method notes: negotiation uses the `checked` fixture (rendered pressed + idle refs on one page); montage uses `mid` + Log an action (Success pre-pressed); ConditionsModal uses `conditions:default` + Customize Bleeding (swatches primed by one click since none is rendered pressed). First draft of the probe false-flagged hover (page.click leaves the pointer on the chip) and the modal's auto-focus ring; both are excluded in the gate.

## Commits (on f818002)
- `58a7d89` test(SC-450): red - lockstep tests (negotiation, montage, ConditionsModal, setPressedState); 4 tests, all red before the fix (`logs/sc450-red-tests.log`).
- `f271a68` fix(SC-450): `setPressedState` + route all hand-written sites.
- `a34e161` test(SC-450): harness gate `assertPressedToggleParity`.
- `99ae762` test(SC-450): jest guard `ariaPressedWriters.test.ts` (3 tests).
Pre-rebase shas (8ab5e91 base, R1 evidence): 5064199, 1a4b70e, 3112362, plus guard commit.

## Gate numbers
At f818002 (head 99ae762; logs suffixed `-f818002`):
- tsc (incl. e2e) rc 0, lint rc 0 (only the pre-existing .eslintignore warning).
- jest: 4817 passed / 1 skipped / 228 of 229 suites (expected 4810 + 7 new; suites 227 + 1).
- lifecycle: `OBSIDIAN-LIFECYCLE done: 25/25 ok, 0 failed`.
- e2e: `OBSIDIAN-E2E done: 63/73 ok, 0 failed, 10 known-bug, coverage: 47/47 pairs`.
- shots: rc 0, 572 PNGs, 0 FAIL; `turn mark parity OK (20 comparisons)`, `portrait mark parity OK (... 6 comparisons ...)`, text scale OK, NEW `pressed toggle parity OK (toggled vs rendered, both directions: 32 comparisons across 8 sites x dark/light on the computed cascade, 9 paint properties each)`.
- freeze: `freeze OK (276/276 ...)`.
- parity: 0 gaps, 0 undeclared, 24 declared.
At 8ab5e91 (R1 evidence, logs without suffix): same results; jest 4812 passed/2 skipped on the first run in the fresh worktree (an `it.skip` in printTwinDeltaAllowedSet fires until the host-css cache exists), 4813/1 after shots.

## Red-proofs
- Harness gate: `logs/sc450-gate-mutation-C-in-place-forgets-data-pressed.log` - with `setPressedState` stamping `data-pressed` only on the first write plus a temporary rule `.dse-nt__chip[aria-pressed='true']:not([data-pressed]){background-image:none!important}`, the gate reports VIOLATED (backgroundImage "none" vs gradient, idle->pressed, dark+light). A first mutation that dropped data-pressed everywhere stayed green, correctly (in-place and rendered then agree). The proof ran against the gate text extracted verbatim from shoot.mjs (a scratch runner), not a full sweep. Reverted; `git status` clean.
- Guard: `logs/sc450-guard-red-proof.log` - a temporary bare `sw.setAttribute('aria-pressed', ...)` in ConditionsModal fails the scan naming `line 383`. Reverted.

## Files / artifacts
Logs in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc450-aria-pressed/logs/` (all `sc450-*`): gate logs listed above, `sc450-gate-on-base-8ab5e91.log`, `sc450-gate-on-fixed.log`. No crops (nothing drifts visibly); `evidence/` is empty.

Drive-by fixes: none.

Follow-ups:
- The two read-only `<span class="dse-init__action-toggle">` data-pressed writes (initiative/view.ts ~873, ~951) use a hand `toggleAttribute`; a state-display span is not a toggle, so they are allowlisted rather than routed. If a read-only display ever moves to a different hook, the allowlist entry goes stale and the guard's stale-entry test says so.
- The harness gate's pitfall-chip "rendered pressed" reference is borrowed from the rendered-pressed motivation chip (the `checked` fixture has no pressed pitfall). If a future restyle differentiates pitfall chips from motivation chips, that one comparison will false-red and needs a fixture with a pressed pitfall (adding a fixture would change the shot sweep, so I did not).

---

## R3 (fix round for R2 review findings LOW-1, LOW-2, LOW-3, INFO)

### Executive summary
- Base still `f818002` (fetched; develop unchanged). Head `84b27ac`, branch `sc450-aria-pressed`, 3 new commits on `99ae762`; not pushed.
- LOW-1: harness gate now measures every site at rest, hover and focus-visible, each state driven for real (pointer to centre, Tab then focus, `:hover`/`:focus-visible` must match or the gate fails). Line now reads `pressed toggle parity OK (... 96 comparisons across 8 sites x dark/light x rest/hover/focus-visible ...)`. Red against the reviewer's M2 (hover-only rule + bare in-place write): fails only in the hover state, dark and light.
- LOW-2 + INFO: guard rewritten on the TypeScript AST (no comment/string stripper). Catches `.dataset.pressed` writes/delete, `ariaPressed` assignments (`=`, `??=`, `||=`, `&&=`, `['ariaPressed']`), `ariaPressed` object keys, folded names (`'aria-'+'pressed'`, template), a write after a string containing `//`. `iconButton.ts` is scanned; only `setPressedState`'s body may write.
- LOW-3: allowlist entries match by exact line text with exact count. Swap case proved red.
- Gates: tsc/lint clean; jest 4819 passed / 1 skipped / 228 of 229 (+2 tests); lifecycle 25/25; e2e 63/73 ok, 0 failed, 10 known-bug, 47/47 pairs; shots 572 PNGs, 0 FAIL; freeze 276/276; parity 0/0/24.
- One jest flake, not touching this change: `sidebarInitiative.test.ts` (SC-288 r2) failed once in a full run, passed alone (11/11) and in the next full run (4819/1/228 of 229).

### Commits (on f818002)
- `8f298d6` per-state harness gate (LOW-1)
- `1325acb` AST guard + line-text allowlist (LOW-2/LOW-3/INFO)
- `84b27ac` gate scrolls each control into view before hovering it. The first full sweep (shorter viewport than my scratch runner) reported two blind-hover problems for the dossier chip below the fold, `logs/sc450-shots-r3-attempt1-blind-hover.log`; fixed and re-run.

### Red-proofs (logs in `.../sc450-aria-pressed/logs/`)
- `sc450-r3-gate-M2-hover-mutation.log`: `setPressedState` stamping data-pressed only on first write (bare in-place write) + `.dse-nt__chip[aria-pressed='true']:not([data-pressed]):hover{background-image:none!important}` -> VIOLATED, 6 lines, all `hover|idle -> pressed`, backgroundImage "none" vs gradient; rest and focus-visible clean. Reverted. (Run on the gate text extracted verbatim from shoot.mjs by a scratch runner.)
- `sc450-r3-guard-red-shapes.log`: a temporary `src/sc450-r3-impl-shapes.ts` (removed) with each new shape - dataset `=`/`['pressed']`/`delete`, `ariaPressed` `??=` `||=` `&&=` `['ariaPressed']=` and `Object.assign` key, `'aria-'+'pressed'`, template-built name, write after a `//`-containing string, `toggleAttribute('data-pressed')` - each line reported by file:line; plus a temporary second writer appended to `iconButton.ts` (`line 169`) and a swap in `initiative/view.ts` (one allowed span write replaced by a bare `aria-pressed` write: `line 872`, count unchanged, still red). All reverted; `git status` clean.
- The same shapes are also in the guard's own can-fail test (`the scanner recognises every write shape ...`) and the swap case in `an allowlist entry matches by line text ...`.

### Gate logs (suffix -r3)
`sc450-tsc-r3.log`, `sc450-lint-r3.log`, `sc450-jest-r3.log` (4819/1/228 of 229), `sc450-jest-r3-final.log` (the flake run), `sc450-jest-r3-final2.log` (4819/1/228 of 229 after the last commit), `sc450-lifecycle-r3.log`, `sc450-e2e-r3.log`, `sc450-shots-r3.log`, `sc450-freeze-r3.log`, `sc450-parity-r3.log`.

Drive-by fixes: none.
Follow-ups: none new (the sidebarInitiative flake is pre-existing and unrelated; observed once under a full run).

---

## R5 (test-file-only fix round for R4 findings)

### Executive summary
- Base `f818002` (develop unchanged). Head `4f5f318`, one commit on `84b27ac`; only `test/unit/build/ariaPressedWriters.test.ts` changed. Not pushed.
- LOW-1: attribute-name match is now case-insensitive (`PRESSED_NAMES.has(v.toLowerCase())`), so `setAttribute('ARIA-PRESSED', ...)` / `toggleAttribute('Data-Pressed', ...)` are caught. `ariaPressed` property names stay case-sensitive.
- INFO (folded part): a `pressed` key (identifier or string key) in an object literal passed to `Object.assign(<x>.dataset, ...)` is flagged. The dataset alias, non-literal keys and runtime-built names are not chased (ruled out).
- Self-test list extended with `'ARIA-PRESSED'`, `'Data-Pressed'` and both `Object.assign(el.dataset, ...)` key forms (and two harmless `Object.assign` counter-cases: other dataset key, non-dataset target).
- Red-proof `logs/sc450-r5-guard-red.log`: a temporary `src/sc450-r5-impl-shapes.ts` (removed) with the four new shapes. The previous guard (R3 test file) stays green on it (5/5 - the miss); the new guard fails naming lines 2-5.
- Gates: tsc and lint clean; jest 4819 passed / 1 skipped / 228 of 229 (new cases are inside the existing can-fail test, so the count is unchanged). Shots/freeze/parity/lifecycle/e2e not re-run (test-file-only delta).
- Logs: `sc450-tsc-r5.log`, `sc450-lint-r5.log`, `sc450-jest-r5.log`, `sc450-r5-guard-red.log`.

Drive-by fixes: none. Follow-ups: none.

### R5 addendum: rebase onto 9ed8dc6 (SC-428) and full battery
- Base `9ed8dc6`, final head `c616e22` (branch `sc450-aria-pressed`, 8 commits, rebased clean; `src/framework/kit/index.ts` auto-merged with both sides' exports kept: `setPressedState` and `labelWithReason`). The R5 commit is `c616e22` (was `4f5f318` pre-rebase). No package.json/lockfile change.
- The guard stays green: SC-428 adds no aria-pressed/data-pressed writer.
- Gates at 9ed8dc6 (logs suffixed `-9ed8dc6`): tsc/lint clean; jest 4849 passed / 1 skipped / 228 of 229 suites (4840 + 9); lifecycle 25/25; e2e `68/76 ok, 0 failed, 8 known-bug, coverage: 51/51 pairs`; shots 572 PNGs, 0 FAIL, `pressed toggle parity OK (96 comparisons ...)`; freeze 276/276; parity 0 gaps / 0 undeclared / 24 declared.
