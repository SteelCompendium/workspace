# SC-146 — independent adversarial review of `1b22e41`

**Verdict: FIX ROUNDS NEEDED.** 6 of the 7 claims hold. **Claim 3 (`gridc`) is BROKEN in the
default theme** — it renders the exact inverse of the site, which is the same class of defect the
audit was opened to fix, and the implementer's own after-shot shows it. Everything else is either
confirmed or carries fidelity gaps worth one more pass.

Reviewer ran the full battery independently, ran live `getComputedStyle` probes in Chromium against
the built harness across `steel-light` / `steel-dark` / `legacy-light` / `steel-print`, measured the
diamond's geometry against real text rects in five statblock fixtures, and diffed the after-shots
against the site references. No files in the worktree were modified.

Colour note (Scott is colourblind): every finding below is stated in terms of stacking order,
position, or measured px. Where a colour value appears it is a sampled RGB triple used as evidence,
never a hue judgment.

---

## 1. Battery reproduction — MATCHES the implementer's report exactly

Run in `/home/scott/code/steelCompendium/worktrees/sc146-statblock-settings/draw-steel-elements`
via a wrapper script (no pipes on any gate command; each exit code captured to a file):

| Gate | Result | Exit |
|---|---|---|
| `npm run tsc` | clean, no output | **0** |
| `npm run lint` | clean (only the pre-existing `.eslintignore` deprecation notice) | **0** |
| `npx jest` | `Test Suites: 1 skipped, 159 passed, 159 of 160` / `Tests: 1 skipped, 2503 passed, 2504 total` / `Snapshots: 3 passed` | **0** |
| `npm run shots` | 234 PNGs, 234 `ok`, 0 `FAIL` | **0** |
| `check-freeze.sh` | `freeze OK (137/137 legacy+print PNGs byte-identical)` | **0** |
| `npm run parity` | `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).` | **0** |

`obsidian-shots` deliberately not run (no display).

**The battery being green proves almost nothing about this ticket.** Confirmed by inspection:
`ls visual-harness/shots | grep -E 'featstyle|columns|stats|ledger|gridc'` returns **nothing** — not
one shot, frozen or unfrozen, renders a non-default statblock pref. The freeze baseline's statblock
lines are all default-pref. Every surface this commit changes is invisible to shots, freeze and
parity, and jest only greps the stylesheet for one selector string. See finding **I3**.

---

## 2. Verdict per claim

### Claim 1 — `sbStats` re-pointed to `.dse-sb__grid` / `.dse-sb__kv` — **CONFIRMED**

Probe (`steel-light`, `steel-dark`, `legacy-light`; `data-dse-sb-stats` toggled on the element root,
`getComputedStyle` read on the live DOM):

`.dse-sb__item` (the PRIMARY row) is **byte-identical across all three modes** in every
theme/scheme — `display: block`, `border-radius: 6.4px`, `background: rgba(0,0,0,.22)` dark /
`rgba(0,0,0,.03)` light, `padding: 7.2px 4.8px`. `.dse-sb__kv` is the only thing that moves.
`shots-after/after-stats-01-sbstats-ledger.png` agrees: the five boxed primary cells survive intact
and the Immunity/Weakness/Movement block becomes hairline rows.

`test/dom/framework/pref-reflection.test.ts:59` guard updated correctly.

> Carries one real fidelity gap — see **I1** (container collapse).

### Claim 2 — Steel-scoped ledger reset — **CONFIRMED**

`styles-source.css:5957`. Probe, `steel-light` and `steel-dark`, `sb-stats=ledger`:

```
border-top-width: 0px    border-radius: 0px      background-color: rgba(0, 0, 0, 0)
flex-direction: row      justify-content: space-between   align-items: baseline
padding: 6.4px 1.6px     border-bottom: 1px  rgba(95,103,108,.14) / rgba(176,183,187,.16)
kv-l order: 1 (left)     kv-v order: 2 (right)
```

The specificity arithmetic in the commit message checks out: the new arm is (0,5,0); the plain Steel
box rule at `styles-source.css:5906` is (0,3,0) and the light override at `:5920` is (0,4,1) — the
new arm wins both, in both schemes, confirmed empirically. Print is correctly untouched (both the
box rule and the reset carry `:not([data-dse-print="on"])`, so print falls through to the base arm
at `:2031` and still gets a hairline row — probed under `print=1`: `kvBg rgba(0,0,0,0)`,
`radius 0px`, `flex-direction row`).

### Claim 3 — new `gridc` option — **BROKEN (Critical)**

See **C1** below. The descriptor and the CSS both landed, and the mode is reachable — but under the
**Steel** theme, the theme that ships by default (`DEFAULT_THEME_ID = 'steel'`), the value renders
*below* the label, which is the inverse of the site's `gridc`.

### Claim 4 — Sourcebook preset writes `sbFeatureStyle: 'flat'` — **CONFIRMED**

`src/prefs/catalog.ts:355` — `sourcebook: { sbFeatureStyle: 'flat', sbDensity: 'comfortable',
sbColumns: 'single', sbStats: 'ledger' }`. Matches the site's bundle (`settings-panel.js:37`) on all
four members the plugin owns. Guard tests in `catalog.test.ts` / `settings-tab.test.ts` updated
coherently (both now require two member flips to derive `sourcebook`, which is correct arithmetic
for the new bundle).

### Claim 5 — Index preset `sbColumns: 'single'` + documented density divergence — **CONFIRMED**

`src/prefs/catalog.ts:356` and the block comment at `:337-349`. The comment is accurate and cites
the site line it follows. `shots-after/after-stats-04-preset-index.png` shows grid stats + visibly
tighter compact padding + no forced wide columns.

> Incomplete against the audit's own §4a table — see **I2** (`meta: gridc`).

### Claim 6 — ◆ diamond separators in flat mode — **CONFIRMED PRESENT**, with geometry/colour caveats

`styles-source.css:3725`. Probed and screenshotted at `steel-light`, `steel-dark`, and at a
440px-constrained mount:

- `content: ""`, `position: absolute`, anchored on `.dse-feature { position: relative }`
  (`styles-source.css:39-42`) — correct anchor, verified.
- Renders in Steel screen only. Under `data-dse-print="on"` the pseudo computes `content: none`.
  Absent in Legacy. `:not(.dse-fb *)` matches the convention of the neighbouring flat-mode arms.
- Visually present and legible in both schemes — see `scratchpad/tight-probe-flat-steel-{dark,light}.png`
  and `flat-narrow-seams.png` (reviewer captures).

Caveats **M1** / **M2** / **M4** below.

### Claim 7 — `sbColumns: wide` → CSS `columns` — **CONFIRMED**

Probe at a 1300px mount, `steel-light`:

```
.dse-sb > .dse-feature__nested  ->  display: block, column-width: 448px,
                                    column-gap: 32px, column-count: auto
top-level .dse-feature          ->  break-inside: avoid, margin-bottom: 10.4px
  ... with sb-featstyle=flat    ->  margin-bottom: 0px
feature left edges              ->  [49, 690]  (two independently packed columns)
```

`display: block` does beat the Steel `.dse-feature__nested` flex rule at `:3615` ((0,4,0) vs
(0,3,0)), verified live. `shots-after/after-full-01-columns-wide.png` shows greedy packing with no
row-forced dead space. Minor note **M6**.

---

## 3. Findings by severity

### CRITICAL

#### C1 — `gridc` renders label-over-value under Steel: the exact inverse of the site

**`styles-source.css:2051-2057`** (base `gridc` arm) vs **`styles-source.css:5906-5919`** (Steel
`.dse-sb__kv` box rule).

Both selectors have specificity **(0,3,0)**:

```
[data-dse-element='statblock'][data-dse-sb-stats='gridc'] .dse-sb__kv        attr+attr+class = (0,3,0)
[data-dse-theme='steel']:not([data-dse-print="on"]) .dse-sb__kv              attr+attr+class = (0,3,0)
```

On a tie, source order decides — and the Steel rule sits ~3,850 lines later, so its
`flex-direction: column` beats `gridc`'s `flex-direction: column-reverse`. The only `gridc`
declarations that survive under Steel are `align-items: center` / `text-align: center` (the Steel
rule doesn't set them), so the mode degrades to "`grid`, but centred".

Measured (`getComputedStyle` + `getBoundingClientRect`, statblock default fixture):

| context | `flex-direction` | label rect.top | value rect.top | reads as |
|---|---|---|---|---|
| **steel / light** | `column` | **273** | **297** | label over value ✗ |
| **steel / dark** | `column` | **273** | **297** | label over value ✗ |
| legacy / light | `column-reverse` | 220 | 194 | value over label ✓ |
| steel / print | `column-reverse` | — | — | value over label ✓ |

So `gridc` is correct in Legacy and in print — the two contexts where the Steel box rule is excluded
— and wrong in the one that ships by default.

**The implementer's own after-shot proves it and was not read against the reference.**
`shots-after/after-stats-02-sbstats-gridc.png` shows `IMMUNITY` on top with
`Corruption 4, psychic 4` beneath it; `shots/site-stats-02-meta-gridc.png` shows
`Corruption 10, poison 10` on top with `IMMUNITY` beneath it. The fix report calls this shot
"**Fix 3**: new Grid (centered) mode" without comparing it to the site capture sitting in the
sibling directory.

**Failure scenario:** a user picks "Grid (centered)" expecting the site's quick-glance cell (big
bold value, small caps label under it) and gets a centred version of the mode they already had. The
CHANGELOG (`CHANGELOG.md`, "the value over the label, centred") ships a false claim, and the audit's
§5(a)-3 acceptance ("so Secondary stats offers the site's three modes") is not met — it offers two
and a half.

**Prescribed fix.** Move the layout into the existing Steel `gridc` arm at
`styles-source.css:5943` (already (0,5,0), already Steel-scoped), keeping the base arm at `:2051`
for Legacy/print:

```css
[data-dse-theme='steel']:not([data-dse-print="on"])[data-dse-element='statblock'][data-dse-sb-stats='gridc'] .dse-sb__kv {
	flex-direction: column-reverse;
	align-items: center;
	justify-content: center;   /* site has it; plugin's base arm omits it — see M4 */
	text-align: center;
	gap: 0.1rem;
	min-height: 3.3rem;        /* site: steel-statblock.css:170 — see M4 */
}
```

Then add a grep guard (see **I3**) so the tie can't silently reopen. Site reference:
`v2/docs/stylesheets/steel-statblock.css:168-172`.

---

### IMPORTANT

#### I1 — `ledger` collapses the secondary block to ONE column; the site keeps TWO

**`styles-source.css:2027-2030`.** The re-pointed ledger arm kept `display: block` on the container:

```css
[data-dse-element='statblock'][data-dse-sb-stats='ledger'] .dse-sb__grid { display: block; padding-bottom: .25rem; }
```

That `display: block` is a carry-over from the rule's previous life targeting `.dse-sb__items` — the
five-cell PRIMARY row, where stacking was the whole point. It was re-pointed but not re-thought.

The site does the opposite. `v2/docs/stylesheets/steel-statblock.css:195-196`:

```css
.sb__meta { display: grid; grid-template-columns: 1fr 1fr; gap: .4rem; padding: 0 var(--pad) .7rem; }
[data-sb-meta="ledger"] .sb__meta { gap: 0 1.6rem; }
```

The grid **survives** ledger mode — only the gaps change (row-gap 0, column-gap 1.6rem) — and the
single-column form is reached only through a responsive breakpoint
(`@media (max-width: 34em)`, `steel-statblock.css:614`).

Visible in the evidence already on disk: `shots-after/after-stats-01-sbstats-ledger.png` stacks
Immunity / Weakness / Movement as three full-width rows;
`shots/site-stats-01-meta-ledger.png` puts Immunity | Weakness side by side with Movement below-left.
Probed container: plugin `display: block`, full 710px rows; site keeps `1fr 1fr`.

**Failure scenario:** ledger mode (and therefore the whole Sourcebook preset) makes every statblock
~one row taller than the site's and throws away the horizontal pairing the site's book layout
relies on — in a fix whose stated purpose is "matching the site's `[data-sb-meta]` scope".

**Prescribed fix:** drop `display: block` and mirror the site —
`[data-dse-element='statblock'][data-dse-sb-stats='ledger'] .dse-sb__grid { gap: 0 1.6rem; }` (the
Steel `gap: 0.5rem` at `:5903` is (0,3,0), so this arm at (0,3,0) needs to stay later in source
order or gain a qualifier). If Scott prefers the single column for Obsidian's narrower panes, that's
a legitimate call — but it should be a *stated* divergence with a comment, exactly like the
`density: compact` decision in fix 5, not an unexamined leftover.

#### I2 — Index preset still writes `sbStats: 'grid'`; the site's Index writes `gridc`

**`src/prefs/catalog.ts:356`.** The audit's own §4a table records the site's Index bundle as
`meta: gridc` (`settings-panel.js:39`). Before this commit the plugin had no `gridc`, so `grid` was
the only reachable value and the divergence was unavoidable. Fix 3 removes that excuse and fix 5
touched this exact object — but the member was left at `'grid'`.

Result: with all seven fixes applied, the plugin's Index preset still does not match the site's on
the one member the commit just made matchable. (Note that flipping it is blocked behind **C1** — it
would currently apply a broken mode.)

**Prescribed fix:** after C1 lands, `index: { …, sbStats: 'gridc' }`, plus the
`catalog.test.ts` assertion; or record a deliberate-divergence comment alongside the `density`
one if Scott prefers `grid`.

#### I3 — Zero regression coverage for five of the seven changed surfaces

Nothing in the battery renders a non-default statblock pref:

- **shots / freeze:** `ls visual-harness/shots | grep -E 'featstyle|columns|stats|ledger|gridc'` →
  empty. All 137 frozen lines are default-pref. Freeze passing is therefore *expected* and carries
  no information about this commit.
- **parity:** its selector map covers no `[data-dse-sb-*]` variant.
- **jest:** the only assertion touching any of this is `pref-reflection.test.ts:59`, a string grep
  for `[data-dse-sb-stats='ledger'] .dse-sb__grid`. There is **no** assertion anywhere for the
  `gridc` arm, the Steel ledger reset, the ◆ separator, or `columns: 28rem`
  (`grep -rn "gridc\|column-reverse\|columns: 28rem" test/` → no hits).

This is why C1 shipped inverted with a fully green board, and why every gate stayed green on the
implementer's run too. **The gate did not fail to catch a subtle bug; it never looked.**

**Prescribed fix (cheap tier):** extend `pref-reflection.test.ts` with sheet greps for the four new
arms, including one asserting the `gridc` Steel arm exists *and* is theme-qualified — that single
assertion would have caught C1. **(right tier):** add pref-combo entries to the harness manifest
(same "own id, own array" convention as `NARROW_SHOTS` / `INTERACTION_SHOTS`, `visual-harness/entry.ts`)
for `statblock` × {`stats=gridc`, `stats=ledger`, `featstyle=flat`, `columns=wide`} and widen the
freeze baseline for their legacy/print twins.

---

### MINOR

#### M1 — the ◆ halo is ~3× the clearance the layout gives it; the code comment's arithmetic is wrong

`styles-source.css:3717-3719` claims: *"flat's own 0.25rem top/bottom padding + zero gap leaves
exactly an 8px seam — this diamond's own halo diameter — so no extra spacing is added."*

8px is the **core square's side**, not the halo. With `box-shadow: 0 0 0 4px …, 0 0 0 5px …` the
outer ring is an 18×18px square, and `transform: rotate(45deg)` puts its **diagonal** on the
vertical axis: **±12.73px** around the seam, ~25.5px total.

Measured across five statblock fixtures (`default`, `goblin-stinker`, `roleless-corpus`,
`villain-corpus`, `human-bandit-chief`), identical every time:

```
clearance above seam to previous feature's last text : 21.2px   (halo overhang -8.5px, fine)
clearance below seam to next feature's first text    :  2.0px   (halo overhang +10.7px)
```

So the opaque halo paints ~10.7px into the next feature's first text line and ~8.5px through the
previous feature's trailing `.dse-section` box. It does not currently clip a glyph — a targeted scan
for text rects intersecting the halo band at x = centre ±13px returned **zero hits** in every
fixture at both 900px and 440px, because the next feature's first line is the left-aligned eyebrow —
but the margin of safety is content-dependent, not structural, and the notch through the trailing
section box's bottom edge is visible in `scratchpad/flat-narrow-seams.png`.

The site solves this explicitly (`steel-statblock.css:311`):
`[data-sb-featstyle="flat"] .sb__feat + .sb__feat { position: relative; margin-top: calc(1.25rem + -16px); padding-top: 1.25rem; }`
— 18.4px of clearance above, 20px below, versus the plugin's 21.2 / **2.0**.

**Prescribed fix:** either port the site's spacing pair onto
`[…featstyle='flat'] .dse-feature__nested > .dse-feature + .dse-feature` (margin-top 4px /
padding-top 1.25rem, keeping the two equal so the diamond stays centred, as the site's own comment
warns), or shrink the halo. At minimum, correct the comment — it currently asserts a clearance the
layout does not have.

#### M2 — the halo is keyed to the PAGE background but the diamond sits on the statblock PLATE

`styles-source.css:3735-3737` reuses `var(--dse-page-bg, var(--dse-surface))` from the
`.dse-hr__diamond` recipe. Per that recipe's own comment (`:5831-5837`), `--dse-page-bg` is
"guaranteed-invalid document-wide" so the fallback `--dse-surface` (`#1a1e21` dark / `#f6f8f8`
light) is what actually resolves — which is right for an `<hr>` on the page, and wrong here: this
diamond sits on `.dse-sb`, whose Steel ground is a gradient
(`linear-gradient(160deg, #fff, #eef1f1)` light).

Sampled at the seam in the reviewer's captures:

| scheme | halo pixel | plate above | plate below |
|---|---|---|---|
| dark | (26, 30, 33) | (26, 31, 33) | (31, 37, 41) |
| light | (246, 248, 248) | (244, 245, 245) | (249, 250, 250) |

Small today (2-8 per channel) but structurally unpinned: the delta grows as the plate's gradient
sweeps, so a taller statblock or a different card width moves it. The site created a token for
exactly this problem — `--sb-plate-solid: #1e2327` / `#f4f6f6`
(`v2/docs/stylesheets/steel-statblock.css:67,74`), used by every plate-mounted diamond it draws
(`:102`, `:334`, `:470`).

**Prescribed fix:** introduce a plugin twin of `--sb-plate-solid` (the solid mid-tone of the Steel
card ground) and use it for this halo; leave `.dse-hr__diamond` on the page token.

#### M3 — ledger value lacks the site's `text-align: right`

Site: `[data-sb-meta="ledger"] .sb__meta .sb__field-v { text-align: right }`
(`steel-statblock.css:190`). The plugin gets right *placement* from `justify-content: space-between`
but not right *alignment*, so a value that wraps to two lines will be left-ragged inside its flex
item where the site's is right-ragged. One declaration on
`[…sb-stats='ledger'] .dse-sb__kv-v` (`styles-source.css:2039`).

#### M4 — `gridc` omits the site's `justify-content: center` and `min-height: 3.3rem`

`steel-statblock.css:170` gives the gridc cell a 3.3rem floor and vertically centres its content, so
a row of gridc cells reads as an even rail regardless of value length. The plugin's arm
(`styles-source.css:2051`) has neither, so cells size to content and a one-word value sits in a
visibly shorter box than a wrapping one. Fold into the C1 fix.

#### M5 — CHANGELOG documents behaviour that does not ship

`CHANGELOG.md` (SC-146 block): *"Added the missing third mode, "Grid (centered)" — a framed cell
with the value over the label, centred"*. False until C1 is fixed. Otherwise the entry is well
placed (under `## 7.0.0 (unreleased…)`, alongside the other `[FIX]` bullets), user-facing in tone,
and accurate on the other six items.

#### M6 — `28rem` is not the same width on both surfaces

The plugin's rem base is 16px → `columns: 28rem` = **448px**; the site's is 20px →
**560px**. Both sheets say "28rem", so the literal matches while the breakpoint does not — the
plugin flows a second column ~112px earlier than the site. Probably fine (Obsidian panes are
narrower than a doc page), but it is a divergence the commit message presents as a match. Worth one
line of comment either way.

#### M7 — two diamonds within ~10px in flat mode

Every feature's eyebrow already renders a `◆` glyph (`◆ TRAIT`, `◆ ABILITY` — visible in every
capture). The new separator puts a second, larger diamond ~2px above it. Visible in
`scratchpad/flat-narrow-seams.png`. Not wrong, but it is a design question for Scott that the site
doesn't have (its flat separator is a line + seed dots + diamond spanning the full width, so the
diamond reads as part of a rule rather than as a repeat of the eyebrow mark).

#### M8 — the `theme-print.test.ts` narrowing is LEGITIMATE, with a fragility note

Explicitly checked, since the brief flagged it as a possible weakening. It is not.

`test/dom/framework/theme-print.test.ts:245-248` now extracts `@media print` blocks first and finds
the `break-inside: avoid` rule inside them. Verified against the real sheet: the three print blocks
(`styles-source.css:8314`, `:8435`, `:8457`) contain no nested at-rules and no empty rules, so
`/@media print\s*\{[\s\S]*?\}\s*\}/g` captures each one whole, and the first `break-inside: avoid`
in the joined text is still Rule 5 (`styles-source.css:8479-8485`, `[data-dse-element], .dse-feature,
.dse-pr, .dse-statgrid`). Both assertions still fire on the real print rule. **Can-fail confirmed by
construction:** delete the print rule and `printBlock.match(...)` returns `null` →
`breakRule = ''` → `expect('').toContain('[data-dse-element]')` throws. The old "first
`break-inside` anywhere in the file" form was the accidental assertion; this one is the intended
one.

Fragility note only: a future nested at-rule inside `@media print` would truncate the capture. That
fails loudly (empty `breakRule`), never silently — acceptable.

**Print layout is unaffected by the multi-column change**, verified by inspection and probe: the new
`break-inside: avoid` (`styles-source.css:2010`) is gated behind `sb-columns='wide'` and declares the
same value the print block already sets for `.dse-feature`; the `@media print` block
(`:8457-8503`) and its on-screen preview twin (`:8523-8530`) are byte-untouched. Under
`data-dse-print="on"` the diamond computes `content: none` and the ledger cell correctly falls
through to the base arm.

---

## 4. Checks that came back CLEAN

- **Preset semantics / round-trip.** `applySbPreset` (`src/prefs/catalog.ts:372-376`) iterates
  `SB_PRESET_MEMBERS` unconditionally and writes **all four** keys on every application — there is
  no conditional or diff-based path, so no stale member can survive a preset switch. Sourcebook →
  Steel Card round-trips all four by construction; `test/unit/prefs/catalog.test.ts:196-200`
  exercises index → steel and asserts `deriveSbPreset` returns `steel`.
- **Legacy safety.** Every new arm is either Steel-scoped with the required
  `[data-dse-theme='steel']:not([data-dse-print="on"])` prefix, or gated behind a non-default pref
  value (`sb-stats='gridc'|'ledger'`, `sb-columns='wide'`, `sb-featstyle='flat'`). Legacy defaults
  are `grid` / `single` / `card`, so no new rule can fire on any frozen surface — consistent with
  `freeze OK (137/137)`.
- **Legacy + non-default pref combos** (which freeze does NOT cover) probed directly:
  legacy+`ledger` → hairline rows with the Legacy bold-label + `": "` colon, sane;
  legacy+`gridc` → `column-reverse`, value above label, **correct** (ironically the only place it
  is); legacy+`wide` → block/columns, sane; legacy+`flat` → no diamond (Steel-only ornament, matches
  the sheet's OD-2 convention). No leakage, no breakage.
- **Per-block `prefs:` overrides.** `src/framework/prefOverrides.ts` validates keys against the
  descriptor list but not values, so `gridc` passes through with no schema change needed. No dead
  path introduced.
- **`::after` collision.** `.dse-feature`'s `::before` is the action spine (`styles-source.css:60`);
  `::after` had no prior claimant on this class (`grep` over the sheet). `.dse-feature` is
  `position: relative` (`:39-42`), so the absolutely-positioned separator anchors correctly.
  No ancestor sets `overflow: hidden` on the path (`.dse-sb` computes `overflow: visible`).
- **Fix 1's blast radius.** Nothing else in the sheet or in `src/` referenced
  `[data-dse-sb-stats] .dse-sb__item*`; the re-point is complete, with no orphaned arm left behind.

---

## 5. Recommended fix round

1. **C1** — Steel-scope `gridc`'s `flex-direction: column-reverse` (+ `justify-content: center`,
   `min-height: 3.3rem` per **M4**). Blocking.
2. **I3** — add at minimum one sheet-grep guard per new arm in `pref-reflection.test.ts`, including
   a theme-qualified one for `gridc`. Blocking, or C1 can silently reopen.
3. **I1** — decide the ledger container: match the site's two-column grid, or keep the single column
   with a written deliberate-divergence comment.
4. **I2** — Index preset `sbStats: 'gridc'` once C1 lands (or comment the divergence).
5. **M5** — CHANGELOG line follows whatever C1 ships.
6. **M1 / M2 / M3 / M4** — separator clearance, plate-solid halo token, ledger value alignment.
   `M6` / `M7` are Scott-facing notes, not defects.

Re-run the battery after the round; expect the same six numbers, since none of the above touches a
default-pref surface — which is precisely the problem **I3** describes.

---

## 6. Reviewer evidence

Scratchpad (`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/19b5ef2c-c696-441d-91ac-21746efdff4a/scratchpad/sc146rev/`):
`battery.sh` + `exitcodes.txt` + per-gate logs; `probe.mjs` / `probe.out` (three-mode ×
three-context computed-style sweep); `probe2.mjs` / `probe2.out` (diamond geometry, wide columns,
print preview); `probe3.mjs` / `probe3.out` (seam clearance vs real text rects, five fixtures);
`probe4.mjs` (glyph-collision scan at 440px); captures
`probe-flat-steel-{light,dark}.png`, `tight-probe-flat-steel-{light,dark}.png`,
`flat-narrow-seams.png`, `probe-wide-steel-light.png`, `probe-wide-flat-steel-light.png`.
No worktree file was modified; `git status` in the worktree is unchanged from the start of review.
