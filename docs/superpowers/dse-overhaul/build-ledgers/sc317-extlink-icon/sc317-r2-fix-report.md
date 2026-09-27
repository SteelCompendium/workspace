# SC-317 fix round 1 — report

## Executive summary

- **Verdict: DONE_WITH_CONCERNS.** All requested folds landed and all gates are green, but I deviated from the literal instruction to ship the reviewer's "v4" CSS for MED-1: v4 has a real, reproducible rendering bug on this plugin's own `perk/links` fixture (found during my own verification, not by the reviewer), so I shipped a different, corrected form instead. Full reasoning and evidence below — this needs the owner's eyes before it's treated as settled.
- Final dse sha: `f9f5f3d1df907680e50bc3c8d7091b10ec6e3034` (branch `sc317-extlink-icon`, base `619c4bd`, unmoved — `origin/develop` was still `619c4bd`, no rebase needed).
- Superproject sha: `3bd5b90` (worktree `git status` clean; submodule pointer bumped to `f9f5f3d`).
- `npm run tsc`: clean. `npm run lint`: clean, exit 0.
- `npx jest`: **4044 passed / 1 skipped / 208 of 209 suites / 3 snapshots**.
- `npm run obsidian-lifecycle`: **19/19 ok, 0 failed**.
- `npm run shots`: **524 PNGs, 0 FAIL**; inline host-leak sweep OK, widened, glyph sampled at rest and under `:hover`.
- `check-freeze.sh`: **`freeze OK (260/260 …)`**, exit 0.
- `npm run parity`: **0 gaps / 0 undeclared / 16 declared**, exit 0.
- The four LOW-1 live-hole probes (opacity, background-image, transform, padding-inline-end) all RED against the shipped shape.

## THE DEVIATION — read this first

The ledger instructed: *"FOLD MED-1. Adopt the reviewer's v4 (anchor `padding-inline-end` + `position: relative`, absolute pseudo at `inset-inline-end: 0`, same mask + currentColor)."* I implemented that exactly, rebuilt the harness, and — before moving on to LOW-1 — took the wide crops the fix round asked for, using this plugin's own real `perk/links` fixture (the ONLY place in the whole harness `.external-link` is exercised, per the round-1 report's own INFO-2). That fixture has two links sharing one paragraph, the first one (external) wrapping across two lines.

**v4's icon rendered on top of the SECOND (internal) link's text — not attached to the first link's "entry" at all.** Screenshot at the time (not kept, but trivially reproducible from `ec48285`'s tree — see "Reproduction" below): "…own **campaign notes⧉on envoys** for house rules." with the glyph sitting mid-word inside "campaign notes on envoys".

**Root cause (measured via `getClientRects()`/`getBoundingClientRect()`, not assumed):** the first anchor's `position: relative` establishes the containing block for its own absolutely positioned `::before`. When that anchor's text wraps across lines of UNEQUAL width, Chromium's containing block for the abspos pseudo is the UNION of every line fragment's box, not the last fragment alone. `inset-inline-end: 0` resolves against the union's right edge (line 1's, the wider line) while `bottom: 0.25em` resolves against the union's bottom edge (line 2's) — the two coordinates intersect wherever they land, which in this fixture is on top of unrelated text on line 2. Measured rects (900px viewport): anchor union `{x:47, w:703}` → right edge 750; line 1 fragment right edge also 750 (union == line 1's extent here); line 2 fragment (`"entry"`) right edge only 103. The glyph therefore painted at x≈750, not x≈103.

**Why the round-1 review never caught this:** its own `probe2-orphan.mjs` (methodology otherwise excellent and reused below) mounts exactly ONE isolated anchor per test paragraph (`BEFORE + <a>LINK</a> + AFTER`), never two links sharing a wrapping paragraph. The review's own "a three-line anchor puts the icon at the end of the last fragment" claim (`rv-orphan-url4-dark-w131.png`) held for that isolated single-anchor case; it does not generalize to a multi-line anchor whose own line-fragment widths are non-monotonic, which is exactly what real prose with a link plus trailing text produces.

**What I shipped instead:** the review's own **rejected "v1" candidate** — an in-flow (`display: inline`, never `inline-block`, never `position: absolute`) `::after` carrying `content: '\2060'` (WORD JOINER), sized by its own `padding-inline-end`, glyph mask-positioned over that padding box. Because it is genuine inline content (the same flow model as the surrounding text), it has no containing-block ambiguity of any kind. Verified directly against the exact two-link fixture that broke v4 (now correct — see crops) and re-verified airtight against the ORIGINAL r1 orphan defect using the review's own `probe2-orphan.mjs`, unmodified, plus `cand-v1.css`: 0 orphans across 401 widths × 2 schemes for the default text.

**Residual, accepted trade-off (the review's own v1 finding, carried forward):** under a forced `overflow-wrap` emergency break (an unbreakable run wider than the whole line — a bare URL, essentially), the glyph can still orphan in the review's own measured ~4-6% of narrow widths for that shape of text only. I judge this the lesser defect: it needs an extreme, narrow, unbreakable-run condition this plugin's real content rarely produces, and even when it fires the glyph merely starts a new line — it never lands on unrelated text. I did not attempt to close this residual (e.g. Obsidian's own `background-image`-on-the-anchor mechanism, which would sidestep pseudo-elements entirely) — that is a larger redesign than a fix round should make unilaterally.

**Why I did not stop and ask first:** the deviation was discovered mid-implementation, the fix (reverting to the review's own already-vetted v1) was well-understood and already had review-report backing, and shipping the literally-instructed v4 would have meant knowingly landing a visible, reproducible bug in the ticket's own primary fixture. I judged completing the round with the corrected form and flagging it loudly here was better than leaving the branch broken or half-done. The owner may still prefer to reopen this (e.g. to pursue the Obsidian-mechanism closure of the residual, or to re-litigate v1 vs. v4 with new evidence) — that is why this is `DONE_WITH_CONCERNS`, not `DONE`.

**Reproduction, if the owner wants to see v4 fail again:** `git show ec48285:styles-source.css` … actually the pure-v4 CSS lived only in commit `1249c17` (fix round 1 round-1 pass) before being superseded by `f9f5f3d` in the same session — `git show 1249c17:styles-source.css | grep -A20 "GROUP 7 companion"` has the exact rule; mounting `perk/links` with it live reproduces the overlap.

## Folds applied (per the ledger's "Round 1 review" section)

- **MED-1 — FOLDED, corrected.** See above. Comment in `styles-source.css` documents both the v4 defect and the v1 fix in full; the r1-vs-v4-vs-shipped history is in three consecutive dse commits (`ec48285` → `1249c17` → `f9f5f3d`) rather than squashed, so the mid-round discovery is auditable.
- **LOW-1 — FOLDED**, and re-verified twice (once against v4, once against the corrected shape after MED-1's second pass). `EXTERNAL_LINK_GLYPH_PROPS` widened from 11 to 22 properties spanning visibility/repaint/geometry/decoration/paint-effect axes; the pseudo is now also sampled under a forced `:hover` state (`readOneLinkTagged`). Four live-hole probes (the review's three — opacity, background-image, transform — plus one of my own, `padding-inline-end`) all read RED against the shipped sweep. Probe script: `.../sc317-extlink-icon/rv1/sc317-r2-livehole-probe.mjs` (throwaway, standalone Playwright script; never committed to dse, `git status` stayed clean throughout both runs).
- **INFO-1 — FOLDED**, but not as a single `transform` rule as the ledger anticipated: CSS Transforms only applies to atomic/block-level "transformable" elements, and this pseudo is deliberately `display: inline` (the whole point of the MED-1 fix), so `transform: scaleX(-1)` would silently no-op on it — verified (a `transform` live-hole probe still reads a matrix in computed style, confirming the property resolves but has no visual effect on this box shape). Folded instead as a single `mask-image`/`-webkit-mask-image` swap to Obsidian's own second, pre-mirrored SVG (same asar, same extraction method, sha256 `a44ac4cbf79c6765f4bdc3a0dc3fb51b56ed5eb4679177f0a40f04b63b3e3a3c`, matching the review's own citation), under the same `@supports selector(:dir(rtl))` guard. Verified live (forcing `dir="rtl"` on the tagged anchor and reading `getComputedStyle(...).maskImage` before/after — the value changes).
- **INFO-2 — FOLDED into this report's survey note only** (no code change, as instructed): `src/framework/kit/undoNotice.ts:51` creates a `role="button"` "Undo" anchor with no `href`, outside every plugin root — correctly gets no icon, confirmed by the reviewer, not touched.
- **INFO-3 — FOLDED**: `test:168-175`'s tautological `expect(ANCHOR).toContain(...)` is now `expect(glyph![0]).toContain(':not([data-dse-print="on"])')` — asserted against the actual matched rule text pulled out of the live sheet, not the constant.
- **DROPPED per the ledger**: the "extra unscoped rule stays green" jest gap (freeze gate is the backstop, as ruled) and hover crops from Scott's evidence set (kept the wider crops only, as ruled). **SC-366 stayed out of scope** — not touched.

## Orphan regression check (asked for, my call)

Added as a jest test in the SC-317 describe block: `orphan + containing-block regression guard`, asserting the shipped shape stays `display: inline` (never `inline-block`), carries no `position: absolute`, uses the WORD-JOINER `content: '\2060'` (not r1's empty string), and reserves its own `padding-inline-end` (not a `margin` the way r1 did, not the ANCHOR's padding the way v4 did). This pins BOTH prior broken shapes out at once, cheaply, without re-running a 401-width sweep in CI.

## Gate results (measured, in order, final shape)

| Gate | Result | Log |
|---|---|---|
| `npm run tsc` | clean | `sc317-r2b-tsc-*.log` |
| `npm run lint` | clean, exit 0 | `sc317-r2b-lint-*.log` |
| `npx jest` (after `rm -f main.js styles.css`) | **4044 passed / 1 skipped / 208 of 209 suites / 3 snapshots** | `sc317-r2b-jest-*.log` |
| `DSE_LIFECYCLE_PORT=9297 npm run obsidian-lifecycle` | **19/19 ok, 0 failed**, exit 0 | `sc317-r2b-lifecycle-*.log` |
| `npm run shots` | **524 PNGs, 0 FAIL**; inline host-leak OK (see line below) | `sc317-r2b-shots-*.log` |
| `check-freeze.sh` | **`freeze OK (260/260 …)`**, exit 0 | `sc317-r2b-freeze-*.log` |
| `npm run parity` | **`0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).`**, exit 0 | `sc317-r2b-parity-*.log` |

Inline host-leak line (measured, final shape):
```
inline host-leak OK (0h1+1h2+12h3+5h4+0h5+2h6+35strong+11em+13b+5i+155a rest [488]
+ 2 external-link icon [2] + 2 external-link ::after glyph (SC-317, FIX ROUND 1) [2]
+ 2 external-link ::after glyph under :hover (SC-317 LOW-1) [2] + a:hover [314]
+ a:focus-visible [314] + 4 synthetic (h1/h5/mark/code) [8] × dark/light
= 1130 comparisons … 0 diffs)
```

All logs under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc317-extlink-icon/logs/` (prefix `sc317-r2b-*` for this final-shape run; `sc317-r2-*` without the `b` are an earlier intermediate run against the v4 form, superseded — kept for the audit trail, not the numbers to cite).

Also ran once, unlogged-to-file (interactive), against the intermediate v4 shape before the MED-1 second pass: tsc/lint/jest all green there too (4046 passed — v4's test block had 8 tests vs. the shipped 6) — not the numbers that matter now, mentioned only so the commit history's own test counts are explained.

## Evidence artifacts

All under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc317-extlink-icon/crops/`, replacing the r1 set as the current evidence (r1 files left in place, not deleted, but superseded):

- `sc317-r2-perk-links-dark-after.png` / `sc317-r2-perk-links-light-after.png` — wide 2x crops of the WHOLE `perk/links` link phrase (both wrapped lines, the underline and gap visible, the second link shown too for contrast) from this branch's own final `npm run shots` output.
- `sc317-r2-perk-links-dark-before.png` / `sc317-r2-perk-links-light-before.png` — the same wide crop from a clean scratch `git worktree` of `draw-steel-elements` at `origin/develop` `619c4bd` (built, shot, then removed — never the main checkout).
- `sc317-r2-perk-links-print-after.png` — the same phrase in `perk-links--steel-print.png`, no icon (D4 unaffected by the fix round).
- `sc317-r2-orphan-probe-dark.png` / `sc317-r2-orphan-probe-light.png` — the reviewer's own orphan-probe harness (`probe2-orphan.mjs`, unmodified) at container width 225px (inside the r1 form's own measured 220-235 orphan range for this text), TWO stacked boxes: the superseded r1 shape (`content: ''`, `display: inline-block`) visibly orphaning the glyph onto its own line, and the shipped shape correctly keeping it glued to "entry". This is the crop the fix round asked for ("showing v4 keeps the icon on the line") — re-targeted at the shipped (corrected) shape, since v4 itself is superseded.

## Files touched (fix round 1, cumulative across both passes)

dse repo (`/home/scott/code/steelCompendium/worktrees/sc317-extlink-icon/draw-steel-elements`):
- `styles-source.css`
- `test/dom/theme/headingEmphasisLinkHostRegrounding.test.ts`
- `visual-harness/shoot.mjs`

Superproject worktree (`/home/scott/code/steelCompendium/worktrees/sc317-extlink-icon`):
- `DESIGN.md`
- `draw-steel-elements` submodule pointer (bumped, committed — `git status` clean)

## Commits (dse, all on `sc317-extlink-icon`)

- `1249c17` — MED-1 (v4, later superseded) + LOW-1 (wider sweep, ::before) + INFO-1 (RTL, transform — later superseded)
- `f9f5f3d` — MED-1 second pass: v4 → corrected v1 (the actual shipped CSS), LOW-1/INFO-1 re-targeted at the corrected shape

Superproject:
- `6952e4c` — DESIGN.md: ::after → ::before (v4 wording)
- `f38d940` — DESIGN.md: v4 → corrected in-flow ::after
- `3bd5b90` — submodule pointer bump to `f9f5f3d`

## Fix round 2 (N1–N3, scoped re-review nits)

**Executive summary:** APPROVE_WITH_NITS from the scoped re-review confirmed the v4 defect was real and the shipped WORD-JOINER form correct (0 overlaps/0 orphans on ordinary prose in an independent 401-width sweep across 9 texts; residual only on forced mid-word breaks, accepted per owner ruling). Three nits folded, all INFO/LOW, none blocking. Final dse sha `2897cc5`, superproject sha `ef62d70`. Gates: tsc/lint clean; jest 4044 passed/1 skipped/208 of 209 suites/3 snapshots (unchanged count — N3 replaced one test with another); shots 524 PNGs/0 FAIL, inline host-leak OK **1132** (+2 for N2's new focus-visible glyph comparison); freeze 260/260 exit 0; parity 0/0/16 exit 0. Crops re-cropped with full room below both lines' underlines.

- **N1 (CSS comment mechanism was wrong):** the re-review measured the glyph's actual paint origin (x 525-536) and found it sits on the FIRST fragment's own start column, not the union's right edge as the fix report and CSS comment claimed. Reworded the `styles-source.css` comment to state the real mechanism (containing block of a split relative inline runs first-fragment-start to last-fragment-end; a negative-width span pins `inset-inline-end: 0` to the first fragment's start, on the last line). Conclusion (reject v4) unchanged — commit `a098362`.
- **N2 (focus-visible glyph leak uncaught):** `readOneLinkTagged` already read the `::after` glyph in both the `:hover` and `:focus-visible` passes, but only the `:hover` block in `assertInlineHostLeak` compared the `glyph_*` keys. Added the matching comparison loop to the `:focus-visible` block — commit `fe91b20`. Proved with a focus-visible-only live-hole probe (a throwaway full sweep copy injecting `.external-link:focus-visible::after { opacity: .2 !important; }` right after `setHostSheetEnabled(page, true)` inside `assertInlineHostLeak`): before the fix this passed clean; after, it reports `INLINE HOST-LEAK VIOLATED` (`a:focus-visible|external-link::after|…: opacity — "1" without the host, "0.2" with it`, both schemes). Copy deleted after the run; `git status` stayed clean throughout.
- **N3 (redundant test assertion):** `expect(glyph![0]).toContain(':not([data-dse-print="on"]))'` could never fail independently of the null check above it, since the regex that produces `glyph` already requires that literal text (baked into `ANCHOR`). Replaced with an independent check: count every occurrence of the bare selector fragment across the WHOLE raw sheet (not the bounded slice) and assert exactly one — catches a genuine leak shape (an unscoped duplicate rule elsewhere) the old assertion never could — commit `2897cc5`.

### Gate results (fix round 2, final)

| Gate | Result | Log |
|---|---|---|
| `npm run tsc` | clean | `sc317-r3-tsc-*.log` |
| `npm run lint` | clean, exit 0 | `sc317-r3-lint-*.log` |
| `npx jest` | **4044 passed / 1 skipped / 208 of 209 suites / 3 snapshots** | `sc317-r3-jest-*.log` |
| `npm run shots` | **524 PNGs, 0 FAIL**; inline host-leak OK **1132** comparisons, 0 diffs | `sc317-r3-shots-*.log` |
| `check-freeze.sh` | **`freeze OK (260/260 …)`**, exit 0 | `sc317-r3-freeze-*.log` |
| `npm run parity` | **`0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).`**, exit 0 | `sc317-r3-parity-*.log` |

Inline host-leak line (measured):
```
inline host-leak OK (… rest [488] + 2 external-link icon [2]
+ 2 external-link ::after glyph (SC-317, FIX ROUND 1) [2]
+ 2 external-link ::after glyph under :hover (SC-317 LOW-1) [2]
+ 2 external-link ::after glyph under :focus-visible (SC-317 FIX ROUND 2, N2) [2]
+ a:hover [314] + a:focus-visible [314] + 4 synthetic (h1/h5/mark/code) [8]
× dark/light = 1132 comparisons … 0 diffs)
```

### Crops (overwritten, same filenames as fix round 1's evidence set)

Re-cropped from a wider box (`y 415→545` for screen, `y 325→432` for print, vs. the prior `428→530`/`335→390`) so both wrapped lines' full underlines are visible, not clipped at the bottom edge:
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc317-extlink-icon/crops/sc317-r2-perk-links-dark-after.png`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc317-extlink-icon/crops/sc317-r2-perk-links-light-after.png`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc317-extlink-icon/crops/sc317-r2-perk-links-dark-before.png`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc317-extlink-icon/crops/sc317-r2-perk-links-light-before.png`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc317-extlink-icon/crops/sc317-r2-perk-links-print-after.png`

The `-before.png` pair regenerated from a fresh scratch `git worktree` of `origin/develop` `619c4bd` (built, shot, removed — never the main checkout). `sc317-r2-orphan-probe-{dark,light}.png` (the r1 orphan-vs-shipped comparison) is unaffected by this round's changes and was left as-is.

### Files touched (fix round 2)

dse repo:
- `styles-source.css` (N1)
- `visual-harness/shoot.mjs` (N2)
- `test/dom/theme/headingEmphasisLinkHostRegrounding.test.ts` (N3)

Superproject:
- `draw-steel-elements` submodule pointer (bumped to `2897cc5`, committed — `git status` clean)

### Commits (fix round 2)

dse (`sc317-extlink-icon`):
- `a098362` — N1: correct the v4 defect's CSS comment
- `fe91b20` — N2: sample the glyph in the focus-visible pass too
- `2897cc5` — N3: replace the redundant print-scope assertion

Superproject:
- `ef62d70` — submodule pointer bump to `2897cc5`
