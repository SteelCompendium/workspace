# SC-123 — fix round 1 re-review (scoped delta)

**Re-reviewer:** independent agent (no code written; worktree left exactly as found).
**Under review:** `sc123-settings-ports` @ `e141582`, dse base `9083dbe` (post-SC-146-landing
rebase). Delta reviewed: `558d839..e141582` (fix round `4f01118` + fb-diamond integration
`1da7884` + CHANGELOG accuracy `e141582`). Rebase integrity checked: `9083dbe..e141582`.
**Method:** full battery re-run from scratch in the worktree + live Playwright probes against
the freshly built harness bundle (computed styles under real Chromium, not jsdom regex) for
every Medium and every Low that has a runtime-observable effect, plus static verification
(diff/grep) of the parts that are documentation or scope claims. `obsidian-shots` NOT run;
display `:1` not touched.

**Verdict: LAND.** All four Mediums and the five in-scope Lows (L-1, L-3, L-4, L-5, L-6) are
fixed and independently reproduced with fresh evidence, not merely re-read. The L-8 integration
item (featureblock ◆ separator) is a faithful twin of the statblock recipe, live-confirmed. The
rebase carries all of SC-146's landed behaviour with no lost or duplicated hunk. The freeze
widening file's 36 hashes are byte-identical to a fresh capture, correctly shaped, and collide
with nothing in the current baseline. The battery reproduces every claimed number exactly. No
collateral changes, no new findings above Low.

---

## 1. Battery reproduction (my own run)

| Gate | Claimed (report) | Reproduced | |
|---|---|---|---|
| `npm run tsc` | 0 | **exit 0**, no output | ✅ |
| `npm run lint` | 0 | **exit 0**, no output | ✅ |
| `npx jest` | 2540 passed / 1 skipped / 159 suites / 3 snapshots | **identical**, exit 0 | ✅ |
| `npm run shots` | 314 ok / 0 FAIL | **314 ok / 0 FAIL**, exit 0 | ✅ |
| `check-freeze.sh` (shared 149-line baseline) | freeze OK (149/149) | **149/149 byte-identical, exit 0** | ✅ |
| `npm run parity` | 0/0/16 | **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)**, exit 0 | ✅ |

Every number in the implementation report's final battery table reproduces exactly, at the
worktree's actual `HEAD` (`e141582`), not an earlier commit.

---

## 2. Per-finding verdicts

### M-1 — per-block `prefs:` override of conditional-DOM keys · **FIXED**

- Confirmed exactly 3 descriptors carry `perBlock: false` (`sbCharLine`, `sbCharBox`,
  `sbVillain`) — `src/prefs/catalog.ts:338,350,363`; no others.
- Ran the new jest cases (`test/dom/framework/pref-overrides.test.ts:184-291`) as part of the
  full suite: the `test.each` over both directions × all three keys, the explicit
  `"+2Might"`-would-have-been shape test, the `sbVillain` mirror, and the scope guard all pass
  — 9 cases, real `ElementPipeline.run` execution (not mocked), asserting DOM shape, the
  `console.warn` message, and that the attribute agrees with the GLOBAL value.
- Confirmed other attr-bearing prefs remain overridable: `sbDensity` (pre-existing test,
  `pref-overrides.test.ts:98`, still passing) and the scope-guard test itself asserts every
  other attr-bearing descriptor is unaffected — the flag does not over-block.
- The prior false claim ("degrades to the default look") is corrected everywhere it lived:
  `statblock/view.ts` doc comments, `.repo-docs/architecture.md`, `CLAUDE.md`,
  `prefOverrides.ts`, `seams/prefs.ts`.

### M-2 — `kwUsage`/`distTarget` silently dropped in print · **FIXED**

Live probe (real Chromium, harness page, `theme=steel&print=1`):

| pref | print `display` | screen `display` (same value) |
|---|---|---|
| `kwUsage: text` | `flex` | `flex` |
| `kwUsage: grid` | `grid` (auto-flow column) | `grid` |
| `kwUsage: ledger` | `grid` | — |
| `distTarget: text` | `flex` | — |
| `distTarget: ledger` | `grid` | — |

Print now reaches every mode arm; screen and print agree. Only the material refinements (wash,
metal-line colour) stay screen-scoped, matching the site's own rule
(`steel-statblock.css:654`).

The SC-121 B-1 contract test (`test/dom/elements/feature.test.ts`) was narrowed, not weakened:
it still requires every layout rule to be Steel-scoped, and now accepts a print-reaching arm
**only** if it also names a non-default `kwusage`/`disttarget` value — the base
`display: contents` invariant is untouched, and no frozen camera (which shoots defaults only)
can reach any of the newly-unscoped arms. Verified by reading the diff and confirming the test
passed in the full jest run.

### M-3 — Legacy borders painted nothing; `sbCharBox: on` dropped the word · **FIXED**

Live probe (real Chromium), computed border on `.dse-sb__char-box` at `sbCharBox: on`:

| scheme | border | label (`.dse-sb__char-l`) |
|---|---|---|
| legacy-dark | `1px solid rgb(54, 54, 54)` | `display: none` (box now paints, so the drop is safe) |
| legacy-light | `1px solid rgb(221, 221, 221)` | — |
| steel-dark | `1px solid rgba(176, 183, 187, 0.5)` (**unchanged** from before the fix) | — |
| steel-print | `1px solid rgb(187, 187, 187)` | — |

`.dse-sb__band` (legacy-dark, villain banded) and `.dse-fb__stat` border-bottom (legacy-dark,
`fbStats: ledger`) both now compute `1px solid` where they previously computed `0px none`.
Every measured number matches the implementation report's claimed values exactly. Steel screen
is provably unchanged (identical `rgba(176,183,187,.5)` before and after), so the fix costs the
Steel look nothing.

### M-4 — "the site ships `disttarget=text`" was false · **FIXED, all 4 + upstream**

- `src/prefs/catalog.ts:56-64` — rewritten to "TWO DEFAULTS DIVERGE," names `charline` and
  `villain` only, `disttarget=grid` explicitly called out as NOT a divergence, with the error's
  provenance (SC-146 audit row S8) cited.
- `test/unit/prefs/catalog.test.ts:29-38` — same correction, same citation.
- `styles-source.css:5442-5446` (comment block above the mode arms) — same correction, plus
  the M-2 print-reach rationale folded in.
- Implementation report's own §3(a) — not rewritten (correctly; that section is a historical
  record of what was believed at the time) but explicitly superseded by the new §1 M-4 section,
  which states in so many words: "the branch's own claim of three divergences is wrong; it is
  two."
- **Upstream, verified directly**: `.superpowers/sdd/sc146/sc146-audit-report.md` — the
  original §2/§4 text is untouched (confirmed byte-for-byte: no diff in those sections), and a
  new **dated §8, "Correction — 2026-08-10 (appended by the SC-123 fix round; §2/§4 above left
  as written)"** is appended at the end of the file. It cites the exact source
  (`settings-panel.js:31-33`), names all four downstream places the error propagated to, and
  states the other S-rows were spot-checked and are correct. This is a correction appended in
  place, not a silent rewrite of history — exactly the prescribed form.

### L-1 — stale freeze doc line · **CORRECTED, twice over**

Report's §1 records the freeze number at three points in the branch's life (pre-fix-round
137/137, fix-round-pre-rebase 137/149, post-rebase 149/149 byte-identical) — matches what I
independently reproduced at `HEAD`.

### L-2 — preset migration · **DELIBERATELY NOT DONE**, correctly flagged as open

No migration code exists in the delta (confirmed — `catalog.ts`'s `deriveSbPreset` is
unchanged in logic). This matches the report's explicit statement that Scott chose to leave it
open; not a regression, correctly surfaced in "Open questions for Scott" §5.1.

### L-3 — unscoped colon reset reached the meta rail · **FIXED**

CSS diff confirms both selectors (`kwusage='grid'`/`'ledger'` `::after`) now carry
`.dse-feature__meta-chips`. New `pref-reflection.test.ts` case asserts exactly 2 matching lines
and that both contain the qualifier; part of the passing jest run.

### L-4 — missing 1.25rem type bumps · **FIXED**, live-confirmed

Live probe: `.dse-sb__char-v` at `sbCharBox: on` → `font-size: 20px`. `.dse-sb__band
.dse-collapse__title` at `sbVillain: banded` → `font-size: 20px`. Both equal `1.25rem` at the
16px root, matching the site's `steel-statblock.css:231`/`:418` values exactly.

### L-5 — blank half-track with one meta cell · **FIXED**, live-confirmed, both cases

Live probe: `feature/villain` (1 chip cell) → `grid-template-columns: 710px` (single full-width
track, no blank half). `statblock/default` (2 chip cells) → `334.906px 334.906px` — the exact
number the review's own probe measured, confirming the two-cell case is untouched. The
implementer's deviation from the review's literal `repeat(auto-fit, minmax(0,1fr))`
prescription (using `grid-auto-flow: column` + `grid-auto-columns: minmax(0,1fr)` instead) is
sound and, per the report's own reasoning, actually correct where the literal prescription
would have collapsed the two-cell case too (auto-fit over a zero minimum floors at one
repetition).

### L-6 — grid/ledger reset small-caps · **FIXED**, live-confirmed

Live probe: `.dse-feature__meta-cell--keywords` at `kwUsage: grid` →
`font-variant-caps: small-caps`, `text-transform: lowercase` — the resets are gone, the chip's
voice survives, matching the site's grid/ledger behaviour.

### L-7 — composites overstated their pairing / cropped panels · **FIXED**, visually confirmed

Viewed `sc123-07-charbox-on.png` and `sc123-07b-charbox-onword.png`: both now pair the site and
plugin at the **same** configuration (`charline=one, charbox=on` / `onword`), both panels
labelled to match, and both show the full card down through the characteristics strip — no
mid-card crop. New `site-stats-08/09-charline-one-charbox-*.png` singles exist as the
re-captured site reference at the plugin's default `charline`.

### L-8 — featureblock `flat` mode had no ◆ separator · **FIXED**, live and visually confirmed

- Static: `styles-source.css:4021-4059` — the fb recipe is declaration-for-declaration the
  statblock twin (same 8px rotated core, same M1 spacing pair on the sibling selector, same M2
  plate-solid halo colours `#1e2327`/`#f4f6f6`), minus the statblock's `:not(.dse-fb *)` guard
  (correctly omitted — reasoning checks out: a nested fb always owns its own element root).
  Pinned by a new `pref-reflection.test.ts` case that checks both recipes declaration for
  declaration; part of the passing jest run.
- Visual: `sc123-15-fix-L8-fb-diamond.png` (before/after, real capture from `558d839` vs.
  current) shows the diamond appearing between "Leapfrog" and "Resonating Croak" in the AFTER
  panel exactly as described.

### L-9 — CHANGELOG "nine navigable pages" · **FIXED** (commit `e141582`)

`CHANGELOG.md` now reads "a short index of ten navigable pages," names Featureblock display in
the list, and attributes the tenth page to SC-123 while leaving the "nine stacked sections"
sentence alone (correctly — that describes the pre-SC-131 scroll page, a different fact). Diff
also folds in three small accuracy notes (fb ◆ twin, print/export reach, per-block rejection)
consistent with the fix round's actual changes. Text-only commit, no code, no gates re-run —
consistent with its own commit message.

---

## 3. Rebase integrity — **CLEAN**

- `git diff 9083dbe..e141582 -- styles-source.css` shows **zero removed lines** touching any
  SC-146-owned selector fragment (`gridc`, `sb-stats`, `sb-columns`, diamond/separator
  patterns) — SC-146's work was not edited or deleted by this branch.
- No duplicate descriptor keys in `catalog.ts` (`key: '<name>'` occurrences all unique).
- Live spot-probes of SC-146's landed behaviour, all passing:
  - `gridc` under Steel: `.dse-sb__kv` computes `flex-direction: column-reverse` (value over
    label), `.dse-sb__kv-v` bolded (`font-weight: 700`) and coloured — SC-146 fix 3 intact.
  - `ledger` two-column: `.dse-sb__grid` computes `342.203px 342.203px` (two equal tracks),
    `.dse-sb__kv` carries a `1px solid` border-bottom — SC-146's Steel ledger arm intact.
  - Preset `sourcebook.sbFeatureStyle`: live DOM root reflects `data-dse-sb-featstyle="flat"`.
  - Preset `index` fixture (`columns-wide`): live DOM root reflects
    `data-dse-sb-columns="wide"`.
  - `SB_PRESETS` in `catalog.ts` carries SC-146's corrected members (`sourcebook:
    sbFeatureStyle: 'flat'`, `index: sbStats: 'gridc', sbColumns: 'single'`) **and** SC-123's
    five appended members in the same three bundles, matching the merge-resolution table in the
    report.
- Jest count (2540) and shots count (314) both match the report's post-rebase numbers exactly,
  which is itself evidence the rebase replay didn't silently drop or double a test/fixture.

**No SC-146 hunk lost or duplicated.**

---

## 4. Freeze widening file — **VERIFIED, exact match**

`sha256sum` of the 36 named PNGs, freshly regenerated by this session's own `npm run shots`
run, diffed against `.superpowers/sdd/sc123/sc123-freeze-widening-36.txt`:

- **All 36 hashes are byte-identical** (`diff` of the sorted lists is empty).
- **Names are exactly the 12 new PREF_SHOTS variants × {legacy-dark, legacy-light,
  steel-print}**: `featureblock-featstyle-flat`, `featureblock-stats`,
  `featureblock-stats-ledger`, `statblock-charbox-on`, `statblock-charbox-onword`,
  `statblock-charline-two`, `statblock-disttarget-ledger`, `statblock-disttarget-text`,
  `statblock-kwusage-grid`, `statblock-kwusage-ledger`, `statblock-kwusage-text`,
  `statblock-villain-banded` — 12 × 3 = 36, verified by `uniq -c` on both axes.
- **No collision with the current 149-line baseline** — `comm -12` against the baseline's
  filename column returns empty.

(Several legacy-dark/legacy-light hashes repeat across different `kwUsage`/`distTarget`
variants — e.g. `disttarget-ledger`, `disttarget-text`, `kwusage-grid/ledger/text` all share
one legacy-dark hash. This is expected, not a copy-paste artifact: per M-2's own fix, these
prefs only reach Steel-scoped layout; under Legacy the base 2-column grid renders identically
regardless of the pref value, so identical bytes across variants is the correct outcome.)

---

## 5. No collateral — **CLEAN**

The 12-file delta (`558d839..e141582`) maps one-to-one onto a finding or the two integration
items:

| File | Finding(s) |
|---|---|
| `.repo-docs/architecture.md`, `CLAUDE.md`, `src/elements/statblock/view.ts` (comments) | M-1 |
| `src/framework/prefOverrides.ts`, `src/framework/seams/prefs.ts` | M-1 |
| `src/prefs/catalog.ts` | M-1 (flags), M-4 (comment) |
| `styles-source.css` | M-2, M-3, M-4 (comment), L-3, L-4, L-5, L-6, L-8 |
| `test/dom/elements/feature.test.ts` | M-2 (SC-121 B-1 narrowing) |
| `test/dom/framework/pref-overrides.test.ts` | M-1 |
| `test/dom/framework/pref-reflection.test.ts` | M-2, M-3, L-3, L-8 |
| `test/unit/prefs/catalog.test.ts` | M-4 |
| `CHANGELOG.md` | L-9 |

Worktree `git status --short` is empty in `draw-steel-elements`; the superproject shows only
the deliberately-unstaged submodule pointer bump. No stray files, no scratch left behind (this
session's own three temporary probe scripts were copied into `visual-harness/` for devbox's
module resolution and deleted immediately after use — confirmed clean before and after).

---

## 6. New findings

**None above Low, and no new Lows.** Everything probed matches its claimed fix exactly, with
fresh evidence (live computed styles under real Chromium, a real jest run, byte-for-byte hash
comparison, and direct visual inspection of the regenerated composites) rather than re-reading
the implementer's own numbers.

One observation, not a finding: the freeze widening (36 lines, `sc123-freeze-widening-36.txt`)
is verified-correct but **not yet applied** to the shared `freeze-baseline.sha256` — this is
by design (the report explicitly lists it as "NOT applied — listed for the orchestrator") and
is a landing-time action, not a defect in this branch.

---

## 7. Recommendation

**LAND.** All four Mediums and every in-scope Low are fixed and independently reproduced. The
rebase onto SC-146 is clean and lossless. The freeze widening file is ready for the lander to
apply verbatim. No new issues found.
