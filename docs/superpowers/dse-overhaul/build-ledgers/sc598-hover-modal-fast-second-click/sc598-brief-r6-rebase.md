# SC-598 r6 brief — rebase onto b5d18f79 + O14 + full battery (orchestration:implementer, I1 resumed)

Same worktree, rules and footguns as your r2 brief (`sc598-brief-r2-impl.md` §4: devbox `-c`, `git -C`, private scratch `.../scratchpad/sc598-r6-I1/`, Write tool for scratch, no glob/variable `rm`, never `rm -rf` a `/tmp` glob, no pattern kills, foreground gates, no tracker). Replacement-ready: a fresh worker reads the ledger (`decisions.md`, O1–O14), `sc598-r4-fix-report.md` and `sc598-r5-rereview-report.md` (INFO-1, INFO-3).

## 1. Rebase

dse develop is now `b5d18f79` (SC-589 landed; `src/elements/initiative/view.ts`, initiative e2e specs and jest, a sidebar vault note, dse CHANGELOG.md — no file shared with SC-598). `git -C <wt>/draw-steel-elements fetch origin`, rebase the five SC-598 commits onto `b5d18f79`, and save the range-diff (`sc598-r6-dse-range-diff.log`; expect all `=`). The superproject branch (`7cb0fdaf` on workspace `origin/main` `e9ff3635`): `git -C <wt> fetch origin`; if `origin/main` moved, rebase onto it keeping every other `## Unreleased` bullet; do not bump the dse pointer. **Never `git commit -am` in the superproject** (it stages the dse pointer — r4 did this once).

## 2. O14 (verbatim from the ledger)

"fold into r6 (I1 resumed, with the b5d18f79 rebase): **INFO-1** — `reopen rv` asserts the preview is `.is-editing` before the second open. **INFO-3** — the vacuity gate is right, but a required gate must not flake under load: cut the trials' scheduled lead time before the second press (no added phases or waits) so the measured gap stays well under 140 ms on a loaded host (target ≤ ~90 ms; report every trial's gap from part 5), keeping each trial red on base; do not raise the 140 ms threshold (150 is the helper's delay). INFO-2 — no action."

Make these as one new test-only commit on top (G-S91 harness code only). Show G-S91 red on a `b5d18f79` build (all trials) and green on head. Update `sc598-dse-verify-proposal.md` in place (new CURRENT draft on `b5d18f79`, gaps, part-5 time).

## 3. Gates (expected at dse develop `b5d18f79`)

tsc + lint 0; jest **7328 + 13 = 7341 passed / 2 skipped** (fresh tree; `rm -f main.js styles.css` with literal paths first); lifecycle all five parts (21 / 16 / 9 / 4 / 7 = **57/57**; part 5 `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87 G-S91`, ≤ ~420 s; record every part's wall time); e2e **`272/276 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs`** (RECOV-R07 is a real signal); styles.css sha equal to a `b5d18f79` build (expected `5e5ff488…`) so shots/freeze/parity carry.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc598-hover-modal-fast-second-click/sc598-r6-rebase-report.md`, ≤10-line executive summary first (dse head + base, superproject head + base, range-diffs, every gate number, part-5 time, G-S91 per-trial gaps, red/green). Evidence prefixed `sc598-r6-`. If the report write is blocked, return it inline. If you need input, end with `STATUS: NEEDS_CONTEXT`. Final text: raw facts plus absolute paths of every evidence file.
