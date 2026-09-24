# SC-240 implementation report (round 1)

## Executive summary

- **Verdict: DONE.** Both owner rulings implemented, tested, gated.
- Final dse sha: `225b02e02235ea0f64602dead96364bc5a6e9d95` (branch `sc240-scc-ref-error`, rebased
  onto `origin/develop` @ `46c0c4c`), single commit, working tree clean.
- tsc clean · lint clean, exit 0 · jest baseline 3930 passed/1 skipped/202 of 203 suites →
  after 3934 passed/1 skipped/202 of 203 suites (net +4, all new SC-240 tests) · shots 524
  PNGs, 0 FAIL · freeze `260/260`, exit 0 (**0 pixels moved**) · parity 0 GAPs / 0 undeclared
  WARNs / 16 DECLARED, exit 0.
- Can-fail proofs: **YES for both fixes** — each source fix was temporarily reverted in
  isolation and the corresponding new test(s) went red with the exact expected failure
  shape, then the fix was restored (working tree diffed clean against HEAD afterwards).
- Drive-by fixes: none. Follow-ups: none.

## Commits

- `225b02e` — `fix(initiative): SC-240 — no bogus filename hint for SCC ref failures; portrait warn only when an image was specified`
  (single coherent commit: both source fixes + all test changes + CHANGELOG, since the two
  fixes are small, independently can-fail-proven, and touch two files with no interleaving
  risk — see "Can-fail proofs" below for the red/green evidence in lieu of separate red
  commits).

Base: `46c0c4c` (docs(changelog): SC-241 …), which is `origin/develop` HEAD at kickoff.
Rebase was a no-op merge (branch tip was already an ancestor of `origin/develop`, 0 ahead /
3 behind before rebase) — no conflicts, no `package.json` change, so no `npm ci` was needed
for the rebase itself (though `npm ci` was run once anyway: the worktree had no
`node_modules` at all — see gate notes).

## (a) Error text — before/after (exact strings)

**Before this ticket (bare-path AND scc-shaped refs, identical):**
```

Failed to resolve hero statblock reference at index 0 (scc.v1:mcdm.monsters.v1/monster.goblin.statblock/goblin-stinker):
    SCC reference (scc.v1:mcdm.monsters.v1/monster.goblin.statblock/goblin-stinker) is not available in this vault. Sync the compendium (Settings → Draw Steel Elements → Sync compendium).

Are there multiple instances of the 'scc.v1:mcdm.monsters.v1/monster.goblin.statblock/goblin-stinker' file in your vault? If so, please specify the full path.

```

**After (scc-shaped ref only — the hint paragraph is gone):**
```

Failed to resolve hero statblock reference at index 0 (scc.v1:mcdm.monsters.v1/monster.goblin.statblock/goblin-stinker):
    SCC reference (scc.v1:mcdm.monsters.v1/monster.goblin.statblock/goblin-stinker) is not available in this vault. Sync the compendium (Settings → Draw Steel Elements → Sync compendium).

```

**Bare-path ref (unchanged, byte-identical to legacy, e.g. `Nope`):**
```

Failed to resolve hero statblock reference at index 0 (Nope):
    Reference file (Nope) not found in root, DS Compendium, or when searching the cache

Are there multiple instances of the 'Nope' file in your vault? If so, please specify the full path.

```
(creature loop is the same shape with "creature" in place of "hero" and its own index/`statblock`/group text)

## What changed

- `src/elements/initiative/resolveRefs.ts`:
  - Factored the SCC-shape test SC-134 added inline (`SCC_PREFIX_RE.test(trimmed)`) out into
    a named `isSccShapedRef(raw)` helper, used by both `resolveStatblockRef`'s routing and
    the two failure-message branches below — one predicate, not a second copy.
  - Hero-loop and creature-loop `catch` blocks now branch on `isSccShapedRef(hero.statblock)`
    / `isSccShapedRef(creature.statblock)`: SCC-shaped refs drop the "Are there multiple
    instances…" hint paragraph; everything else (bare-path) is byte-identical to before.
  - Updated the file-header phase-1 doc comment and both catch-block comments to describe
    the split instead of claiming the hint always fires.
- `src/elements/initiative/view.ts` (`renderPortrait`'s `.catch`): `console.warn(...)` now
  gated on `if (imgSrcRaw)` — fires only when a non-empty image path/URL was actually given
  and still couldn't be resolved. No `image:` key (imgSrcRaw `null`) is silent; the fallback
  glyph renders exactly as before either way. Updated the surrounding comment.
- `src/framework/seams/refs.ts` ~:221 — **checked, left unchanged.** The comment there
  describes `resolveBarePath` specifically ("the initiative merge wraps them in its
  'multiple instances/full path' hint"), and that remains true: `resolveBarePath` is only
  ever reached for non-SCC refs, and those still get the hint. No inaccuracy introduced.
- `:741` in `view.ts` cited by SC-134 for a second warn site — **checked, does not exist.**
  Only one `console.warn("...no portrait image found...")` call site exists in the whole
  `src/` tree (`grep -rn "no portrait image found" src/` → one hit), shared by all three
  `renderPortrait` call sites (hero row, enemy detail row, instance grid cell). The line
  number was stale (file has grown/shrunk since SC-134). The single fix in `renderPortrait`
  covers every row shape.
- `CHANGELOG.md`: one `[FIX]` bullet added under the `## 7.0.0 (unreleased; previously
  numbered 6.0.0)` section (this repo's "Unreleased" heading — verified there is no literal
  `## Unreleased` heading; this is where every other in-flight fix bullet, e.g. SC-241,
  SC-278, already lives).

## Tests added/changed

- `test/unit/model/initiative-resolve-refs.test.ts`:
  - New `makeSccEnv()` helper (registers a real `SccRefProvider` + `SccResolver`, matching
    production wiring / `test/dom/elements/_refHarness.ts`'s `makeCompendiumDeps`) so the
    unit-level SCC-shape tests see `SccRefProvider`'s own message, not the generic
    reserved-provider fallback.
  - New `describe('T-2 / SC-240: SCC-shaped ref failures drop the "multiple instances" hint')`
    block: hero case, creature case (both assert the lead-in + SccRefProvider text present,
    hint absent), plus a bare-path boundary check confirming the hint is still present there.
  - Header comment extended to document the deliberate contract update, matching the
    convention the bare-path pinned tests already used for their own oracle claim.
  - **All pre-existing bare-path/oracle assertions (incl. the "multiple instances" ones)
    left byte-for-byte untouched**, per the ruling.
- `test/dom/elements/encounter.test.ts`: extended SC-134's existing negative-control test
  (unsynced code, real provider chain, builder → tracker round trip) with three more
  assertions — the "Failed to resolve creature statblock reference at index 0 (...)"
  lead-in is present, "multiple instances" is absent, "full path" is absent. No new test
  added here (reusing the existing end-to-end harness per the brief's "prefer driving
  through the real provider stack" note).
- `test/dom/elements/initiative-portrait-missing.test.ts`:
  - Header comment rewritten to document the SC-240 contract change (was: warn on every
    rejection; now: warn only when an image was specified).
  - First test renamed and its assertions flipped: `SOURCE` has no `image:` field anywhere,
    so under the new contract it now asserts **zero** `console.warn` calls (previously
    asserted at least one per portrait) — fallback-glyph assertions are unchanged, since the
    visual result never changed.
  - New test `'SC-240: warn STILL fires when an image WAS specified and could not be
    resolved'`: a hero with `image: images/does-not-exist.png` and no default token image
    seeded — asserts exactly one `console.warn` call containing "no portrait image found"
    and that the fallback glyph still mounts.

## Can-fail proofs

**(a) resolveRefs.ts.** Restored the pre-ticket file
(`git show 46c0c4c:src/elements/initiative/resolveRefs.ts`) over the working copy (tests
left at HEAD) and ran the two touched suites:
`npx jest test/unit/model/initiative-resolve-refs.test.ts test/dom/elements/encounter.test.ts`
→ **3 failed, 51 passed** — exactly the 3 new/extended SC-240 assertions (hero unit case,
creature unit case, the DOM negative-control's new assertions), every other test in both
files (incl. every pre-existing bare-path/oracle test) stayed green. Failure text confirmed
the old hint was back:
`"...is not available in this vault... Are there multiple instances of the '...' file..."`.
Log: `sc240-canfail-a.log`. Source file restored afterward (`git diff` against HEAD: empty).

**(b) view.ts.** Restored the pre-ticket `view.ts` the same way and ran
`npx jest test/dom/elements/initiative-portrait-missing.test.ts` → **1 failed, 3 passed** —
the rewritten first test ("SC-240: NO warn when no image was specified") went red with
`Expected number of calls: 0, Received number of calls: 4` (one warn per portrait, the old
behavior). The new "warn STILL fires" test stayed green (it wasn't exercising the reverted
code path's absence — both old and new behavior warn when an image is specified). Log:
`sc240-canfail-b.log`. Source file restored afterward (`git diff` against HEAD: empty).

Full suite re-run after both restores confirmed back to green (see jest-after below).

## Gates (worktree `sc240-scc-ref-error/draw-steel-elements`, sha `225b02e`)

All run via `devbox run -- bash -c 'cd <worktree>/draw-steel-elements && <cmd>'`, foreground,
each command last in its `bash -c` string (no pipe/echo masking the exit code).

| Gate | Result | Log |
|---|---|---|
| `npm ci` (worktree had no `node_modules`) | exit 0 | `sc240-npmci.log` |
| `npm run tsc` | clean, exit 0 | `sc240-tsc.log` |
| `npm run lint` | clean, exit 0 | `sc240-lint.log` |
| `npx jest` — BASELINE (pre-change, tree at `46c0c4c`) | 3930 passed / 1 skipped / 202 of 203 suites, exit 0 | `sc240-jest-before.log` |
| `npx jest` — AFTER (tree at `225b02e`) | **3934 passed / 1 skipped / 202 of 203 suites** (net +4), exit 0 | `sc240-jest-after.log` |
| `npm run shots` | **524 PNGs, 0 FAIL**, exit 0 (in-run gates all OK: host-copy pin, button/input/table/list/inline/checkbox/prose host-leak, print-twin delta, nested corner-radius) | `sc240-shots.log` |
| `check-freeze.sh <shots-dir>` | **`freeze OK (260/260 frozen print PNGs byte-identical)`**, exit 0 — **0 pixels moved**, matching ruling #3 | `sc240-freeze.log` |
| `npm run parity` (run LAST) | **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)**, exit 0 — composition unchanged from the expected set (FOLLOWUPS #39/#51/#40, 16 rows) | `sc240-parity.log` |

`main.js`/`styles.css` were removed from the plugin root before each jest run (SC-169
footgun). Load average was ~6.8/7.8/6.3 at kickoff — comfortably under the load-sensitivity
threshold the skill warns about; no timeout-shaped reds observed.

## Drive-by fixes

None. Both `refs.ts:221`'s comment and the "second warn site at :741" lead from the brief
were checked and found not to need changes (see "What changed" above for the diagnosis of
each).

## Follow-ups

None identified beyond what the brief already scoped out (SC-134's row-scoped-degradation
question stays OPEN/out of scope, per the ledger).

## Evidence artifacts (absolute paths)

- Report (this file): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc240-scc-ref-error/sc240-impl-report.md`
- `npm ci` log: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc240-scc-ref-error/sc240-npmci.log`
- tsc log: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc240-scc-ref-error/sc240-tsc.log`
- lint log: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc240-scc-ref-error/sc240-lint.log`
- jest baseline (pre-change) log: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc240-scc-ref-error/sc240-jest-before.log`
- jest after-change log: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc240-scc-ref-error/sc240-jest-after.log`
- can-fail proof (a) log: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc240-scc-ref-error/sc240-canfail-a.log`
- can-fail proof (b) log: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc240-scc-ref-error/sc240-canfail-b.log`
- shots log: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc240-scc-ref-error/sc240-shots.log`
- freeze log: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc240-scc-ref-error/sc240-freeze.log`
- parity log: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc240-scc-ref-error/sc240-parity.log`
- Changed source: `/home/scott/code/steelCompendium/worktrees/sc240-scc-ref-error/draw-steel-elements/src/elements/initiative/resolveRefs.ts`,
  `/home/scott/code/steelCompendium/worktrees/sc240-scc-ref-error/draw-steel-elements/src/elements/initiative/view.ts`
- Changed tests: `/home/scott/code/steelCompendium/worktrees/sc240-scc-ref-error/draw-steel-elements/test/unit/model/initiative-resolve-refs.test.ts`,
  `/home/scott/code/steelCompendium/worktrees/sc240-scc-ref-error/draw-steel-elements/test/dom/elements/encounter.test.ts`,
  `/home/scott/code/steelCompendium/worktrees/sc240-scc-ref-error/draw-steel-elements/test/dom/elements/initiative-portrait-missing.test.ts`
- Changelog: `/home/scott/code/steelCompendium/worktrees/sc240-scc-ref-error/draw-steel-elements/CHANGELOG.md`

# Fix round 1 (independent review round 1 folds)

## Executive summary

- **Verdict: DONE.** All 3 LOW + 1 INFO (folded) findings from independent review round 1
  fixed on top of `225b02e`.
- Final dse sha: `3284b5d3d026c2e74d31dc0f2728ff61a43e63bc` (branch `sc240-scc-ref-error`),
  2 commits total (`225b02e` round 1, `3284b5d` this fold), working tree clean.
- tsc clean · lint clean, exit 0 · jest **3936 passed / 1 skipped / 202 of 203 suites**
  (baseline 3934 + 2 new tests: LOW-2's padded-ref case, INFO-1's whitespace-only case; LOW-3
  extended an existing test rather than adding one), exit 0 · shots 524 PNGs, 0 FAIL · freeze
  `260/260`, exit 0 (**0 pixels moved**) · parity 0 GAPs / 0 undeclared WARNs / 16 DECLARED,
  exit 0.
- Can-fail proofs (sabotage): **YES for both LOW-2 and INFO-1**, each isolated, shown red,
  then restored byte-clean.
- Not folded (per ledger, DROPPED by owner): INFO-2, INFO-3, INFO-4. INFO-5 needed no
  change (correct as-is).

## What changed (on top of 225b02e)

- **LOW-1** — moved `isSccShapedRef` (and its own short doc comment) up to directly after
  `SCC_PREFIX_RE`, so the long SC-134 JSDoc block sits against `resolveStatblockRef` again
  instead of attaching to the wrong function. No code/behavior change.
- **LOW-2** — added a new unit test (`hero: PADDED unsynced scc.v1: code still routes
  through SccRefProvider and drops the hint`) in the `T-2 / SC-240` describe block, pinning
  `isSccShapedRef`'s `.trim()`: a leading/trailing-whitespace `"  scc.v1:<code>  "` ref must
  still route through `SccRefProvider` (not fall back to `resolveBarePath`) and still drop
  the "multiple instances" hint.
- **LOW-3** — rewrote the "warn STILL fires" portrait test to also give an enemy creature
  (`amount: 2`) an unresolvable `image`, and assert all 4 expected warns (1 hero + 1 enemy
  detail row + 2 grid cells) plus the correct fallback glyph (shield/skull) at every slot —
  previously it only exercised the hero call site.
- **INFO-1 (folded by owner ruling)** — `renderPortrait`'s warn gate is now
  `if (imgSrcRaw?.trim())` instead of `if (imgSrcRaw)`: a whitespace-only `image: "   "`
  value is treated the same as an absent one (silent, fallback glyph still renders), matching
  the ruling's "absence of an optional field is not a warning anywhere" intent applied to a
  garbage-whitespace value. New test: `SC-240: a WHITESPACE-ONLY image value is treated as
  not specified — no warn`.
- Not touched: `SccRefProvider`, the error-text lead-in, `defaultImagePath` behavior, and the
  bare-path/legacy-oracle assertions (INFO-2/3/4 explicitly dropped per the ledger).

## Can-fail proofs (sabotage)

**LOW-2.** Reverted `isSccShapedRef` to `SCC_PREFIX_RE.test(raw)` (no `.trim()`). Ran
`npx jest test/unit/model/initiative-resolve-refs.test.ts` → **1 failed, 35 passed** — exactly
the new padded-ref test, with the failure showing the regression it exists to catch: the
padded ref fell through to `resolveBarePath`, producing the bare-path "not found" message
re-wrapped in the "multiple instances"/"full path" hint. Log: `sc240-fix1-sabotage-low2.log`.
Restored from the pre-edit `.bak` copy; `git diff` against HEAD afterward: empty.

**INFO-1.** Reverted the gate to `if (imgSrcRaw)` (no `.trim()`). Ran
`npx jest test/dom/elements/initiative-portrait-missing.test.ts` → **1 failed, 4 passed** —
exactly the new whitespace-only test (`Expected number of calls: 0, Received number of
calls: 1`, the warn firing for `"   "`). Log: `sc240-fix1-sabotage-info1.log`. Restored from
a pre-edit copy; `git diff` against HEAD afterward: empty.

## Gates (worktree `sc240-scc-ref-error/draw-steel-elements`, sha `3284b5d`)

All run via `devbox run -- bash -c 'cd <worktree>/draw-steel-elements && <cmd>'`, foreground
(shots/parity given an explicit extended Bash timeout rather than allowed to auto-background),
each command last in its `bash -c` string.

| Gate | Result | Log |
|---|---|---|
| `npm run tsc` | clean, exit 0 | `sc240-fix1-tsc.log` |
| `npm run lint` | clean, exit 0 | `sc240-fix1-lint.log` |
| `npx jest` | **3936 passed / 1 skipped / 202 of 203 suites**, exit 0 | `sc240-fix1-jest.log` |
| `npm run shots` | **524 PNGs, 0 FAIL**, exit 0 (all in-run gates OK) | `sc240-fix1-shots.log` |
| `check-freeze.sh <shots-dir>` | **`freeze OK (260/260 …)`**, exit 0 — 0 pixels moved | `sc240-fix1-freeze.log` |
| `npm run parity` (LAST) | **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)**, exit 0 | `sc240-fix1-parity.log` |

`main.js`/`styles.css` removed from the plugin root before each jest/shots run (SC-169
footgun).

## Commits (this round)

- `3284b5d` — `fix(initiative): SC-240 review round 1 — doc placement, trim coverage, enemy warn coverage, whitespace-only image`
  (on top of `225b02e`, not amended/squashed).

## Evidence artifacts (fix round 1, absolute paths)

- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc240-scc-ref-error/sc240-fix1-tsc.log`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc240-scc-ref-error/sc240-fix1-lint.log`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc240-scc-ref-error/sc240-fix1-jest.log`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc240-scc-ref-error/sc240-fix1-shots.log`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc240-scc-ref-error/sc240-fix1-freeze.log`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc240-scc-ref-error/sc240-fix1-parity.log`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc240-scc-ref-error/sc240-fix1-sabotage-low2.log`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc240-scc-ref-error/sc240-fix1-sabotage-info1.log`

# Fix round 2 (re-review MEDIUM-1)

## Executive summary

- **Verdict: DONE.** Re-review's one MEDIUM finding fixed on top of `3284b5d`, per the
  reviewer's prescribed guard.
- Final dse sha: `f6fb20838e008d08375d37b879cafa282e66a52c` (branch `sc240-scc-ref-error`),
  3 commits total (`225b02e` round 1, `3284b5d` review-1 fold, `f6fb208` this fold), working
  tree clean.
- tsc clean · lint clean, exit 0 · jest **3937 passed / 1 skipped / 202 of 203 suites**
  (3936 + 1 new test), exit 0 — `test/dom/framework/sidebarEncounterHandoff.test.ts`'s known
  load flake did NOT reproduce this run (full green, no isolated rerun needed) · shots 524
  PNGs, 0 FAIL · freeze `260/260`, exit 0 (**0 pixels moved**) · parity 0 GAPs / 0 undeclared
  WARNs / 16 DECLARED, exit 0.
- Can-fail proof: **YES** — reverted the guard to the pre-fix `imgSrcRaw?.trim()`, the new
  test went red with the exact `TypeError: imgSrcRaw.trim is not a function` the fix exists
  to prevent, restored clean.

## What changed (on top of 3284b5d)

- **MEDIUM-1** — `src/elements/initiative/view.ts`'s `renderPortrait` `.catch` handler:
  replaced `if (imgSrcRaw?.trim())` with the reviewer's prescribed guard
  `typeof imgSrcRaw === 'string' ? imgSrcRaw.trim() !== '' : imgSrcRaw != null`. Root cause:
  `Hero`/`Creature.image` is declared `string` in `EncounterData.ts` but the value is
  unvalidated parsed YAML — an unquoted wikilink (`image: [[Frodo.png]]`) parses as a nested
  array, and other shapes (`123`, `true`, `[a, b]`, `{x: 1}`) are equally reachable. The old
  `?.trim()` threw for any of these, and because the throw happened INSIDE the `.catch`
  handler itself, nothing caught it — the fallback glyph never mounted, leaving the portrait
  slot empty: a visible regression ruling 2 ("No visual change") forbids. Fix is local to
  this call site, per the reviewer's explicit instruction not to refactor the model's
  declared types — a non-string value is now treated as "specified" (warns, same as any
  other unresolvable image); only a genuinely empty/whitespace-only STRING is "not
  specified".
- New test in `test/dom/elements/initiative-portrait-missing.test.ts`: an unquoted-wikilink
  `image: [[Frodo.png]]` hero asserts no `TypeError`/unhandled rejection, the shield fallback
  glyph still mounts, and the warn still fires once.
- Header comment extended to mention the non-string case.
- Not touched: the model's declared types (`Hero.image`/`Creature.image` stay `string`, per
  the reviewer's explicit "do not refactor the model" instruction), `SccRefProvider`, the
  error-text lead-in, and everything else out of MEDIUM-1's scope.
- The `sidebarEncounterHandoff` flake was NOT investigated or touched (out of scope per the
  message; the ticket-owner is filing it separately) — it did not reproduce in this round's
  full jest run regardless.

## Can-fail proof (sabotage)

Reverted the guard to `const wasSpecified = imgSrcRaw?.trim();` (the pre-fix-round-2 form).
Ran `npx jest test/dom/elements/initiative-portrait-missing.test.ts` → **1 failed, 5
passed** — exactly the new MEDIUM-1 test, failing with
`TypeError: imgSrcRaw.trim is not a function` thrown from inside the `.catch` handler at
`view.ts:1200`, and a secondary assertion failure (`Expected number of calls: 1, Received
number of calls: 0`) from the warn never firing because the throw pre-empted it — precisely
the regression MEDIUM-1 describes. Log: `sc240-fix2-sabotage-medium1.log`. Restored from a
pre-edit copy; `git diff` against HEAD afterward: empty.

## Gates (worktree `sc240-scc-ref-error/draw-steel-elements`, sha `f6fb208`)

All run via `devbox run -- bash -c 'cd <worktree>/draw-steel-elements && <cmd>'`, foreground,
each with an explicit extended Bash timeout (shots/parity routinely exceed the tool's
120s default under concurrent-agent load) rather than left to auto-background, each command
last in its `bash -c` string.

| Gate | Result | Log |
|---|---|---|
| `npm run tsc` | clean, exit 0 | `sc240-fix2-tsc.log` |
| `npm run lint` | clean, exit 0 | `sc240-fix2-lint.log` |
| `npx jest` | **3937 passed / 1 skipped / 202 of 203 suites**, exit 0 (no flake this run) | `sc240-fix2-jest.log` |
| `npm run shots` | **524 PNGs, 0 FAIL**, exit 0 (all in-run gates OK) | `sc240-fix2-shots.log` |
| `check-freeze.sh <shots-dir>` | **`freeze OK (260/260 …)`**, exit 0 — 0 pixels moved | `sc240-fix2-freeze.log` |
| `npm run parity` (LAST) | **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)**, exit 0 | `sc240-fix2-parity.log` |

`main.js`/`styles.css` removed from the plugin root before each jest/shots run (SC-169
footgun).

## Commits (this round)

- `f6fb208` — `fix(initiative): SC-240 re-review MEDIUM-1 — non-string image no longer throws in renderPortrait`
  (on top of `3284b5d`, not amended/squashed).

## Evidence artifacts (fix round 2, absolute paths)

- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc240-scc-ref-error/sc240-fix2-tsc.log`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc240-scc-ref-error/sc240-fix2-lint.log`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc240-scc-ref-error/sc240-fix2-jest.log`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc240-scc-ref-error/sc240-fix2-shots.log`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc240-scc-ref-error/sc240-fix2-freeze.log`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc240-scc-ref-error/sc240-fix2-parity.log`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc240-scc-ref-error/sc240-fix2-sabotage-medium1.log`
