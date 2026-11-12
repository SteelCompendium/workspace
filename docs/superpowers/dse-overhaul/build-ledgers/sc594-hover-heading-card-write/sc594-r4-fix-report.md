# SC-594 r4 fix report (implementer aef741ab, resumed)

**Executive summary**
- STATUS: DONE. Rebased onto `origin/develop` = `b5d18f79` (SC-589; one CHANGELOG conflict resolved by keeping both bullets). dse HEAD `c36973e5`, superproject branch HEAD `bcdb8848`.
- HIGH-1 fixed: a heading hover is placed from the note TEXT. The line the part hangs from must be an ATX heading line of the link's name in the text; the one-place count comes from the text (not `meta.headings`); 0 matching lines -> refused. The one-place check stays conditional on a twin body (J7 / J11 keep landing); hanging-line + text count refuse all three of the reviewer's shapes (swap, paste, delete).
- LOW-2 fixed: the bound link is checked against the popover's own DOM (`popoverShows`: heading / block / whole note, first `data-heading`); previews already open when the listener registers are bound to no link. LOW-1: J19 (P1) kills mL2; the guard is commented load-bearing. mX10 / mX12 each have a killing test (J22).
- G-S92 trial (j) (section swap, lagging cache) is red on the 0bf5989d bundle and green now; trial (k) (hover one link, then another) added; part 5 442 s.
- Gates on the rebased HEAD: jest 7658 passed / 2 skipped; lifecycle 57/57; e2e `272/276 ok, 0 failed, 4 known-bug, 169/169 pairs`; styles.css identical to a clean b5d18f79 build.
- Red on 0bf5989d: 9 new tests (J20 x4, J21 x5) and G-S92 (j). Mutants: every new one dies; all r2 mutants die incl. mL2; only mM (equivalent) survives.
- CHANGELOGs and the proposal now state exactly what r4 refuses; the stale SC-595 clause and the >180 s Bash note are fixed.

## Base
`git fetch origin`: develop moved `e0e49d4d` -> `b5d18f79` mid-round. Rebased all 6 r2 commits and the r4 commits onto `b5d18f79` (only `CHANGELOG.md` conflicted: kept the SC-589 bullet and mine). No `package.json` change, no `npm ci` needed. All gates run on the rebased HEAD.

## What changed (src)
- `src/framework/host/headingNames.ts` (new): `normalizeHeadingName` (trim, collapse whitespace, lower case), `atxHeadings(lines)` (ATX only, <= 3 spaces indent, optional closing `#` run, none inside a fence / quote / list item).
- `ReadingModeBlockHost.cardLinkLine`: for a heading link, `named` = ATX heading lines of that name in the text. On the hover path (`partStart = start + 1`) `named.includes(start)` is required (the part's hanging line; also covers "0 matching lines"). With a twin body `named.length` must be exactly 1 (replaces the `meta.headings` count). The embed path (`lines[start] === part[0]`) keeps its old rule plus the text count (a setext-heading embed with a twin body is now refused; unique body unchanged). `^id` count was already from the text. Guard in `takePin` commented LOAD-BEARING (J19).
- `hoverLinks.ts`: `popoverShows(popover, linktext)` (measured DOM: `data-type`, first `[data-heading]`); `hoverLinkOf` returns null when the bound link fails it; `registerHoverLinks` binds every `.hover-popover` in `activeDocument` to null at registration (lint-clean: `activeDocument`, no `globalThis`).
- Design notes: owner's conditional one-place check kept (the three shapes are refused without the reviewer's unconditional variant; cost of the unconditional variant would have been J7 / J11: a repeated heading name with a unique body, which base landed). Name matching stays the exact trimmed / lower-cased rule, so LOW-3 (`## Tracker: one` linked as `Tracker one`) stays refused as the owner ruled (J20 test).

## Tests (dse)
The hover-card file keeps its 280 sweep cells. New: J19 x2 (P1 heading / block), J20 (lagging cache: deleted, swapped, pasted, cache on a blank line, fenced `## Tracker` not a heading, setext refused, colon heading refused), `atxHeadings` unit test, J21 (bound link vs DOM: other heading, whole-note link on a heading preview, block <-> heading both ways, whole-note preview with a heading link, the r2 residual (event before the popover exists), preview already open at registration), J22 (link to another note = mX10; duplicate `^id` after a paste = mX12). Existing tests: popover helpers now draw the DOM the host checks (`hoverEl(link)`, `popoverEl(link)`, the onload test); `hovered(..., cachedNote)` models a lagging cache. J10 / J17 (no announced link) / the 16-event log test were rebuilt so the DOM shows the right link and only the identity / null-memo / bound-log rule can refuse (otherwise the DOM check refused first and mG, mN, mQ survived).
Totals: hover-card + pin + wiring 496 tests; full jest `Test Suites: 1 skipped, 264 passed, 264 of 265 total`, `Tests: 2 skipped, 7658 passed, 7660 total` (b5d18f79's 7328 + 330).

## Lifecycle G-S92
(j) heading hover on a short note with two headings holding identical counters; the `## Other` section is moved ABOVE `## Tracker` by `vault.process` and + is clicked by script in the same task: nothing written, one Notice. (k) hover `[[#Tracker]]`, move onto `[[#Other]]`, wait for the second preview, real click on + there: `[5,6]`. Solo run on the final bundle: `OBSIDIAN-LIFECYCLE G-S92 ok` (11 trials). Red evidence: `sc594-r4-lifecycle-gs92-on-0bf5989d.log`: FAIL at (j): `a + was written into a counter, values [6,5]`, no Notice; (a)-(i) and (k) pass on that bundle ((k) is a regression guard, not a red test).

## Red-on-0bf5989d (jest)
`sc594-r4-jest-red-on-0bf5989d.log`: the three touched suites against the 0bf5989d `ReadingModeBlockHost.ts` and `hoverLinks.ts`: `Tests: 9 failed, 486 passed, 495 total`: J20 x4 (deleted, swapped, pasted, fenced-heading count) and J21 x5 (other heading, whole-note link, block<->heading, residual, open at registration). J19 / J22 / the rebuilt J10 / J17 are green there by design (their mutants fail, see below).

## Mutants (`sc594-r4-mutants.log`, runner `sc594-r4-mutate.py.txt`)
Against the three suites (496 tests). All r2 mutants die with strings adapted to the r4 code: mA 46, mB 34, mC 47, mD 1, mE 3, mF 3, mG 1, mH 3, mI 21, mJ 1, mK 1, mL 1, **mL2 2 (J19)**, mN 1, mO 1, mP 1, mQ 1, mR 27, mS 9 failed. New: **mX10 1 (J22)**, **mX12 1 (J22)**, mY1 no hanging-line check 2, mY2 count from the cache 2, mY3 fences not skipped 2, mY4 no one-place requirement 2, mY5 headings not filtered by name 49, mD1 DOM check not applied 4, mD2 heading name not compared 2, mD3 heading link without `data-type=heading` 1, mD4 whole-note link accepted for any preview 1, mD5 block link accepted for any preview 1, mD6 no null-binding at registration 1. Survivor: **mM** only (equivalent, as in r1/r2).

## Gates (logs in the ledger dir, `sc594-r4-gate-*.log`)
- tsc incl. `tsc -p e2e`: `rc=0`. lint (`eslint src main.ts e2e`): `rc=0`, no warnings (a first run flagged `globalThis` / `document` in `hoverLinks.ts`; fixed).
- jest: above.
- lifecycle: part 1 `done: 21/21 ok, 0 failed` wall 184 s; part 2 `16/16` 323 s; part 3 `9/9` 403 s; part 4 `4/4` 297 s; part 5 `7/7` (G-S59 G-S49 G-S73 G-S77 G-S83 G-S87 G-S92 with (a)-(k)) 442 s. Union 57/57.
- e2e: `OBSIDIAN-E2E done: 272/276 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs`, rc=0, 174 s.
- styles.css sha256 `5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27` for my build and for a build with the b5d18f79 versions of the changed `src` files (main.js `0d3653ca…` vs `0a369b34…`): identical, so shots / host-leak / freeze / parity carry (not re-run).

## Docs
Both CHANGELOG bullets rewritten to state only what r4 guarantees, and the refusals named exactly (list item / footnote; section edited, moved, pasted over or removed from outside before the click; preview not from a link hover, already open at load, or not showing its link; link naming two places with a twin body; setext / formatted / colon heading names; whole-note hover edited from outside); the stale SC-595 clause removed from the superproject CHANGELOG (the dse CHANGELOG had none). `sc594-dse-verify-proposal.md` rewritten (footgun (3), the "Hover card writes (SC-594)" bullet with the text placement, DOM cross-check, load-bearing guard and the exact refusal list, CURRENT block with these numbers, part 5, and the >180 s Bash note with the own-pid wait recipe).

## Commits (dse, on b5d18f79)
r2 set rebased: `46f42255` fix, `dc10b3ec` / `88830cc8` / `ec64b48a` tests, `6141877a` G-S92, `e4d96a0d` CHANGELOG. r4: `422152f4` fix (text placement + DOM check), `eaa5c615` / `2bb7e06d` / `a6851aa4` tests, `3105038f` G-S92 (j) (k), `436e042f` CHANGELOG + setext test, `c36973e5` lint fix. Superproject branch: `088a24fb` (r2 bullet), `bcdb8848` (r4 rewrite); no pointer bump.

Drive-by fixes: none.

Follow-ups:
1. The setext-heading hover refusal is by logic (the jest cache mock does not build setext headings, so the test refuses there for the cache's reason); not measured in real Obsidian.
2. Heading-name matching is exact (trim, whitespace, case); Obsidian's own link matching is laxer (LOW-3). A laxer shared normalization would let `## Tracker: one` land; deliberately not done (owner: wording only).
3. The jest popover DOM is a model of the measured DOM (`data-type`, first `data-heading`); a future Obsidian that changes it turns every hover write into a refusal (safe, noisy). G-S92 would catch it.
4. Other efforts' lifecycles run on the same machine; waiting must key on the own node pid by `/proc/<pid>/cwd` (a name match picked another effort's process once).
