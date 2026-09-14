# SC-202 phase 2, round 4 — INDEPENDENT REVIEW (heading + emphasis + link host re-grounding)

**Verdict: FIX-ROUND-NEEDED** — 1 HIGH, 5 MEDIUM, 3 LOW. The CSS fix itself is correct and
lands the family: every gate re-run clean by me (tsc/lint; jest 3769/0F/1sk/197; shots 524
PNGs 0 FAIL; **freeze OK 252/252** with the restored tooling; parity 0/0/16), the can-fail
reproduces exactly (658 → 0), all 524 shot bytes are byte-identical to the implementer's
sweep and to a second sweep of my own, and both widening files match a fresh sweep. What
needs a fix round is around it: **Step A's guard no longer fails on the very defect it
exists to catch** (HIGH-1, mutation-proven); `outline: none` silently removes the browser's
`:focus-visible` ring from every plugin anchor and is mis-described as a UA default (MED-1);
`b`/`i` are the same Obsidian rule family as `strong`/`em`, are not re-grounded, and the
sweep cannot see them (MED-2); `assertLinkTokenOverride` never samples an `.internal-link`
(MED-3); and the report's §5 vault delta is **backwards and 10× incomplete** (MED-4/5).
**Item 13:** the report is wrong, the crops are right — the vault h3 goes **21.088 → 18.72 px
(−11.2 %)**, matching the harness exactly; it moved because `.dse-hero__region-title` has no
font-size of its own, so the block comment's "every classed heading already carries one" is
false. **Item 14:** the six ALLOWLIST entries are legitimate in substance (keep the token
mint dropped) but were added through the wrong mechanism — split them out of `ALLOWLIST`.

---

## Provenance

| | |
|---|---|
| Reviewed | `git diff 27851f0..a8a89f5` — Step A `aa21854`, round 4 `a8a89f5` |
| Worktree | `/home/scott/code/steelCompendium/worktrees/sc202-visual-harness-obsidian/draw-steel-elements` (branch `sc202-visual-harness-obsidian`, base `origin/develop` `d8bda06`) |
| Tree state | clean before and after (`git status --porcelain` empty in the submodule; superproject shows only the expected ` M draw-steel-elements` pointer, present when I started) |
| Tracker calls | none |
| Logs/artifacts | `.superpowers/sdd/sc202-visual-harness-obsidian/sc202-r4rev-*` |

Every number below was produced by me in this session; nothing is quoted from the
implementer's logs except where explicitly compared.

---

## Battery (item 8) — all green, independently re-run

| Gate | Result |
|---|---|
| `npm run tsc` | clean, exit 0 (`sc202-r4rev-tsc.log`) |
| `npm run lint` | clean, exit 0 (`sc202-r4rev-lint.log`) |
| `npx jest` (after `rm -f main.js styles.css`) | **3769 passed / 0 failed / 1 skipped, 197 of 198 suites**, 3 snapshots, exit 0 |
| `npm run shots` (×2) | **524 PNGs, 0 FAIL** both runs; every `*--steel-*.png` byte-identical between them (determinism) |
| `check-freeze.sh` (restored tooling) | **`freeze OK (252/252 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`, exit 0** — run twice, before and after the can-fail sweep |
| `npm run parity` (LAST) | **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)**, exit 0 |
| Shot bytes vs the implementer's sweep | `diff sc202-r4-postedit-allshots.sha256 sc202-r4rev-allshots.sha256` → **empty, 524/524 identical** |
| Widening files | all 8 hashes match my fresh sweep (`feature-list`, `title-nested`, `treasure-hr` ×2 from r3; `perk-links` ×2 from r4); 0 name collisions with the 252-line baseline → **additions-only confirmed**; no `sc202-r4-rebaseline.txt` exists (correct) |
| Prior-family gate lines (item 6) | `host-copy pin` / `button 678` / `input 154` / `table 278` / `list 340` / `chrome` — **byte-identical** between the pre-r4 tree and the fixed tree |

Can-fail (item 5), re-run by me by swapping `27851f0:styles-source.css` in (never
`git checkout`, restored from a saved copy and sha-verified): `INLINE HOST-LEAK VIOLATED`,
exit 1, **60 shown + "… and 598 more" = 658**, e.g.

```
dark|gallery|h3|ancestry|h3#5: … changes fontSize — "18.72px" without the host, "21.088px" with it
```

Restored → `inline host-leak OK (… = 1090 comparisons)` and
`link token-override probe OK (155 links × 5 properties = 775 samples)`. Machine load
1.1–1.9 throughout; no timeout-shaped reds.

---

# Findings

## HIGH-1 — Step A's `inputHostCoverage` guard no longer FAILS on an unclassed input; it now passes silently

`test/unit/build/inputHostCoverage.test.ts:146-156` (commit `aa21854`)

The rewritten unclassed branch emits a *named but always-green* test:

```ts
if (!site.cls) {
    test(`${site.file}:${site.line} — unclassed ${site.tag}…`, () => {
        expect(site.cls).toBeNull();      // ← can never fail
    });
    continue;
}
```

**Mutation-proven.** I removed `cls: 'dse-cond-icons__search', ` from
`src/views/ConditionsModal.ts:288` — i.e. re-created SC-277's exact defect — and ran the
guard:

```
views/ConditionsModal.ts:288 — unclassed input, type=search (…)   → PASSED
Tests: 21 passed, 21 total          exit 0
```

(`sc202-r4rev-guardA-mutated.log`; the same file names it correctly, so the *attribution*
half of the brief's item 12 mutation is satisfied — it says `ConditionsModal.ts:288`, not
`.dse-cond-icons__grid`.)

Before Step A the identical defect turned this suite **red** (by accident: the flat 300-char
window picked up the sibling `<div>`'s class, emitted a real coverage test, and that test
failed). Step A fixed the attribution and, in the same move, removed the failure. The file's
own docstring at `:17-18` still promises the opposite and was not updated:

> "…so a FUTURE input the sweep also cannot see **still fails a test** instead of shipping
> silently leaking."

**Failure scenario:** the next landing that adds an unclassed `createEl('input', …)` (exactly
what SC-277 did, and what cost this round a whole extra commit) ships a leaking input with a
fully green battery. The one gate written to prevent that now prints a green line about it.

**Prescribed fix:** make the branch fail, naming both escapes:

```ts
if (!site.cls) {
    test(`${site.file}:${site.line} — unclassed ${site.tag}${…} must carry a class covered by the SC-202 r1 block`, () => {
        // Give the element a class and fold it into the r1 re-grounding block, or add it
        // to UNCLASSED_BY_DESIGN below with a one-line reason (the checkbox/color families
        // are already excluded by type, above).
        expect(site.cls).not.toBeNull();
    });
    continue;
}
```

Green on landing: I enumerated all 25 `createEl('input'|'textarea')` sites in `src/` — 5 are
type-exempt (`checkbox` ×4, `color` ×1) and the other 20 all carry a class, so there are
**zero** unclassed non-exempt sites today.

---

## MED-1 — `outline: none` deletes the browser's `:focus-visible` ring from every plugin anchor, and the comment calls it a UA default

`styles-source.css:16493-16499` (GROUP 5), comment at `:16479-16492`; pinned by
`test/dom/theme/headingEmphasisLinkHostRegrounding.test.ts:113`

Measured A/B in the harness (`sc202-r4rev-harness-ab.log`), a real focused
`[data-dse-element] a`, **no host sheet** (the plugin's own reference render):

| | `.external-link` | `.internal-link` |
|---|---|---|
| `27851f0` | `outline-style: auto`, width 1px, `:focus-visible` = true | same |
| `a8a89f5` | **`outline-style: none`**, `:focus-visible` = true | same |

The comment's claim is factually wrong:

> "`outline: none`/`text-decoration-line: underline`/… are the browser's own UA anchor
> defaults, restated literally."

Chromium's UA sheet declares **no** `outline` for `a`; it declares `outline: auto` for
`:focus-visible`, in the UA origin — which any author declaration beats at any specificity.
So this line does not restate a UA default, it adopts *Obsidian's* suppression
(`a { outline: none }`) and makes it the plugin's own contract. It is the only property in
the block re-grounded toward the host rather than toward the browser, and it is the inverse
of what r1 did for inputs (which got a GROUP 3 `:focus-visible` restatement *and* joined the
shared kit ring).

The sweep cannot see this: it compares bare-vs-host with the fix applied to **both** sides,
so `none == none` is 0 diffs. In a real vault I measured `outline-style: none` before **and**
after (`sc202-r4rev-realvault-cdp.log`), so there is no vault-visible regression today — the
cost is (a) the plugin's reference rendering lost a keyboard focus indicator it used to draw
and provides no replacement, and (b) if Obsidian ever restores link focus rings, the plugin
now overrides them.

**Prescribed fix** — keep the rest-state line and add the companion the UA actually has:

```css
:is([data-dse-element], .dse-modal):not([data-dse-print="on"]) :where(a):focus-visible {
	outline: auto 1px -webkit-focus-ring-color;
}
```

(0,3,0), so it beats Obsidian's `a { outline: none }` (0,0,1); bare and host both compute
`auto` → the sweep stays at 0 diffs; focus is not captured at rest so no frozen byte moves.
Add the assertion to the r4 guard and correct the block comment. If Scott would rather
plugin links wear the kit ring (`outline: 2px solid var(--dse-focus-ring)`, `styles-source.css:13717`)
that is a design call, not a re-grounding one — either way `outline: none` alone should not
ship as "the browser's default".

---

## MED-2 — `b` and `i` are the same host rule as `strong`/`em`, are not re-grounded, and the sweep is blind to them

`styles-source.css:16439-16451` (GROUP 2); `visual-harness/shoot.mjs:2967` (`tagInline`),
`:3012-3018` (`withSyntheticInline`)

Obsidian's own sheet (my census, `sc202-r4rev-appcss-census.txt`) declares them
byte-identically to the two tags the round did fix, equally unscoped:

```
b { font-weight: calc(var(--font-weight) + var(--bold-modifier)); color: var(--bold-color) }
i { font-style: italic; color: var(--italic-color) }
```

`--bold-modifier: 200`, so a `<b>` renders **600** under the host against the browser's 700.
Measured with the r4 fix applied, a synthetic `<b>` under a real card body:

```
[AFTER-r4] synthetic emphasis tags bare vs host — MOVED: ["b.fontWeight: \"700\" -> \"600\""]
```

`i`/`u`/`s`/`del` do not move (`u`/`s`/`del` have **0** rules anywhere in app.css — the
block's "checked, not assumed" claim for `del`/`s` is correct; `i` is protected only because
`font-style: italic` is also the UA value, i.e. the coincidence round 2's MED-1 forbids
relying on).

The gate cannot see it: `tagInline()`'s tag list is
`['h1'…'h6','strong','em','mark','code','a']` — no `b`, no `i` — and the synthetic probe's
kinds are `['h1','h5','mark','code']`. The block comment never mentions `b`/`i` at all.

**Live content:** the plugin renders 13 real `<b>` and 5 real `<i>` in the gallery, all from
`src/elements/statblock/stickyHeader.ts:117,123,124,134`. None of them moves today, because
`styles-source.css:9982-9996` (`.dse-sb__sticky-{m,c} b`, `.dse-sb__sticky-sm b`,
`.dse-sb__sticky-c i`) pins their weight/style at higher specificity — protection that is
incidental to this block and would vanish the moment any card body renders inline `<b>`
(Obsidian renders raw inline HTML in markdown; the shipped corpus already carries 16 `<u>`
tags, so raw inline HTML is not hypothetical).

**Prescribed fix:** `:where(strong, b)` and `:where(em, i)` in GROUP 2; add `'b','i'` to
`tagInline`'s tag list, to `INLINE_PROPS_BY_KIND` (`STRONG_PROPS`/`EM_PROPS`), and to
`withSyntheticInline`'s `kinds`; record them in the block comment's census.

---

## MED-3 — `assertLinkTokenOverride` never samples an `.internal-link`, but reports that it proved one

`visual-harness/shoot.mjs:3286-3292`

The probe exists to close this round's one genuine numeric tie
(`.markdown-rendered .internal-link` (0,2,0) vs the block's flat anchor (0,2,0)). It visits
**only** `gallery: '1'`. Measured node census of that page
(`sc202-r4rev-harness-probes.log`):

```
E gallery census: {"anchors":155,"internal":0,"external":0, …}
```

Zero `.internal-link` and zero `.external-link` nodes — the classed anchors live only in the
**non-default** `perk/links` fixture, which this probe never visits (`INLINE_SWEEP_VISITS`
at `:3126` does; the token probe does not). So all 775 samples are generic anchors, and the
printed conclusion —

> "the .internal-link companion wins structurally, not by matching Obsidian's default token
> values"

— is asserted about a rule the run never exercised. The tie is still argued (correctly, and
the jest specificity guard checks the arithmetic), never measured.

**Prescribed fix:** iterate `INLINE_SWEEP_VISITS` in `assertLinkTokenOverride` (or add the
`perk/links` visit), and hard-fail if 0 `.internal-link`/`.external-link` nodes were
sampled — the same `min`/"the sweep is blind" guard `assertInlineHostLeak` already carries at
`:3141`.

---

## MED-4 — the report's §5 vault delta is reversed, and covers ~1/10 of what actually changes

`sc202-r4-report.md` §5. Two separate problems.

### (a) Direction — the numbers are the right pair with the labels swapped

Measured over CDP in a real vault, `Harness/hero.md`, `.dse-hero__region-title`
("CHARACTERISTICS"), same note, same build recipe, `27851f0` vs `a8a89f5`
(`sc202-r4rev-realvault-cdp.log`):

| | before (`27851f0`) | after (`a8a89f5`) | harness (both builds) |
|---|---|---|---|
| font-size | **21.088 px** | **18.72 px** | 18.72 px |
| line-height | 27.414 px | 28.08 px | 28.08 px |
| padding-top | 9.490 px | 8.424 px | 8.424 px |
| margin-bottom | 12.653 px | 11.232 px | 11.232 px |
| letter-spacing | 0.2109 px | 0.1872 px | 0.1872 px |

The heading gets **11.2 % smaller**, and its line box gets slightly **taller**. The report
says "~13 % BIGGER (18.72 → 21.09)" with a "slightly tighter line box (28.08 → 27.41)" —
both reversed. Three independent confirmations:

1. `--h3-size: 1.318em` × 16 px = 21.088 px is *Obsidian's* value (app.css); 1.17em × 16 px
   = 18.72 px is the UA value this round restates.
2. The harness renders 18.72 px on **both** builds (measured), and the round's contract is
   vault == harness, so 18.72 px can only be the after value.
3. The can-fail sweep prints it directly: `changes fontSize — "18.72px" without the host,
   "21.088px" with it`.

**The crops are correct as labelled** — `sc202-r4-realvault-heading-before.png` really is the
larger text. I re-shot both independently at the same rect
(`sc202-r4rev-vault-heading-{before,after}.png`, 21.088 px vs 18.72 px) and they agree with
the implementer's. **No re-shoot is needed; the prose and the arithmetic are what must be
corrected**, plus the report's derived claim "sits marginally lower relative to the divider
line under it" (it sits marginally *higher*: padding-top 9.49 → 8.42).

### (b) Completeness — 70 of 239 sampled nodes change, not one heading and one icon

Full measured delta in `sc202-r4rev-vault-delta.txt` (gallery under the real app.css + the
`.markdown-rendered` wrapper, `27851f0` vs `a8a89f5`; every "after" value equals the harness
value, which is the round's contract and is what the 1090-comparison gate asserts):

| what | before → after |
|---|---|
| prose `h6` (perk "Familiar Statblock", class) ×2 | **16 → 10.72 px**, line 24 → 18.22, margins 40 → 24.98 |
| prose `h3` (ancestry, class) ×2 | 21.09 → 18.72 px, line 27.41 → 31.82, weight 660 → 700, **margin-top 40 → 18.72** |
| `.dse-hero__region-title` ×7 | 21.09 → 18.72 px (above) |
| `.dse-enc__roster-heading` | 21.09 → 18.72 px, line 27.41 → 28.08 |
| initiative bare `h3` ×2 | 21.09 → 18.72 px, margins 16 → 18.72 |
| initiative bare `h4` | 19.01 → 16 px, line 26.61 → 24 |
| `.dse-hero__name` (h2) | **23.39 → 24 px** (slightly *bigger*), line 28.07 → 36 |
| `.dse-mt__guide-title` (h4) ×4 | line-height 19.04 → 20.4 px (its font-size is its own) |
| `strong` ×36 (perk, class, career, treasure, featureblock) | **weight 600 → 700** |
| `a` ×14 (kit, perk, class, treasure) | weight 600/400 → 700 (`inherit`) |
| `.external-link` icon | background-image + `padding-inline-end: 14.4px` → `none` / `0px` ✅ |

The h6 case is the one I would put in front of Scott: a `###### heading` inside a plugin
body drops from 16 px to **10.72 px** — the correct Chromium UA ratio, smaller than the body
text around it, and the harness has always rendered it that way. It belongs in the ledger's
FINAL-ASK list next to the external-link icon question, and the round's ticket note should
carry the table above, not one heading.

---

## MED-5 — the block comment's "every classed heading already carries its own font-size" is false

`styles-source.css:16230-16238`

> "Every one of the six classed headings above already carries its OWN font-size/margin
> override at (0,3,0) or higher … so this block is a verified NO-OP for every one of them."

Three of them declare only `margin`/`color` and have no font-size anywhere:

- `.dse-hero__name` (h2) — `styles-source.css:5734`
- `.dse-hero__region-title` (h3) — `:5804` (and the SC-204 note at `:10195` states it
  outright: *"this is an `<h3>` at fs 18.72"*)
- `.dse-enc__roster-heading` (h3) — `:3496`

`.dse-mt__guide-title` has a font-size but no line-height, and its line-height moves too
(above). Only `.dse-skills__group-title` (`:3357`, `--dse-fs-subheading`) and
`.dse-mt__guide-title`'s size are genuinely pinned. This is exactly why classed headings
move in a vault — the brief's item 13 question "why did a CLASSED heading move at all?"

The block **is** a verified no-op in the *harness* (0 of 524 shot bytes, which I confirmed
twice), and that is the claim worth keeping. **Prescribed fix:** rewrite the paragraph to
say what is true — the block only ever wins where the plugin has no size opinion of its own,
which is most of them; it changes nothing in the harness (byte-proven) and re-grounds the
vault onto the harness's values (table in MED-4b) — and drop the "(0,3,0) or higher" claim.

---

## LOW-1 — `fontSizeContract` ALLOWLIST: right answer, wrong mechanism (item 14, see verdict below)

`test/unit/build/fontSizeContract.test.ts:223-234, 294`. The six entries are legitimate in
substance, but they were pushed into the one list whose docstring says *"Do NOT add to this
list to make a red run green… the list can only shrink"* and whose counter test
(`expect(offScale.length).toBe(ALLOWLIST.length)`, `:294`, documented as *"the number of
declarations still owing an adoption"*) now carries six permanent residents that will never
be adopted.

**Prescribed fix:** a separate exported const beside it —

```ts
/** UA restatements: literal-bearing on purpose, never a role-scale candidate (SC-202 r4). */
export const UA_RESTATEMENTS: readonly string[] = [ …the six h1-h6 entries… ];
```

accepted alongside `ALLOWLIST` in "declares NO new hardcoded font-size" and in the dead-entry
check, with the counter becoming
`expect(offScale.length).toBe(ALLOWLIST.length + UA_RESTATEMENTS.length)`. `ALLOWLIST.length`
then still means adoption debt and still only shrinks, and the fifth-family comment moves to
the new const. The `isOnScale()` widening to accept bare `inherit` is sound as written
(`inherit` hardcodes nothing; the "gate HAS TEETH" test still reports `0.85em`/`13px`).

---

## LOW-2 — `color` is excluded from `LINK_REST_PROPS`, so a rest-state colour leak is unobservable

`visual-harness/shoot.mjs:2935`. The exclusion is reasoned ("already safe via the pre-existing
`.dse-card a` family") — but that is precisely the shape of assumption round 2's MED-1 ruled
against, and the round restates `strong`/`em` colour at 0 diff on exactly that principle.
An anchor rendered inside a plugin root but outside the five containers
(`.dse-feature`/`.dse-sb`/`.dse-fb`/`.dse-section__body`/`.dse-card`, `styles-source.css:7980-7985`)
would leak `color` at rest with the gate silent. It happens to be covered today only because
`LINK_HOVER_PROPS` *does* sample colour and passes on all 155 anchors.

**Prescribed fix:** add `'color'` to `LINK_REST_PROPS`. It should be 0 diffs (I measured teal
`rgb(77, 184, 199)` before and after in the real vault on all 9 scc anchors); if it goes red,
that red is the finding.

---

## LOW-3 — the `perk/links` fixture is not quite "the EXACT DOM shape `rewriteSccAnchors` produces"

`visual-harness/entry.ts:868-873`, claim at `:855` and in the CSS comment `:16368`. Measured
in a real vault (`sc202-r4rev-realvault-cdp.log`), `rewriteSccAnchors`
(`src/refs/rewriteSccAnchors.ts:24-38`) produces:

| | real vault | fixture |
|---|---|---|
| web | `class="external-link ds-scc-web"`, `target="_blank"`, `rel="noopener"`, `data-scc` | `class="external-link"` only |
| vault | `class="internal-link"`, `href`/`data-href` = the vault path, `rel="noopener"`, no `target` | `class="internal-link"`, `href="#"`, `data-href="rule/adjacent"` |

`ds-scc-web` is plugin-styled (`styles-source.css:541`, `color: var(--dse-accent)`), so the
fixture's anchor takes its colour from `.dse-card a` instead — same computed value, so
nothing sampled differs today. Either add `ds-scc-web`/`target`/`rel` to the fixture, or
soften the claim to "the classes Obsidian's CSS keys off".

---

# Item verdicts (the brief's 15 probes)

1. **Property-set completeness** — enumerated app.css myself via the harness's own
   `iterRules`/`splitSelectorList`/`splitSubject` (139 matching selector fragments,
   `sc202-r4rev-appcss-census.txt`). The census in the block comment is accurate for
   `h1`-`h6`, `strong`, `em`, `mark`, `code`, `a`, `.internal-link`, `.external-link`,
   including the correction that the external-link icon is a `background-image` on the anchor
   (confirmed: `background-image: linear-gradient(…), url(public/images/6155…svg)`), not a
   `::after`. `del`/`s`/`u` genuinely have **0** rules. Deferrals check out
   (`pre code`, `mark[data-highlight]`, `.is-unresolved` — the vault branch of
   `rewriteSccAnchors` only fires when the note exists, so `.is-unresolved` really is
   unreachable; `h* a` is a `--link-weight` token the block's `font-weight: inherit`
   supersedes). **Gap: `b`/`i` (MED-2).** One more not worth a finding: Obsidian's `a.tag`
   (0,1,1) loses `font-weight`/`text-decoration-line`/`cursor` to the block's `:where(a)`
   (0,2,0) — 0 live content renders a `#tag` inside a plugin body, but it is the one place
   the block reaches material it did not enumerate.
2. **Specificity** — table verified by hand and by the test file's own calculator. The only
   numeric tie is the claimed one; companions land at (0,3,0); `.internal-link.is-unresolved`
   also sits at (0,3,0) but shares no property with the companion, so the deferral is safe.
   The proof that it wins *structurally* is the one thing missing (MED-3).
3. **Real DOM from the real renderer** — captured over CDP (LOW-3). The harness's blindness
   to real scc anchors (no `SccAnchorResolver` wired) is disclosed in the block comment and
   worked around by the fixture; that is the right call for this round.
4. **Which plugin headings are real `h*`** — §6's enumeration is accurate and complete
   (re-grepped `src/`); the gallery renders `hero` h2 ×1, `.dse-hero__region-title` h3 ×7,
   `.dse-enc__roster-heading` ×1, initiative bare h3 ×2 + bare h4 ×1,
   `.dse-mt__guide-title` ×4, plus prose h3/h6 from ancestry/class/perk. `.dse-card__title`
   is a `div` — correctly out of scope. `.dse-skills__group-title` is the one real call site
   the gallery does not render, and it pins its own font-size, so the block is inert for it.
5. **Can-fail** — reproduced exactly: 658 before, 0 after, 1090 comparisons + 775 samples.
   `wrapMountInMarkdownRendered` is the shared helper (single definition, `shoot.mjs:2125`,
   used by the r2/r3/r4 sweeps alike — not forked). `:hover` is forced via CDP
   `CSS.forcePseudoState` and `:focus-visible` via a real `.focus()` after establishing
   keyboard modality, both with a hard `rec.active` check, so neither can silently no-op.
6. **Rounds 1-3 untouched** — byte-identical gate lines (table above).
7. **Real-vault ground truth** — done for `hero` and `scc`; `perk` is indeed not
   camera-reachable (the aliases map has no `perk`; SC-149 folded typed displays into
   `ds-scc`). Link crops confirm the report and Scott's eyeball: the small arrow after
   "speed"/"Stamina" disappears (`background-image` → `none`, `padding-inline-end`
   14.4 px → 0), the teal-cyan colour and underline are unchanged, and "Panther"
   (internal-link) is unchanged in both.
8. **Freeze / shots** — green (table above), with the restored 252-line baseline.
9. **Scope and leak-OUT** — clean, measured: the same note's own `# hero` heading, outside
   any plugin root, renders at **25.888 px** = Obsidian's `--h1-size: 1.618em` after the fix
   (the block would have forced 2em = 32 px). Every one of the block's seven rules is
   anchored to `:is([data-dse-element], .dse-modal)`, and the scope-fence tests hold.
10. **Tests** — the r4 guard can-fails: I deleted `color: black;` from the `mark` rule and it
    went red (1 failed / 22 passed) on the intended assertion; restored, sha-verified. The
    fence's `nextBlockStart` correctly resolves to `-1` (slice = 24,974 chars to EOF), and a
    truncated slice would fail loudly on the positive assertions, not silently. The
    specificity guard is real (it recomputes, and its "would tie" test proves the companion
    is load-bearing). **The input guard's teeth are the problem — HIGH-1.**
11. **Links that are buttons in disguise** — two plugin-authored anchors:
    `src/framework/sidebar/SidebarPanel.ts:160` (`.dse-sidebar__panel-note`, whose
    `text-decoration: none` at (0,1,0) *would* lose to the block's (0,2,0)) — but it is a
    child of `.dse-sidebar__panel`, a **sibling** of the `[data-dse-element]` root, so the
    block does not reach it; and `src/elements/shared/RefUnwrapView.ts:361`
    (`.dse-ref-web-card__link`), which is inside a root but has no CSS of its own, so the
    underline restatement is inert. No regression either way.
12. **Step A** — `.dse-cond-icons__search` is folded into every state the r1 block gives
    `.dse-condal__input`: GROUP 1 (`:15250`), GROUP 2 material (`:15348`), `:focus-visible`
    (`:15378`), `:hover:not(:disabled)` (`:15413`), `:disabled` (`:15444`), `::placeholder`
    (`:15466`), the shared Controls font rules (`:7440`, `:7472`), the shared kit focus ring
    (`:13699`), plus the `type=search`-only `::-webkit-search-decoration`/`-cancel-button`
    rule (`:15531`). The `input host-leak` gate now reports **13 input kinds × 6 states =
    154 comparisons**, so it is swept in all six states. The `-webkit-appearance` claim is
    true (0 `appearance` declarations on any `input[type=…]` rule in app.css — I grepped).
    The `type='color'` exemption at `ConditionsModal.ts:390` is the guard's own pre-existing
    type-based exclusion and generates no test. Attribution is fixed. **Teeth are not —
    HIGH-1.**
13. **Heading-crop contradiction — see MED-4a. RESOLVED: the crops are right, the report is
    backwards.**
14. **`fontSizeContract` allowlist — see the verdict below and LOW-1.**
15. **Bare initiative headings** — governed and swept: the gallery renders
    `initiative|h3(bare)` ×2 and `initiative|h4(bare)` ×1, `tagInline` tags them (the gate
    line's `12h3`/`5h4` counts include them), their harness bytes did not move (0/524), and
    in a vault they move 21.09 → 18.72 px and 19.01 → 16 px respectively (MED-4b).

---

# The two explicit verdicts

**Item 13 — the heading-crop contradiction.** The **measurement in the report is backwards;
the crops are correctly labelled and need no re-shoot.** In a real vault the hero's
"CHARACTERISTICS" h3 goes **21.088 px → 18.72 px (−11.2 %)** with a slightly *taller* line
box (27.414 → 28.08 px) and slightly *less* padding above it (9.49 → 8.42 px); 18.72 px is
the value the browser harness renders on both bundles, so vault-after == harness, which is
the round's whole contract holding. A **classed** heading moved because
`.dse-hero__region-title` declares no font-size of its own (nor do `.dse-hero__name` or
`.dse-enc__roster-heading`) — so the CSS block's claim that every classed heading carries its
own (0,3,0) font-size override is **false and must be corrected** (MED-5), along with the
report's §5 prose, its "13 % bigger", its "tighter line box", and its "sits marginally
lower".

**Item 14 — the `fontSizeContract` allowlist.** **Legitimate — the allowlist is not
illegitimate, so per the owner's ruling the `--dse-fs-h*` token mint stays DROPPED.** The six
values are Chromium's own UA ratios, *derived* rather than chosen, they answer "what does an
unstyled heading look like with zero plugin opinion" rather than the nine roles' question,
they are `em`-relative (so they still track the reader's font size, unlike the absolute
`rem`/`px` family the contract's own docstring calls out), and a `--dse-fs-h3` token would be
worse than a fiction: it would be *retunable*, and retuning it would silently break the
re-grounding this round's own jest guard pins. What is wrong is the mechanism, not the
judgement — they were added to a list documented as "only ever shrinks" and used as the
adoption-debt counter, so `ALLOWLIST.length` no longer means what the file says it means.
Split them into a sibling `UA_RESTATEMENTS` const checked by the same assertions (LOW-1);
that costs ~15 lines and keeps both guarantees true.

---

# Artifacts

All under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc202-visual-harness-obsidian/`:

- Battery: `sc202-r4rev-{tsc,lint,jest,shots,shots2,parity}.log`
- Can-fail (pre-r4 CSS swapped in): `sc202-r4rev-canfail.log`
- Shot hashes: `sc202-r4rev-allshots.sha256`, `sc202-r4rev-allshots-run2.sha256`
- Guard mutations: `sc202-r4rev-guard-canfail.log` (r4 CSS guard goes red),
  `sc202-r4rev-guardA-base.log` / `sc202-r4rev-guardA-mutated.log` (input guard stays green)
- app.css census: `sc202-r4rev-appcss-census.txt`
- Harness computed-style probes + pre/post A/B: `sc202-r4rev-harness-probes.log`,
  `sc202-r4rev-harness-ab.log`
- Real-vault CDP measurements (before / after / after-repeat + leak-out):
  `sc202-r4rev-realvault-cdp.log`
- Measured vault delta table (70 changed nodes): `sc202-r4rev-vault-delta.txt`
- My own crops: `sc202-r4rev-vault-heading-{before,after}.png` (21.088 px vs 18.72 px),
  `sc202-r4rev-vault-link-{before,after}.png` (icon present vs gone)

---

# Scoped re-review of `5f7b8b2` (fix round)

**Verdict: APPROVE.** All 9 findings closed, each verified by execution, not reading. HIGH-1
now fails as promised (mutation: removing `cls: 'dse-cond-icons__search'` → **1 failed**,
naming `views/ConditionsModal.ts:288 — unclassed input, type=search must carry a class
covered by the SC-202 r1 block`; restore → 21 passed). MED-1's ring is restored to the exact
pre-round-4 values (`outline-style: auto`, width `1px`, colour `rgb(16,16,16)` — identical to
`27851f0`). MED-2: synthetic `b`/`i` bare-vs-host **MOVED: []** (was `b 700 → 600`), and the
gate line now prints `13b+5i`. MED-3: `157 links [1 .internal-link + 1 .external-link + 155
generic] × 7 properties = 1099 samples`, and forcing the classed count to 0 hard-fails with
the intended message. MED-4/5 corrected and matching my own measurements row for row.
LOW-1/2/3 closed with teeth. The collateral `inputHostRegrounding` fence fix is real and
load-bearing (reverting it makes r1's GROUP 3 count read 4 instead of 3). **Battery on
`5f7b8b2`:** tsc/lint clean; jest **3773 passed / 0 failed / 1 skipped, 197 suites**; shots
**524 PNGs, 0 FAIL**, deterministic across two of my sweeps; **`freeze OK (252/252 frozen
print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`**, exit 0;
parity **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)**, exit 0. Exactly two
shots moved vs my `a8a89f5` sweep — `perk-links--steel-{print,realprint}`, both to the same
hash `9d7782de…` (twin == realprint), matching the regenerated `sc202-r4-widening.txt`; the
`perk-links` dark/light screen twins and all other 522 PNGs are byte-identical, and r3's six
widening hashes are unchanged. One **new LOW** below (a residual on MED-1's *gate*, not its
fix); it does not block landing.

## Per-finding closure

| Finding | Verdict | Proof I executed |
|---|---|---|
| **HIGH-1** guard vacuous on an unclassed input | **CLOSED** | `expect(site.cls).not.toBeNull()` (`inputHostCoverage.test.ts:159-161`). Mutation → `Tests: 1 failed, 20 passed`, exit 1, message names `views/ConditionsModal.ts:288 — unclassed input, type=search`; restored → `21 passed`, exit 0. The `:17-18` docstring promise is true again. (`sc202-r4rerev-high1-{mutated,restored}.log`) |
| **MED-1** `outline: none` kills `:focus-visible` | **CLOSED (fix); one residual on the gate → new LOW-4** | New GROUP 5 companion `:where(a):focus-visible { outline: auto 1px -webkit-focus-ring-color }` at (0,3,0). Harness, no host sheet, focused anchors: `27851f0` = auto/1px/rgb(16,16,16) → `a8a89f5` = **none** → `5f7b8b2` = **auto/1px/rgb(16,16,16)**, i.e. the pre-round-4 value exactly, on both `.internal-link` and `.external-link`. Comment corrected to say `outline: none` adopts Obsidian's suppression, not a UA default. (`sc202-r4rerev-*`, probe log `probe2-fix`) |
| **MED-2** `b`/`i` not re-grounded, sweep blind | **CLOSED** | `:where(strong, b)` / `:where(em, i)`; `tagInline` tags both; `min: { b: 13, i: 5 }` on the gallery visit. Synthetic probe under app.css + wrapper: **MOVED: []** (was `b.fontWeight "700" -> "600"`). Gate line: `…+35strong+11em+13b+5i+155a rest [488]… = 1126 comparisons` (was 1090). |
| **MED-3** token probe sampled 0 classed links | **CLOSED** | Probe now iterates `INLINE_SWEEP_VISITS`; line reads `157 links [1 .internal-link + 1 .external-link + 155 generic] × 7 properties = 1099 samples`. Can-fail: forcing `isInternal: false` → exit 1, `LINK TOKEN-OVERRIDE PROBE VIOLATED: sampled 0 .internal-link nodes across gallery+perk/links — the probe is blind to the one genuine specificity tie it exists to prove`. (`sc202-r4rerev-canfail-med3.log`) |
| **MED-4** report §5 reversed + incomplete | **CLOSED** | §5 now reads "**11% smaller** (21.088px → 18.72px)", "slightly taller line box (27.414 → 28.08)", "sits marginally *higher*", and states the crops were correct. New §5b table matches `sc202-r4rev-vault-delta.txt` row for row (70 of ~239 nodes; h6 16 → 10.72, prose h3 margin-top 40 → 18.72, hero h2 23.39 → 24, `strong` ×36 600 → 700, `a` ×14, the icon). The prose-h6 case is flagged as a design question for the FINAL-ASK list, not a defect. |
| **MED-5** false "classed headings carry their own font-size" | **CLOSED** | Block comment rewritten (`styles-source.css:16230-16246`) naming the three that do not (`.dse-hero__name` `:5734`, `.dse-hero__region-title` `:5804`, `.dse-enc__roster-heading` `:3496`) and keeping only the true claim (0 of 524 harness bytes). |
| **LOW-1** allowlist mechanism | **CLOSED, with teeth** | Sibling `UA_RESTATEMENTS` const; both lists feed "declares NO new hardcoded font-size" and each has its own dead-entry + duplicate test, plus a disjointness test; counter is now `ALLOWLIST.length + UA_RESTATEMENTS.length`, so `ALLOWLIST.length` still means adoption debt. Can-fail: perturbing `1.17em` → `1.18em` fails **two** tests ("declares NO new hardcoded font-size" and "UA_RESTATEMENTS has no DEAD entries either"). (`sc202-r4rerev-low1-canfail.log`) |
| **LOW-2** `color` absent from `LINK_REST_PROPS` | **CLOSED** | `color` and `outlineWidth` added (both in the module const and in the page-serialized `readOneLinkTagged` copy — the two must stay in sync and do); gate line confirms `× 7 properties`, 0 diffs. |
| **LOW-3** fixture ≠ `rewriteSccAnchors` output | **CLOSED** | Rendered fixture DOM measured in the harness: web anchor `class="external-link ds-scc-web"`, `target="_blank"`, `rel="noopener"`, `data-scc="mcdm.heroes.v1/rule.general/supernatural"`; vault anchor `class="internal-link"`, no `target`, `rel="noopener"`, `data-scc`, `data-href` — exactly what `src/refs/rewriteSccAnchors.ts:24-38` sets. Only the `href` value stays a harness placeholder, now disclosed in both comments. |
| collateral: `inputHostRegrounding` scope fence | **CLOSED and load-bearing** | Reverting the bound to the old unbounded slice makes r1's GROUP 3 test read `Expected: 3 / Received: 4` (it absorbs the new r4 `:where(a):focus-visible` rule); with the fix, r1's count is unchanged at **3**, the same value it had at `27851f0` and `a8a89f5`. (`sc202-r4rerev-r1fence-unbounded.log`) |

## LOW-4 (new, non-blocking) — the sweep still cannot can-fail MED-1's companion

`visual-harness/shoot.mjs` `assertInlineHostLeak`. I deleted the new
`:where(a):focus-visible` rule from `styles-source.css` and ran a full `npm run shots`:
**exit 0**, `inline host-leak OK (… a:focus-visible [314] …)` — the same line, unchanged.
This is structural, not an oversight: the sweep asserts *bare == host*, and with the
companion gone both sides compute `outline-style: none` (the rest rule wins in both), so
there is nothing for it to see. The owner's ruling asked for the `:focus-visible` pass to
can-fail on this; sampling `outlineStyle`/`outlineWidth` was necessary but is not
sufficient, and the fix-round comment on `LINK_REST_PROPS` ("sampled alongside the new
companion rule below") reads as if the sweep now protects it.

What *does* protect it, verified: `headingEmphasisLinkHostRegrounding.test.ts`'s new
source-text assertion — with the rule deleted, that suite goes **1 failed / 23 passed**,
exit 1. That is the right guard for "the plugin's own rule exists" and it is real.

**Prescribed (cheap, optional):** reword the `LINK_REST_PROPS` comment to say the jest
guard, not the sweep, is what can-fails the companion. **Or (larger, a later round's call):**
give the focus pass an absolute reference instead of a relative one — compare a focused
plugin anchor against a synthetic bare `<a>` outside any plugin root with no host sheet
(the UA ground truth), which is the only shape that can catch "the plugin sets the same
wrong value on both sides". Do not let this block the landing.

## Battery detail (`sc202-r4rerev-*` logs)

| Gate | Result |
|---|---|
| `npm run tsc` | clean, exit 0 |
| `npm run lint` | clean, exit 0 |
| `npx jest` (after `rm -f main.js styles.css`) | **3773 passed / 0 failed / 1 skipped, 3774 total, 197 of 198 suites**, exit 0 (+4 vs `a8a89f5`: 3 new `fontSizeContract` tests + 1 new focus-ring CSS test) |
| `npm run shots` | **524 PNGs, 0 FAIL**; `inline host-leak OK (… 13b+5i … = 1126 comparisons)`; `link token-override probe OK (157 links [1 .internal-link + 1 .external-link + 155 generic] × 7 properties = 1099 samples)`; `print-twin parity OK (130)`; prior-family lines unchanged |
| `check-freeze.sh` | **`freeze OK (252/252 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`**, exit 0 (run twice) |
| Shot bytes vs `sc202-r4rev-allshots.sha256` | **2 files moved, both `perk-links--steel-{print,realprint}` → `9d7782de…` (twin == realprint)**; 522 identical, incl. `perk-links--steel-{dark,light}`. Cause is real and correct: LOW-3 added `ds-scc-web`, whose `color: var(--dse-accent)` rule (`styles-source.css:541`) is unscoped and therefore reaches print, where the screen-only `.dse-card a` colour rule does not |
| Widening | `sc202-r4-widening.txt` regenerated to `9d7782de…` ×2 and equal to my fresh sweep; `sc202-r3-widening.txt`'s 6 hashes unchanged; still additions-only (0 collisions with the 252-line baseline) |
| Determinism | my two full `5f7b8b2` sweeps: 524/524 byte-identical |
| `npm run parity` (LAST) | **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)**, exit 0 |

Tree left as found: submodule `git status --porcelain` empty at `5f7b8b2`, `main.js`/
`styles.css` rebuilt from the committed source, `demo-vault` untouched, superproject showing
only the pre-existing ` M draw-steel-elements` pointer.

New artifacts: `sc202-r4rerev-{tsc,lint,jest,shots,parity}.log`,
`sc202-r4rerev-allshots{,-run2}.sha256`, `sc202-r4rerev-high1-{mutated,restored}.log`,
`sc202-r4rerev-canfail-{med1,med3}.log`, `sc202-r4rerev-med1-jestguard.log`,
`sc202-r4rerev-r1fence-unbounded.log`, `sc202-r4rerev-low1-canfail.log`.
