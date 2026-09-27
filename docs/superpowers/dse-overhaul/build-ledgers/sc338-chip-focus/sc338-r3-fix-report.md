# SC-338 round 3 (small fix round) — report

## Executive summary

**Status: DONE.** Owner ruling R-r3: r2's `.dse-swatch` fold failed on its own evidence (a
focused unpressed swatch became indistinguishable from a pressed one — worse than base).
Every `.dse-swatch` addition reverted: both CSS hunks, both guard-test assertions, the
CHANGELOG mention, the dse-verify mention — the two test files are now byte-identical to
round 1 (`git diff 7177033` on them is empty). SC-338 is `.dse-optchip` only from here;
swatch focus design moved to SC-361 (Backlog). Kept r2's MEDIUM-1 CHANGELOG clause and the
LOW-1/LOW-2 dse-verify fixes. Chip rules themselves never changed across r1→r2→r3 (proven
by diff), so chip pixels did not move — r1/r2 grids stay valid, not regenerated. Base
unchanged (`origin/develop` `6c4f6aa`). Full battery green.

## Commits

- `draw-steel-elements` `a756ec1bef1c7a5a3f9b52af96aa3da383ef05e0` — `revert(kit): SC-338
  r3 — pull .dse-swatch back out; SC-338 = chips only` (styles-source.css,
  test/dom/kit/kit-index.test.ts, test/dom/theme/hostRegrounding.test.ts)
- Superproject worktree `00ada4b9837bd9ded946a92987244240c3657fc5` — `docs: SC-338 r3 —
  CHANGELOG chips-only + dse-verify swatch mention removed` (CHANGELOG.md,
  `.claude/skills/dse-verify/SKILL.md`). `draw-steel-elements` pointer intentionally left
  **uncommitted** (dispatcher bumps it at landing).

## Base

`git fetch origin` in dse: `origin/develop` is still `6c4f6aa` — no rebase needed.

## What changed

`git diff 7177033..HEAD -- styles-source.css` still contains the word "swatch" — in
REWORDED comments only, pointing at SC-361 and explaining why the r2 addition was pulled
back out (repo convention: reverted/retired work is documented in place, not silently
deleted — matches every "RETIREMENT"/"reverted" precedent elsewhere in this file and in
dse-verify SKILL.md). No `.dse-swatch` selector or `:where()` list membership remains —
confirmed by direct grep for the functional selector forms (empty result) and by the two
guard tests' diff against `7177033` being exactly empty.

## Gates

Devbox: `devbox run -- bash -c 'cd .../draw-steel-elements && <cmd>'`, gate command last,
`rm -f main.js styles.css` before every jest/build step, foreground only (`npm run shots`
auto-backgrounded past the 120s tool timeout on its own, tracked via the harness's own
background-task mechanism — never a manual `&`).

| Gate | Line |
|---|---|
| tsc | clean, exit 0 |
| lint | clean, exit 0 |
| jest | `Tests: 1 skipped, 3997 passed, 3998 total`; `Test Suites: 1 skipped, 206 passed, 206 of 207 total`; 3 snapshots, exit 0 — no flake this run (load 1.60 at start) |
| obsidian-lifecycle | `OBSIDIAN-LIFECYCLE done: 6/6 ok, 0 failed`, exit 0 |
| shots | 524 PNGs, 0 FAIL; `host-copy pin OK (6 button-reaching rules + 14 tokens × dark/light … verbatim Obsidian 1.14.2 …)`; `button host-leak OK (114 button kinds × 3 states … = 684 comparisons …)` — **identical to r1/r2's 114/684**, confirming the revert changed nothing about what the browser gallery mounts (swatches never mounted there either, so removing them moves nothing) |
| freeze | `freeze OK (260/260 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`, exit 0 — 0 frozen bytes moved |
| parity (last) | `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`, exit 0 |
| camera `--element=modal-montage-edit` (private Xvfb `:170`/9270, `DSE_CAMERA_TMP=/tmp/claude-1000/dse-obsidian-camera-sc338`) | `modal confirmed; no sideways scroll; focus ring inside the body (button.dse-optchip.dse-mt__sheet-resultchip)` |
| camera `--element=modal-montage-limits` | `modal confirmed; no sideways scroll; focus ring inside the body (input.dse-mt__sheet-input)` |

Xvfb `:170` started and stopped by exact PID (`598212`), verified via `ps -p 598212 -o
pid,cmd` immediately before `kill -TERM`; no `pkill`/`killall` by pattern used anywhere
this round.

## Chip pixels — did they move?

**No.** `git diff 7177033..HEAD -- styles-source.css` shows the `.dse-optchip:focus-visible,`
selector line and the `.dse-optchip` entry in the SC-203 `:where()` box-shadow list as pure
CONTEXT lines in every hunk — never added, removed, or reordered relative to each other or
to any other chip-affecting rule, across r1 → r2 → r3. Only surrounding comments changed.
r1's `evidence-r1/sc338-chip-focus-grid.png` and r2's `evidence-r2/sc338-grid-rest.png` stay
valid; neither was regenerated this round.

## Evidence

No new evidence this round (CSS-only revert of already-evidenced, already-reverted work;
gates + the diff-emptiness proof are the evidence). r1/r2 evidence directories are
untouched.

## Drive-by fixes

None.

## Follow-ups

Unchanged from r2: F2/INFO-2 → SC-356 (Backlog); INFO-1 → SC-360 (Backlog); swatch focus
design → SC-361 (Backlog, new this round).

## Tree state

Both worktrees clean except the pre-existing, deliberately-uncommitted ` M
draw-steel-elements` submodule pointer in the superproject.

## Return contract

- Verdict: **DONE.**
- Commits: `draw-steel-elements` `a756ec1bef1c7a5a3f9b52af96aa3da383ef05e0`; superproject
  worktree `00ada4b9837bd9ded946a92987244240c3657fc5`.
- Base: `origin/develop` `6c4f6aa` (unchanged, no rebase needed).
- Gates: tsc/lint clean; jest 3997/1 skipped/3998/206 of 207 (no flake); lifecycle 6/6;
  shots 524/0 FAIL, host-leak 114/684 (unchanged from r1/r2); freeze 260/260; parity
  0/0/16; real-Obsidian camera `modal-montage-edit` ring-checked ok, `modal-montage-limits`
  ok.
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc338-chip-focus/sc338-r3-fix-report.md`
- Evidence: none new this round; r1 (`evidence-r1/`) and r2 (`evidence-r2/`) evidence
  directories remain valid and untouched — chip rules never changed across r1→r2→r3
  (proven by diff, see "Chip pixels — did they move?" above), so nothing to regenerate.
  Gate logs for this round: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/a56f19e1-5165-4bc8-92ee-d6eeff34f029/scratchpad/sc338-r3/`
  (`tsc.log`, `lint.log`, `jest-full.log`, `lifecycle.log`, `shots.log`, `freeze.log`,
  `parity.log`, `camera-edit.log`, `camera-limits.log` — scratch, session-scoped; the
  gate LINES above are the durable record).

## Addendum (round 3b — comment trim)

**What:** trimmed the SC-338 comments in `styles-source.css` so they describe the current
code only, not the story of rounds that never landed on `develop`, and don't cite rulings
as if Scott had approved them (they hadn't reached him yet).

- ~:14032 (shared kit ring rule): the "SC-338 r2 tried adding `.dse-swatch` … REVERTED
  (r3) …" paragraph replaced with one sentence: "`.dse-swatch` is deliberately NOT here:
  its pressed mark already uses this exact outline, so a shared ring would make focus
  look like selection — see SC-361."
- ~:15351 (SC-203 box-shadow re-grounding, section B): the MEDIUM-1 fact kept in three
  lines (`box-shadow: none` applies at rest/hover too, so unpressed chips lose Obsidian's
  input-shadow plate, same as every other member of the list); dropped "Kept deliberately
  (owner ruling, r1 review) …" and the whole swatch paragraph.

**Commit:** `draw-steel-elements` `c19069a51222ecd49674d738e75556d0d9925519` —
`docs(kit): SC-338 r3b — trim comments to describe current code only`. No superproject
commit this round (no CHANGELOG/SKILL.md content changed — this is a code-comment-only
edit).

**Verified comment-only:** `git diff 7177033 -- styles-source.css` touches only lines
inside `/* */` blocks — confirmed by inspection of the full diff (both hunks are pure
comment text; every non-comment line, including `.dse-optchip:focus-visible,` and its
`:where()` membership, is unchanged context). `git status --porcelain` shows no other
file touched.

**Gates run (comment-only change; tsc/lint/jest only, per instruction — jest reads
`styles-source.css` for the two guard tests):**

| Gate | Line |
|---|---|
| tsc | clean, exit 0 |
| lint | clean, exit 0 |
| jest (run 1) | `1 failed, 1 skipped, 3996 passed, 3998 total` — `test/dom/framework/sidebarInitiative.test.ts:350`, the known load-sensitive flake SC-360 (load 2.75 at start), unrelated to this change |
| jest (run 2, re-run per SC-360 protocol) | `Tests: 1 skipped, 3997 passed, 3998 total`; `Test Suites: 1 skipped, 206 passed, 206 of 207 total`; 3 snapshots, exit 0 |

Full logs: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/a56f19e1-5165-4bc8-92ee-d6eeff34f029/scratchpad/sc338-r3b/`
(`tsc.log`, `lint.log`, `jest-full.log` (run 1, the flake), `jest-full-rerun.log` (run 2,
clean)).

**Tree state after:** `draw-steel-elements` clean (`git status --porcelain` empty at
`c19069a`); superproject unchanged (still only the pre-existing ` M draw-steel-elements`
pointer).

## Addendum (round 3c — re-review LOW-1/INFO-1/INFO-2)

**What:**
- **LOW-1** (`.claude/skills/dse-verify/SKILL.md`, superproject): the round 1/2/3 battery
  blocks still told the swatch fold-and-revert story after R-r3 said to remove the
  dse-verify mention, and cited `a756ec1` rather than the actual final head. Replaced with
  one consolidated `**Battery at SC-338** (dse `c19069a`, ...)` entry — same measured
  numbers, no round-by-round history. The LOW-2 correction and the 114/684 drift note
  (both above this entry, in a different section) are unchanged.
- **INFO-1** (`styles-source.css`): two stale cross-pointers left over from the r3b trim —
  the ring-rule comment's `~:15335` (now `~:14032`'s actual target, the SC-203 box-shadow
  block's opening line, `~:15360`) and the box-shadow comment's `~:14022` (the actual
  `.dse-optchip:focus-visible,` line, `~:14035`). Both corrected and verified by grep
  against the final file.
- **INFO-2** (`styles-source.css`): the box-shadow comment described light mode's rest
  look as "a 12%-black inset ring" alone. Obsidian's light `--input-shadow` token is
  `inset 0 0 0 1px rgba(0,0,0,.12), 0 1px 2px 0 rgba(0,0,0,.065)` — the inset ring PLUS a
  faint drop shadow. Wording corrected to name both layers.

**Commits:**
- `draw-steel-elements` `c3d36c5ea53ef80437808cfc4edacff0831ec592` — `docs(kit): SC-338
  r3c — fix stale line pointers + light-mode shadow wording`
- Superproject worktree `28a155d7dd919ad359ab4e010445b291a3bb6ed3` — `docs: SC-338 r3c —
  dse-verify: one consolidated battery entry, no round history`

**Verified comment-only:** `git diff c19069a -- styles-source.css` touches only comment
text (3 small in-place edits: two line-number digits, one wording clause); `git status
--porcelain` shows no other file touched in either repo (besides the pre-existing
superproject `draw-steel-elements` pointer).

**Gates run (comment/docs-only; tsc, lint, jest only, per instruction):**

| Gate | Line |
|---|---|
| tsc | clean, exit 0 |
| lint | clean, exit 0 |
| jest (run 1) | `1 failed, 1 skipped, 3996 passed, 3998 total` — `test/dom/framework/sidebarEncounterHandoff.test.ts:416` (load 8.26 at start). **Not** the documented SC-360 (`sidebarInitiative.test.ts:350`) — a different sidebar suite, same load-sensitive category the dse-verify skill's own "Load-sensitive jest suites" note describes; a comment-only CSS diff cannot cause a test failure |
| jest (run 2, re-run) | `Tests: 1 skipped, 3997 passed, 3998 total`; `Test Suites: 1 skipped, 206 passed, 206 of 207 total`; 3 snapshots, exit 0 (load 12.52 at start — green despite higher load, confirming non-determinism, not a regression) |

Full logs: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/a56f19e1-5165-4bc8-92ee-d6eeff34f029/scratchpad/sc338-r3c/`
(`tsc.log`, `lint.log`, `jest-full.log` (run 1, the flake), `jest-full-rerun.log` (run 2,
clean)).

**Tree state after:** both worktrees clean except the pre-existing, deliberately-
uncommitted ` M draw-steel-elements` pointer in the superproject.
