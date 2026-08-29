# SC-120 §D2 Batch A — implementation report

Worktree: `/home/scott/code/steelCompendium/worktrees/sc120-d2-steel-compositions/draw-steel-elements`
Branch: `sc120-d2-steel-compositions`. Base: `8a47807` (Batch C, fix round). Commit:
`e66d2cf` (not pushed; superproject pointer not touched).

## Scope implemented

Design doc `sc120-r1-design.md` §3.1 (class), §3.2 (career), §4.1 (the two shared CSS
items: variable `.dse-tiles` column count + the right-deck caption rule), §4.2 (dark-mode
material rule — verified no change needed, `.dse-tiles__cell` already carries the correct
translucent-black literals), §5.1 (`plainText`/`stripInlineMarkdown`). Batch B (treasure/
title/complication/culture, `stripLabeledLines` generalization) NOT started, per brief.

## Files touched

- `src/elements/shared/CardLayout.ts` — `stripInlineMarkdown()` extracted from
  `normalizeForDuplicateCheck` (one regex pair, both now call it); `plainText()` added
  (case-preserving sibling); `SteelCardComposition<M>` gains optional
  `rightPrimary`/`rightDeck` closures; `renderSteel()` wires them into `cardHead()`'s
  call — additive, since every existing composition (kit/ancestry/perk/condition/rule)
  omits both and `cardHead`'s `mountSlot` already treats `undefined` as a gap.
- `src/framework/kit/statTiles.ts` — `statTiles()` now writes
  `row.style.setProperty('--dse-tiles-n', String(tiles.length))` on every row, always
  (not conditionally).
- `styles-source.css` — `.dse-tiles`'s base geometry (`~11878`) changed from
  `grid-template-columns: repeat(4, 1fr)` to `repeat(var(--dse-tiles-n, 4), 1fr)`; new
  Steel-scoped rule (placed next to the existing `.dse-head__deck--chip` Steel override,
  `~5880`) on `[data-dse-theme='steel']:not([data-dse-print="on"]) .dse-card > .dse-head
  .dse-head__deck--right` — `font-size: var(--dse-fs-micro)`, `letter-spacing: 0.07em`,
  `color: var(--dse-fg-faint)` (ports `steel-class.css:21-24`).
- `src/elements/display/layouts.ts` — `languageCount()` added next to `kitBonusValue`
  (ports `careerLanguageCount`'s suffix-strip semantics, exported for direct unit
  testing); `careerLayout.steel` and `classLayout.steel` added; a private
  `stripCareerBodyLabels()` helper (+ `CAREER_BODY_LABELS`/`CAREER_LABEL_LINE_RE`) added
  above `careerLayout` — module-private per the brief ("keep it a private helper"),
  shaped so Batch B's `stripLabeledLines(md, labels)` generalization can lift it out.
- `test/unit/kit/crestIconValidity.test.ts` — `careerLayout`/`classLayout` added to the
  covered `STEEL_LAYOUTS` table (`briefcase`/`shield`), both verified resolving against
  the bundled `lucide` package by the pre-existing test loop (no test-code change needed
  beyond the two new table rows).
- `test/dom/elements/displayFamily.test.ts` — `baseCareerLayout`/`baseCareerElement` and
  `baseClassLayout`/`baseClassElement` added (same steel-less-clone convention Batch C
  used for ancestry/perk/condition — SC-144 makes `layout.steel` presence the whole
  branch rule, so the real career/class elements now always take `renderSteel()`); the
  two pre-existing rows/badges assertions for career/class were repointed at these
  clones (comment updated to explain the move, matching Batch C's own phrasing); the two
  "exact once" textContent-count tests for career/class (further down the same file) and
  the `ALL_TEN` table were left pointed at the REAL elements — both still pass unmodified
  under the Steel branch (the Skills/Perk band text takes over from the suppressed row's
  duplicate-count role; `cardTitleText()` already handles either branch).
- `test/dom/elements/displaySteelBatchA.test.ts` (new) — end-to-end DOM coverage per
  family (cardHead crest/eyebrow/right-rail, band presence/order, `--dse-tiles-n` values
  and tile contents, hybrid-mode smoke tests) plus direct `bands()`-closure checks
  (synthetic SDK model instances) pinning the dash-fill/gating rules and the
  Project-Points-strip deviation.
- `test/unit/elements/cardLayoutHelpers.test.ts` (new) — direct unit coverage for
  `stripInlineMarkdown`/`plainText`/`normalizeForDuplicateCheck` (link stripping, case
  preservation, regression check) and `languageCount` (suffix-strip, case-insensitivity,
  fallback, empty/undefined).

## Design decisions worth flagging

1. **`SteelCardComposition<M>` interface change.** The design doc describes class's
   `rightPrimary`/`rightDeck` slots but the interface (`CardLayout.ts`) had no field for
   them — `cardHead()` already supported the slots, `renderSteel()` just never read
   them. Added both as optional closures and wired them through. Additive: every
   composition that doesn't supply them renders byte-identical to before (verified —
   kit pair stays byte-identical across both shots runs).
2. **Caption-rule specificity.** The new right-deck rule
   (`.dse-card > .dse-head .dse-head__deck--right`, 5 selector components) is scoped
   more narrowly than, but higher-specificity than, the pre-existing
   `.dse-head__deck--chip` Steel rule (3 components) that also matches a `chip`-styled
   right deck — so the new rule's 3 properties (font-size/letter-spacing/color) win
   without touching the chip's padding/background/border, matching the design's intent
   ("a caption, not a second chip").

## Deviation from both the design doc and the brief

**`stripCareerBodyLabels()` strips six labels, not the five both documents name.** The
design doc §3.2 and this worker's brief both list exactly `Skills`/`Languages`/
`Renown`/`Wealth`/`Perk`. I added **`Project Points`** as a sixth stripped label.
Rationale: `project_points` is one of the "Career Benefits" tile's own four slots (the
composition renders it structurally as "Project Pts"), and the real corpus carries a
`**[Project Points](...):** 240` body line for every career that has one (verified —
`v2/docs/Browse/career/artisan.md` in this worktree). Leaving it in the stripped-labels
list omission would reproduce, for careers, the exact "double-render" defect the SC-120
ticket itself named for treasure (§1.1 of the design doc). No real career in this
worktree's corpus currently has BOTH `project_points` and gets exercised by a shots
fixture (the `career` fixture, `politician`, has no `project_points`), so this deviation
is invisible to the frozen shots and does not affect the sanctioned hashes below — it is
covered instead by a direct unit test (`displaySteelBatchA.test.ts`, "stripped body also
removes a real '**[Project Points](...):**' corpus line"). Flagging for the ticket-owner
to confirm at sanction time; trivially reverted (delete one array entry) if Scott prefers
strict adherence to the doc's five-label list.

## Gates (devbox-wrapped, dse-verify order, all foreground)

| Gate | Result |
|---|---|
| `npm run tsc` | exit 0, no output — PASS |
| `npm run lint` | exit 0, no output (only the pre-existing `.eslintignore` deprecation notice) — PASS |
| `npx jest` (after `rm -f main.js styles.css`) | Suites: 188 passed + 1 skipped / 189; Tests: **3312 passed + 1 skipped / 3313** (base was 3282+1sk/3283 — +30 new tests, 0 regressions). One transient failure fixed during authoring (test file's own `:scope > .dse-card__body` selector bug, not production code — see below); the known `sidebarEncounterHandoff` flake did NOT reproduce in either full run. |
| `npm run shots` (run 1) | 0 FAIL, 474 shot lines, print-twin parity OK (118 ids), nested-corner-radius OK — PASS |
| freeze check (run 1) | **exactly 14 mismatches**: `{ancestry,condition,perk,perk-narrow,rule,class,career}--steel-{print,realprint}` — Batch C's 10 + class/career. `kit--steel-{print,realprint}` confirmed `: OK` (byte-identical) via a direct `sha256sum -c` from inside the shots dir — PASS (expected violation, exact count) |
| `npm run shots` (run 2, determinism) | 0 FAIL, 474 shot lines — PASS |
| freeze check (run 2) | identical 14-name mismatch set; `kit--steel-{print,realprint}` still `: OK` — PASS |
| determinism | all 14 mismatch-set hashes byte-identical between the two shots runs (`diff` of the two hash dumps: empty); twin (print==realprint) confirmed for all 7 pairs in both runs — PASS |
| `npm run parity` (LAST) | exit 0, **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)** — identical to base/Batch C's numbers; the tiles/caption-rule changes did not move any parity-mapped row — PASS |

**Sibling-fixture check (brief's instruction):** grepped `visual-harness/entry.ts`'s
`FIXTURES` record and `NARROW_SHOTS` array for `class`/`career` — each family has exactly
one fixture (`default`), no narrow variant (unlike perk/perk-narrow in Batch C). So the
freeze delta is exactly class+career's own 4 lines, no sibling movers.

## The 14 after-hashes (both shots runs, byte-identical)

```
b25047cdf7d1a682d84ff91d94d595e997f4b2231692c0909567ca23d7adee65  ancestry--steel-print.png
b25047cdf7d1a682d84ff91d94d595e997f4b2231692c0909567ca23d7adee65  ancestry--steel-realprint.png
6511efb142ed1a70cbaefc53ded9c8b44dff8e887ae9a50d4eb038ad3a857fc3  career--steel-print.png
6511efb142ed1a70cbaefc53ded9c8b44dff8e887ae9a50d4eb038ad3a857fc3  career--steel-realprint.png
dd9650e6ed254b782ceb4deb653cb327f5c59fbd35c4dbd488bfe5607365f872  class--steel-print.png
dd9650e6ed254b782ceb4deb653cb327f5c59fbd35c4dbd488bfe5607365f872  class--steel-realprint.png
63531ab624422b7f06bc865bc160a111be44a674a88e47abd00e7a9f0aeab2e2  condition--steel-print.png
63531ab624422b7f06bc865bc160a111be44a674a88e47abd00e7a9f0aeab2e2  condition--steel-realprint.png
1d0186e12e1443294b23535a34887b141ca3fd2363bfee04752b84e02097eeed  perk--steel-print.png
1d0186e12e1443294b23535a34887b141ca3fd2363bfee04752b84e02097eeed  perk--steel-realprint.png
16e516faee76a315fafc8d91841739fcc1ca461803510aeec7ab0ba87a02bfa8  perk-narrow--steel-print.png
16e516faee76a315fafc8d91841739fcc1ca461803510aeec7ab0ba87a02bfa8  perk-narrow--steel-realprint.png
bcda9977c98356bc94a461e8d4719367aafd51986d11ec9a21e84d32d599e82b  rule--steel-print.png
bcda9977c98356bc94a461e8d4719367aafd51986d11ec9a21e84d32d599e82b  rule--steel-realprint.png
```

Only `career`/`class` are NEW this batch — the other 10 hashes are byte-identical to the
Batch C fix-round report's values (confirmed by direct comparison), proving nothing in
Batch A touched ancestry/condition/perk/perk-narrow/rule's rendered output. `kit`'s pair
is absent from this list entirely because it is `: OK` against the shared frozen
baseline (unchanged bytes) — the `--dse-tiles-n`/`rightPrimary`/`rightDeck`
generalizations are behavior-preserving by construction and by measurement.

(No `rebaseline.txt` written, per owner ruling 9 — the final one is generated once from
the completed tree at effort end.)

## Evidence files (ledger dir)

- `sc120-after-class--steel-dark.png`, `sc120-after-class--steel-print.png`
- `sc120-after-career--steel-dark.png`, `sc120-after-career--steel-print.png`

All under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc120-d2-steel-compositions/`.
No sibling-fixture evidence needed (none exist for class/career, see above).

## Commit

`e66d2cf` on branch `sc120-d2-steel-compositions`, inside `draw-steel-elements/` only.
Not pushed. Superproject pointer not touched. No AI/co-author trailers. Working tree
verified clean after commit (`git status`).

## Out of scope, confirmed untouched

- Batch B families (treasure/title/complication/culture) and the full
  `stripLabeledLines(md, labels)` generalization — `git show --stat e66d2cf` touches only
  the 8 files listed above; no edits under `treasureLayout`/`titleLayout`/
  `complicationLayout`/`cultureLayout`.
- `git diff` confirms zero changes to `renderBase()`, `rows`/`badges` semantics, or any
  other display family's `.steel` composition.

---

# FIX ROUND (round-5 independent review response)

Review: `sc120-r5-batchA-review.md` — verdict **FIX ROUND NEEDED** (0 CRIT / 0 HIGH /
2 MED / 5 LOW / 4 INFO), all gates independently re-measured and matched the r4 numbers
exactly, no correctness defect found in the compositions or shared machinery. Both
MEDIUM findings changed pixels the sanction ask would have covered (career's frozen
body, class's head rail), so the review asked for a fix-then-reshoot before any sanction
ask. Owner ruling 16 (`decisions.md`) accepts all seven findings; scope for this round is
exactly those seven, nothing else (no Batch B work, no design changes beyond the
findings).

**New commit:** `9cb615c` on branch `sc120-d2-steel-compositions`, on top of `e66d2cf`.
Not pushed. No AI/co-author trailers. Working tree verified clean after commit.

## Fix-by-fix

1. **MED-1 — `src/elements/display/layouts.ts` (`stripCareerBodyLabels`).** Career's body
   kept an orphaned "You gain the following career benefits:" lead-in, with nothing after
   it, directly above the d6 table, once its labeled lines were stripped — systematic
   (18/18 Browse careers carry that exact sentence verbatim). Fixed with a
   `CAREER_LEAD_IN_LINES` whole-line-normalized-text match set (checked alongside the
   bold-label match, same blank-line-swallow semantics) — the composition's own "Career
   Benefits" band head is the sentence's structural replacement, per the review's
   prescription.
2. **MED-2 — `styles-source.css` (the right-deck caption rule, `~5898`).** The rule only
   set `font-size`/`letter-spacing`/`color`, leaving the `--chip` surface's
   `border`/`background`/`padding` painted underneath, so class's right rail rendered as
   two outlined pills instead of the site's boxless mini + caption (§4.1 item 2's stated
   goal). Fixed by adding `background: none; border: none; padding: 0;`, mirroring the
   precedent 40 lines below
   (`:is(.dse-sb, .dse-fb) > .dse-head > .dse-head__primary--chip`). Deliberately scoped
   to ONLY the fix the finding's prescribed section marked mandatory (the deck/caption
   rule) — the review's OPTIONAL addendum ("if Scott also wants the site's boxless mini
   for `rightPrimary`, add the sibling rule...") was NOT implemented, since owner ruling
   16 accepted "the finding" without naming that conditional extension and the brief for
   this round named no scope beyond the seven findings. Residual: `rightPrimary`
   (`MIGHT · REASON`) still renders as a chip pill; flagging for the ticket-owner to
   decide whether that's wanted in a follow-up round. Screen-only (both rules carry
   `:not([data-dse-print="on"])`) — zero frozen print bytes move from this fix; only the
   class DARK evidence shot changes.
3. **LOW-1 — `src/elements/display/layouts.ts` (`CAREER_LABEL_LINE_RE`).** The trailing
   colon was optional, so a bold-LED PROSE paragraph with no colon at all (e.g.
   `**Wealth** is a measure of your character's buying power...`) matched and was
   stripped whole, just because its first bolded word equaled a label. Fixed: the regex
   now requires a colon, either inside the bold run (`**Skills:**`, every real corpus
   shape) or immediately after it (`**Skills**:`, accepted defensively per design §5.2's
   own "inside or outside" wording, not currently produced by any real career).
4. **LOW-2 — same function, `line.trim()`.** The label test ran against the TRIMMED
   line, so an indented continuation line under a list item (e.g. `    **Perk:** One
   perk.`) was stripped, which would silently gut a list item. Fixed: matched against the
   RAW line (trim retained only for the blank-line-swallow check) — a stripped label must
   now start at column 0.
5. **LOW-3 — new unit test, `test/dom/elements/displaySteelBatchA.test.ts`.** Nothing
   previously pinned the caption rule's Steel/print scope as a RULE (only DOM assertions
   existed, blind to a dropped `:not([data-dse-print="on"])` guard — and the freeze can't
   see it either this batch, since class's print pair is already moving for MED-2's DOM
   reasons). Added a sheet-scan test mirroring `chromeRound2.test.ts`'s convention:
   reads `styles-source.css` directly, asserts the full selector text is present, and
   asserts the block's declarations (including MED-2's new un-chip lines) directly.
6. **LOW-4 — same test file, the Project-Points direct-unit test.** `bands.find(b =>
   b.head === undefined)` is ambiguous — career's own headless FLAVOR band would also
   match for any model with a non-duplicating flavor; the test passed only because its
   synthetic model had no flavor. Fixed: `bands[bands.length - 1]`, matching the file's
   own `lastBodyDiv()` convention (the body band is always last by declaration order).
7. **LOW-5 — same test.** `void bodyBand.render(...)` was a floating-promise hazard
   identical in shape to the one owner ruling 13 already fixed once in Batch C — the fake
   `renderMarkdown` is async, so an un-awaited call only happened to pass because it
   writes before its first suspension point. Fixed: made the test `async` and `await`ed
   the render.

**Also added (not a fix, but load-bearing regression coverage for 3/4):** two new direct
`bands()`-closure tests proving LOW-1/LOW-2 can actually fail — a bold-led-no-colon
paragraph survives, and an indented continuation line survives — plus updated the
existing "Skills/Perk bands render..." test's body assertions to also check the MED-1
lead-in line is gone.

## Deviation carried forward from r4

Owner ruling 15 already accepted the `Project Points` sixth label (see the original
report above) — untouched this round; the review's INFO items confirmed
`languageCount`'s suffix-strip semantics match the real site source (`cards.go`) and that
policy (B) is lossless across the whole 18-career corpus (both no-action items per owner
ruling 16).

## Gates (fix round, same devbox-wrapped dse-verify order, all foreground)

| Gate | Result |
|---|---|
| `npm run tsc` | Initial attempt failed: named regex capture groups (`(?<inside>...)`) require `target >= ES2018`, and this repo's `tsconfig.json` `target` is `ES6` (CLAUDE.md's "Target ES2018" describes the esbuild OUTPUT target, not tsc's type-check target) — rewrote `CAREER_LABEL_LINE_RE` with two plain (unnamed) capture-group alternatives instead. Final: exit 0, no output — PASS |
| `npm run lint` | exit 0, no output (only the pre-existing `.eslintignore` deprecation notice) — PASS |
| `npx jest` (after `rm -f main.js styles.css`) | Suites: 188 passed + 1 skipped / 189; Tests: **3316 passed + 1 skipped / 3317** (+4 new tests vs the r4 commit: LOW-3's two CSS-scan tests, LOW-1/LOW-2's two direct regression tests); 0 failures — PASS |
| `npm run shots` (run 1) | 0 FAIL, 474 shot lines, print-twin parity OK (118 ids) — PASS |
| freeze check (run 1) | **exactly 14 mismatches**, same names as r4 (`{ancestry,condition,perk,perk-narrow,rule,class,career}--steel-{print,realprint}`); `kit--steel-{print,realprint}` still `: OK` — PASS |
| `npm run shots` (run 2, determinism) | First attempt timed out at the Bash tool's 5-minute default under host load (`/proc/loadavg` 6.96 — a sibling worktree's own `npx jest` run was concurrently active) and was killed mid-run (one incomplete "sweep" shot, not a real defect); re-run with an explicit 600000ms (10-minute) foreground timeout completed cleanly: 0 FAIL, 474 shot lines — PASS |
| freeze check (run 2) | identical 14-name mismatch set; `kit--steel-{print,realprint}` still `: OK` — PASS |
| determinism | all 14 mismatch-set hashes byte-identical between the two fix-round shots runs (`diff` empty); twin (print==realprint) confirmed for all 7 pairs in both runs — PASS |
| `npm run parity` (LAST) | exit 0, **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)** — unchanged from r4/base — PASS |

## Hash movement vs the r4 commit (`e66d2cf`)

Only `career`'s pair moved (MED-1 reaches the print render, since the stripped body
prints too); `class`'s pair — despite MED-2 touching CSS in the same family — is
BYTE-IDENTICAL to r4, because MED-2 is screen-only by construction
(`:not([data-dse-print="on"])` on both the original and the fixed rule). The other five
families are untouched by this round's fixes.

```
BEFORE (r4):      6511efb142ed1a70cbaefc53ded9c8b44dff8e887ae9a50d4eb038ad3a857fc3  career--steel-print.png
BEFORE (r4):      6511efb142ed1a70cbaefc53ded9c8b44dff8e887ae9a50d4eb038ad3a857fc3  career--steel-realprint.png
AFTER (fix round): 6fa077c046f3bdd1608d6937a1861ffa61d2a2ee4548277b6e44d4d4420cc293  career--steel-print.png
AFTER (fix round): 6fa077c046f3bdd1608d6937a1861ffa61d2a2ee4548277b6e44d4d4420cc293  career--steel-realprint.png

UNCHANGED: dd9650e6ed254b782ceb4deb653cb327f5c59fbd35c4dbd488bfe5607365f872  class--steel-{print,realprint}.png
UNCHANGED: b25047cdf7d1a682d84ff91d94d595e997f4b2231692c0909567ca23d7adee65  ancestry--steel-{print,realprint}.png
UNCHANGED: 63531ab624422b7f06bc865bc160a111be44a674a88e47abd00e7a9f0aeab2e2  condition--steel-{print,realprint}.png
UNCHANGED: 1d0186e12e1443294b23535a34887b141ca3fd2363bfee04752b84e02097eeed  perk--steel-{print,realprint}.png
UNCHANGED: 16e516faee76a315fafc8d91841739fcc1ca461803510aeec7ab0ba87a02bfa8  perk-narrow--steel-{print,realprint}.png
UNCHANGED: bcda9977c98356bc94a461e8d4719367aafd51986d11ec9a21e84d32d599e82b  rule--steel-{print,realprint}.png
```

Full fix-round 14-hash set (identical across both fix-round shots runs):

```
b25047cdf7d1a682d84ff91d94d595e997f4b2231692c0909567ca23d7adee65  ancestry--steel-print.png
b25047cdf7d1a682d84ff91d94d595e997f4b2231692c0909567ca23d7adee65  ancestry--steel-realprint.png
6fa077c046f3bdd1608d6937a1861ffa61d2a2ee4548277b6e44d4d4420cc293  career--steel-print.png
6fa077c046f3bdd1608d6937a1861ffa61d2a2ee4548277b6e44d4d4420cc293  career--steel-realprint.png
dd9650e6ed254b782ceb4deb653cb327f5c59fbd35c4dbd488bfe5607365f872  class--steel-print.png
dd9650e6ed254b782ceb4deb653cb327f5c59fbd35c4dbd488bfe5607365f872  class--steel-realprint.png
63531ab624422b7f06bc865bc160a111be44a674a88e47abd00e7a9f0aeab2e2  condition--steel-print.png
63531ab624422b7f06bc865bc160a111be44a674a88e47abd00e7a9f0aeab2e2  condition--steel-realprint.png
1d0186e12e1443294b23535a34887b141ca3fd2363bfee04752b84e02097eeed  perk--steel-print.png
1d0186e12e1443294b23535a34887b141ca3fd2363bfee04752b84e02097eeed  perk--steel-realprint.png
16e516faee76a315fafc8d91841739fcc1ca461803510aeec7ab0ba87a02bfa8  perk-narrow--steel-print.png
16e516faee76a315fafc8d91841739fcc1ca461803510aeec7ab0ba87a02bfa8  perk-narrow--steel-realprint.png
bcda9977c98356bc94a461e8d4719367aafd51986d11ec9a21e84d32d599e82b  rule--steel-print.png
bcda9977c98356bc94a461e8d4719367aafd51986d11ec9a21e84d32d599e82b  rule--steel-realprint.png
```

(No `rebaseline.txt` written, per owner ruling 9 — the final one is generated once from
the completed tree at effort end.)

## Evidence files updated this round

- `sc120-after-class--steel-dark.png` — re-copied (MED-2 changes the dark shot's pixels;
  the print evidence file is byte-identical to r4's copy but was re-copied anyway for a
  consistent snapshot).
- `sc120-after-class--steel-print.png` — re-copied, byte-identical to r4 (confirmed:
  same file size, same hash `dd9650e6...`).
- `sc120-after-career--steel-dark.png`, `sc120-after-career--steel-print.png` —
  re-copied (MED-1 changes both).

## Out of scope, confirmed untouched (fix round)

- Batch B families and the `stripLabeledLines` generalization — not touched.
- The review's optional MED-2 addendum (a boxless `rightPrimary` mini) — not
  implemented; see fix 2 above.
- INFO-1 through INFO-4 — no action asked by owner ruling 16.

## Commit (fix round)

`9cb615c` on branch `sc120-d2-steel-compositions`, inside `draw-steel-elements/` only.
Not pushed. Superproject pointer not touched. No AI/co-author trailers. Working tree
verified clean after commit.

---

# FIX ROUND 2 (owner ruling 17 — adopts the MED-2 addendum)

Owner ruling 17 (`decisions.md`) adopts the round-5 review's OPTIONAL MED-2 addendum,
which fix round 1 (above) deliberately left out: class's `rightPrimary`
("MIGHT · REASON") must render boxless like the site's mini-title, not as a chip — the
site class head (`sc120-ref-class-page--dark.png`) shows large boxless text over the
boxless "primary characteristics" caption; the plugin drew two stacked outlined pills.

**New commit:** `0d10e4e` on branch `sc120-d2-steel-compositions`, on top of `9cb615c`.
Not pushed. No AI/co-author trailers. Working tree verified clean after commit.

## The fix

**`styles-source.css`** (new rule, ~20 lines below the round-5 right-deck caption
override): a Steel-scoped un-chip rule on
`.dse-card > .dse-head .dse-head__primary--right` —

```css
[data-dse-theme='steel']:not([data-dse-print="on"]) .dse-card > .dse-head .dse-head__primary--right {
	background: none;
	border: none;
	padding: 0;
}
```

Exact same shape as the right-deck caption rule's own un-chip properties (round-5 fix
round MED-2) — `rightPrimary` ships via `cardHead()`'s default `chip` render style, the
same flat-chip surface the deck override already fixed, so it had the identical
border/background/padding problem. **Sizing deliberately NOT adjusted** — ruling 17
asked only for the boxless treatment, not the site's larger/uppercase/role-tinted
`--mini` typography; `.dse-head__primary--right`'s existing rule (font-weight 600,
`--dse-role` tint) and the inherited font-size continue to apply unchanged. Screen-only
(`:not([data-dse-print="on"])`) — costs no frozen print bytes.

**`test/dom/elements/displaySteelBatchA.test.ts`**: the round-5 LOW-3 scope-pinning
describe block was restructured into two nested describes (one per rule) sharing a
`ruleBlock(selector)` helper — the pre-existing right-deck-caption assertions are
unchanged in substance, and a new right-primary describe pins the new rule's full
`[data-dse-theme='steel']:not([data-dse-print="on"])` scope plus its three un-chip
declarations.

## Gates (foreground, dse-verify order)

| Gate | Result |
|---|---|
| `npm run tsc` | exit 0, no output — PASS |
| `npm run lint` | exit 0, no output (only the pre-existing `.eslintignore` notice) — PASS |
| `npx jest` (after `rm -f main.js styles.css`) | Suites: 188 passed + 1 skipped / 189; Tests: **3318 passed + 1 skipped / 3319** (+2 new tests vs the prior fix-round commit — the new right-primary scope-pinning tests); 0 failures — PASS |
| `npm run shots` (run 1) | 0 FAIL, 474 shot lines, print-twin parity OK — PASS |
| freeze check (run 1) | **exactly the same 14 mismatches** as fix round 1; `kit--steel-{print,realprint}` still `: OK` — PASS |
| `npm run shots` (run 2) | Not strictly asked for this scoped round (the request specified "one shots run + freeze") — run anyway as extra determinism confirmation: 0 FAIL, 474 shot lines — PASS |
| freeze check (run 2) / determinism | identical 14-name mismatch set; all 14 print/realprint hashes byte-identical between the two runs — PASS |
| `npm run parity` (LAST) | exit 0, **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)** — unchanged — PASS |

## Hash confirmation: class print pair unchanged, career and the rest untouched

Diffing the full 14-name print/realprint hash set against fix round 1's committed
values (`9cb615c`) is **EMPTY** — every one of `{ancestry,condition,perk,perk-narrow,
rule,class,career}--steel-{print,realprint}.png` is byte-identical to fix round 1,
confirming this round's CSS-only, screen-scoped change moved zero frozen print bytes.
`class--steel-print.png` specifically: `dd9650e6ed254b782ceb4deb653cb327f5c59fbd35c4dbd488bfe5607365f872`
— identical to both r4 and fix round 1.

The **dark** shot did change, confirming the fix is real: `class--steel-dark.png` moved
`ae47c5e6ba1493df4f8fc416e18e68bedce5b11cca3c3da3a2f7522d2f1423d6` (fix round 1) →
`8d5afd18bcd53e110220efbb929392f34231499ee1d44291dfbb3c9183407768` (this round).

## Evidence files updated this round

- `sc120-after-class--steel-dark.png` — re-copied (the rightPrimary un-chip changes this
  shot's pixels). `sc120-after-class--steel-print.png` and both `career` evidence files
  are unchanged from fix round 1 and were NOT re-copied (byte-identical, no need).

## Out of scope, confirmed untouched

- Batch B families and `stripLabeledLines` — not touched.
- Sizing/typography changes to `rightPrimary` (the site's uppercase/role-tinted/larger
  `--mini` treatment) — explicitly not asked for by ruling 17, not implemented.
- career, and the other four Batch C families — `git show --stat 0d10e4e` touches only
  `styles-source.css` and the one test file.

## Commit (fix round 2)

`0d10e4e` on branch `sc120-d2-steel-compositions`, inside `draw-steel-elements/` only.
Not pushed. Superproject pointer not touched. No AI/co-author trailers. Working tree
verified clean after commit.

---

# FIX ROUND 3 (owner ruling 18 — languageCount emits the numeral)

Owner ruling 18 (`decisions.md`, owner eyeball of the Batch A evidence): career's
Languages tile renders the word "One" in the tile-value face, whose capital "O" reads as
a digit zero — "0ne" looked like a typo in the evidence shot (owner zoom confirmed).

**New commit:** `eadacc7` on branch `sc120-d2-steel-compositions`, on top of `0d10e4e`.
Not pushed. No AI/co-author trailers. Working tree verified clean after commit.

## The fix

**`src/elements/display/layouts.ts:86-124`** (`languageCount`) — after the existing
" language"/" languages" suffix strip (unchanged), the leading count word is now mapped
to its NUMERAL via a small lookup table (`COUNT_WORD_TO_DIGIT`, one..ten):
"One language" → `"1"`, "Two languages" → `"2"`, etc. — matching the numeric grammar of
every other tile value (`21`, `+9`, `+1`, `—`) and immune to the capital-O/zero ambiguity.
A deliberate divergence from the site tile's count WORD (the site is a reference, not
gospel, per design §0(c)).

**Fallback (per ruling 18's own wording):** a leading word that isn't a recognized count
word falls back to the existing suffix-stripped STRING unchanged — `COUNT_WORD_TO_DIGIT`
deliberately contains ONLY `one` through `ten` (no `zero`/`none`/`no`), so
`languageCount('None')` still returns `'None'` exactly as before this round (verified by
a re-run of the pre-existing fallback test, unchanged) — a "count of zero" isn't a shape
this field's dash-fill/absent-field path would ever actually need to distinguish from a
genuinely absent field.

**Tests updated:**
- `test/unit/elements/cardLayoutHelpers.test.ts` — the two existing suffix-strip tests
  now assert the numeral (`'1'`/`'2'`/`'3'`) instead of the word; added a
  "covers every count word one..ten" test and a "falls back... not a recognized count
  word" test (`'A couple languages'` → `'A couple'`); the pre-existing no-suffix fallback
  test (`'None'` → `'None'`) is unchanged and still passes, confirming the digit map's
  scope is exactly as narrow as intended.
- `test/dom/elements/displaySteelBatchA.test.ts` — the Career Benefits tile-value
  assertion updated from `'One'` to `'1'`.

## Gates (foreground, dse-verify order)

| Gate | Result |
|---|---|
| `npm run tsc` | exit 0, no output — PASS |
| `npm run lint` | exit 0, no output (only the pre-existing `.eslintignore` notice) — PASS |
| `npx jest` (after `rm -f main.js styles.css`) | Suites: 188 passed + 1 skipped / 189; Tests: **3320 passed + 1 skipped / 3321** (+2 new tests vs the prior fix-round commit); 0 failures — PASS |
| `npm run shots` (run 1) | 0 FAIL, 474 shot lines, print-twin parity OK — PASS |
| freeze check | **exactly the same 14 mismatches** as fix round 2; `kit--steel-{print,realprint}` still `: OK` — PASS |
| `npm run parity` (LAST) | exit 0, **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)** — unchanged — PASS |

## New career hashes

Only `career`'s pair moved; every other family (including `class`) is byte-identical to
fix round 2's committed values:

```
BEFORE (fix round 2): 6fa077c046f3bdd1608d6937a1861ffa61d2a2ee4548277b6e44d4d4420cc293  career--steel-print.png
BEFORE (fix round 2): 6fa077c046f3bdd1608d6937a1861ffa61d2a2ee4548277b6e44d4d4420cc293  career--steel-realprint.png
AFTER (fix round 3):  681db993e956307c4da5205c51b91044364b1c970b5f7f1bcaf9166b031d345d  career--steel-print.png
AFTER (fix round 3):  681db993e956307c4da5205c51b91044364b1c970b5f7f1bcaf9166b031d345d  career--steel-realprint.png

UNCHANGED (confirmed by diff): class, ancestry, condition, perk, perk-narrow, rule —
all 12 remaining print/realprint hashes identical to fix round 2's values
(class--steel-print.png stays dd9650e6ed254b782ceb4deb653cb327f5c59fbd35c4dbd488bfe5607365f872).
```

## Evidence files updated this round

- `sc120-after-career--steel-dark.png`, `sc120-after-career--steel-print.png` —
  re-copied (the numeral change affects both). `class` evidence files are unchanged from
  fix round 2 and were NOT re-copied.

## Out of scope, confirmed untouched

- Batch B families and `stripLabeledLines` — not touched.
- Everything else about the career/class compositions — `git show --stat eadacc7`
  touches only `layouts.ts` and the two test files.
- Per owner ruling 18, this one-liner's scoped re-review folds into Batch B's review
  round rather than getting its own dedicated round here.

## Commit (fix round 3)

`eadacc7` on branch `sc120-d2-steel-compositions`, inside `draw-steel-elements/` only.
Not pushed. Superproject pointer not touched. No AI/co-author trailers. Working tree
verified clean after commit.
