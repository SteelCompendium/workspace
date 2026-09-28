# SC-318 decisions ledger — heading sizes (h1–h6) inside plugin cards

Owner: ticket-owner (Opus 5.5). Worktree: `/home/scott/code/steelCompendium/worktrees/sc318-card-headings`
(branch `sc318-card-headings` in every submodule). DSE tracked branch: `develop`.
Base at cut: dse `origin/develop` = `5a20d5f` (SC-317 landed). Freeze baseline 260 lines;
lifecycle 19/19; parity 0 GAPs / 0 undeclared / 16 DECLARED; shots 532 PNGs; jest base on
`5a20d5f` = 4119 total (per SC-235's round-3 re-measure; re-measure yourself).

Workers read THIS file, never the tracker.

## Ticket framing (ticket body, 2026-09-14; not a Scott ruling)

- Origin: Scott on SC-202 (2026-09-14, verbatim): "3. I would like to adjust the header sizes - file a ticket".
- SC-202 round 4 re-grounded `h1`–`h6` inside plugin cards to the browser UA sizes/margins
  (`2em`/`0.67em` h1 … `0.67em`/`2.33em` h6, `em` of the heading's own font-size,
  `line-height: inherit`, `font-weight: bold`) so a real vault matches the harness.
  Consequences Scott saw: `######` heading in a card = 10.7px (smaller than body text); hero
  "CHARACTERISTICS" region title 21.1px -> 18.7px; `###` top margin 40px -> 19px.
- Pre-SC-202 vault values were Obsidian's own heading scale leaking in (h2 23.39 / h3 21.09 /
  h4 19.01 / h6 16 at a 16px body = Obsidian default `--h*-size` 1.462/1.318/1.188/1em).
- Scope: choose a heading scale for markdown-rendered headings inside plugin bodies AND the
  plugin's own real `h*` tags (hero name h2; region/roster/skills-group h3; initiative bare
  h3/h4; montage guide h4 — SC-202 r4 report §6), probably as real `--dse-fs-h*` tokens on
  the D3 token map instead of the six `UA_RESTATEMENTS` entries in `fontSizeContract.test.ts`.
  Keep the re-grounding (harness == vault); change the values.
- "Heading shots move (screen shots are unfrozen; print shots need a sanctioned rebaseline)."
- Evidence: `docs/superpowers/dse-overhaul/build-ledgers/sc202-visual-harness-obsidian/`
  `sc202-r4-report.md` §5b/§6, `sc202-r4-review.md` MED-4(b); CSS block
  "SC-202 r4 — HEADING + EMPHASIS + LINK" GROUP 1 in `styles-source.css`.

## Session constraints (dispatcher, 2026-09-27)

- No tags/releases/RCs on draw-steel-elements, ever. Never touch DSE `main`. No `just deploy*`.
- No freeze-baseline change without Scott's written sanction ("sanctioned") on the ticket; never
  edit the shared baseline (`.superpowers/sdd/freeze-baseline.sha256`). If frozen print bytes
  move, ship `rebaseline.txt` + before/after crops in this dir.
- Kill processes only by PID, only ones whose command line contains this worktree's path
  (never pkill/killall by pattern — PROJECT.md footgun 8.9).
- Run gates in the foreground with output redirected to files; never park on a background job.
- Commit after each coherent step.
- Post comments with `--model opus-5.5`. Do NOT land; report LAND-READY or PARKED-NEEDS-REVIEW.
- Main checkout dse dirt (demo-vault/Welcome.md, justfile, compendium-manifest.json,
  demo-vault/montage 1.md) is Scott's known vault state — never report, never touch.

## Related type-scale work (must stay consistent; avoid their selectors)

- **SC-232** (Steel card NAME size, `.dse-head__primary--left`): in flight (slot-content round).
  Working proposal Option A per-family site parity: generic 27px, ability 33.3, statblock 41.4,
  featureblock 37.8, project 28.8; narrow (`@container dse-head (max-width:480px)`) falls back
  to today's 20px. Parity declared 16 -> 26.
- **SC-235** (Steel section-title size, `.dse-section__title`): parked in Needs Review.
  A = 18px/0.1em (site computed), B = 15px/1.8px (matches site RENDERED letter height;
  recommended), leave = 16px/0.07em. Parity 16 -> 10 (A) or 16 (B/leave).
  Key finding: the site renders Petrona with browser-SYNTHESIZED small caps (capitals at 70%),
  plugin renders Source Serif 4 real small caps -> CSS px alone misleads; compare RENDERED
  glyph height where small caps / different faces are involved.
- **Measurement convention (shared):** raw computed px measured against the live site
  (parity README rule 4), site rem base = 20px (`html { font-size: 125% }`), plugin body
  16px default; plus rendered glyph (cap/x) height where faces or small caps differ.
- Parity declared-deferral count overlap: develop 16; SC-235 -> 10; SC-232 -> 26; both -> 20.
  Any SC-318 parity edit must be reported as an overlap.

## Scott rulings

(none yet on SC-318 beyond the origin quote above)

## Owner rulings

(none yet)

## Round 1 result (survey, 2026-09-27) — `sc318-r1-survey-report.md`

- The SC-202 GROUP 1 block (`styles-source.css:17110-17147`) is SCREEN-ONLY
  (`:not([data-dse-print="on"])`). Print (twin + realprint) already renders Obsidian's own
  scale: h1 25.89 / h2 23.39 / h3 21.09 / h4 19.01 / h5 17.22 / h6 16px, weights 700..600,
  40px top margin after a paragraph. Only screen shows the UA scale (h3 18.72, h6 10.72).
- Blast radius: 43 of 130 frozen ids (86 lines) contain a heading — all untouched if the change
  stays screen-only. Screen: 32 ids x 2 + 2 gallery = 66 PNGs.
- Site parity (Option B) rejected on measurement: the site re-levels headings and renders them
  as page headings (h6 28px, h3 48px) — every level outranks the card name.
- Parity has no h* pair; no collision with `.dse-head*` / `.dse-section__title`.
- Hierarchy cost of A: shipped h3 21.09 outranks today's 20px card name by 1.09px (gone under
  SC-232's 27px generic, present at its 20px narrow fallback). Option C (1.25..1em, nothing
  above 20px) is the no-outrank alternative.

## Owner rulings, round 1 (2026-09-27; not Scott's — he decides the scale)

- **Implement Option A, SCREEN-ONLY, as the branch proposal** Scott will see: mint
  `--dse-fs-h1..h6` = 1.618 / 1.462 / 1.318 / 1.188 / 1.076 / 1 x body; lh 1.2/1.2/1.3/1.4/1.5/1.5;
  weight 700/680/660/640/620/600; letter-spacing -0.015/-0.011/-0.008/-0.005/-0.002/0em;
  margin-block 1 body-em, margin-top 2.5 body-em when following `p, pre, table, ul, ol`
  (Obsidian's own rule, expressed so it scales with the body size). Freeze must read 260/260.
  The ask offers A (branch) / C (compact 1.25..1em, shown by probe) / leave (UA).
- **Acceptance invariant:** for every heading that A governs, the harness SCREEN computed
  font-size / line-height / weight / margins at default size equal the PRINT twin's computed
  values (screen == print == vault). Report the table.
- **Scaling:** tokens scale exactly as the existing `--dse-fs-heading` / `--dse-fs-subheading`
  tokens do (Obsidian text-size setting, SC-230 modal scaling); at default they land on the
  px above.
- **Plugin tags:** roster heading, region title (CHARACTERISTICS), initiative bare h3/h4 share
  the tokens via explicit declarations (the classed ones get `font-size: var(--dse-fs-hN)`).
  **`.dse-hero__name` (h2) does NOT change** — it is the hero card's NAME, which is SC-232's
  territory (card-name sizes); pin it explicitly to today's rendered values with a comment
  citing SC-232. Keep the existing pins on `.dse-skills__group-title` (subheading) and
  `.dse-mt__guide-title` (label). Steel tracker uppercase/weight rule (~10715) stays.
- **Tests/docs:** empty `fontSizeContract.test.ts` UA_RESTATEMENTS (tokens replace them);
  update `headingEmphasisLinkHostRegrounding.test.ts` pinned sizes, `tokens.ts`/`tokens.test.ts`,
  `token-coverage.test.ts`, `theme-steel.test.ts` invariants, `font-sizes.md`, and six rows in
  the WORKTREE superproject's `docs/superpowers/dse-overhaul/D3-token-map.md`.
- Side finding LOW `D3-token-map.md:689` `--dse-fs-control` drift -> FOLD (same file, doc line).
- Side finding LOW no fixture for card-body h1..h6 -> FOLD: add ONE screen harness capture
  with an h1..h6 ladder in a card body (plus a blockquote-h6 ability header if cheap). If the
  harness auto-produces print twins for it, those are new unbaselined files: report them as a
  widening candidate, do NOT touch the baseline. Skills group title fixture -> DROP (its size
  is pinned and untouched here).
- INFO call-site line drift -> DROP (historical report, no live doc cites the lines).
- Parity: no new pair (the site has no card-body heading node to pair with). Declared stays 16.
- CHANGELOG: one `## Unreleased` bullet in the WORKTREE superproject CHANGELOG.md; plus DSE's
  own changelog if its AGENTS.md convention requires one.

## Round 2 result (implementer, 2026-09-27) — `sc318-r2-implement-report.md`

- dse `236d593` (7 commits on `5a20d5f`); worktree superproject `5478d94` (3 commits on
  origin/main `6b0f25c`). Gates: tsc/lint clean; jest 4142 pass / 1 skip / 4143 (base 4119);
  lifecycle 19/19; shots 536 / 0 FAIL (532 + 4 new `perk-headings--steel-*`); freeze 260/260;
  parity 0/0/16. Screen == print invariant holds (markdown ladder all properties; plugin tags
  font-size). Narrow: 0 new wraps, 0 mid-word. New fixture `perk-headings` produces 2 new
  unbaselined print files (widening candidate, not applied).
- Worker stalled twice parked on background shots runs (PIDs 66822, 85595); resumed.

## Owner rulings, round 2 (2026-09-27)

- Deviation (UA_RESTATEMENTS keeps one entry: the `.dse-hero__name` 1.5em pin) -> ACCEPTED;
  that list exists for deliberate non-debt literals. No new token.
- Widening candidate (`perk-headings--steel-print.png` / `--steel-realprint.png`, +2 lines,
  260 -> 262) -> goes in the consolidated Scott ask as an OPTIONAL sanction item; landing does
  not depend on it. Hashes must be re-verified across 2 clean runs before the ask.
- Owner eyeball of `r2-evidence/sc318-ladder.png`: ACCEPTED (1:1, Option C visibly applied).
  `sc318-before-after.png`: usable, but the "On Humans" h3 top gap looks about the same in
  Today and A although the survey predicted 18.72 -> 40px — reviewer must verify the
  adjacency margin rule actually fires in card bodies. Hero crop has stray text leaking at
  its top edge — re-crop cleanly in the fix round.

## Round 3 result (independent review, 2026-09-27) — `sc318-r3-review-report.md`

FIX-FIRST (evidence only): 0 HIGH, 1 MED, 3 LOW, 3 INFO. CSS matches the rulings. Adjacency
rule DOES fire: "On Humans" h3 margin/gap develop 18.72 -> branch 40 == print 40. Gates green
at `236d593`/`5478d94` (jest 4142/1/4143; lifecycle 19/19; shots 536 x2 identical; freeze
260/260 x2; parity 0/0/16). Print: 0 computed-style diffs across 134 ids. Widening hashes
matched across 2 clean runs.

## Owner rulings, round 3 (2026-09-27)

- **MED-1 -> FIX:** regenerate `sc318-before-after.png`, `sc318-ladder.png`,
  `sc318-measure.txt` with "Today" from a REAL `5a20d5f` build (the reviewer's
  `r3-review/base/` build / `ancestry-real-base-vs-branch-vs-print.png` is the reference). For
  the ladder (no develop fixture), inject develop's GROUP 1 AND neutralize the branch's GROUP 1b
  adjacency rule. Clean crops (no stray text at the top edge), include the blockquote-h6 row,
  `crops/` naming matches content.
- **LOW-1 -> FIX:** restore today's line-height on `.dse-skills__group-title` (21.6px at
  default) and `.dse-mt__guide-title` (20.4px) — the ruling said their pins stay; nothing
  about them should move. Express it the way their other pins are expressed (scaling units).
- **LOW-2 -> disclose only:** add the blockquote-h6 row to the measure table (screen mt 16 vs
  print 0 comes from SC-202's existing blockquote rule ~16684, pre-existing: develop 10.72 vs 0).
  No code change, no ticket (spacing inside a blockquote, not a heading size).
- **LOW-3 -> FIX:** comment ~6307 must not say UA_RESTATEMENTS is "now empty".
- **INFO-1 -> FILED SC-372** (Backlog): Large-text pref is a no-op on every `--dse-fs-*` token
  (pre-existing). OUT OF SCOPE here.
- **INFO-2 -> disclose in the ask:** screen == print holds at the default text size; at other
  Obsidian text sizes heading SIZES still match print but screen margins scale with text.
- **INFO-3 -> DROP:** no shipped or captured heading inside a list item.

## Fix round 1 result (implementer, 2026-09-27) — report `sc318-r2-implement-report.md` "Fix round 1"

- dse `520aabf` (8 commits on `5a20d5f`, develop unmoved); superproject `323970c` (rebased on
  origin/main). MED-1 evidence regenerated in `r4-evidence/` from a real `5a20d5f` build;
  LOW-1 fixed with `line-height: inherit` (21.6 / 20.4px restored); LOW-2 disclosed; LOW-3 fixed.
  Gates: jest 4142/1/4143; lifecycle 19/19; shots 536/0 x2; freeze 260/260 x2; parity 0/0/16.
- Scoped re-review dispatched to the round-3 reviewer (brief `sc318-brief-r5-rereview.md`).
- Owner eyeball of r4-evidence/sc318-before-after.png + sc318-ladder.png: ACCEPTED (real develop Today; On Humans gap visibly grows; blockquote row present; C applied).

## Round 5 result (scoped re-review, 2026-09-27) — `sc318-r5-rereview-report.md`

FIX-FIRST: 0 HIGH, 1 MED, 0 LOW, 1 INFO. MED-1: the LOW-1 fix put `line-height: inherit` in
the shared, NOT screen-scoped rule `styles-source.css:3408-3417`, so print
`.dse-skills__group-title` line-height moves 23.92 -> 27.6px (no capture renders it, so freeze
misses it). Screen pins now == develop everywhere; evidence verified. Superproject now on
origin/main `4ca84a8`.

## Owner rulings, round 5 (2026-09-27)

- MED-1 -> FIX as prescribed: move the skills declaration into a screen-scoped rule that
  outranks GROUP 1's h3 rule; print must read 23.92px (== develop) on print twin and
  realprint; `.dse-collapse__title` must not change. ADD the source-text test that the pin sits
  under a print-excluded selector (can-fail proven).
- INFO -> FOLD: measure table pins section gains print rows.

## Fix round 2 result (implementer, 2026-09-27)

- dse `29d68f8` (9 commits on `5a20d5f`); superproject `1b338a2` (on origin/main `4ca84a8`).
  Skills pin moved to a screen-scoped selector; print 23.92px == develop; collapse title 0 diffs.
  jest 4144/1/4145; shots 536/0 x2; freeze 260/260 x2; parity 0/0/16; lifecycle skipped
  (CSS + test only). Scoped re-review (round 6) dispatched to the round-3 reviewer.

## Round 6 result (scoped re-review, 2026-09-27) — `sc318-r5-rereview-report.md` "Round 6"

- LAND-READY-AS-PROPOSAL: 0 HIGH/MED/LOW, 1 INFO (comment ~3490 says collapse title "keeps the
  shared rule's plain inherit"; the shared rule no longer declares one). Print 0 diffs vs develop
  across 134 ids; new tests can fail. Gates at `29d68f8`/`1b338a2`: jest 4144/1/4145; shots
  536/0; freeze 260/260; parity 0/0/16. Widening hashes unchanged.
- Owner ruling: INFO -> FOLD (comment only, implementer, verified by built-CSS diff + jest).
- Widening candidate copied to `widening.txt` (2 lines, additions only) for the dispatcher,
  applied ONLY if Scott writes "sanctioned".

## Final state (2026-09-27)

- dse `2c55304` (10 commits on develop `5a20d5f`); worktree superproject `af2f90a` on origin/main
  `4ca84a8`. Fix round 3 comment-only (built styles.css byte-identical to `29d68f8`).
  jest 4144/1/4145; lifecycle 19/19 (at 520aabf; later deltas CSS/test/comment only); shots
  536/0; freeze 260/260; parity 0/0/16. No rebaseline.txt (frozen print unchanged).
- Consolidated ask POSTED (A recommended / C / leave + optional "sanctioned" for 2-line
  widening `widening.txt`, 260 -> 262). Ticket In Progress + Needs Review. PARKED.
- Landing notes: parity unchanged (16) -> no conflict with SC-232/SC-235 counts. No selector
  overlap with `.dse-head*` / `.dse-section__title`. Widening applied only on "sanctioned"
  (re-verify the 2 hashes at the landed tip). If Scott picks C or leave, rework before landing.

## Scott ruling 1 (2026-09-28 00:23 UTC, comment 8ee73a15) — VERBATIM

> Option A is good. Sanctioned

Effect: Option A (the branch as built) is chosen. "Sanctioned" (literal word, capitalised)
sanctions the optional 2-line widening in `widening.txt` (perk-headings--steel-print.png /
--steel-realprint.png, 260 -> 262), additions only. The dispatcher applies it at landing
after the hashes are re-verified at the final tip. Ticket -> Awaiting, Ready for Agent removed.

## Owner rulings, post-Scott (2026-09-28)

- Final round (implementer): fetch, rebase dse onto the CURRENT origin/develop (SC-235 may have
  landed: section titles 15px, parity 14 declared), superproject onto current origin/main;
  full battery; re-verify the 2 widening hashes across 2 clean shots runs at the final tip;
  expected parity = develop's declared count (SC-318 adds none).

## Base moved (dispatcher, 2026-09-28)

- origin/develop = `6dca388` (SC-235 landed: Steel section titles 15px / 0.12em). Parity on
  develop 14 DECLARED; freeze baseline unchanged at 260. SC-318's expected parity = 14.
  Round 7 (final rebase + battery) dispatched against it.

## Round 7 result (final, 2026-09-28) — `sc318-r7-final-report.md`

- dse `dfb7395` (10 commits on origin/develop `6dca388`); worktree superproject `e205a42` on
  origin/main `fa0fcb7` (diff: CHANGELOG, D3-token-map, dse pointer). Develop base: jest 4122,
  parity 14, shots 532. Branch: tsc/lint clean; jest 4147/1/4148; lifecycle 19/19; shots 536/0
  x2; freeze 260/260 x2 (baseline 260); parity 0/0/14. Widening hashes identical x2 and equal to
  widening.txt -> `widening-final.txt`.
- Incident (worker): a failed `cd` ran `git remote set-url` + `git reset --hard` in the MAIN
  checkout superproject; worker restored it. Owner verified 2026-09-28: main checkout on `main`
  at `fa0fcb7` == origin/main, origin = SteelCompendium/workspace, dse submodule at pin `6dca388`
  on develop with only Scott's known vault dirt. No push occurred.
- LAND-READY. Expected after landing: parity 14 DECLARED; freeze 262 with the sanctioned widening.
