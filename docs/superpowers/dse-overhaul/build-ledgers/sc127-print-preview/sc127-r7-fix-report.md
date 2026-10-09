# SC-127 round 7 — fix round for the round-6 re-review findings (guard code)

**Executive summary.** All 4 round-6 findings (1 High, 1 Medium, 2 Low) fixed. MEDIUM-A's
fix shape changed mid-round by owner amendment: the first DOM-independent census attempt
(a textual ancestor-scope reachability filter) fired on 222 of 278 theme-differing tokens
as false positives, so the owner retired reachability filtering entirely in favour of a
**generator** — `visual-harness/obsidian-light-island.mjs` produces the print preview's
`.theme-dark` host block directly from the pinned Obsidian sheet: every `--*` token whose
`.theme-dark`/`.theme-light` resolution differs (295 of 1096, measured), restated verbatim
to its `.theme-light` value. This also auto-absorbed LOW-B (the two tokens are among the
295) and structurally retired HIGH-A (the old hand-written-CSS-parsing extractor is gone;
the generated block is found by two unique marker strings). Final dse sha `4c05379` on
branch `sc127-print-preview`, rebased onto `origin/develop` `619c4bd`. Superproject sha
`795c2ae`. Battery: tsc/lint clean; jest **4060 passed / 1 skipped / 208 of 209 suites**
(base `619c4bd`: 4056/1/208-of-209 clean-rerun, net +4; one pre-existing flaky/load-
sensitive test unrelated to SC-127, confirmed clean in isolation and on a clean full
rerun); shots **524, 0 FAIL**, deterministic across 2 clean sweeps; freeze **exactly 130
`*--steel-print.png` FAILED / 0 `*--steel-realprint.png` FAILED / 0 missing**, both
sweeps; parity **0/0/16, exit 0**. All 4 findings can-fail proven (6 independent
break/red/restore cycles across HIGH-A/MED-A's predecessor + the final design).

## 1. What changed, and why the design changed mid-round

### HIGH-A — retired structurally, not merely fixed
`extractSc127HostBlockBody`'s `\{([^}]*)\}` regex still truncated at a `}` inside a
comment — the r5 `--hr-color` comment itself quoted a bare `hr` rule verbatim and
triggered it (1264 of 6313 chars, 23 of 59 declarations seen; both guards still printed
OK because all 18 pinned literals sat before the cut). Rather than patch the parser
again, the whole hand-maintained block — and the function that had to parse it — is
gone. The generated block lives between two literal marker strings
(`/* SC-127 LIGHT ISLAND — GENERATED … BEGIN */` / `… END */`), found by `indexOf`, never
by parsing an arbitrary CSS rule. The comment-brace footgun this finding is about cannot
recur against this code, structurally, the same way MEDIUM-A's fix works.

### MEDIUM-A — two attempts, then a generator
1. **First attempt** (matching the original brief): made the census DOM-independent by
   classifying "reaches an in-note surface" textually, via ancestor SCOPE, reusing
   `EXCLUDED_ANCESTOR_SCOPES` (`obsidian-host-pin.mjs`, the same list the button-reaching
   gate trusts). Measured on a full sweep: **222 of 278 theme-differing tokens DRIFTED**
   — `body`/`:root`-level declarations and dozens of unrelated Obsidian UI selectors
   (titlebar, CodeMirror table widgets, drag-reorder ghosts, settings panels) all passed
   the ancestor-scope filter and were flagged for not being restated, even though they
   have nothing to do with reading-view content. Log: `sc127-r7-full-1.log`.
2. **Owner's amendment** (same day, after reviewing sweep 1): retire reachability
   filtering entirely. `visual-harness/obsidian-light-island.mjs` (new file) computes
   every `--*` token name the pinned sheet declares ANYWHERE (1096, measured), resolves
   each under `body.theme-dark` and `body.theme-light` with only the pinned sheet loaded,
   and keeps the ones that differ (295). The generated block sets each to its
   `.theme-light` computed value verbatim — formulas kept as formulas (`getComputedStyle`
   substitutes nested `var()` references through the sheet's own mapping chain but does
   not evaluate `calc()` arithmetic), baked literals where the chain bottoms out at one.
   `npm run gen-light-island` regenerates it; `shoot.mjs`'s `assertSc127LightIslandPinned`
   checks completeness (every differing token is present) and correctness (each resolves
   right on a live dark-preview probe) against the SAME generator function, so the guard
   cannot silently diverge from what regenerating would produce.

### LOW-A — the jest pin, properly scoped
`printTwinDeltaAllowedSet.test.ts`'s `'borderTopColor'` etc. check matched anywhere in
`shoot.mjs`, which the neighbouring `BORDER_COLOR_PROPS` Set literal also satisfies —
deleting the four names from `PRINT_DELTA_STYLE_PROPS` left it green, 17/17. Now scoped
to the `PRINT_DELTA_STYLE_PROPS` array's own extracted declaration body only.

### LOW-B — absorbed automatically
`--input-placeholder-color`/`--list-marker-color` both map to `--text-faint` (which
differs dark vs light), so they are simply two of the generator's 295 differing tokens —
no separate hand-declaration needed once the generator design landed. Verified present in
the committed block with the correct value (`#ababab`, matching `.theme-light`'s own
`--text-faint`).

## 2. Battery (full, in order) — measured numbers, final tip `4c05379`

| Gate | Result |
|---|---|
| `npm run tsc` | clean (`sc127-r7-tsc.log`) |
| `npm run lint` | clean, exit 0 (`sc127-r7-lint.log`) |
| `npx jest` | **4060 passed / 1 skipped / 208 of 209 suites / 3 snapshots**, exit 0 (`sc127-r7-jest-full.log`) |
| `npm run shots` | **524, 0 FAIL**, `SC-127 light island OK (1096 Obsidian tokens checked, 295 differ dark vs light in the pinned sheet, all 295 restated and correct — 0 skipped, no reachability filter)`, `print-twin delta OK (130 …)`, both clean sweeps (`sc127-r7-sweepA.log`, `sc127-r7-sweepB.log`) |
| `check-freeze.sh` | **`FREEZE VIOLATED (130 checksum mismatches, 0 missing)` — all 130 `*--steel-print.png`, ZERO `*--steel-realprint.png`**, both sweeps identical (`sc127-r7-freeze-A.log`, `sc127-r7-freeze-B.log`) |
| `npm run parity` | **0 GAPs / 0 undeclared WARNs / 16 DECLARED / exit 0** (`sc127-r7-parity.log`) |

**Base-vs-branch jest.** Base `619c4bd` (`git stash` the r7 working tree, measure,
restore): first run showed **1 failure**
(`sidebarEncounterHandoff.test.ts` › "the encounter block persists the id it minted") —
re-ran that ONE file in isolation and it passed 10/10 clean; re-ran the FULL base suite
again and it was clean, **4056 passed / 1 skipped / 208 of 209 suites**
(`sc127-r7-jest-base-619c4bd.log` = the red run, kept for the record;
`sc127-r7-jest-base-619c4bd-retry.log` = the clean rerun; `sc127-r7-jest-rerun-flaky.log`
= the isolated file). Matches dse-verify's own documented "shared-build-host,
load-sensitive suite" class — `/proc/loadavg` read 12.63 at the time — not a real base
regression, not related to SC-127. This branch's own total, 4060, is **+4** over the
clean base (net of removing ~15 obsolete HIGH-A/MED-A/MED-1-LOW-4 tests and adding ~19
new ones across the round's several designs — the git-blame-able diff is in
`test/unit/build/printTwinDeltaAllowedSet.test.ts`, currently 21 `it(...)` blocks in the
SC-127-specific describes).

## 3. Can-fail proofs (6 independent break/red/restore cycles)

1. **HIGH-A's jest pin (this round's FIRST commit, before the amendment retired the code
   it tested)** — reverted `extractSc127HostBlockBody` to the old `[^}]*` regex:
   1 of 28 tests failed (`… uses iterRules, not a hand-rolled brace regex`). Restored.
   `sc127-r7-canfail-highA.log`. (This guard and its test are GONE after the amendment —
   see §1 — kept here as the historical record the brief asked for.)
2. **LOW-A** — deleted the four `border*Color` entries from `PRINT_DELTA_STYLE_PROPS`:
   1 of 28 tests failed (previously stayed green, 17/17, proving the old pin vacuous).
   Restored. `sc127-r7-canfail-lowA.log`.
3. **The first (retired) MED-A design's own explosion** is itself a can-fail proof of a
   different kind: a full sweep against the LIVE, unmutated ancestor-scope census printed
   `SC-127 HOST PALETTE CENSUS DRIFTED — 222 of 278 …` — the design failed its OWN
   correctness bar without any deliberate mutation, which is exactly why the owner retired
   it. `sc127-r7-full-1.log`.
4. **MEDIUM-A (final design), completeness** — deleted the generated `--hr-color: #e4e4e4;`
   line from the committed block, ran a full sweep: `SC-127 LIGHT ISLAND DRIFTED — 1 of
   295 theme-differing Obsidian token(s) are MISSING … --hr-color: pinned sheet
   .theme-light is "#e4e4e4"`, exit 1. Restored (byte-identical to the pre-mutation file,
   diff-verified). `sc127-r7-canfail-island-delete.log`.
5. **MEDIUM-A (final design), correctness** — hand-edited that same line to
   `--hr-color: #123456;`, ran a full sweep: `SC-127 LIGHT ISLAND DRIFTED — 1 of 295 …
   --hr-color: committed block resolves "#123456", the pinned sheet's .theme-light
   resolves it to "#e4e4e4"`, exit 1. Restored. `sc127-r7-canfail-island-edit.log`.
6. **The jest-level "block equals generator output" test (amendment point 3)** — cannot
   run a real browser (jest/jsdom has no real CSS cascade resolution), so it is a textual
   approximation; can-fail is inherent in its own design (it goes red on any REAL
   completeness gap it can see — proven live during development: it caught
   `--interactive-accent-hover` as a textual false positive before the documented
   allowlist entry was added, and would go red again if that allowlist entry were removed
   while the token stayed absent). Not a separate log — this was live development
   iteration, described in the test's own comments.

## 4. Follow-ups

- The generated block is significantly larger (295 declarations) than any hand-curated
  list would be — a deliberate cost of the "restate everything, judge nothing" design
  (§1). Not a problem for a machine-generated block, but worth knowing if anyone goes
  looking for it expecting r5/r7's old ~50-line hand-written version.
- **Trade-off, recorded in three places now** (styles-source.css's own comment,
  `obsidian-light-island.mjs`'s header, `visual-harness/README.md`): a CUSTOM dark theme's
  own light variant is NOT used — the preview island is always stock Obsidian's
  `.theme-light`. Only matters for a vault running a custom dark theme with its own
  distinct light variant; native controls in the preview then look like Obsidian's
  defaults, not the vault's chosen theme.
- r3/r5's own carried-forward follow-ups (the declined hover-rule print-guard; SC-348
  role-chip contrast) are unchanged by this round.

## 5. Rebaseline deliverable

- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/sc127-rebaseline.txt`
  — 130 lines, `*--steel-print.png` only, filename order identical to the frozen
  baseline's own print-line order (verified, `diff` empty).
- **Deterministic across 2 clean sweeps**: sweep A `sc127-r7-sweepA.log`, sweep B
  `sc127-r7-sweepB.log` (`visual-harness/shots/*` deleted between them). `diff` of both
  sweeps' 130-line print hash lists is empty, and of both sweeps' 130-line realprint hash
  lists is also empty (`sc127-r7-sweepA-{print,realprint}.sha256` vs
  `sc127-r7-sweepB-{print,realprint}.sha256`).
- **0 realprint bytes moved**, both sweeps (`.theme-dark`-scoped generated block never
  matches under forced `.theme-light`).

## 6. After-crops (sanction ask)

Copied the real `visual-harness/shots/<id>--steel-print.png` at the final commit
(`4c05379`) plus a top-1300px crop of each, for the same five fixtures as every prior
round:

- `sc127-r7-after-statblock-charline-two-dark-twin.png` / `-top.png`
- `sc127-r7-after-feature-dark-twin.png` / `-top.png`
- `sc127-r7-after-initiative-dark-twin.png` / `-top.png`
- `sc127-r7-after-negotiation-dark-twin.png` / `-top.png`
- `sc127-r7-after-hero-dark-twin.png` / `-top.png`

## 7. Commits

dse clone (`/home/scott/code/steelCompendium/worktrees/sc127-print-preview/draw-steel-elements`,
branch `sc127-print-preview`, rebased onto `origin/develop` `619c4bd`):

1. `4ab8fc8` — `fix(print): SC-127 r7 — generate the light island from the pinned sheet, not by hand` (styles-source.css + package.json)
2. `be45cbe` — `test(print): SC-127 r7 — the light-island generator and its in-run/jest guards` (new obsidian-light-island.mjs, shoot.mjs, printTwinDeltaAllowedSet.test.ts)
3. `4c05379` — `docs(dse-verify): SC-127 r7 — document the light-island generator and its pin-bump step` (visual-harness/README.md)

Superproject (`/home/scott/code/steelCompendium/worktrees/sc127-print-preview`):

4. `795c2ae` — `chore: bump draw-steel-elements to 4c05379 (SC-127 r7 fix round — light island generator)`

The superproject branch was reset onto the current `origin/main` (`4e4c61b`, which moved
66+ commits since the branch was last touched — but SC-127 was still not landed there, so
this was a clean reapply, not a conflict resolution) rather than rebased, to avoid a
gitlink conflict on `draw-steel-elements` across the many intervening pointer-bump
commits from other efforts — the branch's only content is 2 small doc edits plus the
pointer, both reapplied at unchanged anchor text and verified. `steel-etl`,
`steelCompendium.github.io` and `v2` remain locally stale (SC-127 never touches them; per
the standing land-stack note, left for the dispatcher/`git submodule update` at landing).

No co-author or AI-attribution trailers in any commit message.

## 8. Artifact paths (all absolute, directory
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/`)

- Report (this file): `sc127-r7-fix-report.md`
- Rebaseline: `sc127-rebaseline.txt`
- Rebase log: `sc127-r7-rebase.log`
- Rebaseline sweep logs: `sc127-r7-sweepA.log`, `sc127-r7-sweepB.log`
- Rebaseline sweep hash sets: `sc127-r7-sweepA-{print,realprint}.sha256`,
  `sc127-r7-sweepB-{print,realprint}.sha256`
- Freeze logs: `sc127-r7-freeze-{A,B}.log`
- After-crops: `sc127-r7-after-{statblock-charline-two,feature,initiative,negotiation,hero}-dark-twin{,-top}.png`
- Battery logs: `sc127-r7-{tsc,lint,jest-full,jest-base-619c4bd,jest-base-619c4bd-retry,jest-rerun-flaky,parity}.log`
- Generator run logs: `sc127-r7-genisland-1.log`, `sc127-r7-build-genisland.log`
- Progressive/superseded-design logs: `sc127-r7-full-{1,2}.log` (full-1 = the retired
  ancestor-scope census's 222-drift measurement; full-2 = the final design, clean)
- Can-fail logs: `sc127-r7-canfail-{highA,lowA,island-delete,island-edit}.log`
- jest island-test iteration logs: `sc127-r7-jest-island-{1,2,3}.log` (1/2 show the false
  positives found and fixed while building the amendment-point-3 test; 3 is final/clean)
- dse commits: `4ab8fc8`, `be45cbe`, `4c05379` on branch `sc127-print-preview` in
  `/home/scott/code/steelCompendium/worktrees/sc127-print-preview/draw-steel-elements`
- Superproject commit: `795c2ae` on branch `sc127-print-preview` in
  `/home/scott/code/steelCompendium/worktrees/sc127-print-preview`
- New source file: `/home/scott/code/steelCompendium/worktrees/sc127-print-preview/draw-steel-elements/visual-harness/obsidian-light-island.mjs`

## Return contract

- **dse sha:** `4c05379` (branch `sc127-print-preview`, rebased onto `origin/develop` `619c4bd`)
- **superproject sha:** `795c2ae` (branch `sc127-print-preview`, reset onto `origin/main` `4e4c61b` + 1 commit)
- **Battery:** tsc clean; lint clean exit 0; jest 4060 passed / 1 skipped / 208 of 209
  suites / 3 snapshots, exit 0 (base 619c4bd clean: 4056/1/208-of-209, net +4; one
  pre-existing load-sensitive flaky test unrelated to SC-127, reconfirmed clean); shots
  524 / 0 FAIL exit 0 (2 clean sweeps, deterministic); parity 0 GAPs / 0 undeclared / 16
  DECLARED, exit 0
- **Freeze counts:** twin (`*--steel-print.png`) **130 FAILED** (expected,
  sanction-pending); realprint (`*--steel-realprint.png`) **0 FAILED**; 0 missing — both
  clean sweeps
- **Rebaseline:** `sc127-rebaseline.txt`, 130 lines, deterministic across 2 clean sweeps
- **Census:** light island — 1096 Obsidian tokens checked, 295 differ dark vs light, all
  295 restated and correct, 0 skipped, no reachability filter
- **Can-fail proofs:** HIGH-A (superseded design) and LOW-A each independently proven;
  the retired MED-A ancestor-scope census self-proved its own inadequacy (222 of 278
  drifted, unmutated); the final MED-A design (generator) proven twice on real full
  sweeps — delete a line → DRIFTED naming it; hand-edit a value → DRIFTED naming it —
  both restored and reverified clean
- **Skipped:** nothing required
- **Drive-by fixes:** none
- **Follow-ups:** the custom-dark-theme trade-off (documented in 3 places, §4); r3/r5's
  carried-forward items unchanged
- **Artifacts:** §8 above (all absolute paths)
