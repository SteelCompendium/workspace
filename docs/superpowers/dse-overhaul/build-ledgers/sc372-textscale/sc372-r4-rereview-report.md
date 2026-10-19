# SC-372 r4: scoped re-review of the r3 delta (98dcb22..f6d29ec + superproject 51e5d8d)

## Executive summary
- **Verdict: LAND-READY after a routine rebase.** The r3 code is correct and every gate reproduces. The only open item is landing hygiene: origin/develop has moved to e9502a8 since r3.
- **Findings: 0 BLOCKER, 0 HIGH, 0 MEDIUM, 1 LOW, 3 INFO.** The LOW is the rebase. When I replayed the branch onto e9502a8, the only conflict was one trivial CHANGELOG hunk. The sweep stays green there (102969 / 199 loads), and the expected freeze line becomes 276/276.
- **CSS:** byte-identical to `spec-once-block.css`. The only difference is one trailing blank line. There are 0 deleted lines, so the token rule, the prompt rule and every consumer rule are unchanged.
- **Exactly once:** the r2 oracle (unchanged `enum.mjs` + `compare.mjs`) compared the no-registry tree against r3 on the same harness bundle, with 0 violations in every run. Screen 1.2: 74,589 ratios, 1,670 fixed. Print 1.2: 75,453 ratios, 382 fixed. Screen 0.8: 74,589 ratios, 1,670 fixed. Print 0.8: 75,453 ratios, 382 fixed. Default baselines: 0 of 32,908 + 48,082 differ.
- **Nothing becomes inert:** in that comparison, every single-S ratio stays exactly S (12,086 on screen, 3,326 in print). A per-element probe of statblock, feature and counter embedded in the party G-S6h slots found 0 inert and 0 over-scaled texts, at both 1.2 and 0.8.
- **The gates bite:** with the registry removed, the shipped sweep prints `TEXT SCALE COMPOUNDS - 12`, the same 12 lines as r2's log, and the 3 new `text scale OK` rows fail 14 times. The divergence test bites at 0.85→0.86em, and 4 further mutations also fail it.
- **Battery (branch f6d29ec):** tsc and lint clean. jest 4438 passed / 1 skipped / 220 of 221 suites; I measured the base 0ecb90e at 4431 / 1 / 219 of 220, so the branch is base + 7 tests and + 1 suite. shots 568, 0 FAIL. `text scale OK (1146)`. `text scale once OK (102063 / 197 loads)`. Freeze 274/274 against the 274-line baseline that matches this base. Parity 0 / 0 / 24.

## Findings

### LOW-1: origin/develop moved past the branch base again (0ecb90e → e9502a8), and the shared freeze baseline moved with it
- **Where:** branch `sc372-textscale` @ f6d29ec sits on 0ecb90e. origin/develop is now e9502a8: SC-417 (be4f002), SC-411 (GIF camera) and SC-390 (sdk 3.1.0 + companion statblock) have all landed. SC-390 also rebaselined 2 lines of `.superpowers/sdd/freeze-baseline.sha256` (`statblock-roleless-corpus--steel-{print,realprint}`) and widened it by 2 (`statblock-companion-corpus--…`). The rebaseline was applied 2026-10-18 15:02, and the backup is `freeze-baseline.sha256.pre-sc390-bak`.
- **Failure scenario:** someone gating this branch as it stands sees `FREEZE VIOLATED (2 checksum mismatches, 2 missing)` and reads it as an SC-372 leak, or lands the branch without the rebase. In fact the branch's shots match the pre-SC-390 baseline 274/274, with 0 mismatches (`logs/r4-freeze.log` plus a `sha256sum -c` against the `.pre-sc390-bak`). All 4 non-OK lines belong to SC-390.
- **Fix (owner/landing, not code):** rebase onto origin/develop, run `npm ci` (package.json changed: sdk 3.1.0, gifenc, pngjs), and re-run the battery.
  - I replayed the branch onto e9502a8 in a scratch worktree, now removed. `git cherry-pick 0ecb90e..f6d29ec` hit exactly one conflict: `CHANGELOG.md`, where the SC-372 [FIX] entry sits next to SC-390's [FIX] entries. Keeping both hunks resolves it. `src/framework/tokens.ts` and every other file merged cleanly.
  - On the replayed tree: jest 4508 passed / 1 skipped / 223 of 224 suites. The e9502a8 base itself was not measured.
  - Shipped sweep, sliced: `text scale once OK (102969 comparisons over 199 loads)`. That is +906 comparisons and +2 loads for SC-390's `statblock-companion-corpus` screen + twin. `text scale OK (1146)`, unchanged.
  - **Expected numbers after rebase:** `text scale once OK (102969 … 199 loads)` and `freeze OK (276/276 …)`. The shots PNG count will move with SC-390's new id (+4 PNGs expected, not measured; I did not run a full shots pass on the replay).

### INFO-1: `tokens.ts` comment says "Fourteen of these tokens", but the 12 tokens in that block come right after it
- **Where:** `src/framework/tokens.ts:123-126`. "Fourteen of these tokens are scale-dependent (the eight roles plus h1-h6)". The next sentence says "All twelve are theme- AND print-invariant". h1–h6 are the next block (SC-318, `:142-155`).
- **Failure scenario:** none at runtime. A reader counts 14 out of a block of 12.
- **Fix (optional):** "Fourteen --dse-fs-* tokens are scale-dependent (the eight roles here plus SC-318's h1-h6 below)". INFO-4 is otherwise done.

### INFO-2: the CHANGELOG sentence describes a compounding bug no released build ever had
- **Where:** `CHANGELOG.md:35-36`, under `## 7.0.0 (unreleased)`. Before SC-372 the knobs did nothing at all. The ×1.44 compounding existed only on the unlanded r1 branch.
- **Failure scenario:** none harmful. The wording ("scales once, not twice") is the §F1.4 step 5 text the owner ruled in. It reads as a fix for something users never saw, and it omits the control-knob case (initiative turn and action-toggle buttons).
- **Fix (optional):** keep it, or rephrase as plain behaviour ("Text nested inside other small text … scales by the setting once"). No action required.

### INFO-3: the sweep cannot see an over-broad registration; only the named rows can
- **Where:** `visual-harness/shoot.mjs` `sweepKnobs` (the r2 prototype, ported verbatim). It accepts a ratio of 1 or S, so text that a registry entry made inert (ratio 1 where S was due) passes. The 3 new `TEXT_SCALE_PAGES` rows pin the 3 inner consumers known today. `.repo-docs/font-sizes.md` tells authors the sweep "fails … on any element that scales by a knob twice", which is accurate, but it does not mention the inert direction.
- **Failure scenario:** a future registration that covers a consumer behind an absolute-size or other-knob element would make that consumer stop following the knob, and every gate would stay green. Today: 0 such cases (oracle and nested-root probe below).
- **Fix (optional, docs):** add one sentence to the font-sizes.md registry paragraph: "when you register a container, add a `TEXT_SCALE_PAGES` row for its inner consumer (the sweep catches double scaling, not lost scaling)".

## Probe results (brief §2 items 1–6)

| # | Probe | Result |
|---|---|---|
| 1 | CSS vs `sc372-r2-review/spec-once-block.css` | The 59 added lines of `git diff 98dcb22..HEAD -- styles-source.css` equal the spec file plus one trailing blank line. 0 removed lines, so the token rule, prompt rule and consumer rules are untouched. Placed right after `--dse-fs-h6: calc(1em * var(--dse-fs-large-scale)); }` (styles-source.css:6653-6655). `git range-diff a337460..fcbcd09 0ecb90e..98dcb22` shows all 6 r1 commits as `=`, which confirms 98dcb22 is the rebased fcbcd09. The production build (`npm run build-no-check`, chrome106) lowers the block to flat `:where(…)>*, :where(…):before, :where(…):after, :where(…) :is([data-dse-element],.dse-modal)` lists. **The harness bundle does NOT lower nesting**: `dist/harness.css` ships `& > *` as written. So I also oracle-tested a page with the production-lowered rules swapped in: identical to the nested form (`cmp-lowered-vs-r3-screen-1.2.txt`: 0 differences, 0 violations). |
| 2 | Exactly once, 9 small + 3 control containers, 1.2 and 0.8, screen + print | Oracle = r2 `enum.mjs` + `compare.mjs`, unchanged, run on pages built from the r3 bundle with the registry present (`index-r3.html`) and with the 2 registry rules cut out of the same `harness.css` (`index-noreg.html` = r1 semantics on 0ecb90e, 423,819 bytes, the same size as r2's r1 sheet). Results:<br>• Screen 1.2: 74,589 ratios, 1,670 compounded→S, 12,086 S kept, 60,833 unmoved kept, **0 violations**.<br>• Print (twin + realprint) 1.2: 75,453 / 382 / 3,326 / 71,745, **0**.<br>• Screen 0.8: 74,589 / 1,670 / 12,086 / 60,833, **0**.<br>• Print 0.8: 75,453 / 382 / 3,326 / 71,745, **0**.<br>These are exactly r2's Hp numbers. Defaults: 32,908 + 48,082 baselines, 0 differ in every run.<br>Per inner consumer (`inner-check.py`), every measurement is exactly S on screen at both 1.2 and 0.8: badge-text 159, malice-log-heading 13, nt__why 6, rhead-w 22, rhead-sub 22, guide-item::before 5, chip-note 3, action-toggle 205, init__turn 22. On paper: badge-text 165, malice-log-heading 10, nt__why 3 and chip-note 3 are S. init__turn is 1 on paper (control). Montage rhead-w/-sub are 1 on paper, the same in the no-registry tree: their consumer rule is the screen-only Steel rule, a pre-existing r1 property and not part of this delta. **Control on paper: 25,151 of 25,151 ratios are exactly 1.** |
| 3 | Over-broad registry (inert text) | Oracle: every no-registry single-S ratio stays S, with 0 S→1 transitions over all 4 runs. Nested element roots (`probe-nested-inert.mjs`): statblock, counter and feature roots were moved into a plain container, then into a `.dse-party__member-ref` and a `.dse-party__member-deck` host, each wrapping a `.markdown-rendered` (the G-S6h shape). Per-element comparison at Small 1.2 and 0.8: **0 inert, 0 over-scaled**. Statblock {1: 29, S: 130}, feature {S: 34}, counter {S: 1}. The no-registry control gives statblock {S²: 36, S³: 6} and feature {S²: 4, S³: 4}, so the probe is not vacuous. The 29 ratio-1 texts are absolute-sized, and they are also 1 in the plain container. |
| 4 | Gate vacuity | **The shipped** `assertTextScaleOnce` + `sweepKnobs`, sliced verbatim from shoot.mjs (`once-runner.mjs`), run against `index-noreg.html`: `TEXT SCALE COMPOUNDS - 12 distinct element(s)`, whose sorted line set equals r2's `logs/gate-nesting-r1.log`. Against r3: OK. The shipped `assertTextScale`, run via r2 `gate-runner.mjs` on noreg: `TEXT SCALE BROKEN`, 14 lines: badge-text and nt__why × 0.8/1.2 × element root/twin/realprint (12), plus action-toggle × 0.8/1.2 (2). So the 3 new rows bite. `sweepKnobs` diffs byte-identical against `gate-nesting.mjs`, and the page loop matches it (screen: element×fixture + interactionShots(click) + prefShots(prefs, width) + chromeShots(stack, prefs, hover); twin: element×fixture; `mustNotMove: ['control']` off screen; S = 1.2). It is called once, right after `assertTextScale(page)` inside the `!args.element` full-run branch. Coverage limits, by spec: S = 1.2 only, twin but not realprint (the oracle covers 0.8 and realprint: 0 violations). Divergence test (`mutate.sh`, scratch worktree): M0 unmodified 7/7. M1 control 0.85→0.86em fails (Expected "0.85em", Received "0.86em"). M2 small label 0.85→0.86em fails. M3 micro dropped from the small registry fails (partial set). M4 a stray `.dse-stray-probe { --dse-fs-label }` fails test 3. M5 a large token mixed into the small registry fails (knobs ["small","large"]). M6 `&::after` dropped fails 2 tests. |
| 5 | Docs / scope | `.repo-docs/font-sizes.md:54-63`, D3-token-map point 4 (51e5d8d) and the CHANGELOG sentence all describe what the code does. INFO-1: `shoot.mjs:6295/6308` print `x ${value}` only when `expected !== b`, done. INFO-4: reworded (see INFO-1 above for a residual nit). Out of scope and untouched in the delta: SidebarPanel, CompendiumSearchModal, any `src/**/*.ts` besides the `tokens.ts` comment, `.claude/skills/dse-verify`, and the SC-422 surfaces. The only `src/` change is a comment. |
| 6 | Battery (branch f6d29ec, worktree) | tsc clean · lint clean (only the pre-existing `.eslintignore` warning) · jest **4438 / 1 skipped / 220 of 221** · base 0ecb90e measured in a detached scratch worktree: **4431 / 1 / 219 of 220**, so the branch is base + 7 tests (the 7 `it` blocks of the new `scaleTokenScope.test.ts`) and + 1 suite. The first base run showed 4430 / 2 skipped; the extra skip was `printTwinDeltaAllowedSet`'s "no cached obsidian-app.css", a scratch-location artifact, gone once I copied the cached sheet in. · shots **568 PNGs, 0 FAIL**, `text scale OK (1146 comparisons …)`, `text scale once OK (102063 comparisons over 197 loads …; 68s)`, print-twin delta OK 141 ids, every other in-run gate OK · freeze against the current shared baseline: `FREEZE VIOLATED (2 mismatches, 2 missing)`, all SC-390 (LOW-1); against the 274-line pre-SC-390 baseline that matches this base: **274/274, 0 mismatches** · parity **0 gaps / 0 undeclared / 24 declared** (run last). |

## Evidence images
- `evidence/sc372-small-120.png`: AFTER looks right. Every tier badge ("≤11", "12-16", "17+", "crit") is on one line, inside its badge, and visibly larger than BEFORE. Measured (`probe-badge.mjs`): at Small 1.2 the badge-text is 15.55px inside a 17.28px badge. Without the registry it is 18.66px, larger than the badge, and "12-16" wraps.
- `evidence/sc372-control-120.png`: AFTER looks right. "Advance round", "Add" and the malice ± stepper are larger and inside their boxes. No button label overflows. Small-knob text (the malice log heading) correctly does not move under Control.

## Artifacts (all under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc372-textscale/sc372-r4-rereview/`)
- `logs/`: `r4-tsc.log`, `r4-lint.log`, `r4-jest.log`, `r4-jest-base-0ecb90e.log`, `r4-shots.log`, `r4-freeze.log`, `r4-parity.log`, `r4-build.log`, `r4-vacuity-noreg-once.log`, `r4-vacuity-noreg-textscale.log`, `r4-mutations.log`, `r4-nested-inert.log`, `r4-badge.log`, `r4-badge-noreg.log`, `r4-rebased-once.log`, `r4-rebased-textscale.log`, `r4-jest-rebased-e9502a8.log`, `r4-rebased-npmci.log`, `r4-rebased-harness-build.log`
- `out/`: enum JSON + logs and `cmp-r3-{screen,print}-{1.2,0.8}.txt`, `cmp-lowered-screen-1.2.txt`, `cmp-lowered-vs-r3-screen-1.2.txt`
- `harness/`: `index-{r3,noreg,lowered}.html`, `harness-{r3,noreg,lowered}.css`, `dist/` (the r3 harness bundle snapshot), generated `once-index-noreg.mjs`, `gate-index-noreg.mjs`
- Scripts: `once-runner.mjs`, `run-enum-r4.sh`, `enum-jobs.txt`, `run-cmp.sh`, `inner-check.py`, `mutate.sh`, `probe-nested-inert.mjs`, `run-nested.sh`, `probe-badge.mjs`
- `rebased-gen/once-index.mjs` (the sliced sweep that ran on the replayed tree)

Tree state: dse worktree `git status --porcelain` empty before and after, HEAD f6d29ec. Superproject worktree ` M draw-steel-elements` before and after (the unbumped pointer), HEAD 51e5d8d. The scratch worktree has been removed and pruned. Nothing was committed to the branch.

## Addendum — Large-knob chip probe

- **They scale with Large because their own rules read a Large role token. This is not cross-knob inheritance, and the registry does not touch it.** Keyword and action-type chip text inherits from `.dse-feature__meta-cell--{keywords,type}`, whose rule is `font-size: var(--dse-fs-subheading)`. LEADER and EV 20 have the rule `font-size: calc(var(--dse-fs-heading) * 0.9)`. Each applies Large exactly once. SIGNATURE, LEVEL 3, MONSTER/ABILITY and "Human, Humanoid" do not move.
- **On develop all of it was inert** (R = 1.000 everywhere, measured on a develop-semantics sheet). r1 is what makes it move. The role assignments themselves are older (SC-185), and the head chips carry an explicit SC-185 comment that they follow the Large knob. **My call: intended, not a defect.** It is a gap in the help text's list of examples. Fix that wording, not the CSS (0 bytes).
- **The card-name wrap is bigger text at that card width, not a layout bug.** At 120% the name wraps once the pane is under about 800px; at 100% the same name wraps under about 680px. In every case: no overflow, no collision with the right column.

Probe: `sc372-r4-rereview/probe-large-chips.mjs` (log `logs/r4-large-chips.log`). Pages: `harness/index-r3.html` (r3 bundle snapshot) and `harness/index-develop.html`. The develop page is the same bundle with the registry removed and the token rule narrowed back to `:root` only, which is the pre-SC-372 shape. Nothing was built in the worktree.
- Font sizes are given at Large 1.0 / 1.2 / 0.8.
- `m` is the element's own multiplier: its 1.2 ratio divided by its parent's 1.2 ratio.
- I identified the consumed token with a sentinel: set `--dse-fs-<t>: 123px` inline on the element and check whether its own font-size follows.
- Source lines are `git show f6d29ec:styles-source.css`.

| Text (fixture) | Element | fs 1.0 / 1.2 / 0.8 | Parent fs | Own font-size reads | Moves with Large? |
|---|---|---|---|---|---|
| MAGIC / MELEE / STRIKE / WEAPON (statblock; ATTACK / WEAPON in feature) | `span.dse-feature__kw` | 18.4 / 22.08 / 14.72 | `.dse-feature__meta-value` 18.4 (R 1.2) | none | yes. m = 1.000: it **inherits** from `.dse-feature__meta-cell--keywords`, which reads **`--dse-fs-subheading`** (`:9155-9174`, Steel screen rule) |
| Main action (statblock ability meta) | `p` in `.dse-feature__meta-cell--type` | 18.4 / 22.08 / 14.72 | 18.4 (R 1.2) | none | yes, inherits from the `--type` cell (subheading, same rule) |
| LEADER (statblock head, right) | `span.dse-head__primary--right.dse-head__primary--chip` | 18 / 21.6 / 14.4 | `.dse-head` 16 (R 1.0) | **heading** | yes, m = 1.200, **reads the token itself**: `calc(var(--dse-fs-heading) * 0.9)` (`:8487-8497`) |
| EV 20 (statblock head, right) | `span.dse-head__deck--right.dse-head__deck--chip` | 18 / 21.6 / 14.4 | 16 (R 1.0) | **heading** | yes, reads the token itself, `calc(var(--dse-fs-heading) * 0.9)` (`:8385-8388`) |
| Main Action (feature head deck chip) | `p` in `.dse-head__deck--chip` | 18 / 21.6 / 14.4 | deck chip 18 (R 1.2) | none | yes, inherits from the deck chip (heading) |
| SIGNATURE (ability head chip inside the statblock) | `p` in `.dse-head__primary--chip` | 16 / 16 / 16 | 16 (R 1.0) | none | **no.** The `:is(.dse-sb, .dse-fb) > .dse-head > …--chip` rule does not reach an ability's own head. The image only looks bigger. |
| LEVEL 3 | `.dse-head__eyebrow--chip` | 13.6 / 13.6 / 13.6 | 16 | label | no. It is Small. |
| MONSTER / ABILITY eyebrows, "Human, Humanoid" | `.dse-head__eyebrow--line`, `.dse-head__deck--line` | 13.6 constant | 16 | label | no. They are Small. |

Chip box growth at 1.2: Magic 72.7→81.4px (×1.12), Weapon 88.4→99.3, Main action 98.1→115.7, LEADER 87.0→106.6, EV 20 64.6→75.9. The horizontal padding is fixed (0.75rem), so boxes grow less than ×1.2. "About ×1.3" is not supported by the measurements.

**Answers**
1. **Do they scale with Large, and how?** Yes. Neither path is cross-knob inheritance of the r2 INFO-3 kind (one knob's text inheriting another knob's em): each text gets the Large knob exactly once.
   - **Keyword and action-type chips:** the text spans set no size of their own. They take the size of their meta cell, and the cell's rule reads the Large role token `--dse-fs-subheading`.
   - **LEADER and EV 20:** they read `--dse-fs-heading` themselves.
   - The registry does not touch the Large knob: the r3 page and the no-registry page give identical Large ratios.
2. **Was it like this on develop?** No. On develop all of these are inert at 1.2 (R = 1.000; the develop sheet's tokens resolve at `:root` × 1, which is the ticket's original bug). They move because r1 made the knob reach the tokens.
   - **The role choices predate SC-372.** The meta cells were transcribed as `subheading` (the site's chip band at 1.15em = 18.4px). The head chips were derived in SC-185 round 3, category H, whose comment says `calc(--dse-fs-heading * 0.9)` "keeps the ratio when the Large text size knob moves" (`:8380-8384`, `:8494-8496`). So they were designed to follow Large.
   - r1 delivered that design. r3 changed nothing here.
3. **My call: intended, not a defect.**
   - The help text defines Large as "Size of text above the body size". These texts are 18–18.4px against a 16px body, so they are Large by that definition. The examples after the dash ("card names, band titles and display stat numbers") are incomplete.
   - Small's help says "text below the body size … chips". That means the below-body chips (tier badges, LEVEL chip, eyebrows), and those do follow Small.
   - **Recommended:** no CSS change. Optionally reword the Large help text (`src/prefs/catalog.ts:361`) and the CHANGELOG to "card names, band titles, ability keyword and action chips, and display stat numbers". That moves 0 frozen bytes: the help text is not in any print capture.
   - **If Scott instead wants these chips on Small**, the fix is this one line in each of the two rules:
     - `.dse-feature__meta-cell--{keywords,type}`: `font-size: calc(1.15em * var(--dse-fs-small-scale))`
     - the two head-chip rules: `font-size: calc(1.125em * var(--dse-fs-small-scale))`
     - **Default bytes do not move** (× 1 is the same px).
     - But it makes Small govern text that is above body size, against its own help text.
     - It also adds direct scale-variable consumers: today the only one is the prompt rule. So it is a role decision for Scott, not a fix. I would open a separate ticket if he wants it.

**Card-name wrap: confirmed as size × width, not a layout bug.** Probe `probe-name-wrap.mjs`, log `logs/r4-name-wrap.log`: the `?width=` pane sweeps 860→620px on the statblock fixture.
- **"Human Bandit Chief":** one line at 100% until the pane is 700px (445px of text in a 474px box). It wraps at 660px.
- **At 120%:** 49.68px text with a 545px one-line width. It fits at 820px (569px box) and wraps from 780px (529px box). The box also narrows by about 25px because LEADER and EV 20 grow.
- **"Whip and Magic Longsword":** 490px at 120%. It wraps from a 760px pane. At 100% it wraps from 660px.
- **Every case:** overflow false, and the name never collides with the right column.

So the wrap at 120% is the same width-driven wrap the default look already does about 100–120px narrower. The evidence card was captured narrower than 800px.

## r7 scoped check

- **Verdict: LAND-READY. Findings: 0 BLOCKER, 0 HIGH, 0 MEDIUM, 1 LOW (CHANGELOG wording, non-blocking, docs only), 0 INFO.**
- **r6 rebase is clean.** `range-diff` shows all 12 commits as `=`. The branch's net diff over 1640ed0 is identical to its pre-rebase net diff over e9502a8. The SC-372 CSS block is byte-identical, and every line SC-408/SC-423 added is present.
- **Gates on 6737031** (1640ed0):
  - e2e `59/71 ok, 0 failed, 12 known-bug, coverage: 47/47 pairs`
  - shots 572 PNGs, 0 FAIL, `text scale OK (1146)`, `text scale once OK (102969 comparisons over 199 loads)`
  - freeze `OK (276/276)`
  - parity 0 / 0 / 24

### 1. The r5 fold commits (a18fd98, 9c91c06, 6737031)
- **a18fd98 (INFO-1).** The comment in `src/framework/tokens.ts:123-126` now reads "Eight of the nine roles (all but `body`) … and so are the six h1-h6 tokens below (SC-318): those fourteen …". The "All twelve" that follows correctly refers to the block's 9 roles + 3 knobs. This matches the ruling, and the commit changes only that comment.
- **9c91c06 (INFO-2, INFO-3).** font-sizes.md gains the sentence that the sweep cannot catch text that goes inert, and that only the named `TEXT_SCALE_PAGES` rows, including the three nested ones, pin that. This matches the ruling. In the CHANGELOG, "scales once, not twice" is dropped as ruled, and a nested-text clause is added. **See LOW-r7-1.**
- **6737031 (addendum).**
  - The `catalog.ts:361` help text reads "card names, band titles, ability keyword and action chips and display stat numbers", word for word what the ruling asks.
  - The CHANGELOG uses the same list.
  - The drive-by in `docs/settings.md:48-49` makes the same list change. It is in scope: user-facing docs on the same subject.
  - Nothing else changed: 3 files, 4 lines.

### 2. The r6 rebase (aebc0a9 on e9502a8 → 6737031 on 1640ed0)
- `git range-diff e9502a8..aebc0a9 1640ed0..6737031`: all 12 commits `=`, so they are patch-identical.
- `git diff e9502a8 aebc0a9` vs `git diff 1640ed0 6737031`, ignoring `index`/`@@` lines: **identical**. The branch adds and removes exactly the same lines as before.
- `styles-source.css`:
  - The SC-372 token rule plus registry (150 lines, from "THE SCALE-DEPENDENT ROLE TOKENS" through the control registry's closing `}`) is `cmp`-identical between aebc0a9 and 6737031.
  - All 23 changed lines of SC-408's `e9502a8..1640ed0` diff are still present. The branch's only removals are r1's original 8 comment/`--dse-fs-body` lines (the move into the shared rule), the same as before the rebase.
- `visual-harness/shoot.mjs`:
  - All 104 lines SC-408/SC-423 added are present.
  - The `TEXT_SCALE_*` tables and the span from `assertTextScale` through `assertTextScaleOnce` are md5-identical between aebc0a9 and 6737031.
  - The call sites, `await assertTextScale(page)` at `:5794` and `await assertTextScaleOnce(page, manifest)` at `:5796`, stay inside the full-run branch after `assertModalTextScaleAnchoring`.
  - `portrait mark parity OK` still prints in the run.
- `CHANGELOG.md`: all 6 SC-408/SC-423 added lines are present, and the SC-372 entry is intact. Its wording is covered by LOW-r7-1 below.

### LOW-r7-1: the CHANGELOG's nested-text clause hangs off the Control clause, but the example it gives (tier badges) is Small
- **Where:** `CHANGELOG.md:52-53` at 6737031: "buttons, steppers, tabs and collapse headers follow Control text size (screen only), including text nested inside other text such as the power-roll tier badges."
- **Failure scenario:** a reader takes this to mean the tier badges follow Control (screen only). They follow Small, on screen and on paper. Also, line `:50` is 130 characters and `:53` is 77, so the entry is no longer wrapped to the file's ~95-column width.
- **Fix:** end the Control clause at "(screen only)." and add a sentence: "Text nested inside other text, such as the power-roll tier badges, follows its setting too." Then rewrap the paragraph. Docs only: no gate, no test and no bytes are affected, so it can be folded at landing without a re-run.

### 3. Gates (re-run myself on 6737031; logs in `sc372-r4-rereview/r7/`)
| Gate | Result |
|---|---|
| e2e (`npm run e2e`, private Xvfb, not headed) | `OBSIDIAN-E2E done: 59/71 ok, 0 failed, 12 known-bug, coverage: 47/47 pairs` (`r7-e2e.log`) |
| shots | 572 PNGs, all regenerated this run, 0 FAIL / 0 error lines. `text scale OK (1146 comparisons …)`, `text scale once OK (102969 comparisons over 199 loads …; 66s)`, `portrait mark parity OK (… 6 comparisons …)`, `turn mark parity OK (20 comparisons …)`, `print-twin delta OK (142 capture ids …)` (`r7-shots.log`) |
| freeze | `freeze OK (276/276 frozen print PNGs byte-identical …)` against the current 276-line shared baseline (`r7-freeze.log`) |
| parity (last) | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)` (`r7-parity.log`) |

These match the r6 report and dse-verify CURRENT @ 1640ed0. Not re-run (out of r7 scope; r6 reported them): tsc, lint, jest 4732 (= 1640ed0's recorded 4725 + 7), lifecycle. dse worktree `git status --porcelain` was empty before and after, HEAD 6737031. Nothing committed.
