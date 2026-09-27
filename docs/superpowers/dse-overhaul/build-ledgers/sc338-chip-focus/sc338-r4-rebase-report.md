# SC-338 round 4 — rebase + full battery — report

## Executive summary

**Status: DONE.** No code change (Scott approved both asks 2026-09-27: ring look, and the
rest-state drop-shadow removal). Rebased dse onto `origin/develop` `825ea51` — no CSS/test
conflicts, two stale `~:NNNNN` comment pointers fixed by grep against the post-rebase file.
Rebased the superproject onto `origin/main` — 3 CHANGELOG.md conflicts (each SC-338 commit
editing the same bullet in sequence), resolved by keeping every other bullet and replaying
SC-338's own wording history; dse-verify SKILL.md's battery entry updated to the new sha
and numbers. `git diff origin/develop..HEAD` in dse shows only the SC-338 files. Chip
pixels byte-identical to r1 (md5). Full battery green.

## Commits

- `draw-steel-elements` `afd6ae30d869b5b53054739f8db61fdb73818368` — `docs(kit): SC-338 r4
  — re-point SC-338 line pointers after rebase onto 825ea51` (on top of the rebased r1-r3c
  history: `d6b08a1`/`4d84438`/`994cac8`/`246a35b`/`f5a1346`, each reapplied by the rebase
  with a new sha).
- Superproject worktree `efc602070bf73281dcc128210a552b64e96dca48` — `docs: SC-338 r4 —
  dse-verify battery entry updated for the 825ea51 rebase` (on top of the rebased r1/r2/r3
  history: `8fa0885`/`415e8e4`/`e1f6b8e`/`2719ebd`). `draw-steel-elements` pointer
  intentionally left **uncommitted** (dispatcher bumps it at landing).

## Base

dse: `git fetch origin` → `origin/develop` = `825ea51` (matches brief's expectation exactly,
7 tickets landed since `6c4f6aa`: SC-243, SC-230, SC-272, SC-236, SC-255, SC-231, SC-284).
Superproject: `origin/main` = `601b44a`.

## Rebase — dse

`git rebase origin/develop`: **no conflicts** on any of the 5 SC-338 commits. The rebase
shifted line numbers below the SC-338 hunks by ~220 lines (unrelated landings added content
above), which went stale exactly where the brief predicted: two in-comment `~:NNNNN`
pointers. Re-verified and fixed by direct `grep -n` against the post-rebase file (not
estimated): the ring-rule comment's pointer to the SC-203 box-shadow block (now `~:15591`,
was `~:15360`) and that block's pointer back to `.dse-optchip:focus-visible,` (now `~:14266`,
was `~:14035`). No `npm ci` needed — `package.json`/the lockfile are unchanged between
`6c4f6aa` and `825ea51`.

## Rebase — superproject

`git rebase origin/main` (branch `sc338-chip-focus`): **3 CHANGELOG.md conflicts**, one per
SC-338 commit that edits the Unreleased SC-338 bullet (r1 adds it, r2 rewords it to include
swatches, r3 reverts the wording to chips-only) — each conflict was "both sides inserted/
edited the same bullet slot"; resolved by keeping SC-243's bullet (from `origin/main`) above
the SC-338 bullet, and letting each SC-338 commit's own intended wording win in turn (so the
sequence replays faithfully — r1's wording, then r2's, then r3's, exactly as if rebasing
against a base with no SC-338 bullet at all). `.claude/skills/dse-verify/SKILL.md` conflicts
auto-merged cleanly every time (no manual resolution needed — SC-338's edits and the other
landed tickets' edits touch different parts of the file). Final CHANGELOG.md: `grep -c
'^- \*\*'` = 170 bullets, 0 conflict markers anywhere in either file.

## Gates

Devbox: `devbox run -- bash -c 'cd .../draw-steel-elements && <cmd>'`, gate command last,
`rm -f main.js styles.css` before every jest/build step, foreground only (`npm run shots`
and `npm run obsidian-lifecycle` both auto-backgrounded past the 120s tool timeout on
their own, tracked via the harness's own background-task mechanism — never a manual `&`).

| Gate | Line |
|---|---|
| tsc | clean, exit 0 |
| lint | clean, exit 0 |
| jest | `Tests: 1 skipped, 4112 passed, 4113 total`; `Test Suites: 1 skipped, 211 passed, 211 of 212 total`; 3 snapshots, exit 0 — green on the first run, no flake (load 3.34 at start). Counts grew from `6c4f6aa`'s 3997/206-of-207 purely from the 7 unrelated tickets landed on `origin/develop` in between; SC-338 itself adds 0 new `test()` blocks this round |
| obsidian-lifecycle | `OBSIDIAN-LIFECYCLE done: 19/19 ok, 0 failed`, exit 0 — matches the brief's expected count exactly (up from 6/6 pre-rebase; the extra 13 scenarios are SC-343's later landings, unrelated to SC-338) |
| shots | 532 PNGs, 0 FAIL (up from 524 — new fixtures from landed tickets); `host-copy pin OK (6 button-reaching rules + 14 tokens × dark/light … verbatim Obsidian 1.14.2 …)`; `button host-leak OK (114 button kinds × 3 states … = 684 comparisons …)` — **identical to every prior round's 114/684**, confirming the rebase changed nothing about what the browser gallery mounts |
| freeze | `freeze OK (260/260 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`, exit 0 — 0 frozen bytes moved. (The 260-line baseline itself was rebaselined by others' sanctioned landings between rounds per the ledger; SC-338 never touched it and moves none of it) |
| parity (last) | `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`, exit 0 |
| camera `--element=modal-montage-edit` (private Xvfb `:170`/9270, `DSE_CAMERA_TMP=/tmp/claude-1000/dse-obsidian-camera-sc338`) | `modal confirmed; no sideways scroll; focus ring inside the body (button.dse-optchip.dse-mt__sheet-resultchip)` |
| camera `--element=modal-montage-limits` | `modal confirmed; no sideways scroll; focus ring inside the body (input.dse-mt__sheet-input)` |

Xvfb `:170` (PID `4095748`) killed by exact PID after `ps -p` confirmation; no
`pkill`/`killall` by pattern used anywhere this round. No background wait loops started.

## Chip pixels — did the rebase move them?

**No — proven byte-identical, not merely visually compared.** Real-Obsidian camera
(`--element=modal-montage-edit`, private Xvfb `:170`/9270), a temporary opt-in probe patch
(`SC338_R4_PROBE=1`, reverted byte-clean after capture — `git diff` on
`visual-harness/obsidian-camera.mjs` is empty) cropped the focused (auto-focused, pressed)
Success chip, dark then light. `md5sum` against the equivalent crops from `evidence-r1`
(the very first landing, `evidence-r1/probe-after/sc338-probe-{dark,light}-pressed.png`):

```
d85c3b047734fa192165110d0638dc8d  evidence-r1/probe-after/sc338-probe-dark-pressed.png
d85c3b047734fa192165110d0638dc8d  evidence-r4/sc338-r4-probe-dark-pressed.png
7fcd3db728f8f9606ff3c31e1d8c1613  evidence-r1/probe-after/sc338-probe-light-pressed.png
7fcd3db728f8f9606ff3c31e1d8c1613  evidence-r4/sc338-r4-probe-light-pressed.png
```

Identical hashes both themes — the PNGs are byte-for-byte the same file. This is expected:
`git diff origin/develop..HEAD` (see above) shows the SC-338 CSS/test hunks are the only
change, and within those hunks the chip's own selector membership, specificity, and
declared values never moved across r1→r2→r3→r3b→r3c→r4 (only comment text and, in r2→r3,
the now-reverted swatch addition, which never touched any `.dse-optchip` rule).

Evidence: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc338-chip-focus/evidence-r4/`
(`sc338-r4-probe-dark-pressed.png`, `sc338-r4-probe-light-pressed.png`).

## Drive-by fixes

None.

## Follow-ups

Unchanged: F2/INFO-2 → SC-356; INFO-1 → SC-360; swatch focus design → SC-361 (all
Backlog, no action this round).

## Tree state

Both worktrees clean except the pre-existing, deliberately-uncommitted ` M
draw-steel-elements` submodule pointer in the superproject. `git diff` on
`visual-harness/obsidian-camera.mjs` is empty (the r4 temp probe fully reverted).

## Return contract

- Verdict: **DONE.**
- Commits: `draw-steel-elements` `afd6ae30d869b5b53054739f8db61fdb73818368`; superproject
  worktree `efc602070bf73281dcc128210a552b64e96dca48`.
- Base shas: dse `origin/develop` `825ea51` (was `6c4f6aa`); superproject `origin/main`
  `601b44a9837cfb3d6e7cefd36734c0b2707da5be`.
- Gates: tsc/lint clean; jest 4112 passed/1 skipped/4113 total/211 of 212 suites (no
  flake); obsidian-lifecycle 19/19; shots 532 PNGs/0 FAIL, host-leak 114/684 (unchanged);
  freeze 260/260; parity 0/0/16; real-Obsidian camera `modal-montage-edit` ring-checked
  ok, `modal-montage-limits` ok.
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc338-chip-focus/sc338-r4-rebase-report.md`
- Evidence: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc338-chip-focus/evidence-r4/`
  (`sc338-r4-probe-dark-pressed.png`, `sc338-r4-probe-light-pressed.png` — both md5-identical
  to `evidence-r1/probe-after/`'s equivalents). Raw gate logs (scratch, session-scoped):
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/a56f19e1-5165-4bc8-92ee-d6eeff34f029/scratchpad/sc338-r4/`.
