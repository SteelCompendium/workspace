# SC-171 — every `color-mix()` fallback in the Steel sheet is inert on the app engine: implementation report

**Status:** complete, committed, battery green, evidence posted inline on Linear SC-171.
**Branch:** `sc171-colormix` @ **`6a481f0`** (single commit), off develop **`c676d58`**.
**Superproject pointer:** left **unstaged** in the worktree, per instruction.
**Linear:** one implementation comment with four inline PNGs. **State and labels untouched.**
**Freeze baseline:** never touched (72 lines, steel-print only). No widening, no rebaseline.

---

## 1. The defect, restated from measurement

On the engine the app actually runs — **Chromium 106.0.5249.199 / Electron 21.4.1** (Obsidian's
asar self-updates; the Electron shell does not) — a `color-mix()` declaration whose value
contains `var()` **parses successfully** and fails later, at **computed-value time**. That
happens *after* the cascade has already discarded the static twin authored above it, so the
property lands on its `unset` value rather than on the fallback.

The sheet's SUPPORT-FLOOR doctrine assumed the opposite (rejection at *parse* time, which
leaves the static declaration standing). That is true only for **literal** values, and every
`color-mix()` declaration in this sheet carries a `var()` — the mixed hue is always a token,
and `--dse-role` is written inline per card at runtime.

`CSS.supports('color', 'color-mix(in srgb, red 14%, blue)')` → `false` on that engine.
`CSS.supports('background', …)` likewise.

No gate could see this: the visual harness runs a modern Chromium where `color-mix()`
resolves, and `cssSupportFloor.test.ts` was a source-text adjacency scan — and the adjacency
*was* authored.

---

## 2. Inventory — 10 declarations, 8 were ungated

Confirms the SC-160 review's corrected count exactly (`background` ×5, `border-bottom` ×2,
`box-shadow` ×2, `background-image` ×1). Floor values are `getComputedStyle` reads from a
real spawned Obsidian on that engine, before and after the change.

| # | Selector | Property | Gated before | Gated after | Floor BEFORE | Floor AFTER |
|---|---|---|---|---|---|---|
| 1 | `[steel]:not([print]) .dse-pr__row` | `background-image` | **no** | yes | `none` | `linear-gradient(90deg, rgba(231,76,60,.08), rgba(0,0,0,0) 60%)` (low) · amber `rgba(240,180,41,.08)` (mid) · green `rgba(76,175,106,.08)` (high) · gold `rgba(224,176,80,.08)` (crit) |
| 2 | `[steel]:not([print]) .dse-sb[data-dse-role] > .dse-head` | `background` | **no** | yes | `background-image: none`, `background-color: rgba(0,0,0,0)` | `linear-gradient(rgb(34,39,43), rgb(26,30,33))` |
| 3 | ↳ same rule | `border-bottom` | **no** | yes | `0px none` | `1px solid rgb(154,162,168)` |
| 4 | `[steel] .dse-sb[data-dse-role] > .dse-head::after` | `box-shadow` | **no** | yes | `none` | `rgb(26,30,33) 0 0 0 4px, rgb(154,162,168) 0 0 0 5px` |
| 5 | `[steel]:not([print]) .dse-fb > .dse-head` | `background` | **no** | yes | `background-image: none`, `background-color: rgba(0,0,0,0)` | `linear-gradient(rgb(34,39,43), rgb(26,30,33))` |
| 6 | ↳ same rule | `border-bottom` | **no** | yes | `0px none` | `1px solid rgb(154,162,168)` |
| 7 | `[steel] .dse-fb > .dse-head::after` | `box-shadow` | **no** | yes | `none` | `rgb(26,30,33) 0 0 0 4px, rgb(154,162,168) 0 0 0 5px` |
| 8 | `[steel]:not([print]) .dse-sb__band--villain` | `background` | **no** | yes | `rgba(0,0,0,0)` | `rgba(0,0,0,0.16)` |
| 9 | `[steel]:not([print]) .dse-sb__sticky-inner` | `background` | yes (SC-160) | yes | `rgb(26,30,33)` ✅ | `rgb(26,30,33)` (unchanged) |
| 10 | `[steel]:not([print]) .dse-sb__sticky-inner::before` | `background` | yes (SC-160) | yes | — | — |

Rows 9-10 are the control: SC-160's gate already worked on the floor engine before this
change, which is exactly why it was the pattern to copy.

**Severity confirmed as the review stated it, not as FOLLOWUPS #73 originally did.** The
statblock and featureblock head bands lost their **entire** background *and* their hairline —
a missing material, not a missing wash — and both head notches lost their halo outright.
The villain band had no panel behind it at all.

---

## 3. The fix

All 8 ungated declarations moved into an `@supports (background: color-mix(in srgb, red 14%,
blue))` block placed **immediately after** the rule it enhances, so the static declaration is
the only one outside the gate. A floor engine never enters the block; a modern engine enters
it and the enhanced line wins.

Three mechanical points:

1. **The static twin is repeated INSIDE each block.** `cssSupportFloor.test.ts`'s adjacency
   scan reads source text and does not model `@supports`, so the pair must be real there.
2. **Placement is immediately after the base rule**, not at the end of the sheet — equal
   specificity means source order decides, and this keeps every gated declaration in exactly
   the cascade position it already held. Checked for interference: the `.dse-pr__row` rules
   that follow (`:first-child`, the three `[data-tier]` variants, the three light-scheme
   twins) touch only `border-top` and the `--t`/`--tw` custom properties, never
   `background-image`; and the unscoped base `.dse-pr__row` rules at ~9268 are lower
   specificity, so order between them is irrelevant.
3. **No colour value changed and no rule was restructured beyond the gate.** Verified by the
   byte-identical harness result (§5).

**The doctrine comment is corrected once**, at the SUPPORT FLOOR note (~6123), rewritten from
SC-160's wording into the rule that actually holds — *"a static fallback survives only if the
enhanced declaration is gated; a `var()`-bearing `color-mix()` is NOT rejected at parse
time"* — with the measurements, the two mechanical requirements, and a pointer to the guard.
SC-160's own block comment was condensed to point at it rather than re-deriving the same
reasoning a second time.

---

## 4. The gate that can see it — fix shape (a)

`test/unit/build/cssSupportFloor.test.ts` gains a **third scan**,
`findUngatedColorMixViolations()`: a brace-depth walk over a comment-masked copy that carries
the stack of enclosing preludes, so unlike the two existing scans it **does** model
`@supports`. It fails on any `color-mix()` declaration containing `var()` that is not inside
an `@supports` whose condition itself tests color-mix, and reports source line, property and
the remediation.

Two deliberate exemptions, both matching the older scan's semantics:
- **custom properties** (`--x: color-mix(…)`) — not parsed as a property value until
  substituted;
- **literal-only `color-mix()`** — that shape genuinely *is* invalid at parse time, so the
  plain adjacency pair `findFloorViolations` already enforces is sufficient. Demanding a gate
  there would be false rigour.

### Can-fail proof, twice

**External (performed, then reverted).** Un-gated the villain band in the real sheet and
re-ran the suite:

```
● every var()-bearing color-mix() declaration sits inside an @supports color-mix gate
  Received: "styles-source.css:7002  background: color-mix(in srgb, var(--dse-act-villain) 8%, transparent)
      <-- it contains `var()`, so a Chromium 106 engine parses it and then fails at
          computed-value time — AFTER the cascade discarded the static `background` above it,
          leaving the property `unset`. Move it inside `@supports (background: color-mix(in
          srgb, red 14%, blue))` …"
```

Sheet restored from a pre-edit copy; the branch carries no trace of it.

**Permanent, in-repo.** A test rewrites the sheet's own gate preludes to `@supports
(background: red)` and asserts the scan then reports **exactly 10** declarations, grouped by
property (`background: 5, background-image: 1, border-bottom: 2, box-shadow: 2`). So the
green assertion can never silently go vacuous — if someone deletes the gates, both the real
assertion and the control fire, and if someone adds an eleventh declaration the control's
count assertion fails until the inventory is updated.

### Fix shape (b), the real-engine probe — evaluated, NOT built

It works — this report's numbers came from exactly such a probe
(`.superpowers/sdd/sc171/sc171-probe.mjs`, a cut-down sibling of `obsidian-camera.mjs`) — but
it is not cheap enough to bolt onto the battery, and pretending otherwise would produce a
flaky gate:

- it needs a spawned Obsidian, its **own** Xvfb display and CDP port, a scratch
  `--user-data-dir`, and a warm-up launch so the asar self-updates: **~60-90s** per run, and
  it cannot share a display with another agent's camera;
- it cannot live in jest (no browser) — it belongs beside `obsidian-camera.mjs` as another
  capture mode, with its own manifest of selector → expected-floor-value rows;
- that manifest is a new maintenance surface: every colour token change moves it.

**Recommendation: its own ticket.** The honest cheap version is small — assert
`CSS.supports('color', 'color-mix(…)') === false` inside the already-running camera (so the
run proves it is testing the floor at all), then read a fixed list of computed properties on a
fixed list of selectors and compare against expected floor values. That is worth having and
would catch the whole class, not just color-mix. It is not a rider on this ticket.

---

## 5. Verification

### Modern-Chromium harness: byte-identical

`npm run shots` at the base commit and again at the branch tip, in the same tree, with
`sha256sum *.png` taken both times: **218 files, 0 FAIL, `diff` of the two hash lists is
empty.** Not "no visible change" — the same bytes. This is the load-bearing evidence that the
gate alters only floor-engine behaviour.

`check-freeze.sh` → `freeze OK (72/72 steel-print PNGs byte-identical)`, exit 0.

### Real Obsidian: the static fallbacks now compute

Full before/after table in §2. Probe run twice for the "before" state (the first run's
`pr-rows` capture had Obsidian's first-launch trust modal overlapping it; the second run
reproduced identical computed values with a clean frame — the numbers were never in doubt,
only the photograph).

PNG evidence: `.superpowers/sdd/sc171/evidence/` —
`{before,after}-{statblock-head,statblock-card,pr-rows,feature-card,featureblock-head,villain-band}.png`
plus `{before,after}.json` (the full computed-style dumps, including the engine banner).
Four posted inline on Linear.

### Battery, in order

| Gate | Base `c676d58` | Branch `6a481f0` |
|---|---|---|
| `npm run tsc` | clean | **clean** |
| `npm run lint` | clean, exit 0 | **clean, exit 0** |
| `npx jest` | 2821 passed / 1 skipped / 170 suites | **2825 passed / 1 skipped / 170 suites** (+4 tests, no new suite) |
| `npm run shots` | 218, 0 FAIL | **218, 0 FAIL — byte-identical** |
| `check-freeze.sh` | 72/72, exit 0 | **`freeze OK (72/72 …)`, exit 0** |
| `npm run parity` | 0 / 0 / 16 | **0 gaps / 0 undeclared / 16 declared, exit 0** |

Base numbers were **measured in this tree** (stash → run → pop), not taken on trust. Load was
1.5-9.3 throughout; no timeout-shaped reds in `settings-tab` / `settings-preview`, no re-runs
needed.

> Note for the brief's numbers: it quoted the base as **168** suites. The actual figure at
> `c676d58` is **170** (169 passed + 1 skipped), measured. Test *count* matched exactly
> (2821 + 1 skip), so only the suite figure was stale.

---

## 6. Six existing tests updated — deliberately strengthened, not relaxed

`steelMaterial.test.ts` and `statblockSticky.test.ts` locate rules by counting selector
matches in the sheet, and a gated twin repeats its base rule's selector verbatim — so five
counts doubled and one regex bound to the wrong `@supports` block. Rather than loosening the
assertions:

- **`steelMaterial.test.ts`** — `Rule` gained a `gated` flag (computed from brace-matched
  `@supports (… color-mix …)` character ranges), and `baseRules` is the ungated layer, i.e.
  what a Chromium 106 engine actually applies. `selectorOf()` and the two `.dse-head::after`
  counts now read `baseRules`, with an explicit "exactly one gated twin each" assertion added
  alongside. The two notch-halo contracts were rewritten from "one rule with two box-shadow
  declarations" into **"the base rule holds the flat halo ALONE, and the color-mix halo exists
  only behind the gate"** — a strictly stronger contract, and the one whose violation was this
  bug. The print-tier check now expects 4 rules instead of 3 and asserts one of them is the
  gated twin, keeping its real point (no rule in that set carries a print exclusion) intact
  over the larger set.
- **`statblockSticky.test.ts`** — its gate regex took the *first* `@supports` block in the
  sheet, which is now `.dse-pr__row`'s. It now collects all of them and selects the sticky one
  by content, plus asserts there are at least two (so the sweep cannot be silently undone).

---

## 7. Files touched

**Submodule `draw-steel-elements`** (committed, `6a481f0`):

| File | Change |
|---|---|
| `styles-source.css` | 7 new `@supports` gates (8 declarations); SUPPORT FLOOR doctrine comment rewritten; SC-160's block comment condensed to point at it; five per-rule fallback comments corrected |
| `test/unit/build/cssSupportFloor.test.ts` | `findUngatedColorMixViolations()` + `COLOR_MIX_GATE`; 4 new tests (real assertion, in-repo can-fail control, detector sanity, line-number sanity); header gains the SC-171 section |
| `test/dom/theme/steelMaterial.test.ts` | `Rule.gated` + `baseRules`; six assertions made gate-aware (two rewritten as stronger contracts) |
| `test/dom/elements/statblockSticky.test.ts` | gate selected by content, not by position |
| `.repo-docs/conventions.md` | one bullet: the Chromium 106 floor and the `@supports`-gate requirement (the plugin docs had no support-floor mention at all before this) |
| `CHANGELOG.md` | `[BUGFIX]` bullet under 7.0.0 unreleased, plain language |

**Superproject:** `draw-steel-elements` pointer **unstaged**, as instructed. Nothing else.

---

## 8. Concerns / notes for the orchestrator

1. **FOLLOWUPS #73 is now fully closed by this branch** and should be archived at landing
   (its text carries the superseded "15 declarations / cosmetic" framing; the corrected
   numbers are in §2 above and on the ticket).
2. **The real-engine probe (b) is unbuilt and wants its own ticket** — §4. It is the only
   thing in the battery that would have caught this class without a human looking, and the
   same gap still exists for every other above-floor feature.
3. **No sanction needed anywhere.** No frozen byte moved (218/218 identical, 72/72 freeze), no
   default changed, no colour value changed, no Linear state or label touched.
4. **Nothing was widened.** The freeze baseline is untouched at 72 lines; this branch adds no
   fixture.
5. **Housekeeping.** Xvfb `:91` was mine and is killed at the end of the session; the scratch
   `--user-data-dir` lives under `/tmp/claude-1000/sc171-probe-udd`. Display `:1` never
   touched, `npm run obsidian-shots` / `docs-shots` never run. `demo-vault/Harness/` was
   regenerated (gitignored); `node_modules/` was installed in the worktree (it had none).
   The submodule tree is clean at `6a481f0`.
6. **One incidental fact worth keeping:** `visual-harness/obsidian-camera.mjs` resolves the
   `ws` fallback package relative to itself, so a probe script living outside the repo must
   import it by absolute path — Node in the plugin's devbox has no global `WebSocket`.
# SC-171 — adversarial executing review

**Verdict: LAND**, with two guard-hardening findings (M-1, M-2) recommended as a rider or a
follow-up ticket. Nothing in the shipped CSS is wrong: every measured claim in
`sc171-report.md` reproduced exactly, independently, on my own Xvfb display and in my own
runs. The findings are all about the **guard** SC-171 added (ticket fix-shape 2a), not about
the fix.

- Branch reviewed: `sc171-colormix` @ **`6a481f0`** (single commit) on develop **`c676d58`**.
- Worktree left **clean at `6a481f0`**; superproject pointer left **unstaged** (as the
  implementation instruction required). Freeze baseline never touched (72 lines).
- My Xvfb was **`:94`** (never `:1`/`:77`/`:78`/`:83`/`:91`), scratch
  `--user-data-dir` at `/tmp/claude-1000/sc171-review-udd`. Both killed/removed.
  `npm run obsidian-shots` / `docs-shots` never run.

---

## 1. Battery, measured by me at `6a481f0`

| Gate | Claimed | **Measured (this review)** |
|---|---|---|
| `npm run tsc` | clean | **clean** |
| `npm run lint` | clean, exit 0 | **clean, exit 0** (only the pre-existing `.eslintignore` deprecation warning) |
| `npx jest` | 2825 passed / 1 skipped / 170 suites | **2825 passed / 1 skipped / 2826 total; 169 passed + 1 skipped = 170 suites; 3 snapshots** |
| `npm run shots` | 218, 0 FAIL, byte-identical vs base | **218, 0 FAIL; `diff` of the two `sha256sum *.png` lists is EMPTY** |
| `check-freeze.sh` | 72/72, exit 0 | **`freeze OK (72/72 steel-print PNGs byte-identical)`, exit 0** |
| `npm run parity` | 0 / 0 / 16 | **`0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`** |

Load `/proc/loadavg` was 2.3–3.7 throughout; no timeout-shaped reds in `settings-tab` /
`settings-preview`, no re-runs needed.

**Shots A/B method (reproduced, not taken on trust):** ran `npm run shots` at the branch tip
and hashed all 218 PNGs; `git checkout c676d58 -- styles-source.css`; re-ran `npm run shots`
and hashed again; `diff` of the two hash files is empty; restored
`git checkout 6a481f0 -- styles-source.css`. Freeze re-verified green after the restore.

---

## 2. Claim 1 — inventory and "nothing else changed": VERIFIED, mechanically

**10 `color-mix()` declarations, all gated.** Confirmed three ways: grep of the sheet
(7 `@supports (background: color-mix(in srgb, red 14%, blue))` blocks, no `color-mix(` in any
declaration outside one), the in-repo can-fail control's property grouping
(`background: 5, background-image: 1, border-bottom: 2, box-shadow: 2` = 10), and the built
`styles.css` (7 gates survive esbuild minification with **both** declarations of each
duplicated pair intact — esbuild does not collapse the static twin, which was worth checking
and the report did not).

**No colour value changed and no rule was restructured.** I flattened both revisions to a
multiset of `(selector-context, declaration)` pairs with `@supports` wrappers *erased* and
comments stripped, then diffed:

```
BASE decls: 3133   BRANCH decls: 3141
--- present in BRANCH only (added) ---   (8, all exact duplicates of an existing declaration)
  ... .dse-pr__row                       background-image: linear-gradient(90deg, var(--tw), transparent 60%)
  ... .dse-sb[data-dse-role] > .dse-head  background: linear-gradient(180deg, var(--dse-surface-raised), var(--dse-surface))
  ... .dse-sb[data-dse-role] > .dse-head  border-bottom: 1px solid var(--dse-role)
  ... .dse-sb[data-dse-role] > .dse-head::after  box-shadow: 0 0 0 4px var(--dse-surface), 0 0 0 5px var(--dse-role)
  ... .dse-fb > .dse-head                 background: linear-gradient(180deg, var(--dse-surface-raised), var(--dse-surface))
  ... .dse-fb > .dse-head                 border-bottom: 1px solid var(--dse-role, var(--dse-role-leader))
  ... .dse-fb > .dse-head::after          box-shadow: 0 0 0 4px var(--dse-surface), 0 0 0 5px var(--dse-role, var(--dse-role-leader))
  ... .dse-sb__band--villain              background: rgba(0, 0, 0, 0.16)
--- present in BASE only (removed) ---   (none)
--- colour literal delta ---
  added: {'rgba(0, 0, 0, 0.16)': 1}   (the duplicated villain static)   removed: {}
```

So the branch is exactly the base **plus the eight static twins repeated inside the gates**.
Zero declarations removed, zero values changed, zero selectors changed. Every gated twin's
selector is byte-identical to its base rule's, and every gate sits immediately after the rule
it enhances.

**Cascade interference re-derived independently, not accepted from the report:**
- `.dse-pr__row` — the rules between the gate and the end of the family
  (`:first-child`, the three `[data-tier]`, the three `body.theme-light` twins) touch only
  `border-top` and `--t`/`--tw`. The unscoped base rules at ~9317 (`.dse-pr__row` (0,1,0),
  `button.dse-pr__row` (0,1,1), `button.dse-pr__row:hover`, `.dse-pr__row[aria-checked=true]`
  (0,2,0)) all use the `background` *shorthand* — which does reset `background-image` — but
  every one of them is **below** the Steel rule's (0,3,0), so the gated twin at the same
  (0,3,0) later in source is authoritative either way. `:is([data-dse-element], .dse-modal):not([data-dse-print="on"]) button.dse-pr__row`
  at (0,3,1) outranks both, but sets only `font-family`.
- `.dse-sb[data-dse-role] > .dse-head` — the structure-tier twin at
  `[data-dse-theme='steel'] .dse-sb[data-dse-role] > .dse-head` (0,4,0) that follows the gate
  sets only `position` / `margin-bottom`.
- `.dse-fb > .dse-head` and both `::after` notches — same shape, no property overlap.
- No `@media print` rule zeroes either notch's `box-shadow`; the print `box-shadow: none` list
  targets the card lift (`.dse-sb`, `[data-dse-element='feature'|'featureblock']`), not the
  `::after`.

---

## 3. Claim 2 — floor engine before/after: VERIFIED by my own probe run

Ran `.superpowers/sdd/sc171/sc171-probe.mjs` twice against a spawned real Obsidian on my own
display `:94`, port `9251`, scratch UDD — once with `styles-source.css` at **`c676d58`** and
once at **`6a481f0`**, rebuilding `styles.css` (`npm run build-no-check`) between runs.

**Engine, both runs (identical):**

```
obsidian/1.1.16  Chrome/106.0.5249.199  Electron/21.4.1
CSS.supports('color',      'color-mix(in srgb, red 14%, blue)')  ->  false
CSS.supports('background', 'color-mix(in srgb, red 14%, blue)')  ->  false
```

| Surface (computed style, real app) | BASE `c676d58` | BRANCH `6a481f0` |
|---|---|---|
| `.dse-sb > .dse-head` `background-image` | `none` | `linear-gradient(rgb(34,39,43), rgb(26,30,33))` |
| `.dse-sb > .dse-head` `background-color` | `rgba(0,0,0,0)` | `rgba(0,0,0,0)` (gradient carries it) |
| `.dse-sb > .dse-head` `border-bottom` | **`0px none`** | **`1px solid rgb(154,162,168)`** |
| `.dse-sb > .dse-head::after` `box-shadow` | `none` | `rgb(26,30,33) 0 0 0 4px, rgb(154,162,168) 0 0 0 5px` |
| `.dse-fb > .dse-head` `background-image` / `border-bottom` | `none` / `0px none` | gradient / `1px solid rgb(154,162,168)` |
| `.dse-fb > .dse-head::after` `box-shadow` | `none` | flat halo |
| `.dse-pr__row[data-tier=low]` | `none` | `linear-gradient(90deg, rgba(231,76,60,0.08), rgba(0,0,0,0) 60%)` |
| `.dse-pr__row[data-tier=mid]` | `none` | `… rgba(240,180,41,0.08) …` |
| `.dse-pr__row[data-tier=high]` | `none` | `… rgba(76,175,106,0.08) …` |
| `.dse-pr__row[data-tier=crit]` | `none` | `… rgba(224,176,80,0.08) …` |
| `.dse-sb__band--villain` `background-color` | `rgba(0,0,0,0)` | `rgba(0,0,0,0.16)` |
| **`.dse-sb__sticky-inner` (SC-160 control)** | **`rgb(26,30,33)`** | **`rgb(26,30,33)` — unchanged** |

Every row matches `sc171-report.md` §2 exactly, including the SC-160 control being
already-correct before the change. The report's numbers are honest.

---

## 4. Claim 4 — the new gate: teeth confirmed, two false negatives found

**External can-fail proof, reproduced.** I un-gated the villain band in the real sheet and
ran the suite. It fails with the exact line number:

```
● every var()-bearing color-mix() declaration sits inside an @supports color-mix gate
  Received: "styles-source.css:7002  background: color-mix(in srgb, var(--dse-act-villain) 8%, transparent)
      <-- it contains `var()`, so a Chromium 106 engine parses it and then fails at
          computed-value time — AFTER the cascade discarded the static `background` above it,
          leaving the property `unset`. Move it inside `@supports (background: color-mix(in
          srgb, red 14%, blue))` …"
```

Sheet restored via `git checkout 6a481f0 -- styles-source.css`; the branch carries no trace.

**The in-repo control does assert a COUNT and a property grouping**, not truthiness —
`expect(violations.length).toBe(10)` plus
`expect(byProp).toEqual({background: 5, 'background-image': 1, 'border-bottom': 2, 'box-shadow': 2})`.
That part of the report's claim is accurate.

**Probes I ran (temporary jest file, since deleted).** Results, all by execution:

| Probe | Expected | Actual |
|---|---|---|
| `color-mix()` with no `var()`, ungated | skipped by this scan; caught by `findFloorViolations` | **correct** — gate scan 0; adjacency scan reports `color: color-mix(in srgb, red 40%, blue)` "it is the first declaration in its rule" |
| gate testing something else (`@supports (display: grid)`) | must flag | **flags** ✅ |
| nested `@media` inside a real gate | not flagged | **not flagged** ✅ |
| nested `@media print`, ungated | flagged | **flagged** ✅ |
| custom property `--w: color-mix(…var()…)` | exempt | **exempt** ✅ |
| color-mix in a comment | ignored | **ignored** ✅ |
| declaration with no trailing `;` | flagged | **flagged** ✅ |
| line number reported | usable | **exact** ✅ |
| brace / semicolon inside a quoted string (`content: "}"`, `url(data:…;base64,…)`) | flagged | **flagged** (the brace-walk's stack does get corrupted by a quoted `}`, but the sheet contains no braces inside strings outside comments — theoretical only) |
| **`@supports not (background: color-mix(…))`** | **must flag** | **NOT flagged — see M-2** |
| **`@supports (display: grid) or (background: color-mix(…))`** | **must flag** | **NOT flagged — see M-2** |
| **gate present, base twin ABSENT outside it** | should flag | **NOT flagged by either scan — see M-1** |

---

## 5. Claim 5 — the six rewritten tests: strictly stronger where rewritten, one silent gap

**Mutation test, run.** I put the `color-mix` box-shadow back into the `.dse-sb[…]>.dse-head::after`
**base** rule (the exact pre-SC-171 shape) and ran the two suites:

```
● Steel material contract › statblock notch (SC-103) › the notch halo is flat in the base rule
  and color-mix-enhanced only behind the @supports gate (SC-121 M-1, SC-171)
    Expected length: 1   Received length: 2
Test Suites: 1 failed, 1 passed, 2 total   Tests: 1 failed, 83 passed, 84 total
```

The two rewritten notch-halo contracts are **strictly stronger** than what they replaced: the
old form ("one rule, two `box-shadow`s, first flat, second mixed") is satisfied by the exact
shape that shipped the bug; the new form ("base rule holds the flat halo ALONE, gated twin
holds the pair") is not. `Rule.gated` / `baseRules` is a correct model — the flat rule regex
`/([^{}]+)\{([^{}]*)\}/g` naturally yields the *inner* selector for a rule nested in an
`@supports`, and `insideColorMixGate` brace-matches, so the flag is right. `selectorOf()`, the
two `.dse-head::after` counts and the print-tier check (3 → 4 + "exactly 1 gated") are all
correct narrowings, each with an added "exactly one gated twin" assertion so the gate cannot
silently multiply.

`statblockSticky.test.ts` selecting its `@supports` block by content is correct and its
`gates.length >= 2` floor keeps the sweep from being silently undone (there are 7 today).

**The gap: `steelBlocksFor()` was not made gate-aware** — see L-3.

---

## 6. Claim 7 — composition with SC-170 (`sc170-real-print`, `fce4b75`)

Both branches sit on `c676d58`. **No textual conflict:** SC-170's `styles-source.css` hunks are
entirely in the print token blocks at ~9622–9790; SC-171's are at ~6120–7180.

**Semantically clean.** SC-170 pads the print token selectors to (0,4,0) and stamps
`data-dse-print` under real print. Every SC-171 gate repeats its base rule's selector
**verbatim**, including the `:not([data-dse-print="on"])` half where present — so under real
print the base rule and its gated twin switch off **together**. There is no gated rule that
applies in print where the ungated one didn't, and none that stops applying where it did.

The only print-reaching gated declarations are the two notch `::after` `box-shadow`s, whose
base rules are also print-reaching (structure tier, S-1(a), no print exclusion — that predates
SC-171). See L-5 for what that means in real print; it is a strict improvement, not a
regression, and no print rule contradicts it.

**Print twin bytes:** freeze `72/72` byte-identical on my own regenerated shots, at branch and
at base.

---

## 7. Claim 8 — docs / CHANGELOG

`CHANGELOG.md` `[BUGFIX]` bullet under 7.0.0-unreleased is genuinely plain-language and
accurate: it names the surfaces in user words ("header band", "the little diamond", "faint
tier stripes behind power-roll outcome rows", "villain action band"), says the design and the
colours did not change, and explains the cause without CSS jargon. No overclaim.

`.repo-docs/conventions.md` gains one correct bullet — the Chromium 106 floor and the
`@supports`-gate requirement, pointing at the sheet's SUPPORT FLOOR note and the guard. The
plugin docs had no support-floor mention at all before; this is a real gap closed.

The rewritten SUPPORT FLOOR doctrine comment in `styles-source.css` is accurate against my own
measurements, and condensing SC-160's block to point at it (rather than re-deriving) is the
right call.

---

## 8. Findings, severity-ranked

### M-1 (Medium) — the new guard is one-sided: it requires the gate, never the base twin outside it

The scan asks "is this `color-mix()` inside a color-mix `@supports`?" It never asks "does the
same property exist in an ungated rule with the same selector?" So the shape
`@supports (…color-mix…) { .x { background: STATIC; background: color-mix(…var()…); } }`
with **no** `.x { background: STATIC }` outside the block passes **both** scans — the repeated
pair inside the block satisfies `findFloorViolations`' adjacency, and the gate satisfies
`findUngatedColorMixViolations`. A floor engine then gets *nothing at all*: the same failure
class SC-171 exists to prevent, arrived at from the other direction.

**Reproduction (run, on the real sheet):** delete the static
`background-image: linear-gradient(90deg, var(--tw), transparent 60%);` from the
`.dse-pr__row` base rule at ~6202, leaving the `@supports` block untouched. Then:

```
npm run tsc   -> clean
npm run lint  -> clean
npx jest      -> 169 passed, 1 skipped, 0 failures   (with my probe file removed)
```

Every gate green, and every tier row renders with no wash on Chromium 106.

**Fix (small, same file):** for each rule inside a color-mix `@supports`, require that the
identical selector also appears in an ungated rule declaring the same property. That closes
the class in both directions and is ~15 lines in `findUngatedColorMixViolations`' walk (it
already carries the prelude stack).

### M-2 (Medium) — `@supports not (…)` and `@supports (X) or (… color-mix …)` are accepted as gates

`preludeGatesColorMix()` is `/^@supports\b/i.test(p) && p.includes('color-mix(')`. Two false
negatives, both proven by execution:

- `@supports not (background: color-mix(in srgb, red 14%, blue)) { … color-mix(var()) … }`
  → **0 violations.** This is the worst possible case: the block applies **only** on the floor
  engine, i.e. exactly where the declaration is guaranteed to fail.
- `@supports (display: grid) or (background: color-mix(…)) { … }` → **0 violations.** A
  Chromium 106 engine supports `display: grid`, enters the block, and fails.

The shipped sheet uses neither shape, so this is a hole in the guard rather than a live bug —
but the guard's entire job is to be un-foolable by the next author, and `not()` is the
idiomatic thing someone reaches for when writing a *floor-only* fallback block.

**Fix:** reject a prelude whose condition contains `not` or `or`, or parse it properly and
require a positive color-mix term in every disjunct. Two lines plus a test.

### L-3 (Low) — `steelBlocksFor()` was not made gate-aware, so the tier-row contract silently changed meaning

`steelMaterial.test.ts`'s `steelBlocksFor()` still filters `rules`, not `baseRules`. Only one
of its consumers has a gated twin, and it is
`it('tier rows carry a tier-coloured wash under Steel')`, which asserts
`blocks.some(b => /background-image:\s*linear-gradient\([^;]*color-mix\(/.test(b))`. Before
SC-171 that matched the base rule; now it matches the **gated twin's** body and passes for a
different reason, asserting nothing about the layer a floor engine sees.

This is the asymmetry: the two notch families were correctly rewritten into
"flat in base ALONE / mixed only behind the gate", but the `.dse-pr__row` family — the one
with the most rows affected in the measurement — got no equivalent contract. It is also why
M-1's reproduction lands on `.dse-pr__row` specifically. Folding a base-layer assertion in
here would close M-1 for this surface even without the general scanner change.

### L-4 (Low) — the can-fail control's anti-rot claim is narrower than `sc171-report.md` §4 states

The control neuters gates by string-replacing the **exact literal** `COLOR_MIX_GATE`. Add an
11th declaration behind a differently-worded but perfectly valid gate — e.g.
`@supports (color: color-mix(in srgb, red, blue))` — and, run on the real sheet plus that
addition:

```
real assertion violations: 0
control count (asserted === 10): 10   -> control still PASSES
```

So the report's "if someone adds an eleventh declaration the control's count assertion fails
until the inventory is updated" holds only for the literal gate string. Cheap fix: neuter by
regex (`/@supports\s*\([^{]*color-mix\([^{]*/`) rather than by literal.

### L-5 (Low, informational — no action) — real print behaviour DOES change on the floor engine, and freeze cannot see it

The two notch `::after` rules are structure tier (no `:not([data-dse-print="on"])`), so their
`box-shadow` reaches print. On the floor engine it computed `none` before and computes the flat
halo now. **`freeze 72/72` is not evidence about this**: the frozen `*--steel-print.png` are
captured in the harness's modern Chromium, which enters the gate and always painted a halo. So
real Ctrl-P output was *diverging from its own golden* until this branch, and now matches it.
Strictly an improvement; nothing zeroes it in print (checked). Recording it so the next
reviewer does not re-derive it, and because it is the one place where "freeze is byte-identical"
does **not** imply "print is unchanged".

### N-6 (nit) — the scan is order-blind

The doctrine's mechanical requirement 1 ("the gate block must sit AFTER the rule it enhances —
equal specificity, source order decides") is documented but unenforced. A gate authored above
its base rule would pass every check and lose the cascade on modern engines. Cheap to add
alongside M-1, which already needs the base rule's position.

### N-7 (nit) — landing housekeeping, already flagged by the implementer

FOLLOWUPS #73 still carries the superseded "15 declarations / cosmetic" framing and is fully
closed by this branch — archive at landing keeping `(was #73)`. Superproject pointer is
unstaged by design.

---

## 9. Reproduction commands

```bash
# battery (worktree, load-checked first)
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc171-colormix/draw-steel-elements && npm run tsc'
devbox run -- bash -c 'cd .../draw-steel-elements && npm run lint'
devbox run -- bash -c 'cd .../draw-steel-elements && npx jest'
devbox run -- bash -c 'cd .../draw-steel-elements && npm run shots'
bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh \
     /home/scott/code/steelCompendium/worktrees/sc171-colormix/draw-steel-elements/visual-harness/shots
devbox run -- bash -c 'cd .../draw-steel-elements && npm run parity'

# shots A/B
#   run shots @ 6a481f0, sha256sum *.png > branch.txt
#   git checkout c676d58 -- styles-source.css ; run shots ; sha256sum *.png > base.txt
#   diff base.txt branch.txt   -> empty
#   git checkout 6a481f0 -- styles-source.css

# floor probe (own display, own port, own scratch UDD)
devbox run -- bash -c 'cd .../draw-steel-elements && npm run build-no-check'
devbox run -- bash -c 'cd .../draw-steel-elements && \
  SC171_DISPLAY=:94 SC171_PORT=9251 SC171_TMP=/tmp/claude-1000/sc171-review-udd \
  SC171_OUT=<scratch>/probe \
  node /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc171/sc171-probe.mjs rev-after'
```

Temporary artefacts used during this review (a probe jest file, three sheet mutations, a
scratch UDD, Xvfb `:94`) were all removed; `git status --porcelain` in the submodule is empty
at `6a481f0`.

---

# Rider — M-1 / M-2 / L-3 / L-4 closed (test-only)

**Commit: `8b6064d`** on `sc171-colormix`, on top of `6a481f0`.
`test(support-floor): make the color-mix gate two-sided and un-foolable (SC-171 review rider)`

**Test-only, verified:** `git diff --quiet 6a481f0 -- styles-source.css` → **no change**. Two
files touched, both under `test/`:

| File | Change |
|---|---|
| `test/unit/build/cssSupportFloor.test.ts` | M-1 two-sided scan, M-2 gate acceptance, L-4 parsing neuterer, header note rewritten (+ N-6 recorded as a known limit); 6 new tests |
| `test/dom/theme/steelMaterial.test.ts` | L-3: `steelBlocksFor()` is base-layer only, new `steelGatedBlocksFor()`, tier-wash contract rewritten two-part |

Because it is test-only, the gates re-run are **tsc + lint + jest**. Shots / freeze / parity
were not re-run and did not need to be — no `styles-source.css`, `src/`, or fixture byte moved
(they were measured green at `6a481f0` in §1 above: 218/0, 72/72, 0/0/16).

| Gate | At `6a481f0` | **At `8b6064d`** |
|---|---|---|
| `npm run tsc` | clean | **clean** |
| `npm run lint` | clean, exit 0 | **clean, exit 0** |
| `npx jest` | 2825 passed / 1 skipped / 170 suites | **2831 passed / 1 skipped / 170 suites, 3 snapshots, 0 failures (+6)** |

## What changed

### M-1 — the scan is now two-sided

`findUngatedColorMixViolations` returns violations of two `kind`s:

- `ungated` — a `var()`-bearing `color-mix()` with no gate (the original SC-171 failure);
- `no-base-twin` — a **gated** `color-mix()` with no static declaration of the same property,
  in the same selector context, **outside** the gate.

The context key is the enclosing prelude stack with any color-mix gate removed, so a base
rule inside `@media screen` twins a gate inside the same `@media screen` and not a top-level
one. A "twin" whose own value contains `color-mix(` does not count (it fails on the floor
engine too). Custom properties stay exempt, as in the adjacency scan.

The walk was refactored into `scanDeclarations()` (one pass, records `{line, prop, value,
stack}`) so the twin index can be built before any violation is judged.

### M-2 — `isColorMixGatePrelude()` replaces the substring test

Was: `/^@supports\b/i.test(p) && p.includes('color-mix(')`. Now the condition must additionally

- contain no `\bnot\b` — `@supports not (… color-mix …)` applies **only** where color-mix is
  missing, i.e. exclusively on the floor engine;
- have **every** top-level `or` disjunct test color-mix — `(display: grid) or (… color-mix …)`
  lets the floor engine in through the other arm. Top-level splitting is paren-aware, so the
  `or`-free canonical prelude is one term and `color-mix(`'s own parens never confuse it.

`and`-conjunctions are deliberately still accepted (`(display: grid) and (… color-mix …)` is
safe — one false conjunct fails the term), so the rule is a real analysis, not "reject anything
unfamiliar."

### L-3 — `steelBlocksFor()` is base-layer only

It filtered `rules`; it now filters `baseRules`, with `steelGatedBlocksFor()` added as the
explicit accessor for the enhancement layer, so a contract has to say which layer it means.
Only one consumer had a gated twin, and it is the one that had silently changed meaning. The
tier-wash contract is now the same shape as the two notch contracts:

- base layer: exactly one block carrying `background-image: linear-gradient(90deg, var(--tw),
  transparent 60%)`, and **no `color-mix` in any base block**;
- gated layer: exactly one twin, two `background-image` declarations, static first, color-mix
  second.

### L-4 — the control neuters by parsing

`neuterColorMixGates()` rewrites every prelude that `isColorMixGatePrelude()` accepts. Two
things this fixes over the old literal `split/join`:

- a differently-worded but valid gate is now disarmed and counted;
- matching runs against a **comment-masked** copy (same length, spliced back by index).
  Matching raw text let the doctrine comment — which quotes the canonical prelude in prose —
  start a `@supports[^{}]*\{` match that ran through the comment and swallowed the next
  **real** gate, leaving it un-neutered. That was a live bug in my first cut of this helper,
  caught by the control's own structural assertion (`no accepted prelude survives`), which is
  now part of the test.

### N-6 — left as-is, recorded

Order-blindness (nothing checks that the gate block sits *after* the rule it enhances, which
equal specificity makes load-bearing) is documented as a **KNOWN LIMIT** in the file header
rather than fixed, per the coordinator's ruling.

## Can-fail proofs — all run against the REAL stylesheet, then reverted

| Mutation on `styles-source.css` | Result |
|---|---|
| Delete `.dse-pr__row`'s base `background-image`, leave the `@supports` block intact | **`cssSupportFloor` fails:** `styles-source.css:6209 background-image: linear-gradient( 90deg, color-mix(in srgb, var(--t) 8%, transparent), transparent 60% ) <-- it is gated, but there is NO static \`background-image\` declaration outside the gate for \`[data-dse-theme='steel']:not([data-dse-print="on"]) .dse-pr__row\`…` — **and** `steelMaterial`'s rewritten tier contract fails. Before this rider the identical mutation passed all 2825 tests. |
| Rewrite the villain gate to `@supports not (background: color-mix(in srgb, red 14%, blue))` | **fails:** `styles-source.css:7006 background: color-mix(in srgb, var(--dse-act-villain) 8%, transparent)`, kind `ungated` |
| Rewrite the villain gate to `@supports (display: grid) or (background: color-mix(…))` | **fails:** same line 7006, kind `ungated` |
| Put the `color-mix` `background-image` back into the **base** `.dse-pr__row` rule | **fails:** `tier rows carry a FLAT wash in the base rule … Expected pattern: not /color-mix/` |
| Un-gate the villain band entirely (the §4 proof, re-run) | still fails, naming `styles-source.css:7002` |

Two in-repo controls now run these live on every jest run rather than only on demand: the M-1
control holes the real sheet in memory and asserts exactly one `no-base-twin` violation naming
`.dse-pr__row` + `background-image` (with an anti-vacuous guard that fails loudly if its anchor
text ever moves), and the L-4 control asserts a differently-worded valid gate is both accepted
before neutering and counted after.

## Not done, deliberately

- `styles-source.css`'s SUPPORT FLOOR doctrine comment still says the guard "enforces BOTH
  halves" (adjacency + gate). It now enforces three: adjacency, gate, and base twin. Updating
  that prose was out of this rider's scope (CSS untouched) — worth one sentence at landing or
  in the next CSS-touching ticket.
- N-6, per the ruling above.

Worktree clean at **`8b6064d`**; superproject pointer still unstaged; no Xvfb, probe, or
scratch UDD left behind.
