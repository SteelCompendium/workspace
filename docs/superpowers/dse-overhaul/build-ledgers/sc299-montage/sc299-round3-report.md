# SC-299 round 3 — rebase + re-review-1 fix round (HIGH-1, LOW-1, LOW-2)

## Executive summary

- **Verdict: DONE.** Both rebases landed clean (dse onto `5a5ed49`, superproject onto
  `8685b65`), and all three folded findings are fixed: HIGH-1 (both halves — containment
  wrap + `--dse-mt-colmin` geometry widening — plus a real-Chromium in-run gate), LOW-1
  (aria-label dropped from the role-less empty current-round cell), LOW-2 (light contrast
  pin reads the declared `chip-bg` token instead of a hand-copied hex).
- ws head `f229603` on base `8685b65`; dse head `b2e40d1` on base `5a5ed49`.
- Conflicts: `CHANGELOG.md` (both rebases, kept both sides each time) and one submodule
  gitlink conflict (resolved to the rebased dse head, never main's).
- Gates (verbatim, measured this round): tsc clean · lint clean · jest `Test Suites: 1
  skipped, 202 passed, 202 of 203 total` / `Tests: 1 skipped, 3902 passed, 3903 total` /
  `Snapshots: 3 passed, 3 total` · shots 524 PNGs, 0 FAIL, exit 0 (my new
  `montage quick-trio containment OK (6 configurations…)` gate included) · freeze
  `freeze OK (260/260 frozen print PNGs byte-identical — steel-print twin + steel-realprint
  since SC-170)`, exit 0 · parity `0 gap(s), 0 undeclared warning(s), 16 declared
  deferral(s)`, exit 0.
- No frozen bytes moved, no new parity gaps, `bg-color` fired 0 rows.
- 3 dse commits (`7f9227a`, `fcfb705`, `b2e40d1`), 1 ws pointer-bump commit (`f229603`);
  no attribution trailers in any of them.

## 1. Rebases

### 1.1 dse (`sc299-montage` → `origin/develop` `5a5ed49`)

`git fetch origin` then `git rebase origin/develop`, from old base `96e2238`. Fully clean —
**zero conflicts**, not even `CHANGELOG.md` (SC-126's own dse-side changes didn't touch
lines review-1's commits touched). `package.json`/`package-lock.json` unchanged between
`96e2238..5a5ed49` (`git diff --stat` empty) — no `npm ci` run. New head: `6e5f35c` (later
moved to `b2e40d1` by this round's fix commits, see §3).

### 1.2 Superproject (`sc299-montage` → `origin/main` `8685b65`)

`git fetch origin` then `git rebase origin/main`, from old base `728f514`, replaying two
commits (`cf5f7da`, `69b8002`).

- **`CHANGELOG.md`**: conflicted on both replayed commits. First conflict — kept both
  sides (origin/main's SC-325/SC-315/SC-196 bullets + the branch's SC-299 bullet,
  concatenated, no markers left). Second conflict — `CHANGELOG.md` auto-merged clean
  (only the submodule gitlink conflicted); the second commit ended up carrying just the
  blank-line fix (INFO-8) since the SC-299 bullet itself was already folded into the first
  commit's resolution.
- **`draw-steel-elements` gitlink**: conflicted on both replayed commits (round 1's bump
  and round 2's bump, since dse itself was rebased first). Resolved to the rebased dse
  head each time (`git add draw-steel-elements` after confirming the submodule's checked-
  out `HEAD` matched the intended rebased commit) — never to main's `5a5ed49`. Final
  pointer after the rebase: `6e5f35c`.
- Verified post-rebase: `git diff origin/main -- CHANGELOG.md` shows exactly the SC-299
  bullet added, nothing else; `docs/handoffs/HANDOFF.md` and every other file main changed
  is untouched (`git diff origin/main --stat -- . ':!draw-steel-elements'` shows only
  `CHANGELOG.md` plus 3 pre-existing, uncommitted, unrelated submodule checkout drifts in
  the working tree — `steel-etl`/`steelCompendium.github.io`/`v2` — left as found, never
  staged or committed).

## 2. Re-review-1 fixes (owner rulings, ledger "Re-review 1 DONE 2026-09-18")

### HIGH-1 — coarse-pointer quick trio overflowed its cell (wrong-write)

Both halves per the owner's ruling:

1. **Containment** (`styles-source.css`, `@media (pointer: coarse)`): `.dse-mt__cell-quick`
   gains `max-width: 100%` + `flex-wrap: wrap`. Both lines are required — `max-width` alone
   still failed the hit-test in my own A/B (flex items refuse to shrink below their
   min-content without `flex-wrap`), matching the reviewer's own finding.
2. **Geometry** (`src/elements/montage/BoardView.ts` + `styles-source.css`): the round
   track's own minimum now reads `minmax(var(--dse-mt-colmin, 5.2em), 1fr)` (was a bare
   `5.2em` literal) — the sanctioned geometry seam untouched (still one `setProperty` call
   for `--dse-mt-cols`), with `--dse-mt-colmin: 9.2em` declared on `.dse-mt__board` inside
   the coarse block only. Non-coarse layout is byte-identical (the `var()` fallback is the
   old literal).

**In-run gate** (`visual-harness/shoot.mjs`, `assertMontageCoarseContainment`): its own
Chromium browser context (`hasTouch: true, isMobile: true` — the only way to make
`(pointer: coarse)` match; proven via `matchMedia` in-page, fails loudly if it doesn't
match rather than assuming). Two invariants: every `.dse-mt__cell-quick` box stays inside
its own `.dse-mt__cell` box, and `elementFromPoint` 6px inside a recorded cell's right edge
returns that cell. Exercised at 560/700/900px panes (mid fixture, real 3-round DOM — both
checks) and with the round track list rewritten to 4/5/8 rounds at the full pane
(containment check only — see the function's own doc comment for why: rewriting
`--dse-mt-cols` to more tracks than the DOM has real cells needs each probed cell's
`grid-column` pinned explicitly, or CSS Grid's implicit auto-placement (which only lines
hero rows up correctly when every row has exactly `2 + rounds` children) staggers every row
diagonally — an artifact of the synthetic rewrite I found and fixed via explicit
`grid-column` placement, not anything a real N-round board hits; and containment alone is
sufficient there because a trio proven to stay inside its own cell cannot occupy a
different cell's pixels regardless of round count, so the wrong-write cannot occur without
a containment violation first). Prints `montage quick-trio containment OK (6
configurations: 560/700/900px panes + 4/5/8-round track lists, mid fixture, pointer:
coarse — …)` on success; a violation fails `npm run shots` with the measured pixel numbers
and exits 1 (verified this fires correctly — an earlier draft of the round-rewrite loop,
before the `grid-column` fix, correctly failed the gate on a real geometry bug I introduced
by omission, caught it, and fixed it before this final run).

Jest CSS-contract test added (`test/dom/elements/montage.test.ts`) pinning both
declarations (`max-width: 100%`, `flex-wrap: wrap` on `.dse-mt__cell-quick`;
`--dse-mt-colmin: 9.2em` on `.dse-mt__board`) plus a DOM test pinning the geometry seam's
own `--dse-mt-cols` string shape (`minmax(var(--dse-mt-colmin, 5.2em), 1fr)` × rounds).

Evidence (real coarse-pointer captures, mid fixture, steel dark, post-fix):
`evidence/sc299-r3-coarse-{560,700,900}.png` — visually confirmed clean, no overlap onto
round-2's cells at any width (900 renders at the harness's own 760px `#mount` cap, same
constraint the reviewer's own `index.html` reproduction is subject to).

### LOW-1 — aria-label on the role-less empty current-round cell

`BoardView.ts`: `cell.setAttribute('aria-label', ariaLabel)` is now conditional on
`!isEmptyCurrentCell` — dropped for exactly the one role-less cell shape (review-1 MED-2),
kept for every other cell shape (all of which still carry `role="button"`). No `title`
added, per the owner's ruling. Existing DOM test updated (`hasAttribute('aria-label')` now
asserted `false` instead of pinning the old string).

### LOW-2 — light contrast pin hard-coded its ground

`test/dom/framework/lightContrast.test.ts`: the `turn-done` pin's `ground: '#eaeeef'`
literal is now `ground: lightValue('chip-bg')` — reads the declared `--dse-chip-bg` token
from the Steel light block directly, matching how `FILL_INK` already tracks declared
tokens rather than copied hexes. A future edit to `--dse-chip-bg` now moves this pin's
ground with it instead of leaving it stale-but-passing.

## 3. Gates (full battery, post-fix, dse `b2e40d1` / ws `f229603`)

All run in the foreground, gate command last in `bash -c`, per the dse-verify skill.

| Gate | Result | Log |
|---|---|---|
| `npm run tsc` | clean, no output, exit 0 | `sc299-r3-tsc.log` |
| `npm run lint` | clean, no output, exit 0 | `sc299-r3-lint.log` |
| `rm -f main.js styles.css && npx jest` | `Test Suites: 1 skipped, 202 passed, 202 of 203 total` / `Tests: 1 skipped, 3902 passed, 3903 total` / `Snapshots: 3 passed, 3 total`, exit 0 | `sc299-r3-jest.log` |
| `npm run shots` | 524 PNGs, `0 FAIL`; `montage quick-trio containment OK (6 configurations…)`; `host-copy pin OK`; `button host-leak OK (114 kinds × 3 states × dark/light = 684 comparisons)`; exit 0 | `sc299-r3-shots.log` |
| `check-freeze.sh <shots>` | `freeze OK (260/260 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`, exit 0 | `sc299-r3-freeze.log` |
| `npm run parity` (last) | `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`, exit 0; `bg-color` fires 0 rows (unchanged) | `sc299-r3-parity.log` |

Jest 3902 vs review-1's own 3881 baseline: +21, net of (a) tests that arrived via the
`5a5ed49` rebase itself (SC-126's own additional commits between `96e2238` and `5a5ed49`
add tests unrelated to this ticket) and (b) my own +2 new tests (the geometry-seam DOM test
+ the HIGH-1 CSS-contract test) — no test was deleted or weakened to hit a number.

## 4. Drive-by fixes

None.

## 5. Follow-ups

- **Board-level clipping at high round counts under coarse, worth the owner's attention
  (not fixed here — out of the folded scope).** `.dse-mt__board` clips its own overflow
  (`border-radius` + `overflow: hidden`, decoration tier, pre-existing, unrelated to this
  fix). The `--dse-mt-colmin: 9.2em` widening (HIGH-1 part 2) raises the round column's
  hard minimum under coarse from ~83px to ~147px; at high round counts (measured: 8 rounds)
  the sum of hard minimums can exceed the board's own rendered width, and content beyond
  that width is clipped and un-hit-testable (not merely visually cut off — genuinely
  unreachable) rather than requiring horizontal scroll. This is a narrower, different
  concern than HIGH-1 (a container clipping its own overflow, not a control painting over a
  neighbour), was not part of the owner's ruling, and is orthogonal to whether HIGH-1's own
  containment/wrong-write invariants hold (they do, at every round count I tested,
  including 8). Flagging so the owner can judge whether very-high-round-count coarse-
  pointer montages need their own follow-up (e.g., horizontal scroll on
  `.dse-mt__board-wrap`, or a lower `--dse-mt-colmin` past some round-count threshold).

## Artifacts

- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc299-montage/sc299-round3-report.md`
- Gate logs: `sc299-r3-{tsc,lint,jest,shots,freeze,parity}.log` in
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc299-montage/`
- Evidence: `evidence/sc299-r3-coarse-{560,700,900}.png` in the same directory
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc299-montage` (superproject head
  `f229603`) and `.../sc299-montage/draw-steel-elements` (head `b2e40d1`), working trees
  clean (the 3 pre-existing unrelated submodule checkout drifts — `steel-etl`,
  `steelCompendium.github.io`, `v2` — left untouched, unstaged, exactly as found)

## Commit shas

- dse `7f9227a` — fix(montage): SC-299 review-1 round-3 HIGH-1/LOW-1 — contain the
  coarse-pointer quick trio; drop the empty-current-cell aria-label
- dse `fcfb705` — test(montage): SC-299 review-1 round-3 — HIGH-1/LOW-1 coverage plus a
  real-Chromium containment gate
- dse `b2e40d1` — test(framework): SC-299 review-1 round-3 LOW-2 — light contrast pin
  reads the declared chip-bg token
- ws `f229603` — chore: bump draw-steel-elements submodule pointer (SC-299 r3)

No attribution trailers in any commit. No push, no tags.
