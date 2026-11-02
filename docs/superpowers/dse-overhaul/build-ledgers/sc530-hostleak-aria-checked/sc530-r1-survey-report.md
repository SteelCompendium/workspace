# SC-530 r1: survey + prototype — `aria-checked` in the button host-leak kind key

## Executive summary
1. **Recommendation: form (A)**, `|checked` only when `aria-checked="true"` (placed after `|selected`, before `|disabled`). **Reach: no new click and no new section.** SC-527's first negotiation section (section 38) already picks tier #0. That row is the only checked tier row in the sweep DOM, and SC-530 adds one `reached` selector to that section's data. The track seal is checked at load. (B) only renames: no rule tells `false` apart from absent on a swept button, and every `button.dse-pr__row` carries the attribute.
2. **Prototype**: dse `sc530-r1-proto` @ **`d1ab0bd`** (local, not pushed), on `f81a277`. Only `shoot.mjs` changes, +28/−2, in four places: the `tagButtons` line, one `reached` selector in `SC527_STATES`, `SC530_EXPECT` + `assertSc530Tagged`, and one call site.
3. **Button sweep**: base 157 kinds / 942 comparisons, prototype **159 / 954**. The boundary stays at **34 records, identical, the same names**. The 2 new kinds are `negotiation|dse-pr__row|checked` (section 38, "≤11 −1 Patience chosen") and `negotiation|dse-track__slot|checked` (gallery section 19, "Patience 3"). Renamed 0, lost 0, first nodes moved 0 (dark and light). **Modal pass: 228, 38 kinds, no change.** None of its 10 scenarios has an `aria-checked` node. Form (B) would also give 159 / 954, but it renames 2 kinds (same first nodes).
4. **PNGs**: 592 base and 592 prototype, **all sha256 identical**. The 4 probe runs were also identical. Freeze 280/280. Built `main.js` (`753da90d…`) and `styles.css` (`ae45354b…`) are byte-identical between `f81a277` and `d1ab0bd`.
5. **Gates on the prototype**: tsc rc 0, lint rc 0, jest **6208 passed / 1 skipped / 249 of 250** (rc 0; the SC-527 reach tests also cover the new selector), shots rc 0, input 15/176, checkbox 7/116, prose 106 [212].
6. **Can-fail**:
   - (a) host-only `[aria-checked="true"].dse-pr__row { padding: 13px !important }`. Prototype rc **1**, 18 problems, **all on `negotiation|dse-pr__row|checked`**. The same probe on the `f81a277` harness gives rc **0**, 157/942: the gap was real.
   - (b) the tier click removed: rc **1**, 8 named lines, including `the sweep tagged no \`negotiation|dse-pr__row|checked\` button — a checked radio (SC-530) would go unchecked`.
   - Every probe was reverted and the tree is clean.
7. **Residual gap (owner call, beyond `aria-checked`)**: Interest's vertical seals share `negotiation|dse-track__slot` with Patience's horizontal ones, so they are never compared. Their own-box CSS differs (padding, width, border, colour; the current seal also has a background and an inset ring). Probe (c), a host-only rule on the vertical checked seal, stays **rc 0 on the prototype**. Form (C) = (A) + a vertical-track context, measured offline: 161 kinds, +2, 0 renamed / 0 moved.
8. **develop moved**: `git fetch` shows origin/develop is now `fb24f8a2` (SC-536). The owner said no rebase in r1, and `sc530-hostleak-aria-checked` is still at `f81a277`.

## 0. Method and state
- dse worktree `/home/scott/code/steelCompendium/worktrees/sc530-hostleak-aria-checked/draw-steel-elements`. At the start, origin/develop was `f81a277`. `npm ci` was run first, because there was no `node_modules`.
- The prototype is on local branch `sc530-r1-proto` (`d1ab0bd`). The checkout is back on `sc530-hostleak-aria-checked` @ `f81a277`. `git status --porcelain` is empty for both the dse and the superproject.
- The dse tree has gitignored dirt only: `node_modules/`, `visual-harness/dist/` and `shots/`, plus root `main.js`/`styles.css` written by jest's cssNesting test.
- **Inventory method** (`sc530-inv.mjs`): it takes the sweep's own declarations verbatim out of `shoot.mjs` (`sc530-extract.mjs`, the SC-527 r1 method). For each scheme it:
  - loads the button sweep URL;
  - runs the sweep's exact pre-tag sequence: `CHROME_REVEAL_CSS`, Modifiers, the extra roll modifier, `reachStateKindsForSweep`, `mountClickRevealedForSweep`;
  - runs the sweep's own `tagButtons`;
  - dumps every `button, .dse-btn` node in DOM order.

  It does the same for the 10 modal scenarios: each one's own `open()`, then `tagButtons` with its scope. `sc530-forms.py` asserts that the dump's recomputed key equals what `tagButtons` wrote, node for node, and that the first-node set matches. It then derives the kinds under each form.
- **CSS inventory**: `sc530-cssrules.py` walks the built `styles.css` and the pinned host `obsidian-app.css` (1.13.7) and keeps every rule whose selector names `aria-checked`, `:checked`, `data-current` or `role=radio`.

## 1. Inventory — every swept node carrying `aria-checked` (dark = light, identical)

**Gallery button sweep**: 499 nodes, 157 kinds. **48 nodes carry `aria-checked`: 7 `true`, 41 `false`, 0 `mixed`.** All are `<button role="radio">` inside `negotiation`. None is `[aria-checked]` outside the `button, .dse-btn` selector.

| family | where (section) | nodes | `aria-checked` at tag time | today's key | first node of its kind today |
|---|---|---|---|---|---|
| `button.dse-pr__row` (kit `powerRollPanel` selectable, `role=radio`) | 19 (gallery negotiation) | 4 | all `false` (no tier picked) | `negotiation\|dse-pr__row` | **#167, "≤11 −1 Interest, −1 Patience" (Y)** |
| same | 38 (SC-527 negotiation #1, tier #0 clicked) | 4 | **#411 `true`** ("≤11 −1 Patience chosen"), 3 `false` | same key | n (shares the key, never compared) |
| same | 39 (SC-527 negotiation #2, no tier click) | 4 | all `false` | same key | n |
| `button.dse-track__slot` (kit `track`, Patience: horizontal, `fill=remaining`) | 19, 38, 39 | 6 each | **slot 3 `true` + `[data-current]`**, the rest `false` | `negotiation\|dse-track__slot` | **#150 Patience 0 (sec 19) (Y)** |
| `button.dse-track__slot` (kit `track`, Interest: **vertical**, descending) | 19, 38, 39 | 6 each | **slot 3 `true` + `[data-current]`**, the rest `false` | same key as Patience | n: **never compared** (see §5) |

- **SC-356 modal pass**: 10 scenarios × 2 schemes have **0** `aria-checked` nodes and 0 outside the selector. Their kinds and counts are unchanged under every form.
- **Input sweep**: tagged inputs carry no `aria-checked`. Inputs have no checked state.
- **Checkbox sweep**: `tagCheckboxes`' key carries no state either, but it is **not the same blind spot**. The sweep drives `checked`, `checked+hover`, `indeterminate` and `disabled` as forced states on every kind (`STATES`, shoot.mjs ~:6540), so `:checked` CSS is compared by construction. No change is needed. (My inventory's input count reads 14 because it skips the sweep's initiative-title click, which only matters for the textarea. Not relevant here.)
- **Plugin CSS selecting a checked state on these nodes** (built `styles.css`; full list in `css-rules-plugin.txt`):
  - tier row:
    - `.dse-pr__row[aria-checked=true] { background; border-color }`
    - `[data-dse-element=negotiation] .dse-nt .dse-nt__roll-slot button.dse-pr__row[aria-checked=true] { border-radius:0 }`
    - steel `… .dse-nt__roll-slot button.dse-pr__row[aria-checked=true] { background-color; box-shadow: inset 0 0 0 2px accent }`
    - `.dse-pr__row[aria-checked]:focus-visible` (presence: it matches `true` and `false` alike)
  - track seal, all on `[data-current]` (which `track.ts` toggles together with `aria-checked`):
    - `.dse-track--vertical .dse-track__slot[data-current] { padding-top/bottom; font-weight }`
    - steel `.dse-track--vertical .dse-track__slot[data-current] { background-color; box-shadow; color }`
    - `@container dse-nt (max-width:420px) .dse-nt__interest .dse-track__slot[data-current] { display:grid; … }`
    - descendant-only: `.dse-track__slot[data-current] .dse-track__mark|.dse-track__n`
  - **No rule selects `[aria-checked=false]` or `mixed`.**
- **Host CSS**: the injected host copy (`OBSIDIAN_HOST_BUTTON_CSS`) and the pinned `obsidian-app.css` have **0** rules on `aria-checked` or `role=radio` (`css-rules-host.txt`).

## 2. Key forms — measured (inventory + shots)

| form | gallery kinds / comparisons | new kinds | renamed (old → new, same first node?) | lost | moved first nodes | modal |
|---|---|---|---|---|---|---|
| today | 157 / 942 | — | — | — | — | 38 / 228 |
| **(A) `\|checked` iff `="true"`** | **159 / 954** (shots-measured) | `negotiation\|dse-pr__row\|checked` (first #411, sec 38/negotiation, "≤11 −1 Patience chosen", 661.22×37.39); `negotiation\|dse-track__slot\|checked` (first #153, sec 19, "Patience 3", 30.39×30.39) | **0** | 0 | 0 | 38 / 228 (shots-measured) |
| (B) `\|aria-checked:<v>` | 159 / 954 (inventory) | `…dse-pr__row\|aria-checked:true` (#411), `…dse-track__slot\|aria-checked:true` (#153) | **2**: `negotiation\|dse-pr__row` → `negotiation\|dse-pr__row\|aria-checked:false` (same first node #167: yes); `negotiation\|dse-track__slot` → `negotiation\|dse-track__slot\|aria-checked:false` (same first node #150: yes) | 0 | 0 | 38 / 228 |
| (C) = (A) + vertical-track context (offline, for §5) | 161 / 966 | (A)'s 2 + `negotiation\|dse-track__slot\|in:track--vertical` (first #156 "Interest 5") + `…\|checked\|in:track--vertical` (first #158 "Interest 3") | 0 | 0 | 0 | 38 / 228 |

- The boundary is not affected by any form. None of the new or renamed kinds is disabled or unhittable. For (A) this is measured: 34 records, identical text. For (B) it is inferred: the same nodes, so the same records with 2 key strings renamed, which only appear if they are in the boundary, and they are not.
- **Why (A)**: the ledger's condition for (B) is "`false`/`mixed` carry separate CSS that would otherwise merge". It does not hold:
  - no `[aria-checked=false]` or `mixed` rule exists;
  - the only presence rule (`[aria-checked]:focus-visible`) cannot merge anything, because every swept `button.dse-pr__row` is selectable and so carries the attribute (static rows are `<div>`s, `powerRollPanel.ts:143`);
  - no source sets `mixed`.

  (B) costs 2 renames for no extra coverage. (A) mirrors `|selected` and renames nothing.
- **First nodes, prototype vs base** (`firstnode-cmp-base-proto.txt`, the sweep's own tag output): 0 lost, 0 moved (DOM index, section, label, w, h) in the gallery and in all 10 modal scenarios, dark and light. The only new kinds are the 2 above.

## 3. Reaching the checked state
- **The tier row: already in the sweep DOM, confirmed.** SC-527's first negotiation section (index 38) clicks `.dse-pr__row` #0 last, which enables Complete Argument. At tag time row #411 has `aria-checked="true"` (and it survives `mountClickRevealedForSweep`). The prototype adds `'button.dse-pr__row[role="radio"][aria-checked="true"]'` to that section's `reached` list, so the existing 5 s wait names it if it is not reached.
- **The track seal**: checked at load. A track always has exactly one current seal; the first in DOM order is the gallery's Patience 3. It needs no click.
- **Other controls that are checked only after a click**: none. Patience and Interest are checked at load. The tier row in sections 19 and 39 stays unpicked on purpose: clicking gallery section 19 would move nothing today, but SC-513/SC-527 doctrine is no gallery clicks. A second checked tier row would also add no kind.
- **Assertion**: `SC530_EXPECT = ['negotiation|dse-pr__row|checked', 'negotiation|dse-track__slot|checked']`, checked by `assertSc530Tagged`. Its one call site is right after `assertSc527Tagged` in `assertBtnHostLeak`. A miss gives a named FAIL, never a skip. The modal pass shares `tagButtons`, but no assertion is needed there (no `aria-checked` node).
- **SC-526 rebase**: SC-530 touches `tagButtons`, SC-527's data and comment, and one new block placed before `reachStateKindsForSweep`. It does not touch `SC513_*`, `mountClickRevealedForSweep`, the popover or any prefs.

## 4. Can-fail probes (each reverted with `git checkout HEAD -- visual-harness/shoot.mjs`, status clean)
| probe | head | rc | result |
|---|---|---|---|
| (a) `injectHostCss` also prepends `[aria-checked="true"].dse-pr__row { padding: 13px !important; }` (`leakprobe.diff`) | `d1ab0bd` | **1** | `BUTTON HOST-LEAK VIOLATED`, 18 lines, **all `negotiation\|dse-pr__row\|checked`**: rest/hover/focus-visible × dark/light × {h 37.39→47.39, height, padding "8px 18px"→"13px"} |
| (a) same on base harness | `f81a277` | **0** | `button host-leak OK (157 … 942 …)`: the base sweep cannot see it |
| (b) remove the tier click `['.dse-pr__row', 0]` from SC-527 negotiation #1 (`canfail-noclick.diff`) | `d1ab0bd` | **1** | 8 named lines per §4b below |
| (c) INFO: `.dse-track--vertical [aria-checked="true"].dse-track__slot { padding: 13px !important; }` (`vertprobe.diff`) | `d1ab0bd` | **0** | `button host-leak OK (159 … 954 …)`: the vertical current seal stays uncompared under (A) (see §5) |

(b), verbatim (dark; light repeats them):
- `dark: SC-527 negotiation: appeal to the first Motivation, mark the second spent, pick a Power Roll tier — the state was not reached: nothing in the extra negotiation section matches \`.dse-nt__complete button.dse-btn.dse-btn--accent:not(:disabled)\``
- `dark: SC-527 negotiation: … — the state was not reached: nothing in the extra negotiation section matches \`button.dse-pr__row[role="radio"][aria-checked="true"]\``
- `dark: the sweep tagged no \`negotiation|dse-btn.dse-btn--accent\` button — a state reached only by a click (SC-527) would go unchecked`
- `dark: the sweep tagged no \`negotiation|dse-pr__row|checked\` button — a checked radio (SC-530) would go unchecked`

All 4 probe runs wrote 592 PNGs, sha256-identical to base.

## 5. The residual gap the owner must rule on (vertical track seals)
- Under every `aria-checked` form, Interest's seals (vertical rail, 692 px wide) share the class signature `dse-track__slot` with Patience's (horizontal, 30 px round). The kind's first node is Patience 0, idle, and the `|checked` kind's first node is Patience 3.
- The vertical seal's **own box** has separate rules:
  - `.dse-track--vertical .dse-track__slot { width:100%; padding; border-bottom; line-height }`
  - steel `{ border-bottom-color; color }`, plus `:hover { background-color }`
  - current: `{ padding-top/bottom; font-weight }`, steel `{ background-color; box-shadow; color }`
- None of these has ever been compared. Probe (c) proves it for the current seal (rc 0). Under (A), the horizontal Patience 3 node is a weak sample: its checked CSS sits on descendants (`.dse-track__mark`, `.dse-track__n`), which the sweep does not read. The (A) kind is still correct, just low-yield.
- This is SC-205 R3's structural-context class (the same reason `|in:chrome` exists), not an `aria-checked` question. Options:
  - **fold** into SC-530 as form (C): add `|in:track--vertical` when `n.closest('.dse-track--vertical')`. Measured offline: +2 kinds (161 / 966), 0 renamed, 0 moved, no click. It would need a shots run plus a probe (c) that goes red.
  - or **file a follow-up**.

  r1 recommends (A) for SC-530 and leaves (C) to the owner.

## 6. Measurements
| run | dse | rc | PNGs | freeze | button | boundary | modal | input | checkbox | prose |
|---|---|---|---|---|---|---|---|---|---|---|
| base | f81a277 | 0 | 592 (`shots-base.sha256`) | (not run, per brief) | 157 / 942 | 34 (32 fv-disabled + 2 hover no-hit) | 228 (38 kinds) | 15 / 176 | 7 / 116 | 106 [212] |
| proto | d1ab0bd | 0 | 592, all identical | **280/280** | **159 / 954** | **34, identical list** | 228 (38 kinds) | 15 / 176 | 7 / 116 | 106 [212] |

Other prototype results: tsc rc 0 (`tsc` + `tsc -p e2e`), lint rc 0, jest 6208 / 1 / 249 of 250 rc 0, `node --check shoot.mjs` rc 0. Build sha256 base = prototype (`build-base.sha256`, `build-proto.sha256`).

Prototype button line verbatim: `button host-leak OK (159 button kinds × 3 states (rest/hover/focus-visible) × dark/light = 954 comparisons: every sampled property is identical with and without Obsidian's \`button\` rules; user-select and -webkit-app-region are excluded by design)`. Modal: `modal button host-leak OK (10 modal scenarios over 9 modal classes, 38 button kinds × 3 states (rest/hover/focus-visible) × dark/light = 228 comparisons: …)`.

**Boundary, all 34 records** (prototype = base, verbatim kinds):
- 32× focus-visible: disabled:
  - `featureblock|dse-btn.dse-btn--ghost.dse-rollbar__reset|disabled` ×2
  - `featureblock|dse-btn.dse-btn--icon.dse-stepper__btn|disabled` ×2
  - `feature|dse-btn.dse-btn--ghost.dse-rollbar__reset|disabled` ×2
  - `feature|dse-btn.dse-btn--icon.dse-stepper__btn|disabled` ×2
  - `hero|dse-btn.dse-btn--ghost.dse-rollbar__reset|disabled` ×2
  - `hero|dse-btn.dse-btn--icon.dse-stepper__btn|disabled` ×2
  - `hero|dse-btn|disabled` ×2
  - `montage|dse-btn.dse-btn--accent|disabled` ×2
  - `montage|dse-btn.dse-btn--icon.dse-mt__board-rowact|disabled` ×2
  - `montage|dse-btn|disabled` ×2
  - `negotiation|dse-btn|disabled` ×2
  - `party|dse-btn.dse-btn--icon.dse-stepper__btn|disabled` ×2
  - `roll|dse-btn.dse-btn--ghost.dse-rollbar__reset|disabled` ×2
  - `roll|dse-btn.dse-btn--icon.dse-stepper__btn|disabled` ×2
  - `statblock|dse-btn.dse-btn--ghost.dse-rollbar__reset|disabled` ×2
  - `statblock|dse-btn.dse-btn--icon.dse-stepper__btn|disabled` ×2
- 2× hover: no point in its box hit-tests to it: `initiative|dse-btn.dse-init__stamina` ×2

Modal boundary (unchanged): 6× focus-visible disabled, `modal:(none)|dse-btn.dse-btn--accent|disabled` @MinionStaminaPoolModal / @MontageAddHeroModal / @StaminaEditModal, ×2 each.

## For r2
- Rebase onto origin/develop `fb24f8a2` (SC-536, no shots-harness change per the owner). Re-run shots and check the PNG identity against `shots-base.sha256`, attributing any difference with a clean `fb24f8a2` run.
- Comments:
  - the `tagButtons` comment is in the prototype;
  - the SC-527 block header "Known gap (SC-530)" has been replaced, so check the wording;
  - the `entry.ts` `galleryExtra` comment needs no change, because SC-530 adds no section;
  - the dse-verify bullet: CURRENT 159/954, boundary 34 unchanged, and the "Open key gap: SC-530" sentence becomes closed. The owner drafts the proposal.
- Jest seam tests (in `test/dom/visual-harness/fixtures.test.ts`, beside SC-527's):
  1. `SC530_EXPECT` literal: exactly the 2 keys, each with prefix `negotiation`.
  2. `tagButtons` read out of the `shoot.mjs` source and run in jsdom on the gallery + SC-527 mount. At load it must give `negotiation|dse-track__slot|checked` and no `negotiation|dse-pr__row|checked`. After clicking section 38's `.dse-pr__row` #0 it must give `negotiation|dse-pr__row|checked`. It must never give any `aria-checked:` string or rename `negotiation|dse-pr__row` / `negotiation|dse-track__slot` (no renames).
  3. Call-site order: `assertSc530Tagged(` appears exactly twice (declaration + 1 call), after `assertSc527Tagged(` in `assertBtnHostLeak`.

  SC-527's existing reach tests already check that the new `reached` selector is absent at load and present after the clicks (they passed).
- Full battery per the ledger. Re-measure can-fail (a) and (b) on the r2 head. If the owner folds (C), add `|in:track--vertical`, a third `SC530_EXPECT` pair, and probe (c), which must then go red.

## Drive-by fixes
- None.

## Follow-ups
- (If (C) is not folded) **Vertical kit-track seals (Interest) are never compared by the button host-leak sweep.** They share `negotiation|dse-track__slot` with the horizontal Patience seals, and their own-box CSS is separate (§5). Probe (c) shows a host-only leak on them passes. This is a Backlog candidate, related SC-530 / SC-205.
- INFO: the button sweep samples only the button's own computed style. A track seal's checked or spent state is drawn on descendants (`.dse-track__mark`, `.dse-track__n`). The host `button` rules cannot select those spans, so there is no leak path today. No action.

## Evidence (scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc530-r1-a6e9f21b0f51c4756/`)
- Prototype patch: `sc530-r1-proto-d1ab0bd.patch`
- Shots `shots-<tag>.{log,rc,sha256,count,head,status,diff}`, tags `base`, `proto`, `leakprobe-head`, `leakprobe-base`, `canfail-noclick`, `vertprobe-head`:
  - base ran through `sc530r1-run.sh`: `shots-base.rc` = 0, and `shots-base.sha256` was taken right after the run
- Host-leak excerpts: `hostleak-lines-base.txt`, `hostleak-lines-proto.txt`
- Freeze: `freeze-proto.{log,rc}`
- tsc, lint and jest: `tsc-proto.*`, `lint-proto.*`, `jest-proto.*`
- Builds: `build-base.sha256`, `build-proto.sha256`
- Probe diffs: `leakprobe.diff`, `canfail-noclick.diff`, `vertprobe.diff`
- Inventory:
  - scripts: `sc530-extract.mjs`, `sc530-inv.mjs`, `sc530-inv.sh`, `sc530-forms.py`, `sc530-fncmp.py`, `sc530-cssrules.py`
  - dumps: `inv-base.json`, `inv-proto.json`
  - analyses: `forms-base.txt`, `forms-C-base.txt`, `firstnode-cmp-base-proto.txt`, `css-rules-plugin.txt`, `css-rules-host.txt`
- Runners: `sc530r1-run.sh`, `sc530-shots.sh`, `sc530-freeze.sh`, `sc530-jest.sh`
