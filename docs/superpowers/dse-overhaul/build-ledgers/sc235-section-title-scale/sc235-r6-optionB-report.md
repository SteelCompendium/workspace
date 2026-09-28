# SC-235 round 6 — implement Scott's choice (option B) report

## Executive summary

- **STATUS: DONE.** Scott's ruling ("Recommended approach is good", comment 00d1a795,
  2026-09-28) implemented: option B — section title `font-size: calc(var(--dse-fs-body) *
  0.9375)` (15px at default), `letter-spacing: 0.12em` (1.8px at 15px), line-height follows
  the existing 1.7 rule for free (25.5px). Spend chip stays pinned at today's 16px/0.07em.
- **dse sha:** `464838f` (branch `sc235-section-title-scale`, on `origin/develop` `5a20d5f`
  — unchanged this round; fetched, already up to date, no rebase needed).
- **superproject sha:** `a5d230f` (on `origin/main` `0cd7934` — rebased once at the start of
  this round, clean, no conflicts).
- **develop/main shas ended on:** `origin/develop` = `5a20d5f`; `origin/main` = `0cd7934`.
- **Gates:** tsc clean; lint clean; jest **4122 total (4121 passed / 1 skipped / 0 failed)**
  vs base (`5a20d5f`) **4119 total** — exactly +3 (unchanged from round 3, no tests
  added/removed this round, only content edits); `obsidian-lifecycle` **19/19 ok, 0 failed**;
  `shots` **532 PNGs, 0 FAIL**; freeze **260/260**, exit 0 (screen-only, confirmed); parity
  **0 GAPs / 0 undeclared / 14 DECLARED / exit 0**; can-fail proof (new declarations deleted)
  **4 GAPs, exit 1**, restored byte-clean, re-verified green.
- **DECLARED N = 14** (7 entries): `pr-chars:ink`, `section-tag:font-size`,
  `section-tag:line-height`, `statblock-wrap:margin-top`, `statblock-wrap:margin-bottom`,
  `featureblock-wrap:margin-top`, `featureblock-wrap:margin-bottom`.
  `section-tag:letter-spacing` does **not** fire (0.12em at 15px = 1.8px = the site's
  0.1em-at-18px = 1.8px, within tolerance) and was correctly **not** re-declared.
- **Narrow wraps:** re-verified 0 new wraps/mid-word breaks vs today at 300px and 240px
  across every capture id in the harness manifest (option B's 15px is smaller than today's
  16px, so if anything it wraps less).
- **x-scaling:** exact 0.9375 ratio confirmed at host 16/18/20px (15/16.875/18.75px) and the
  SC-230 modal 1.4x anchoring holds exactly (19.6875 / 14.0625 = 1.4).
- Evidence: one composite (`r6/sc235-final-B.png`), viewed and confirmed — the branch column
  now visibly matches the site's rendered letter size where Today's does not.

## 1. Context / rebase

- DSE (`draw-steel-elements`): `git fetch origin` showed `origin/develop` unchanged at
  `5a20d5f` (same as round 5's end state) — no rebase needed.
- Superproject: `git fetch origin` showed `origin/main` had moved to `0cd7934` (four handoff/
  docs commits, no CHANGELOG.md or pointer conflicts). `git rebase origin/main` was clean.
- **A process mistake caught and fixed before it caused any real loss:** partway through this
  round, `git checkout HEAD -- <files>` was used (intending to restore the working tree after
  a base-count jest measurement) while the round-6 edits were still **uncommitted** — since
  `HEAD` was still round 5's tip at that moment, this discarded the round-6 working-tree edits
  instead of restoring them. Caught immediately by re-running parity and seeing 10 DECLARED
  instead of the expected 14. All round-6 edits (CSS, comments, tests, parity map, README,
  both CHANGELOGs) were reconstructed and reapplied from the working session's own record,
  verified identical (`git diff --stat` matched byte-for-byte before/after), and **committed
  immediately** before any further base-count measurement was attempted — the same measurement
  was then redone safely against the committed state.

## 2. Implementation

`styles-source.css` (~8166, the `.dse-section__title` rule):

```css
[data-dse-theme='steel']:not([data-dse-print="on"]) .dse-section__title {
	display: flex;
	align-items: center;
	gap: 0.32em;
	font-variant: small-caps;
	text-transform: lowercase;
	font-size: calc(var(--dse-fs-body) * 0.9375);
	letter-spacing: 0.12em;
}
```

The rule's own comment was rewritten end to end for option B: why A over-rendered (real smcp
glyphs at a size chosen for the site's fake ones), why 15px matches the site's rendered ink
(both land at 8px), and the explicit trade (computed font-size no longer equals the site's
18px, by design). The spend-chip pin comment (~9362) was updated to say its font-size/
letter-spacing values are "whatever [the base rule's] current values are" rather than naming
A's literal 18px/0.1em. The SC-143 comparison comment (~8324, `.dse-card__band-head`'s
history) was updated from "1.125em/18px" to "0.9375em/15px". Both CHANGELOGs and the
`steelTypography.test.ts` SC-235 test block were rewritten in the same plain wording the
owner specified — no "matches the site's size" claim anywhere.

## 3. Parity

**Pre-check** (before declaring anything): `npm run parity` on the new CSS reported exactly
**4 GAPs** — `section-tag:font-size` and `:line-height`, both schemes — confirming
`:letter-spacing` does not fire (predicted correctly: 0.12em at 15px = 1.8px, matching the
site's own 1.8px within the 0.25px tolerance).

**Declared:**

```
"pair": "section-tag", "rule": "font-size"
"pair": "section-tag", "rule": "line-height"
```

Both cite SC-235 and Scott's 2026-09-28 ruling (comment 00d1a795), with the small-caps-
synthesis reasoning restated for the parity audience — a **different** reason than round 1's
now-healed pair (which cited computed equality; this citation is about a deliberate computed
*inequality* chosen for a rendered equality).

**Post-fix:** `0 GAPs / 0 undeclared / 14 declared deferral(s)`, exit 0.

**Full declared list (14 rows, both schemes):**

| Pair:rule | Rows |
|---|---|
| `pr-chars:ink` | 2 |
| `section-tag:font-size` | 2 |
| `section-tag:line-height` | 2 |
| `statblock-wrap:margin-top` | 2 |
| `statblock-wrap:margin-bottom` | 2 |
| `featureblock-wrap:margin-top` | 2 |
| `featureblock-wrap:margin-bottom` | 2 |

`compare.test.ts`'s guard now asserts these exact 7 entries; `visual-harness/parity/README.md`
moved with it (new "RE-DECLARED, deliberately, on purpose" paragraph explaining the reopen).

**Can-fail proof:** deleting the two new `section-tag` declarations (scripted, not by hand)
reproduces the pre-check's exact 4 GAPs, exit 1. Restored byte-identical
(`git diff --stat` empty afterward) and re-verified green (14 DECLARED, exit 0).

## 4. x-scaling and modal anchoring

| `#mount` font-size (simulated text-size setting) | `.dse-section__title` computed font-size | Ratio |
|---|---|---|
| 16px (default) | 15px | 0.9375 exactly |
| 18px | 16.875px | 0.9375 exactly |
| 20px | 18.75px | 0.9375 exactly |

Modal (`--dse-text-scale: 1.4`, same construction as every prior round's check): modal body
21px (15px base x 1.4), title inside the modal 19.6875px. Ratio vs. the unscaled title
(15px x 0.9375 = 14.0625px): 19.6875 / 14.0625 = **1.4 exactly** — SC-230's anchoring holds
under option B with no compounding, same as under option A.

## 5. Narrow wraps (re-verified on the final head)

Full sweep of every capture id in the harness manifest at 300px and 240px (same method as
rounds 3/4's `wrap300.mjs`), comparing today (`5a20d5f`) against this branch (`464838f`,
option B): **0 new wraps, 0 new mid-word breaks, anywhere.** Option B's 15px is smaller than
today's 16px, so it never introduces a wrap today's 16px doesn't already have — consistent
with rounds 3/4's finding that B (measured then as a probe) adds 0 wraps. Spend-chip sanity
check: the `feature-spend` capture's title-row wrap data is byte-identical between today and
head at both widths, confirming the round-3 pin is unaffected by the base rule's font-size/
letter-spacing move.

## 6. Evidence

`r6/sc235-final-B.png` — 3 rows (feature/ability, statblock, kit) x 3 columns (Today / This
branch / Site), Steel dark, 900px main-pane width, 1 image px = 1 CSS px, crop never
rescaled. Every cell's computed font-size/letter-spacing was verified at capture time
(printed in the caption) and the rendered ink height/word width was measured by the same
pixel-scan method the round-2 review's glyph probe uses:

| Family | Today | This branch (B) | Site |
|---|---|---|---|
| feature/ability | 16px/1.12px — 9px tall, 60px wide | 15px/1.8px — **8px tall**, 62px wide | 18px/1.8px — 8px tall, 55px wide |
| statblock | 16px/1.12px — 9px tall, 61px wide | 15px/1.8px — **8px tall**, 62px wide | 18px/1.8px — 8px tall, 55px wide |
| kit | 16px/1.12px — 9px tall, 60px wide | 15px/1.8px — **8px tall**, 62px wide | 18px/1.8px — 8px tall, 55px wide |

The branch's rendered letter height now equals the site's (8px) in every family, where
Today's (9px) did not. Word width is not an exact match (62px vs. the site's 55px) — the
same residual round 2's analysis already named: real smcp glyphs are proportionally wider
than the site's synthesized ones at the same rendered height. Viewed the composite myself
and confirmed it shows what the captions claim.

## 7. Gate numbers (measured on `5a20d5f` → `464838f`)

| Gate | Result |
|---|---|
| `npm run tsc` | clean |
| `npm run lint` | clean, exit 0 |
| `npx jest` (base `5a20d5f`, in-worktree checkout method) | 4119 total (4118 passed / 1 skipped / 0 failed) |
| `npx jest` (head `464838f`) | **4122 total (4121 passed / 1 skipped / 0 failed)** — base + 3, unchanged from round 3 (no tests added/removed this round) |
| `npm run obsidian-lifecycle` | `OBSIDIAN-LIFECYCLE done: 19/19 ok, 0 failed`, exit 0 |
| `npm run shots` | **532 PNGs, 0 FAIL** |
| `check-freeze.sh` | `freeze OK (260/260 …)`, exit 0 |
| `npm run parity` | **0 GAPs / 0 undeclared / 14 DECLARED / exit 0** |
| Can-fail proof (new `section-tag` declarations deleted) | **4 GAPs, exit 1** — restored byte-clean, re-verified green |

## Commits

DSE (`draw-steel-elements`), branch `sc235-section-title-scale`, now at `464838f`:
1. `464838f` — `fix(feature): SC-235 round-6 — option B, section title 15px / 0.12em`

Superproject worktree, branch `sc235-section-title-scale`, now at `a5d230f`:
1. `a5d230f` — `docs: SC-235 round-6 — option B CHANGELOG + DSE pointer bump`

## Evidence artifacts (all absolute paths)

- Report (this file): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc235-section-title-scale/sc235-r6-optionB-report.md`
- Composite: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc235-section-title-scale/r6/sc235-final-B.png`
- Composite spec: `r6/final-spec.json`
- Per-cell crops + word crops + computed-style/ink data: `r6/crops/*.png`, `r6/crops/final-capture.json`
- x-scaling / modal probe: `r6/scale-check.json`
- Narrow wrap sweeps: `r6/wrap-today.json`, `r6/wrap-head.json`, `r6/wrap-diff.log`
- Scripts: `r6/scripts/{final-capture,scale-check,wrap-diff}.mjs`/`.py` (new), `r6/scripts/{wrap300,compose}.mjs` (copied from r3-evidence/r1-evidence)
- Scratch git-archive builds: `r6/today/` (base `5a20d5f`), `r6/head/` (head `464838f`)
- Gate logs: `r6/{tsc,lint,jest-head,jest-base,jest-targeted-3,lifecycle,shots,freeze,parity-final,parity-final-2,parity-canfail}.log`
- Precheck logs (before declaring, kept for the record): `r6/parity-precheck.log`, `r6/parity-postfix.log`, `r6/parity-postfix2.log`
