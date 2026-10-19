# SC-372 r2 review + F1/F2 design (independent reviewer)

## Executive summary
- **Verdict: FIX-REQUIRED.** r1's fix is correct and every gate reproduces green. The branch is not land-ready only because F1 is folded into SC-372 and is not implemented yet. **Findings: 0 BLOCKER, 1 HIGH (F1), 1 MEDIUM, 2 LOW, 4 INFO.**
- I re-measured r1 @ fcbcd09 (on a337460) myself. tsc and lint are clean. jest 4438 passed / 1 skipped / 220 of 221 suites. shots 568 PNGs, 0 FAIL, `text scale OK (1104 comparisons …)`. freeze `OK (274/274)`. parity 0 GAPs / 0 undeclared / 24 DECLARED.
- **The knobs work everywhere they are stamped.** I measured every element (plus ::before/::after) on every harness page: 117 screen loads and 194 print loads, at 1.2 and 0.8. A text that is not nested scales by exactly S. No ratio falls outside {1, S, S²}, and control never moves on paper.
- **F1, exact count: 9 distinct same-knob nesting pairs, affecting 1,670 screen element×knob ratios (S²) and 382 print ones.** r1's presence-based count was too high. Nested element roots compound too, which no fixture shows: a statblock embedded in a party `hero_ref` (the G-S6h slot) reaches S² and S³.
- **F1 recommendation, one line:** keep a small registry of consumer "containers" whose children, ::before/::after and nested roots re-declare that knob's roles as plain `em` ratios. No new tokens, the token rule is unchanged, about 4 KB of CSS. Backstop it with a new full-manifest `text scale once OK` sweep in `npm run shots`. The prototype has 0 violations across 150,042 oracle ratios and 0 of 80,990 default baselines moved. I applied the exact spec block to the worktree, then reverted it: shots 568, 0 FAIL; `text scale OK (1104)`; sweep `text scale once OK (102063 comparisons / 197 loads)`; **freeze OK (274/274)**.
- **F2: open a TICKET, don't fold.** A local fix does exist and is specified below. But the sidebar only ships behind the experimental switch (SC-406, 7.1.0), the fix is TypeScript lifecycle code, and the same gap also affects three other surfaces with different hosts. One of them ships in 7.0.0: the Compendium search modal.

## Findings

### HIGH-1 — F1: a role nested in another consumer of the same knob compounds the knob (owner ruled: FOLD)
- **Where:** `styles-source.css:6608-6654`, the token rule. Roles are `calc(<r>em * S)`, and `em` is the parent's size. The 9 measured pairs and their source lines are in the table in §F1.1.
- **Failure scenario:** at Small text size 120%, the statblock power-roll tier badge text goes 12.96 → 18.66 px (×1.44), larger than its own 17.28 px badge, and "12-16" wraps (`evidence/sc372-small-120.png`). Embedding another element inside a label-sized host compounds every small role inside the embed: party `hero_ref` → embedded statblock gives 36 texts at ×1.44 and 6 at ×1.728 (probe below).
- **Fix:** §F1.4 spec.

### MEDIUM-1 — The in-run gate cannot see compounding, or any consumer outside its 17-row sample
- **Where:** `visual-harness/shoot.mjs:101-151` (the `TEXT_SCALE_*` tables) and `:6196` ("every real consumer below is deliberately un-nested").
- **Failure scenario:** a new nested consumer, or one of the 9 existing pairs, never shows up. The gate is green on r1 while 1,670 ratios are S².
- **Fix:** add the `text scale once OK` sweep (spec §F1.4 step 3). The prototype is non-vacuous: on r1 it prints `TEXT SCALE COMPOUNDS - 12 distinct element(s)` and lists exactly the 9 pairs on screen and print. On the fixed sheet it is green.

### LOW-1 — More role-token consumers sit outside any stamped root (the F2 family, pre-existing)
The catalog says "Applies everywhere" for Small, but these surfaces ignore it:
- `.dse-compendium-suggest__type/__source/__code/__hint` (`styles-source.css:2367/2394/2408`). They render in `CompendiumSearchModal extends SuggestModal` (`src/authoring/CompendiumSearchModal.ts:73`). That is not a DseModal, so it is never stamped, and it **ships in 7.0.0** (`main.ts:585`, not gated).
- `.dse-settings-preview__label` (`:16345`). It is the caption outside the stamped preview root.
- `.dse-sidebar__panel-header` (`:16213`) and `.dse-sidebar__empty-message` (`:16289`). Both are experimental-only.
- **Fix:** file one Backlog ticket (see §F2).

### LOW-2 — The docs tell authors to "keep a role's consumers un-nested", but nothing enforces it and the code breaks it 9 times
- **Where:** `.repo-docs/font-sizes.md:55` and the superproject's `docs/superpowers/dse-overhaul/D3-token-map.md` point 4 ("Known property, not changed here").
- **Fix:** rewrite both as part of the F1 work (§F1.4 step 5).

### INFO
1. **Misleading failure message.** `shoot.mjs:6287` and `:6300` print `(baseline Xpx x 0.8)` for a control consumer on paper, where the expected value is the baseline itself. The vacuity run shows it: `expected 13.6000px (baseline 13.6px x 0.8)`. Fix: print `x ${value}` only when `expected !== b`.
2. **`ROOT_BLOCK` is copied verbatim into 4 test files**, and F3 adds 2 more. It is acceptable, but a shared `test/` helper would stop them drifting apart.
3. **Cross-knob products are untouched by the F1 fix, and that is intentional.** There are 18 distinct cases, for example the "To go" label inside the portrait-toggle button moving with both Small and Control. Each knob applies once, which matches the help text ("text on buttons" means Control). A "nearest consumer wins" rule would need a decision from Scott; I did not prototype it.
4. **`src/framework/tokens.ts:123` says "The eight scale-dependent roles"**, but 14 tokens move: the 8 roles plus h1–h6. The wording is accurate only if h1–h6 do not count as roles. Optional rewording.

## Probe results (items 1–8)

| # | Probe | Result |
|---|---|---|
| 1 | All 3 knobs at 0.8 and 1.2, on every page/fixture (manifest elements×fixtures, interaction shots incl. the montage DseModal, pref shots, chrome stacks). Computed font-size of every element plus pseudo-elements. | Screen 1.2: 117 loads, 8,013 visible in-root texts, 74,589 element×knob ratios, **0 anomalies** (every ratio is 1, S, or S² in a nested pair). Screen 0.8: same counts, 0 anomalies. Print (twin + realprint) 1.2: 194 loads, 75,453 ratios, 0 anomalies. Stamped roots are exactly the two call sites (`pipeline.ts:580` reflect, `managedModal.ts:123` reflectCss), so r1 missed **no stamped root**. The unstamped consumer surfaces are LOW-1. |
| 2 | Two roots on one page, stamped by hand with opposite values; unstamped span. | Root A (small .8 / large 1.2 / control .8): label 0.8000, name 1.2000, button 0.8000. Root B (inverted): 1.2000 / 0.8000 / 1.2000. Unstamped span stays 13.6 → 13.6, and `<html>` resolves `calc(0.85em * 1)`. No cross-talk. (In production all css prefs are global: `prefOverrides.ts` rejects them per block.) |
| 3 | Nested roots: counter / statblock root moved into the party `.dse-party__member-ref` (label consumer, the G-S6h slot); into a plain container; montage root inside a stamped DseModal body. | The inner root resolves its own stamp, and re-declaring the tokens does not double-apply anything. Plain container: all 1 or S, except the known badge pair. Modal body: 122 S, 10 S² (badge pair). **Inside a same-knob consumer it compounds**: statblock-in-member-ref at Small 1.2 gives {1: 34, S: 96, S²: 36, S³: 6}. Fixed by the recommended mechanism: {1: 34, S: 138}. |
| 4 | Print: small and large apply, control does not. | The r1 gate passes in twin and realprint. My exhaustive print run found 0 control movement on paper and exact S for un-nested small/large. Print compounding: 4 of the 9 pairs (badge-text, malice-log heading, nt__why, chip-note; the chip-note pair is print-only). |
| 5 | Direct consumers of the scale vars. | Only `styles-source.css:17444` (the "Untitled encounter" prompt, `label / 1.462 / large-scale`). It is correct after r1 (gate row) and still correct under the F1 fix, because the h2 is not registered and the divisor reads the unchanged stamp. The `calc(var(--dse-fs-heading|numeral) * k)` derivations scale with their token (0 anomalies). No TS sets any `--dse-fs-*` value except the catalog stamp. |
| 6 | The gate is not vacuous. I sliced shoot.mjs's own gate code (`gate-runner.mjs`) and ran it against broken sheets. | r1 sheet: OK (1104). Tokens back on `:root` only: BROKEN, 356 lines. `.dse-modal` dropped from the selector: BROKEN, 32 (all modal rows). `--dse-fs-micro` alone left on `:root`: BROKEN, 30. Control consumer forced to scale on paper: BROKEN, 4. Prompt divisor removed: BROKEN, 2. Each claim in the OK line is backed. The gate does not claim nesting, and it does not cover it (MEDIUM-1). |
| 7 | Defaults: zero frozen bytes. | I re-ran shots + freeze on r1: `freeze OK (274/274)`, shots 568 PNGs, 0 FAIL. Parity 0/0/24. |
| 8 | Single source of truth. | r1 has no duplication: one rule. Its guard (`scaleTokenScope.test.ts` "no other rule declares any of them") really fails on a second declaration: with my F1 block applied it fails, 1 of 4439. The F1 spec intentionally adds plain-ratio re-declarations, so that test has to be widened together with a divergence test (§F1.4 step 4). |

## F1 / F2 design

### F1.1 Enumeration: same-knob consumer inside a same-knob consumer, same root, measured at 1.2

Method: an element's own multiplier m = R(element) / R(parent), where R = fs(knob=S) / fs(default). A consumer has m = S. The pairs below are consumers whose ancestor is also a consumer, total R = S² = 1.44 (0.64 at 0.8).

| # | knob | outer consumer (rule) → inner consumer (rule) | surface | example px (default → 1.2) | pages |
|---|---|---|---|---|---|
| 1 | small | `.dse-pr__badge` (caption `:15109`, Steel secondary `:9966`) → `.dse-pr__badge-text` (secondary `:15143`) | screen + print | 12.96 → 18.66 (print 11.52 → 16.59) | 33 (every power-roll panel) |
| 2 | control | `.dse-init__actions` (Steel control `:13723`) → `.dse-btn.dse-init__action-toggle` (control kit rule) | screen | 11.56 → 16.65 | 13 initiative |
| 3 | control | `.dse-init__grouphead > .dse-init__turnbox` (`:13955`) → `.dse-btn.dse-init__turn` | screen | 11.56 → 16.65 | 13 |
| 4 | small | `.dse-init__malice-log` (caption `:880/1013`) → `.dse-init__malice-log-heading` (caption `:1039`) | screen + print | 10.24 → 14.75 | 13 |
| 5 | small | `.dse-mt__board-rhead` (micro, Steel screen `:4586`) → `.dse-mt__rhead-w` (micro `:4600`) | screen | 7.84 → 11.29 | 8 montage |
| 6 | small | `.dse-mt__board-rhead` → `.dse-mt__rhead-sub` (micro) | screen | 7.84 → 11.29 | 8 |
| 7 | small | `.dse-nt__check` (secondary `:2818`) → `.dse-nt__why` (caption `:2838`) | screen + print | 11.52 → 16.59 | 5 negotiation |
| 8 | small | `.dse-mt__guide-item` (caption `:5131`) → its own `::before` (micro `:5136`) | screen | 8.96 → 12.90 | montage-guide-open |
| 9 | small | `.dse-optchip` (caption `:2126`; print only, where the Steel control rule `:11598` does not apply) → `.dse-nt__chip-note` (micro `:2795`) | print | 8.96 → 12.90 | negotiation:checked/ended |
| + | small | any K-consumer that hosts rendered markdown → an embedded element root's K roles (G-S6h: `.dse-party__member-ref` label `:5917`; also `.dse-mt__brief-text` secondary `:4572`) | real vault only, no fixture | S² / S³ | — |

None for the large knob. r1's presence-based scan over-counts. For example, negotiation `.dse-track__n` in `.dse-track` is ×1.2, a single scaling, because `.dse-track` is not a consumer.

### F1.2 Options weighed (all prototyped and measured with the same oracle)
The oracle compares each prototype to r1, element by element, over all pages: an r1 ratio of 1 must stay 1; an r1 ratio of S or S² must become exactly S; every default baseline must be bit-identical.

| option | mechanism | exactly once (screen 1.2 / print 1.2) | defaults moved | nested roots | future authors | cost |
|---|---|---|---|---|---|---|
| A | per-rule cancel `calc(<tok> / var(--dse-fs-K-scale))` on each inner rule (like the prompt rule) | measured cases only | 0 (by construction) | **not handled** | a new pair needs a new context-qualified rule; only the gate catches it | ~9 rules, several with copied Steel/print anchors (the chip-note case needs a paper-only selector); perf ≈ r1 |
| G-full (G1/G2) | generic: all 207 consumer selectors in `:where(…) > *` lists that mark the knob "applied" (`/ var(--dse-fs-K-applied)` in the tokens) | 1665 fixed; **2 violations**: chip-note on screen goes inert, because `.dse-optchip` matches the list but loses the cascade to the Steel control rule, so a central list cannot follow cascade order; and the guide-item ::before is missed | 0 / 32,908 | handled | a missing consumer is caught by a jest list-equality test, but that needs a nesting-flattening generator (styles-source uses CSS nesting) | +17–22 KB CSS, 3 new tokens (DSE_TOKEN_NAMES/coverage churn), **full-document recalc +20–25 % (G1) / +35–40 % (G2)** in a 23k-node DOM: a universal-key `* ` selector runs against all of Obsidian's DOM |
| H | small container registry + `-applied` divisor tokens | 1670 / 382 fixed, **0 violations** | 0 / 32,908 + 48,082 | handled | the gate names the chain; you register the container | ~3.9 KB, 3 new tokens, token formulas change |
| **Hp (recommended)** | same registry, but the registered containers' children / ::before / ::after / nested roots re-declare the K roles as **plain em ratios**; tokens unchanged | **1670 / 382 fixed, 0 violations; 0.8 also 1670 fixed, 0 violations** | **0 / 32,908 (screen) + 48,082 (print) + 32,908 (0.8 run)** | handled ({1: 34, S: 138}) | same as H | ~4 KB, **no new tokens, the r1 token rule and prompt rule are byte-unchanged**, perf ≈ r1 (see §F1.3) |

Ruled out without a prototype:
- **Registered `@property <length>` tokens** resolved at the root. They cancel compounding but also make every nested role root-relative, which moves the default look (badge-text would go from 0.81 to 0.8 of the root, and so on). That violates O5.
- **Container style queries** (`@container style(--x)`) can see the parent, but Obsidian's Chromium floor is 106 (`esbuild.config.mjs:104-112`) and style queries need 111+.
- **Any "the parent already applied the knob" trick.** A custom property set on X is visible to X itself, so X cannot carry a flag only for its children. A child-combinator selector is the only Chrome 106 primitive that targets children and not the element itself, which is why every working option needs a selector list.

### F1.3 Prototype measurements (Hp)
- Oracle vs r1, screen 1.2: 74,589 element×knob ratios. 1,670 compounded → exactly S; 12,086 single-S kept; 60,833 unmoved kept; **0 violations**. Print 1.2: 75,453 ratios, 382 fixed, **0 violations**. Screen 0.8: 74,589 ratios, 1,670 fixed (0.64 → 0.8), **0 violations**.
- Defaults: 32,908 screen + 48,082 print + 32,908 (0.8-run) baselines, **0 differ** (bit-identical font-size).
- r1's own `text scale OK` gate on the Hp sheet: **OK (1104)**, prompt row included.
- Nesting sweep (`gate-nesting.mjs`): r1 sheet gives `TEXT SCALE COMPOUNDS - 12 distinct`. The Hp sheet gives `text scale once OK (102063 comparisons over 197 loads …; 106s)` (77–106 s at load average 10–13).
- Nested roots on Hp: statblock in party member-ref {1: 34, S: 138}; plain container {1: 130, S: 42}; in a modal body {1: 14, S: 132}. Two-roots cross-talk is unchanged (OK).
- Perf, full-document recalc + layout, 23,573 nodes, median of 30, best of 3. Run 1: r1 324–389 ms, A 348 ms, G1 407–450 ms, G2 460–479 ms. Run 2: r1 329–332 ms, **Hp 348–356 ms (+~6 %)**, G1 423–427 ms (+~29 %).
- **Exact spec block applied to the worktree's `styles-source.css`** (source form with CSS nesting; reverted afterwards, `git status` clean, harness rebuilt; harness.css md5 back to ea4e538…):
  - esbuild chrome106 lowers it cleanly.
  - `npm run shots`: 568 PNGs, 0 FAIL, `text scale OK (1104 …)`, every other in-run gate OK.
  - **`freeze OK (274/274)`**.
  - Sweep against the real built harness: `text scale once OK (102063 comparisons over 197 loads; 74s)`.
  - jest: 4437 passed / 1 failed / 1 skipped. The one failure is exactly the expected `scaleTokenScope` "no other rule declares any of them", which spec step 2 rewrites. No other suite is affected (fontSizeContract, token-coverage, tokens, theme-steel, headingScaleTokens all green).

### F1.4 Implementation spec for r3 (no judgment calls)
1. **CSS.** In `styles-source.css`, immediately after the closing `}` of the SC-372 token rule (the line after `--dse-fs-h6: calc(1em * var(--dse-fs-large-scale));`), insert **verbatim** the block in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc372-textscale/sc372-r2-review/spec-once-block.css`. It contains:
   - A comment explaining the mechanism and the registration rule.
   - A small-knob `:where(<9 selectors>) { & > *, &::before, &::after, & :is([data-dse-element], .dse-modal) { --dse-fs-secondary: 0.9em; --dse-fs-label: 0.85em; --dse-fs-caption: 0.8em; --dse-fs-micro: 0.7em; } }`.
   - A control-knob counterpart with 3 selectors, re-declaring `--dse-fs-control: 0.85em`.
   - Do not change the token rule, the prompt rule, or any consumer rule.
   - esbuild (chrome106) lowers the block to 4 flat selector lists per knob; verified in `harness/lowered-spec.css`.
2. **Tests.** In `test/unit/build/scaleTokenScope.test.ts`:
   - Replace test 3 ("no other rule declares any of them") with: every declaration of a scale-dependent token sits either in the shared token rule or in a rule whose normalized selector is exactly `& > *, &::before, &::after, & :is([data-dse-element], .dse-modal)` (the `rules` regex already yields that innermost selector).
   - Add a **divergence test**: each such registry rule declares exactly the full token set of exactly ONE knob (small = 4, control = 1, large = 9). Each value equals the `<r>em` coefficient of that token's `calc(<r>em * var(--dse-fs-K-scale))` in the token rule (parse the coefficient; compare strings). Prove it bites: change `0.85em` to `0.86em` in a scratch run; the test must fail.
   - F3: in `test/dom/theme/scaleRules.test.ts:207` and `test/dom/framework/theme-steel.test.ts:208`, switch to the same line-anchored `ROOT_BLOCK` regex the other four files use.
3. **Gate.**
   - In `visual-harness/shoot.mjs`, add `async function assertTextScaleOnce(page, manifest)`. Port `sweepKnobs` verbatim from `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc372-textscale/sc372-r2-review/gate-nesting.mjs`, along with its page loop: the screen loop covers every manifest element×fixture page plus interactionShots (click), prefShots (prefs, width) and chromeShots (stack, prefs, hover). The print-twin pass covers element×fixture pages, with `mustNotMove: ['control']`. Use S = 1.2.
   - Call it on the line after `await assertTextScale(page);` (`shoot.mjs:5688`, inside the same `if (!args.element)` full-run branch), passing the `manifest` already loaded at `:5439`.
   - On success print `text scale once OK (<n> comparisons over <loads> loads: …)`. On failure print `TEXT SCALE COMPOUNDS` with one line per `[surface] knob: <chain> -> <element> x<ratio> (pages)`, then the remedy "register the outer consumer's own selector in styles-source.css → 'SC-372: EACH TEXT-SIZE KNOB APPLIES ONCE'", and `process.exit(1)`.
   - Also add three real rows to `TEXT_SCALE_PAGES` so the inner consumers are pinned at exactly S (catches an over-broad registry entry that makes text inert): statblock `['statblock .dse-pr__badge-text (nested secondary)', '.dse-pr__badge-text', 'small']`; initiative `['initiative .dse-init__action-toggle (nested control)', 'button.dse-init__action-toggle', 'control', true]`; negotiation `['negotiation .dse-nt__why (nested caption)', '.dse-nt__why', 'small']`.
   - Replace the comment at `:6196` ("Nested consumers of one knob compound … deliberately un-nested") with a pointer to the new sweep.
   - Fix INFO-1's message while you are there.
4. **Vacuity proof (r3 must record it).** With the CSS block removed and the gate kept, the sweep prints `TEXT SCALE COMPOUNDS` with the 12 lines from `logs/gate-nesting-r1.log`. With it restored, it is OK.
5. **Docs.**
   - `.repo-docs/font-sizes.md:55`: replace "keep a role's consumers un-nested" with the registry rule (register an outer consumer that can contain same-knob text or rendered markdown; copy its own selector; the sweep enforces it).
   - Superproject `docs/superpowers/dse-overhaul/D3-token-map.md` point 4: replace "Known property, not changed here …" with one sentence on the registry.
   - `CHANGELOG.md`: append to the SC-372 [FIX] entry, "Text nested inside other small text (power-roll tier badges, the malice log heading, montage round headers) scales once, not twice."
   - Workspace `.claude/skills/dse-verify/SKILL.md` "Current expected numbers": add the `text scale once OK` line.
6. **Expected gates after r3:** tsc/lint clean · jest 4438 + 1 new (divergence) passed, test 3 rewritten · lifecycle not required (no TS) · shots 568, 0 FAIL, `text scale OK (≥1104 + new rows)` and `text scale once OK (~102,063 comparisons over 197 loads)` (adds ~80–110 s) · freeze `OK (274/274)` · parity 0 / 0 / 24.

### F2: sidebar panel header (and its family)
- **A local fix exists:**
  - In `SidebarPanel.renderHeader()` (`src/framework/sidebar/SidebarPanel.ts:199`), after creating the header, call `this.deps.prefs?.reflectCss(header, this)`. `deps.prefs` is already threaded in production (`main.ts:518`), and `SidebarPanel extends Component`, so the subscription is released on unload.
  - Add `.dse-sidebar__panel-header` to the token rule's selector list.
  - Add a jsdom test that the header carries `--dse-fs-small-scale` after `prefs.set`, and extend `scaleTokenScope` test 6 to the third stamper.
- **Recommendation: TICKET, not fold.**
  - The sidebar exists only with the experimental switch on (`main.ts:502-505`, SC-406, deferred to 7.1.0), so folding it adds TS lifecycle code, and therefore the lifecycle gate, to a release-gating ticket for a surface that does not ship.
  - The same gap affects the shipping Compendium search modal (a `SuggestModal`, not a `Component`-owned DseModal, so it needs a lifetime owner for the subscription), the settings preview caption, and the sidebar empty message.
  - One ticket should decide whether plugin chrome follows the text knobs, and fix all four surfaces.
  - **Ticket text:** "Role-token consumers outside any stamped root ignore the Small/Control text-size knobs: compendium search modal hints, settings preview caption, sidebar panel header + empty message (the last two experimental). Parent SC-372. Local fix for the sidebar header specced in sc372-r2-review-report.md §F2."

## Artifacts
All paths below are under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc372-textscale/sc372-r2-review/`:
- `enum.mjs`, `analyze.mjs`, `compare.mjs`: the exhaustive enumeration, its analysis, and the oracle.
- `consumers.mjs`: the CSSOM consumer list.
- `probe-roots.mjs`: items 2 and 3.
- `gate-runner.mjs` + `run-gates.sh`: shoot.mjs's own gate on scratch sheets.
- `gate-nesting.mjs`: the sweep to port.
- `perf.mjs`.
- `gen-proto.py` (G1/G2), `gen-H.py`, `gen-Hp.py`, `mkpage.sh`, `run-enum.sh`.
- `spec-once-block.css`: the exact CSS to insert.
- `harness/`: scratch harness pages per variant.
- `out/`: raw JSON plus `*-analysis.txt` / `cmp-*.txt`.
- `logs/`: battery logs, gate vacuity logs, nesting sweep logs, perf.
