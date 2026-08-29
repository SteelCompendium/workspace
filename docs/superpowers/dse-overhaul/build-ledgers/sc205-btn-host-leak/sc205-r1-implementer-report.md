# SC-205 — round 1 implementer report

**Verdict: COMPLETE, all gates green, no pixels moved.**

- Worktree: `/home/scott/code/steelCompendium/worktrees/sc205-btn-host-leak/draw-steel-elements`
- Branch: `sc205-btn-host-leak` · base `16e25ff` · **commit `b2a92f514279e9e51e4b570fa62933f59241c04c` (`b2a92f5`)**
- Not pushed. Superproject pointer untouched. No landing recipe run.
- Obsidian extracted from: **1.13.7**, `~/.config/obsidian/obsidian-1.13.7.asar`
  (app.css sha256 `f612f1e8f36486fa57f3b8bd45f0c848409d5b168002e757a13c6d286a7b4c41`, 637,077 bytes).
  **NOT** `/opt/Obsidian/resources/obsidian.asar` — that installer copy is dated Mar 2023 and is
  the stale source the SC-189 comment named.

## Gate numbers

| Gate | Result |
|---|---|
| `npm run tsc` | clean |
| `npm run lint` | clean, exit 0 (only the pre-existing `.eslintignore` deprecation warning) |
| `npx jest` | **3257 passed / 1 skipped / 3258 total · 184 suites passed, 1 skipped (185) · 3 snapshots** · exit 0 · load 1.10 at start |
| `npm run shots` | **474 PNGs, 0 FAIL**, exit 0 |
| `check-freeze.sh` | **`freeze OK (210/210 frozen print PNGs byte-identical …)`, exit 0 — 0 checksum mismatches** |
| `npm run parity` | **0 gaps / 0 undeclared warnings / 16 declared deferrals**, exit 0 |

Jest delta: +1 test (the undoNotice guard). No base re-measure was taken — the skill warns jest
counts are location-sensitive, so a scratch-tree base run would have under-reported by 2.

### New gate OK lines (from `sc205-gate-shots-final.log`)

```
host-copy pin OK (6 button-reaching rules + 14 tokens × dark/light: OBSIDIAN_HOST_BUTTON_CSS is verbatim Obsidian 1.13.7)

button host-leak OK (80 button kinds × 3 states (rest/hover/focus-visible) × dark/light = 480 comparisons: every sampled property is identical with and without Obsidian's `button` rules; user-select and app-region are excluded by design)
  104 of those (kind,state) records sampled the node at rest because the state is provably unreachable on it — each one proved, never assumed:
      34× hover: renders a zero-sized box
      34× focus-visible: renders no box at all (a display:none ancestor — unfocusable in a real vault too)
      24× hover: pointer-events: none
      8× focus-visible: disabled
      2× hover: no point in its box hit-tests to it (clipped by an ancestor overflow, or covered)
      2× focus-visible: visibility: hidden
```

**0 diffs across all 480 comparisons** — exactly the ticket's prediction. SC-203's (0,2,0)
re-grounding block outranks all three added (0,1,1) rules, and the kit's own `:hover` /
`[disabled]` rules cover the rest. Numbers were byte-identical across two independent full runs
(deterministic).

## What shipped

1. **Host copy completed** (`visual-harness/shoot.mjs`, `OBSIDIAN_HOST_BUTTON_CSS`). Added the
   three omitted `(0,1,1)` rules verbatim, plus a fourth Obsidian rule the ticket had not
   counted:
   - `@media (hover: hover) { button:hover { background-color: var(--interactive-hover);
     box-shadow: var(--input-shadow-hover) } }`
   - `button:focus-visible { box-shadow: 0 0 0 3px var(--background-modifier-border-focus) }`
   - `button[disabled], button[aria-disabled="true"], button[disabled="true"] { cursor:
     not-allowed; opacity: 0.7 }` — note the real selector qualifies **all three** with
     `button`, unlike the ticket's paraphrase.
   - `@media (forced-colors: active) { button { border: 1px ButtonBorder solid } }` — the
     **sixth** reaching rule, found by the extraction. Modelled for the pin, never measured
     (Playwright renders `forced-colors: none`); documented as such in the code.

   Tokens added: `--input-shadow-hover` and `--background-modifier-border-focus`, dark + light,
   at their real desktop values.

2. **Three drifts the re-read exposed and corrected** (none were in the ticket):
   - `app-region: no-drag` → `-webkit-app-region: no-drag` (the real property name);
   - the base rule has gained `corner-shape: var(--button-corner-shape)` (+ the token);
   - dark `--interactive-hover` had moved **#363636 → #3f3f3f** (`--color-base-35`). The copy
     had been carrying the stale value since SC-203.

3. **Ruling #4 discharged.** The "`button:hover` NO LONGER EXISTS" comment is corrected in
   place. Root cause recorded: SC-203 walked a live `document.styleSheets` for rules matching a
   rendered `.dse-btn`; that walk did not descend into `@media`, and the rule lives inside
   `@media (hover: hover)`. Provenance now names the asar path, the version, and the extraction
   method, and points at the pin as the reason not to hand-edit.

4. **Three-state sweep.** `assertBtnHostLeak` now runs rest → hover → focus-visible, bare, then
   the same three with the host injected, per scheme — one navigation per scheme, states
   genuinely driven in **both** passes. Formulation unchanged: bare-vs-host computed-style
   invariance over `BTN_PROPS`, no expected-value assertions.
   - `(hover: hover)` capability is **asserted**, not assumed (Playwright's default chromium
     context does report it; a context that stopped would make the rule inert and the gate
     vacuous).
   - Hover uses a point **verified by `elementFromPoint`** to hit-test to the node, not its
     geometric centre, plus a two-move sequence ending on that point. Both were necessary, and
     both were found by measurement, not theory — see "Two real flakes" below.
   - Focus-visible presses a real `Tab` for keyboard modality, then `.focus()`, then asserts
     `matches(':focus-visible')` per record.
   - **Ruling #2:** a record that reaches neither state and cannot prove it is unreachable
     **fails the gate**. Exemptions assert the disabling condition (`disabled`, no client
     rects, `visibility` not visible, non-focusable markup; for hover: zero box,
     `pointer-events: none`, or no hitting point) and are printed with counts. The inverse is
     also checked: a record flagged unreachable that matches the state anyway fails as a wrong
     exemption. `aria-disabled` is deliberately **not** an exemption — such elements still take
     focus and must still reach `:focus-visible`.

5. **Drift pin (ruling #1).** New `visual-harness/obsidian-host-pin.mjs` +
   `assertHostCopyPinnedToObsidian(page)`, run inside `npm run shots` **before** the sweep.
   - Reads app.css straight out of the asar (8-byte pickle header + JSON index) — no `npx asar`,
     no network. Verified byte-identical to `npx asar extract-file` output.
   - Prefers the newest `~/.config/obsidian/obsidian-<x.y.z>.asar` over
     `/opt/Obsidian/resources/obsidian.asar`, because Obsidian self-updates and the installer
     copy is exactly how the model rotted.
   - **Rules:** extracts *every* rule in app.css that reaches a plain plugin button (a whole
     computed set, not a hand-picked list — a hand-picked list is the failure mode that produced
     this ticket), normalizes whitespace/quotes, compares in order. An added, removed, moved or
     re-declared rule all report loudly, naming the rule.
   - **Tokens: pinned, not excluded** — deliberate, and documented in the code. Excluding them
     was the tempting call, but the token block is where the copy rotted most quietly
     (`--interactive-hover`), and rule-text checking would never have said so. They are compared
     **resolved in a real browser** under the same `theme-dark`/`theme-light` body class on both
     sheets, which is what makes `--button-radius: var(--input-radius)` and a literal `5px`
     comparable. The *scope* boundary is documented instead: `.is-mobile` / `.mod-macos` token
     overrides are deliberately not modelled (desktop only), with the reason in the CSS comment.
   - Asar absent → loud printed SKIP naming both search paths and stating the copy is
     UNVERIFIED, exit 0. Sweep still runs.

6. **`.dse-undo-notice__action` guard** — `test/dom/elements/staminaRecoveries.test.ts`, inside
   the existing `SC-132: the undo toast` describe (it already builds the notice through the real
   production path). Asserts `tagName === 'A'`, not `BUTTON`, no `button` ancestor, and that it
   still carries `role="button"` / `tabindex="0"`. The comment cites SC-205 and states *why*:
   Obsidian renders a notice **outside** any `[data-dse-element]` root, and the SC-203
   re-grounding block is anchored on `:is([data-dse-element], .dse-modal)` — so being a
   non-`button` is the only thing keeping this control out of the host leak set.

7. **`styles-source.css` foot comment made true.** The old sentence promised a gate that "sweeps
   the gallery at rest AND on hover" — the code did rest only. Replaced with a paragraph stating
   exactly what the gate now does (three states, both schemes, invariance not expected values,
   proof-backed exemptions printed with counts) plus a pointer to the drift pin.

### Two real flakes the hover pass surfaced (diagnosed, not papered over)

Both were found by measurement and would have been intermittent false reds:

- `initiative|dse-btn.dse-init__stamina` sits inside `.dse-init__right`, which is
  `position: absolute; overflow: hidden` — its own geometric centre is **clipped away** and
  `elementFromPoint` there returns the row. Pointing at the centre silently sampled resting
  style. Now: no point in its box hit-tests to it → proof-backed exemption (2 records).
- A card's ghost edit button is `pointer-events: none` (as is its `.dse-chrome` parent) until
  revealed. Chromium recomputes the hover chain on a pointer **event**, so a single move that
  arrives before the reveal changes hit-testing leaves the chain stale — the same node read
  hovered in one pass and at rest in the other, which presents as a host leak. This actually
  fired on the first run (`statblock|dse-btn.dse-btn--ghost.dse-btn--icon`, 3 property diffs).
  Fixed by the arrive-then-re-hit-test sequence; the genuinely unreachable ones are exempted
  (24 records) because `.dse-chrome` is itself `pointer-events: none` in this gallery state.

## Can-fail proofs (ruling #3)

All four ran the real gate, then were fully reverted and re-run green. `shoot.mjs` was restored
from a sha-verified backup each time (green sha256
`df7f3ad37930a41a8f86fbfec8646ed403e7badbf754c3d24771d2303e7f80b4`); verified no `SC205-CANFAIL`
marker survives in the committed tree.

| Proof | Perturbation | Result |
|---|---|---|
| **A — the sweep** | `!important` on all three added rules (pin call disabled for the control run, since it would otherwise fail first) | **exit 1, 364 problem lines** (40 printed + "and 324 more"), across `rest` (the `[disabled]` group: `cursor` default→not-allowed, `opacity` 0.5→0.7) and `hover` (`background-color`, `box-shadow`) |
| **B — the drift pin** | dark `--interactive-hover` reverted to the stale `#363636` **and** `corner-shape` dropped from the base rule | **exit 1**, both halves fired and named exactly what differed — the full rule text side by side, and `dark: --interactive-hover is "#3f3f3f" in Obsidian but "#363636" in the copy` |
| **C — focus-visible loudness** | `disabled` exemption removed | **exit 1, 16 loud failures** (4 disabled kinds × 2 passes × 2 schemes), each saying the sweep "would have sampled its resting style and called it a pass" |
| **D — the SKIP path** | `findObsidianAsar()` forced to `null` | **exit 0** with the loud `host-copy pin SKIPPED` line naming both search paths; sweep still ran and printed OK |

A cheap harness for B/C/D: `npm run shots -- --bg=dark` still reaches all the gates (they do
their own dark+light navigations) in ~2m25s vs ~6m for a full run. **Not** valid for
freeze/parity — the final battery used a full run.

## Evidence artifacts

All under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc205-btn-host-leak/`:

- `sc205-appcss-1.13.7-button-rules.txt` — the verbatim app.css slice (lines 7196–7245) carrying all five measured rules
- `sc205-appcss-1.13.7-tokens.txt` — the token definitions + the `--color-base-*` scale they resolve through
- `sc205-canfail-A-important.log`
- `sc205-canfail-B-drift.log`
- `sc205-canfail-C-focusvisible.log`
- `sc205-canfail-D-skip.log`
- `sc205-gate-shots-final.log`
- `sc205-gate-freeze.log`
- `sc205-gate-parity.log`
- `sc205-gate-jest.log`

## Notes for the ticket owner

- `npm ci` had to be run in the worktree first — it had no `node_modules`. Not a code change.
- The sweep gained ~4 minutes of wall time (full `npm run shots` ~6m). The interactive states are
  necessarily per-node (only one node can be under the pointer). If that becomes a problem it is
  its own ticket; it is not tunable without giving up the state coverage.
- **Known coverage boundary, deliberate, not filed:** 17 kinds/scheme render no box at rest
  (a `display:none` chrome ancestor) and are exempted from both interactive states. In a real
  vault those are unfocusable too, so the exemption is correct — but a *hovered-then-focused*
  reveal is a fourth state this ticket did not scope. Flagging it rather than deciding it.
