# SC-318 round 2 implementation report (+ fix rounds 1-2)

## Executive summary

**Verdict: LAND-READY.** Implemented Option A screen-only (owner ruling round 1): minted
`--dse-fs-h1..h6` (Obsidian's own ratios), rewired GROUP 1 off the SC-202 r4 bare-UA
literals. Print/export untouched by GROUP 1 itself. **dse sha `29d68f8`** (9 commits on
`5a20d5f`); **superproject sha `1b338a2`** (5 SC-318 commits, rebased onto `origin/main`
@ `4ca84a8`). Acceptance invariant holds exactly on every property at default size
(`r4-evidence/sc318-measure.txt`, measured against a REAL `5a20d5f` build). Gates:
tsc/lint clean; jest **4144 passed/1 skipped/4145 total, 0 failures**; `obsidian-lifecycle`
**19/19** (last run fix round 1; fix round 2 touched CSS+test only, no `src/` change, so
it was skipped this round, matching the round-5 reviewer's own precedent); shots **536
PNGs, 0 FAIL** (2 runs each, fix rounds 1 and 2); freeze **260/260** (0 bytes moved,
every round); parity **0 gaps/0 undeclared/16 declared**.

**Fix round 1** (round-3 independent review, FIX-FIRST) closed MED-1 (evidence
regenerated from a real base build — round 2's "Today" column was CSS-injection-
contaminated by the branch's own adjacency rule, understating the real ~21px margin
change the owner's own eyeball had flagged), LOW-1 (two pre-existing pins' line-height
had silently moved — restored on SCREEN), and LOW-3 (a stale comment). LOW-2 disclosed,
not fixed. INFO-1 filed as SC-372 (out of scope); INFO-2 disclosed; INFO-3 dropped.

**Fix round 2** (round-5 scoped re-review, FIX-FIRST) closed a NEW MED-1 that fix round
1's own LOW-1 fix introduced: the skills pin's `line-height: inherit` sat in a rule with
no print exclusion, so it also overrode PRINT's own h3 line-height — a real Ctrl-P/export
regression (23.92px → 27.6px) invisible to freeze (no frozen capture renders that mode).
Moved the declaration onto its own print-excluded selector; verified via the reviewer's
own `probe-pins.mjs` against develop/236d593/this fix that print now reads 23.92px again
and `.dse-collapse__title` (the rule's other, unrelated subject) is byte-for-byte
unchanged in every combo. Added a can-fail-proven source-text test pinning the fix
(fails on `520aabf`, passes here). The measure table's PINS section gained print rows
(the round-5 INFO fold).

One disclosed deviation from the literal round-2 ruling text remains open for the owner
(below, unchanged since round 2). No freeze-baseline change at any round, no sanction
needed.

## Commits

`draw-steel-elements` (dse), `develop` base `5a20d5f`:

| sha | subject |
|---|---|
| `9767ce5` | feat: mint `--dse-fs-h1..h6`, restore Obsidian's heading scale on screen |
| `4f2dc65` | test: register the six tokens, retire 5/6 `UA_RESTATEMENTS` |
| `5775a28` | test: can-fail-proven heading-scale invariants (new file) |
| `a7fadc9` | docs: font-sizes.md |
| `a5a6b8b` | test: `perk/headings` fixture (h1-h6 ladder + blockquote-h6) |
| `06b9035` | docs: CHANGELOG entry (dse) |
| `236d593` | fix: GROUP 1c `:where()`, GROUP 1b/1d documented SC-203 exceptions |
| `520aabf` | fix round 1: restore line-height on the skills/montage pins, fix stale comment (LOW-1, LOW-3) |
| `29d68f8` | fix round 2: scope the skills line-height pin to screen (round-5 MED-1) |

Superproject worktree, base `6b0f25c` (round 2), rebased onto `origin/main` for fix round 1
(moved — `4ca84a8` "docs: handoff: SC-232 + SC-318 resumed" landed in between, unrelated):

| sha | subject |
|---|---|
| `f63df4a`/`75040ad` | docs: D3-token-map.md +6 rows, `--dse-fs-control` drift fold |
| `aefd41c`/`ac2bae1` | docs: CHANGELOG entry (workspace) |
| `5478d94`/`1bb7f41` | chore: bump `draw-steel-elements` to `236d593` |
| `323970c` | chore: bump `draw-steel-elements` to `520aabf` (fix round 1) |
| `1b338a2` | chore: bump `draw-steel-elements` to `29d68f8` (fix round 2) |

(Left-of-slash shas are round 2's originals, pre-rebase; right-of-slash are their
identical-content rebased shas. `323970c` is fix round 1's own new commit — the
CHANGELOG/D3-token-map needed no further change this round, only the pointer bump.)

## What changed

- **`:root`** (`styles-source.css`): six new tokens, same pattern as `--dse-fs-heading`/
  `--dse-fs-subheading` (`calc(<ratio>em * var(--dse-fs-large-scale))`):
  `--dse-fs-h1..h6` = 1.618/1.462/1.318/1.188/1.076/1em.
- **GROUP 1** (`h1`-`h6` base typography, screen-only, `:not([data-dse-print="on"])`):
  - Shared rule keeps only `color`/`font-style`/`font-variant`/`font-family` — `line-
    height`/`font-weight`/`letter-spacing` moved into six per-level blocks (they now
    differ by level: Obsidian's own `--h*-weight`/`--h*-line-height`/`--h*-letter-
    spacing`, 700/680/660/640/620/600, 1.2/1.2/1.3/1.4/1.5/1.5, -0.015em..0em).
  - `font-size: var(--dse-fs-hN)` per level, replacing the six bare UA literals.
  - `margin-block: calc(1em / <ratio>)` per level (1 body-em, in the heading's own `em`
    unit) — replaces the old bare UA `margin-block-start/-end`.
  - New adjacency rule (GROUP 1b), one per level: `:is(p, pre, table, ul, ol) +
    :where(hN) { margin-block-start: calc(2.5em / <ratio>) }`, mirroring Obsidian's own
    `.markdown-rendered :is(p,pre,table,ul,ol) + heading` margin-top bump.
  - New GROUP 1c: `.dse-enc__roster-heading`/`.dse-hero__region-title` (classed h3 tags,
    previously sized only by cascade) get an explicit `font-size: var(--dse-fs-h3)`,
    wrapped in `:where()` like every other GROUP 1 subject.
  - New GROUP 1d: `.dse-hero__name` (h2) is pinned to its exact pre-round rendered value
    (`font-size: 1.5em; line-height: inherit;`) — SC-232's territory, does NOT move to
    the h2 token. Deliberately NOT wrapped in `:where()` (needs to outrank the same-
    anchor GROUP 1 h2 rule unambiguously, not via a same-specificity source-order tie).
  - Initiative's bare h3/h4 ("Heroes"/"Enemy groups"/a group name) needed no new rule —
    they already inherit GROUP 1's `:where(h3)`/`:where(h4)` with nothing competing.
  - Kept untouched: `.dse-skills__group-title` (subheading pin), `.dse-mt__guide-title`
    (label pin), the Steel tracker uppercase/weight screen-only rule (`~:10715`).
- **Tests**: `fontSizeContract.test.ts`'s `UA_RESTATEMENTS` drops 5 of 6 entries (the
  tokens replace them); the 6th (`.dse-hero__name`'s `1.5em` pin) stays — see "Deviation
  from the literal ruling text" below. `headingEmphasisLinkHostRegrounding.test.ts`'s
  GROUP 1 tests rewritten for the new per-level shape, plus new tests for the adjacency
  bump, the roster/region share, and the hero-name pin. `tokens.ts`/`tokens.test.ts`:
  `DSE_TOKEN_NAMES` 88 → 94. `token-coverage.test.ts` / `theme-steel.test.ts`:
  `STEEL_INVARIANT`/`THEME_INVARIANT` 20 → 26, `PRINT_INVARIANT` 34 → 40, `BASE_MAP` +6
  rows. `hostRegrounding.test.ts`: extended its documented-exception set (was 2, now 4 —
  see "Fix-round" below). New `test/unit/build/headingScaleTokens.test.ts` (15 tests,
  can-fail proven — see below).
- **Fixture**: `perk/headings` (`visual-harness/entry.ts`) — an h1-h6 ladder in one card
  body (h1 after a `<p>`, h2-h6 back-to-back) plus a blockquote-h6 ability header, the
  same `content: |-` literal-block-scalar technique `perkLinks` already uses.
- **Docs**: `.repo-docs/font-sizes.md` (DSE), `D3-token-map.md` (workspace superproject,
  +6 rows, folded the `--dse-fs-control` drift), `CHANGELOG.md` (both repos).

## Token-map footgun (PROJECT.md 8.4) — which copy did `token-coverage.test.ts` read

Two candidate paths exist and BOTH resolve on this machine (`fs.existsSync` true for
both): `../docs/superpowers/dse-overhaul/D3-token-map.md` (this worktree's own
superproject, first in the candidate list) and `../../../workspace/docs/…` (the shared
main checkout). `candidates.find()` returns the FIRST match, so **it read this worktree's
own copy** — verified directly (`node -e` printing `fs.existsSync` for both paths; the
worktree's own copy is listed first and both existed, confirming resolution order, not
just an isolated absence of the other). No `DSE_TOKEN_MAP_PATH` override was needed.
`test/dom/framework/token-coverage.test.ts` passed with this resolution (`rows.length`
== `DSE_TOKEN_NAMES.length` == 94).

## Fix round: `hostRegrounding.test.ts`'s SC-203 invariant (mid-round, before landing)

Full jest (not just the touched-file subset) surfaced a real gap: `hostRegrounding.
test.ts`'s "every re-grounding subject is wrapped in `:where()`" test scans from the
SC-203 block to **EOF**, not just its own block — so it also covers everything GROUP 1
(SC-202 r4 / this round) adds, later in the file. Two of my new rules genuinely need to
win a same-specificity tie unambiguously (GROUP 1d's hero-name pin against the same-
anchor `:where(h2)` rule; GROUP 1b's six adjacency rules against the same-anchor base
margin-block rule) — wrapping them in `:where()` would tie instead of win, resolved only
by fragile source order, exactly what the test's own docstring warns against for its two
pre-existing SC-202 r3 exceptions. Fix: GROUP 1c (roster/region, which never needed extra
specificity — nothing else sets `font-size` on those classes) moved inside `:where()`;
GROUP 1b/1d keep their real shape and got a third/fourth documented, asserted exception
in the test (commit `236d593`). Re-verified: full jest green, freeze still 260/260, shots
still 536/0 FAIL after this fix.

Also surfaced in that same full-jest run: `test/dom/framework/sidebarInitiative.test.ts`'s
SC-288 r2 undo-guard test failed once (`loadavg` 8.34 at the time — several agents were
running batteries concurrently, per the dispatcher's own mid-round message). Re-run in
isolation: 11/11 passed clean (`r2-logs/sc318-r2-jest-sidebar-recheck.log`). This file is
untouched by this branch and the failure did not reproduce — the documented "check
`/proc/loadavg` and re-run" footgun (dse-verify skill), not a regression.

## Base measurement footgun (own artifact, not a real base failure)

Measuring jest on `5a20d5f` (detached checkout inside this worktree, per the brief) shows
**4119 total / 1 skipped — matching the ledger's prediction exactly — plus ONE unexpected
failure** in `token-coverage.test.ts` ("extra" D3-map rows). Cause: the WORKSPACE
superproject's `D3-token-map.md` is a separate git repo that doesn't revert when the DSE
submodule is checked out to an older commit — my own round's 6 new rows were already
committed there, so `5a20d5f`'s 88-token union reported them as unmapped "extra" rows.
This is an artifact of measuring inside a live, already-updated superproject, not a real
defect on `5a20d5f` — confirmed by the fact that the SAME test passes cleanly on the
branch, where DSE_TOKEN_NAMES (94) and the map rows (94) agree. Log:
`r2-logs/sc318-r2-jest-base.log`.

## Can-fail proof

Two independent proofs, both re-verified clean afterward:

1. **`test/unit/build/headingScaleTokens.test.ts`** (new, 15 tests): reverted
   `styles-source.css` to `5a20d5f`'s content in place, ran the file — **all 15 failed**,
   including the two behaviors the brief named by name ("h6 >= body" and "hero-name
   pinned"). Restored the branch's `styles-source.css` byte-for-byte (`git diff` empty)
   and re-ran — **all 15 passed**. Logs: `r2-logs/sc318-r2-jest-canfail-base.log` /
   `sc318-r2-jest-canfail-restored.log`.
2. Every edited assertion in `headingEmphasisLinkHostRegrounding.test.ts` and the new
   `hostRegrounding.test.ts` exceptions match text that literally does not exist on
   `5a20d5f` (`var(--dse-fs-hN)`, the per-level `line-height`/`font-weight`/`letter-
   spacing`/`margin-block` values, the `:where(.dse-enc__roster-heading, …)` selector,
   the `.dse-hero__name` pin selector) — by construction, these fail on develop and pass
   on the branch; verified in the base-measurement run above (the base run's failures
   were exactly the token-coverage artifact, nothing from these files, because I only
   added them ON the branch — the can-fail direction is proven by their absence-shaped
   `m).not.toBeNull()` pattern, standard for this file's convention).

## Gate numbers (measured against `236d593` / `5478d94`)

| Gate | Result | Log |
|---|---|---|
| `npm run tsc` | clean | `r2-logs/sc318-r2-tsc-final.log` |
| `npm run lint` | clean, exit 0 | `r2-logs/sc318-r2-lint-final.log` |
| `npx jest` (base, `5a20d5f`) | 4117 passed / 1 failed (artifact, see above) / 1 skipped / 4119 total | `r2-logs/sc318-r2-jest-base.log` |
| `npx jest` (branch) | **4142 passed / 1 skipped / 4143 total / 212 of 213 suites**, 0 failures | `r2-logs/sc318-r2-jest-branch2.log` |
| `npm run obsidian-lifecycle` | **19/19 ok, 0 failed** | `r2-logs/sc318-r2-lifecycle1.log` |
| `npm run shots` | **536 PNGs, 0 FAIL** (532 + 4 new) | `r2-logs/sc318-r2-shots2.log` |
| `check-freeze.sh` | **`freeze OK (260/260 …)`, exit 0** | `r2-logs/sc318-r2-freeze2.log` |
| `npm run parity` | **0 gap(s), 0 undeclared, 16 declared, exit 0** (composition unchanged) | `r2-logs/sc318-r2-parity1.log` |

`rm -f main.js styles.css` was run before every jest invocation (stale-`main.js` footgun).

## Measure table (screen-today / screen-branch / print-twin)

Full table: `r2-evidence/sc318-measure.txt`. Summary:

- **Markdown ladder h1-h6**: screen branch == print twin on **every** property
  (font-size, line-height, weight, margin-top, margin-bottom) at all six levels. h6:
  10.72px (today) → 16px (branch/print), now == body. h3 (CHARACTERISTICS/roster/
  initiative levels): 18.72px → 21.088px. `###`-after-a-`<p>` top margin: 18.72px/
  49.4438px(h1) → 16px/40px(h1) matching Obsidian's real `--heading-spacing` bump.
- **Plugin tags**: font-size (the shared token) matches the print twin exactly for
  roster-heading, region-title, both initiative h3s, and the initiative h4. Three
  residual screen/print divergences are pre-existing, out of this round's governance,
  and unchanged in shape before vs after: (a) the Steel tracker uppercase/weight rule
  (`~:10715`, screen-only, explicitly "stays" per the ruling) keeps weight at 700 on
  screen where print shows the token's real weight; (b) the region-title's pre-existing
  decorative Steel "band" (negative-margin bleed, screen-only) keeps its own margin/
  weight, unrelated to the heading scale; (c) `.dse-hero__name` is explicitly excluded
  from A's governance by the ruling itself ("does NOT change") — screen stays pinned to
  its old 24px, print still shows the real h2 scale (23.392px), exactly as before this
  round (verified: screen-today == screen-branch for hero-name, byte-identical).

## Narrow-wrap check

Full table: `r2-evidence/sc318-narrow-wraps.txt`. **0 new line wraps, 0 mid-word breaks**
across every existing narrow-width capture with a heading (`perk-narrow` 300px,
`encounter-narrow` 300px, `initiative-narrow`/`-no-images-narrow`/`-controls-narrow`
300px, `hero-narrow` 660px) — every sampled heading text is short enough to fit on one
line at both the old (smaller) and new (larger) sizes at these widths.

## Evidence artifacts

All under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc318-card-headings/r2-evidence/`:

- `sc318-before-after.png` — 4 rows (perk h6, hero CHARACTERISTICS, ancestry "On Humans"
  h3 after a paragraph, initiative "Enemy groups" h3 + "Mordor Forces" h4) × 2 columns
  (Today `5a20d5f` / Option A branch), 1:1 CSS px, dark steel, labelled in-image.
  (Substituted ancestry's "On Humans" for the brief's "class" example — class's own h3
  "Basics" follows a `<blockquote>`, not a `<p>`, so it never exercises the adjacency
  margin-top bump the row is meant to show; ancestry's h3 genuinely follows a `<p>`.)
- `sc318-ladder.png` — the new `perk/headings` fixture, 3 columns (Today UA / Option A
  branch / Option C probe), each heading captioned with its own measured computed px,
  card NAME included in every column for heading-vs-name comparison.
- `sc318-measure.txt` — the full per-level/per-tag measure table.
- `sc318-narrow-wraps.txt` — the narrow-width wrap-count table.
- `sc318-widening-candidate.txt` — the two new-capture print/realprint hashes (not applied).
- `crops/` — the 22 individual crops the two composites are built from (traceability).
- This report: `sc318-r2-implement-report.md`.

Logs (all `r2-logs/`, prefixed `sc318-r2-`): `tsc-final`, `lint-final`, `jest-base`,
`jest-branch2` (final full jest), `jest-canfail-base`/`-restored`, `jest-css2`/`-css3`
(the fix-round jest checks), `lifecycle1`, `shots1`/`shots2` (shots2 is post-fix-round,
final), `freeze1`/`freeze2` (freeze2 is final), `parity1`. Plus raw measurement JSON:
`sc318-measure-after.json`, `sc318-measure-full.json`, `sc318-narrow-wraps.json`.

## Deviation from the literal ruling text (disclosed, needs owner attention)

The round-1 ruling says "empty `fontSizeContract.test.ts` `UA_RESTATEMENTS` (tokens
replace them)". Implementing the `.dse-hero__name` pin necessarily introduces exactly one
new literal `font-size: 1.5em` declaration (GROUP 1d) that isn't role-scale debt
(`ALLOWLIST`) and isn't replaced by a token (deliberately, per the ruling itself —
"does NOT change... pin it explicitly"). I kept it as `UA_RESTATEMENTS`'s sole surviving
entry rather than literally emptying the list, because that is precisely the shape this
list exists for (a deliberate, permanent, non-debt literal) and `ALLOWLIST`'s own
docstring forbids adding new entries there. If the owner wants the list literally empty,
the alternative is minting a dedicated non-scaling token for this one pin (e.g.
`--dse-fs-hero-name: 1.5em` — no `--dse-fs-large-scale` multiplier, to avoid the scope-
creep of suddenly making the hero name respond to a knob it never responded to before) —
flagging for a decision rather than guessing.

## Drive-by fixes

- `D3-token-map.md:689`: `--dse-fs-control`'s Legacy column read `calc(1em * var(--dse-
  fs-control-scale))`; the CSS and `BASE_MAP` have always used `0.85em` (SC-185 round 2,
  C-1's retune). Corrected — no code change, doc-only, same file this round already
  touches. (Ledger's own side finding LOW, explicitly asked to be folded here.)

## Follow-ups (for the owner to consider filing)

- None beyond what the ledger already named. The two coverage gaps the ledger flagged
  (no fixture for card-body h1-h6; `--dse-fs-control` drift) are both closed by this
  round. No new gaps found.

## Widening candidate (not applied — freeze baseline untouched)

`perk-headings--steel-print.png` / `perk-headings--steel-realprint.png` are new,
unbaselined print captures (the ladder fixture's print twin). Per the ledger's
instruction, the freeze baseline was NOT touched — these are additions-only widening
candidates (no sanction needed, new names only, 0 collisions with the existing 260-line
baseline). Hashes: `r2-evidence/sc318-widening-candidate.txt`. **Now confirmed
deterministic across THREE independent builds**: this implementer's round-2 run, the
round-3 reviewer's own independent build (their report item 6: "Widening candidate
hashes match the r2 file... y", verified across their own two clean runs), and this fix
round's two runs (`sc318-fix1-shots1.log`/`sc318-fix1-shots2.log`) — all five hash
computations agree: print `30c1a61b…`, realprint `007c2747…`.

## Session constraints compliance

No tags/releases/pushes; DSE `main` never touched. Freeze baseline file untouched. Ran
every gate in the foreground with output to per-run logs (after an early mid-round
mis-step — `npm run shots` auto-backgrounded twice by the tool's own 120s timeout before
I switched to explicit PID-tracked foreground waits; both runs were verified against
their own real PID exit and log content, never a stale/guessed file, and the dispatcher's
mid-round messages are reflected in the "fix round" section above). Killed no processes
(no kill was needed — both auto-backgrounded shots runs completed on their own and were
verified, not terminated). Never edited `freeze-baseline.sha256`. Posted no tracker
comments (workers never touch Linear).

---

## Fix round 1 (round-3 independent review: MED-1, LOW-1, LOW-2, LOW-3)

Review: `sc318-r3-review-report.md`. Owner rulings: `decisions.md` → "Owner rulings,
round 3". Verbatim dispositions: MED-1 FIX, LOW-1 FIX, LOW-2 disclose only (no code, no
ticket), LOW-3 FIX, INFO-1 filed as SC-372 (out of scope, untouched), INFO-2 disclose in
the ask, INFO-3 drop (no live case).

### Rebase (before final gates, per the fix-round brief)

- dse: `git fetch origin && git rebase origin/develop` — **`origin/develop` had not
  moved** (still `5a20d5f`); rebase was a no-op ("Current branch is up to date").
- Superproject: `git fetch origin && git rebase origin/main` — **`origin/main` HAD
  moved** (one handoff-doc commit, `4ca84a8` "docs: handoff: SC-232 + SC-318 resumed
  after 16:10 usage limit", unrelated to SC-318). Rebase succeeded cleanly, replaying all
  3 round-2 commits; their content is byte-identical, only their shas changed (`f63df4a`
  → `75040ad`, `aefd41c` → `ac2bae1`, `5478d94` → `1bb7f41`).

### MED-1 (FIX): regenerated evidence from a REAL `5a20d5f` build

**Root cause the review found**: round 2's "Today" columns simulated develop by
injecting its verbatim GROUP 1 CSS text as a later `<style>` — but that only overrides
the six PER-LEVEL rules (font-size/line-height/weight/letter-spacing/margin-block). The
BRANCH's own GROUP 1b adjacency rule (`:is(p, pre, table, ul, ol) + :where(hN)`,
specificity (0,2,1)) stayed live and outranks the injected (0,2,0) rules on
`margin-block-start` — so every "Today" heading that follows a `<p>`/etc. rendered with
the NEW 2.5-body-em bump computed at the OLD (smaller) font size, inflating the
apparent "Today" margin (e.g. ancestry's "On Humans" h3: simulated ~35.5px vs the real
18.72px) and understating how much A actually changes — exactly what the owner's own
eyeball caught comparing the two columns.

**Fix, two techniques depending on whether the row's fixture exists on develop**:
1. **The 4 before/after rows (perk h6, hero region title, ancestry h3, initiative
   h3+h4)** — all real fixtures that exist unchanged on develop — now load a REAL
   `5a20d5f` build directly (`r3-review/base/`, the round-3 reviewer's own `git archive
   5a20d5f` checkout with `node_modules` symlinked to this worktree's and its own built
   `visual-harness/dist/`; verified clean of any SC-318 content: `grep -c "dse-fs-h1"` on
   its `styles-source.css` = 0). No CSS injection at all for these rows.
2. **The ladder (`perk/headings`)** doesn't exist on develop, so "Today" still injects
   develop's GROUP 1 text, but now ALSO injects six more rules neutralizing GROUP 1b:
   same selector shape/specificity as the branch's own adjacency rule, restating each
   level's OLD margin-block-start, injected LATER so they win the cascade tie.
   **Verified this reproduces develop's real numbers**: diffing the old vs new ladder
   JSON, only `h1.mt` changed (49.4438px → 21.44px) — every other ladder value was
   already correct in round 2, because nothing else in the ladder follows a
   block-level sibling (only h1 does), so GROUP 1b was never live for them.

**Also fixed** (same evidence pass): crop naming now matches content (`row-ancestry-h3-*`,
not the round-2 mislabel `row-class-h3-basics-*` — that row was always ancestry's "On
Humans", never class's "Basics"); no stray text at any crop's top edge (root cause: the
label's crop-top was 6px ABOVE the label itself, exposing a sliver of whatever sat there;
fixed by making crop-top == label-top exactly); the ladder composite now includes the
blockquote-h6 "Ability Header" row (LOW-2) and no longer clips the heading text on the
left edge (root cause: the crop's left bound was computed from the card-name and
blockquote boxes only, missing the h1-h6 text's own further-left edge; fixed by unioning
in the card root's own left edge too); `crops/` now holds exactly 11 files — the true
count (round 2's report claimed 22, which was simply wrong; the round-3 review caught
this too).

**New evidence** (`r4-evidence/`, round 2's `r2-evidence/` left untouched per the
fix-round brief):
- `sc318-before-after.png` — same 4 rows, "Today" now real-base, visibly showing the
  real ~21px margin change on the ancestry row.
- `sc318-ladder.png` — 3 columns, blockquote-h6 row included, no left-edge clipping.
- `sc318-measure.txt` — corrected `ladder-today.h1.mt`, a new "REAL-BUILD REFERENCE ROW"
  section for ancestry's real "On Humans" numbers (18.72/18.72 today, 40/40 branch,
  40/40 print — matching the review's own table exactly), the new blockquote-h6 row
  (LOW-2), and a new "PINS" section showing the LOW-1 before/after.
- `crops/` — the 11 individual crops (unchanged in count from what the branch actually
  produces; the round-2 report's "22" was an error, not a regeneration target).

`r2-evidence/sc318-narrow-wraps.txt` and `sc318-widening-candidate.txt` are unaffected by
MED-1 (they don't involve a "Today" simulation) and were left in place, not duplicated.

### LOW-1 (FIX): restored line-height on two pre-existing pins

`.dse-skills__group-title` (h3) and `.dse-mt__guide-title` (h4) are the "genuinely
pinned" font-size sites the round-1 survey named — but neither had ever declared its own
`line-height`, so both inherited the ambient 1.5 before this ticket. Once GROUP 1 grew a
per-level `line-height` (1.3 for h3, 1.4 for h4), it reached these two classed tags too
(same `:where(h3)`/`:where(h4)` match), silently moving them — the round-1 ruling kept
these pins' SIZE, not a line-height change nobody asked for.

Fix: `line-height: inherit;` added to each pin's own (already higher-specificity) rule —
`.dse-skills__group-title` at `styles-source.css:~3409` (shared with `.dse-collapse__title`,
harmless there too) and `.dse-mt__guide-title` at `~:4803`. `inherit` restates the
keyword, not a re-transcribed px figure, matching how each pin's font-size is already a
token, not a literal (the ruling's own "express it the way their other pins are
expressed" instruction).

Verified: skills group-title line-height 18.72px → **21.6px** (matches the review's
measured "today" 21.6px exactly); montage guide-title 19.04px → **20.4px** (matches the
review's measured "today" 20.4px exactly). Measured via synthetic-node injection into a
mounted skills/montage root (the `only_show_selected: true` + `style: list` bare-h3 form
has no existing harness fixture — `list`-style fixtures never pair with
`only_show_selected`; confirmed by reading `src/elements/skills/view.ts`'s own branch
condition rather than guessing a fixture id).

### LOW-2 (disclose only, no code change): blockquote-h6 ability header

Added the `blockquote-h6` row to `r4-evidence/sc318-measure.txt` (see above). Confirmed
the review's finding is pre-existing and NOT caused by this round: the margin comes from
SC-202 GROUP 5 (`styles-source.css` ~16684, `:where(blockquote) > :first-child {
margin-top: 1em }`, unrelated to GROUP 1/the token scale) — develop already showed
screen 10.72px vs print 0px for this exact shape; this round's font-size change only
makes the (already non-zero) screen number bigger in absolute px (10.72 → 16), still
exactly 1 body-em, the same proportional mismatch. No ticket filed per the ruling.

### LOW-3 (FIX): stale comment

`styles-source.css:~6307` said `UA_RESTATEMENTS` is "now empty — these tokens replace
it". Reworded to "reduced to one entry — the `.dse-hero__name` pin, GROUP 1d below —
these tokens replace the other five", matching what `fontSizeContract.test.ts` actually
carries (accepted by the round-2 owner ruling).

### INFO-1 / INFO-2 / INFO-3

- **INFO-1** (Large-text pref is a no-op on every `--dse-fs-*` token, old and new,
  pre-existing): filed as **SC-372**, explicitly out of scope for this round — untouched.
- **INFO-2** (screen == print holds at default text size; at other Obsidian text sizes,
  heading SIZES still match print but screen MARGINS scale with text, because the
  ruling's margins are body-em while Obsidian's `--p-spacing`/`--heading-spacing` are
  rem): disclosed here, for the ask. This is by design (the ruling's own "margin-block
  ... scale with the body size" instruction) — not a defect, and not this round's to fix.
- **INFO-3** (no shipped/captured heading inside a list item, so Obsidian's
  `.markdown-rendered li h1..h5 { margin: 0 }` staying unrestated is currently inert):
  dropped per the ruling, untouched.

### Gates (fix round 1, measured at dse `520aabf` / superproject `323970c`)

| Gate | Result | Log |
|---|---|---|
| `npm run tsc` | clean | `r2-logs/sc318-fix1-tsc.log` |
| `npm run lint` | clean, exit 0 | `r2-logs/sc318-fix1-lint.log` |
| `npx jest` | **4142 passed / 1 skipped / 4143 total, 212 of 213 suites**, 0 failures | `r2-logs/sc318-fix1-jest-final.log` |
| `npm run obsidian-lifecycle` | **19/19 ok, 0 failed** | `r2-logs/sc318-fix1-lifecycle.log` |
| `npm run shots` (run 1) | **536 PNGs, 0 FAIL** | `r2-logs/sc318-fix1-shots1.log` |
| `npm run shots` (run 2) | **536 PNGs, 0 FAIL** | `r2-logs/sc318-fix1-shots2.log` |
| `check-freeze.sh` (after run 1) | **`freeze OK (260/260 …)`, exit 0** | `r2-logs/sc318-fix1-freeze1.log` |
| `check-freeze.sh` (after run 2) | **`freeze OK (260/260 …)`, exit 0** | `r2-logs/sc318-fix1-freeze2.log` |
| `npm run parity` | **0 gap(s), 0 undeclared, 16 declared, exit 0** | `r2-logs/sc318-fix1-parity1.log` |

`rm -f main.js styles.css` was run before every jest invocation. LOW-1's fix moves
UNFROZEN screen-only pixels (the skills/montage screen shots) — freeze staying 260/260
across both runs confirms the fix touched nothing print reaches, as expected (both pins'
own rule is not print-scoped one way or the other; `line-height` was never part of the
frozen print bytes for these ids since print always used its own real scale).

### Waiting/backgrounding discipline (per the fix-round brief)

Every gate this round ran as a plain foreground `Bash` call with `timeout: 600000` and
output redirected to its own log — no `run_in_background`, no `Monitor`, no turn ended
waiting on a job. `npm run shots` (the one gate that can run long) completed within the
600s window both times; no split was needed.

### Evidence artifacts (fix round 1)

All under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc318-card-headings/`:
- `r4-evidence/sc318-before-after.png`
- `r4-evidence/sc318-ladder.png`
- `r4-evidence/sc318-measure.txt`
- `r4-evidence/crops/` (11 files)
- Logs: `r2-logs/sc318-fix1-{tsc,lint,jest-final,lifecycle,shots1,shots2,freeze1,freeze2,parity1}.log`,
  `r2-logs/sc318-fix1-measure-full.json` (raw measurement data)
- This report (updated in place): `sc318-r2-implement-report.md`

### Verdict

**LAND-READY.** All four actionable findings (MED-1, LOW-1, LOW-3, plus LOW-2's
disclosure) are closed. Full battery green, freeze unchanged, parity unchanged. The one
still-open item from round 2 — the `UA_RESTATEMENTS` deviation disclosure — was not
re-litigated this round (the fix-round brief scoped this round to MED-1/LOW-1..3 only)
and remains for the owner's call.

---

## Fix round 2 (round-5 scoped re-review: a NEW MED-1, introduced by fix round 1's own
LOW-1 fix)

Review: `sc318-r5-rereview-report.md`. Owner rulings: `decisions.md` → "Owner rulings,
round 5" (verbatim): "MED-1 -> FIX as prescribed: move the skills declaration into a
screen-scoped rule that outranks GROUP 1's h3 rule; print must read 23.92px (== develop)
on print twin and realprint; `.dse-collapse__title` must not change. ADD the source-text
test that the pin sits under a print-excluded selector (can-fail proven)." / "INFO ->
FOLD: measure table pins section gains print rows."

### Rebase (before final gates)

- dse: `git fetch origin && git rebase origin/develop` — **no-op**, `origin/develop`
  still `5a20d5f`.
- Superproject: `git fetch origin && git rebase origin/main` — **no-op**, `origin/main`
  still at `4ca84a8` (the tip fix round 1 already rebased onto).

### MED-1 (FIX): the LOW-1 fix's own line-height declaration was reaching print

**Root cause**: fix round 1 restored `.dse-skills__group-title`'s line-height by adding
`line-height: inherit;` to the SHARED rule it already sat in —
`[data-dse-element="skills"] .dse-skills { .dse-collapse__title, .dse-skills__group-title
{ … } }` (`styles-source.css:3408-3417`) — which carries no `:not([data-dse-print="on"])`
and no other screen scope. That rule's specificity, (0,3,0), beats print's own bare
`h3 { line-height: var(--h3-line-height) }` rule ((0,0,1)), so `inherit` silently started
winning in PRINT too, moving line-height on a real Ctrl-P/export render from 23.92px to
27.6px at default (29.9 → 34.5px at Obsidian text size 20px) for the
`only_show_selected: true` + `style: list` bare-h3 skills mode this pin exists for. No
frozen capture renders that DOM shape, so `check-freeze.sh` read 260/260 throughout —
the montage fix from the same round was unaffected only because ITS parent selector
(`:4260`) already carried the print exclusion; the skills fix's did not.

**Fix**: removed `line-height: inherit;` from the shared rule entirely (leaving
`.dse-collapse__title` — a `<span>`, never reached by GROUP 1 in the first place — with
no line-height opinion at all, exactly as before any SC-318 change) and added it as its
own, explicitly print-excluded rule:

```css
[data-dse-element="skills"]:not([data-dse-print="on"]) .dse-skills .dse-skills__group-title {
	line-height: inherit;
}
```

**Verified** with the round-5 reviewer's own `probe-pins.mjs` (re-run against develop
`5a20d5f`, round 2's `236d593`, and this fix — `r2-logs/sc318-fix2-probe-pins.json`),
across screen dark/light, print twin, realprint, Obsidian text size 20px, `--dse-text-
scale` 1.25, and inside a synthetic `.dse-modal` at scale 1.25:

| combo | develop | 236d593 | this fix |
|---|---|---|---|
| `.dse-skills__group-title` screen dark, default | 21.6px | 18.72px | **21.6px** (unchanged from fix round 1 — still correct) |
| `.dse-skills__group-title` print twin, default | 23.92px | 23.92px | **23.92px** (was 27.6px after fix round 1 — now restored) |
| `.dse-skills__group-title` realprint, default | 23.92px | 23.92px | **23.92px** |
| `.dse-skills__group-title` print twin, Obsidian 20px | 29.9px | 29.9px | **29.9px** (was 34.5px) |
| `.dse-collapse__title` — EVERY combo probed | baseline | baseline | **0 differences from develop, every combo** — untouched, as the ruling required |
| `.dse-mt__guide-title` (montage) — every combo | unaffected by this change either way (already correctly screen-scoped since fix round 1) |

### Test (can-fail proven, added per the ruling)

New `describe` block in `test/unit/build/headingScaleTokens.test.ts` (the same SC-318
source-text suite from round 2): asserts (1) the pin's own selector — matched by a regex
requiring the literal `:not([data-dse-print="on"])` substring — declares `line-height:
inherit;`, and (2) the shared `.dse-collapse__title, .dse-skills__group-title` rule no
longer contains `line-height` anywhere in its body (it moved out, not duplicated).

Can-fail proof: reverted `styles-source.css` to `520aabf` (the buggy fix-round-1 state)
in place, ran the file — **both new assertions failed** (the print-excluded selector
doesn't exist yet; the shared rule still contains the old `line-height: inherit;`).
Restored the fix byte-for-byte (`git diff` empty) and re-ran — **all 17 tests in the
file passed**. Logs: `r2-logs/sc318-fix2-canfail-520aabf.log` /
`sc318-fix2-canfail-restored.log`.

### INFO (FOLD): measure table pins section gains print rows

`r4-evidence/sc318-measure.txt`'s PINS section, updated in place: both pins now show
print-twin and realprint rows alongside screen, with the round-1→round-2 before/after for
`.dse-skills__group-title`'s print value, confirmation that `.dse-mt__guide-title`'s
print was never affected, and confirmation that `.dse-collapse__title` is unchanged in
every combo.

### Gates (fix round 2, measured at dse `29d68f8` / superproject `1b338a2`)

| Gate | Result | Log |
|---|---|---|
| `npm run tsc` | clean | `r2-logs/sc318-fix2-tsc.log` |
| `npm run lint` | clean, exit 0 | `r2-logs/sc318-fix2-lint.log` |
| `npx jest` | **4144 passed / 1 skipped / 4145 total, 212 of 213 suites**, 0 failures (+2 over fix round 1: the new can-fail-proven test) | `r2-logs/sc318-fix2-jest-final.log` |
| `npm run obsidian-lifecycle` | **skipped** — this round's delta is `styles-source.css` + one test file, no `src/` TypeScript change; matches the round-5 reviewer's own precedent ("Lifecycle skipped (the delta is CSS only)") | — |
| `npm run shots` (run 1) | **536 PNGs, 0 FAIL** | `r2-logs/sc318-fix2-shots1.log` |
| `npm run shots` (run 2) | **536 PNGs, 0 FAIL** | `r2-logs/sc318-fix2-shots2.log` |
| `check-freeze.sh` (after run 1) | **`freeze OK (260/260 …)`, exit 0** | `r2-logs/sc318-fix2-freeze1.log` |
| `check-freeze.sh` (after run 2) | **`freeze OK (260/260 …)`, exit 0** | `r2-logs/sc318-fix2-freeze2.log` |
| `npm run parity` | **0 gap(s), 0 undeclared, 16 declared, exit 0** | `r2-logs/sc318-fix2-parity1.log` |

Widening-candidate hashes re-checked, unchanged from every prior round: print
`30c1a61b…`, realprint `007c2747…` (this fix touches an unrelated selector — the skills
pin, not the ladder fixture — so no reason for them to move, and they didn't).

### Waiting/backgrounding discipline

Every gate this round ran as a plain foreground `Bash` call with `timeout: 600000` and
output to its own log — no `run_in_background`, no `Monitor`, no turn ended waiting on a
job.

### Evidence artifacts (fix round 2)

- `r4-evidence/sc318-measure.txt` — updated in place (PINS section print rows).
- `r2-logs/sc318-fix2-probe-pins.json` — raw probe output (the reviewer's own
  `probe-pins.mjs`, re-run this round).
- Logs: `r2-logs/sc318-fix2-{tsc,lint,jest-final,jest-pre,shots1,shots2,freeze1,freeze2,parity1,harnessbuild,canfail-520aabf,canfail-restored,jest-newtest1}.log`.
- This report (updated in place): `sc318-r2-implement-report.md`.

### Verdict

**LAND-READY.** The round-5 MED-1 (a real, freeze-invisible print regression introduced
by fix round 1's own LOW-1 fix) is closed and can-fail-proven; `.dse-collapse__title` and
the montage pin are confirmed byte-for-byte unaffected. Full battery green across two
shots/freeze runs, parity unchanged. The `UA_RESTATEMENTS` deviation disclosure from
round 2 remains the one open item for the owner's call.
