# SC-299 round 4 report — harness-gate hardening + one comment (no plugin behaviour change)

## Executive summary

- **Verdict: DONE_WITH_CONCERNS.** Both prescribed fixes landed exactly as ruled (MED-1
  fold: viewport 2400 + null-hit classified as its own `PROBE POINT OFF-SCREEN` finding
  that still fails the gate; LOW-1 fold option (a): comment corrected; INFO (i)/(ii)
  folded). Full battery green: tsc/lint clean, jest 3902/1 skipped/202 of 203 suites
  (unchanged), shots 524 PNGs/0 FAIL, freeze `260/260`, parity `0/0/16`/exit 0 — zero
  frozen bytes moved, zero plugin behaviour changed (2 files touched, both harness/CSS
  comment).
- **One concern for the owner:** can-fail scenario (a) (drop `--dse-mt-colmin` only)
  no longer fails the gate at all (exit 0, 0 violations/wrong-writes/offscreen across
  all 6 configurations) — the brief predicted it would still exit 1 naming a real
  containment/geometry regression. Measured, there isn't one to name: at 5.2em the trio
  wraps to 3 rows but never overflows horizontally at any tested width/round-count: the
  pre-fix red was **entirely** the 47px viewport-clearance coincidence MED-1 diagnosed,
  not a masked geometry bug. See §2 below for the full reasoning and evidence.
- dse HEAD `d124cc3` (2 commits on `781c579`/`d124cc3`, base `b2e40d1`); superproject
  `bf4f2c3` on `origin/main` `8685b65`. No push, no tags.

## 1. What changed

`visual-harness/shoot.mjs` (`assertMontageCoarseContainment`, ~line 671-869):
- Viewport `1000x1000` → `1000x2400` (const `VIEWPORT_HEIGHT`), documented inline.
- `measure()`'s wrong-write loop now checks `if (!hit) { offscreen.push(...); continue; }`
  **before** computing `hitCell`, so a null `elementFromPoint` result can never be folded
  into a wrong-write.
- `report()` prints a new, loud, separate line per off-screen probe —
  `PROBE POINT OFF-SCREEN — not a wrong-write: <hero>'s round <n> probe at y=... falls
  outside this gate's own 2400px viewport...` — and still calls `process.exit(1)` (the
  gate still fails on an off-screen probe; it just names the finding correctly).
- CONTAINMENT now also measures the union of the `.dse-mt__quick` buttons inside each
  `.dse-mt__cell-quick`, not just the (`max-width`-capped) container (re-review-2 INFO
  (i)); violations print `CONTAINMENT (container)` / `CONTAINMENT (buttons)`.
- One doc line added noting the gate omits `sheet=1` deliberately, re-measured harmless
  (INFO (ii)).
- The "OK" line's text updated to describe both measurements and the fixed viewport.

`styles-source.css` (~3861, the GEOMETRY half of the HIGH-1 fix comment): corrected from
"stays on ONE row at ordinary round counts" to the measured truth — `9.2em` keeps the
trio at **two** rows instead of the pre-branch 5.2em minimum's three; one row needs
`>= 10.4em`, deliberately not chosen (SC-326). No declaration changed.

## 2. Can-fail re-proof — `sc299-r4-canfail.log`

Method: `assertMontageCoarseContainment` extracted **verbatim** (post-patch) into a
throwaway runner (deleted before finishing; never committed — `git status`/`git diff
--stat` below confirm the tree carries only the two intended files), run against the real
rebuilt harness bundle (`npm run harness:build`) after each `styles-source.css` injection.

| Injection | Exit | Result |
|---|---|---|
| baseline (shipped) | 0 | OK line, 6/6 configurations clean |
| **(a)** `--dse-mt-colmin: 9.2em` removed only | **0** | **0** violations / wrong-writes / offscreen at ALL 6 configurations (560/700/900px x 4/5/8-round rewrites) — see concern below |
| **(b)** all three fix declarations removed | **1** | 5x `CONTAINMENT (container)` + 5x `CONTAINMENT (buttons)`, cell 87.67px / trio 141.59px / overflow 26.95px-26.97px (matches re-review-2's own number to 0.05px), 5x `WRONG-WRITE` naming real `BUTTON[aria-label=...]` targets, **zero** `hit null` lines |
| **(c)** restore + rebuild | — | `git status --porcelain`: ` M styles-source.css` / ` M visual-harness/shoot.mjs` only; `git diff --stat`: exactly those 2 files, 86 insertions / 24 deletions total |

**(b) matches the brief's prediction exactly** — the original HIGH-1 regression still
fails loudly, now with both the pre-existing container check and the new INFO(i)
buttons-union check firing (both genuinely violated once `max-width` is also gone), and
the MED-1 fix visibly works: real button targets, no phantom null hits.

**(a) does not match the brief's prediction**, and this is the one thing to flag for the
owner. The brief text (from the re-review-2 MED-1 "prescribed fix") said: *"the gate must
still exit 1, but now naming the real containment/geometry regression rather than a null
hit."* Measured, dropping `--dse-mt-colmin` alone produces **no** containment violation
and **no** off-screen hit at any of the 6 tested configurations (full per-configuration
JSON logged in `sc299-r4-canfail.log`) — the 5.2em fallback wraps the trio to 3 rows, but
3 rows of one 44px button each fits comfortably inside every tested cell's content box
(64.6-68px range), so there was never a horizontal overflow to catch. The pre-fix
"exit 1 / hit null" for this exact injection was **entirely** the accidental 47px
viewport-clearance MED-1 itself diagnosed (Talin's round-2 probe at y=953 in the old
1000px viewport, y=1172 once 5.2em pushes the trio taller) — not evidence of a masked
geometry bug the old code was stumbling onto correctly for the wrong reason. Once the
viewport is widened exactly as prescribed, there is nothing left for this gate's two
invariants (CONTAINMENT, NO-WRONG-WRITE) to catch in this injection — the actual
regression from dropping colmin is the row-count/UX one LOW-1 already covers (comment
only, explicitly not gate-enforced by owner ruling). I did not fabricate a violation to
match the prediction; I implemented the owner's prescribed fix exactly and report the
real measurement.

## 3. Full battery

All logs in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc299-montage/`:

| Gate | Log | Result |
|---|---|---|
| `npm run tsc` | `sc299-r4-tsc.log` | clean, exit 0 |
| `npm run lint` | `sc299-r4-lint.log` | clean, exit 0 |
| `rm -f main.js styles.css && npx jest` | `sc299-r4-jest.log` | **3902 passed / 1 skipped / 202 of 203 suites**, 3 snapshots — unchanged from re-review-2's own numbers (no test surface touched by this round) |
| `npm run shots` | `sc299-r4-shots.log` | **524 PNGs, 0 FAIL**; new OK line read and updated (`montage quick-trio containment OK (6 configurations: ... every .dse-mt__cell-quick box AND its .dse-mt__quick buttons' union stay inside their own .dse-mt__cell; ... on-screen in this gate's 2400px viewport ...)`) |
| `check-freeze.sh` | `sc299-r4-freeze.log` | **`freeze OK (260/260 frozen print PNGs byte-identical)`**, exit 0 — nothing moved a frozen byte (expected: this round touches only a harness gate and a comment) |
| `npm run parity` (LAST) | `sc299-r4-parity.log` | **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)**, exit 0 — unchanged |

## 4. Commits

dse (`/home/scott/code/steelCompendium/worktrees/sc299-montage/draw-steel-elements`):
- `781c579` `test(harness): SC-299 round 4 — coarse-containment gate: 2400px viewport,
  classify null hits as off-screen not wrong-write, measure the quick-buttons union`
- `d124cc3` `style(montage): SC-299 round 4 — comment correction: colmin keeps the trio
  at two rows, not one`

Superproject (`/home/scott/code/steelCompendium/worktrees/sc299-montage`):
- `bf4f2c3` `chore: bump draw-steel-elements submodule pointer (SC-299 r4)`

No trailers on any commit (checked: `grep -i "co-authored\|generated with\|claude"` over
both commit bodies, 0 hits). No push, no tags.

## 5. Drive-by fixes

None.

## 6. Follow-ups

None filed (workers don't touch the tracker) — flagging for the owner instead: **the §2
can-fail discrepancy on injection (a)** is worth a look before closing SC-299 round 4 —
not because anything is broken (LOW-1's comment fix already documents that 5.2em's only
observable effect is row count, and containment holds at every tested colmin value per
re-review-2's own LOW-1 table), but because the MED-1 fix, applied exactly as prescribed,
happens to make this specific can-fail injection go fully quiet rather than "still fail
with a corrected diagnosis." If the owner wants the gate to keep some signal on a dropped
`--dse-mt-colmin` specifically (as opposed to trusting the CSS-contract jest test that
already pins the declaration), that would need a new, deliberately-scoped invariant (e.g.
asserting row count / cell height, not containment) — out of this round's scope as
briefed (no plugin behaviour change, gate limited to `assertMontageCoarseContainment`'s
existing two invariants).

## Artifacts

- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc299-montage/sc299-r4-canfail.log`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc299-montage/sc299-r4-tsc.log`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc299-montage/sc299-r4-lint.log`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc299-montage/sc299-r4-jest.log`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc299-montage/sc299-r4-shots.log`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc299-montage/sc299-r4-freeze.log`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc299-montage/sc299-r4-parity.log`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc299-montage/sc299-round4-report.md` (this file)

## Modified source

- `/home/scott/code/steelCompendium/worktrees/sc299-montage/draw-steel-elements/visual-harness/shoot.mjs`
- `/home/scott/code/steelCompendium/worktrees/sc299-montage/draw-steel-elements/styles-source.css`
