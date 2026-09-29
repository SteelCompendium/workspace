# SC-232 round 12 — final prep (rebase onto SC-235+SC-318, reconcile parity, final evidence)

## Executive summary

- Final dse head **`9ded832`** on branch `sc232-cardname-scale`, base `origin/develop` **`dfb7395`**
  (SC-318 landed; rebased through `6dca388`/SC-235 mid-round after the base moved again — see
  "Base moved mid-round" below).
- Superproject head **`9ba7798`**, base `origin/main` **`e1aa610`** (also rebased mid-round —
  required to fix a real jest failure, see below). Submodule pointer intentionally NOT bumped
  (`git status` shows `draw-steel-elements` dirty/new-commits by design — landing-time step).
- Parity: **0 gap(s), 0 undeclared warning(s), 24 declared deferral(s), exit 0** (7 develop +
  10 SC-232 ink rows — the target).
- Rebaseline: **78 lines / 39 ids, unchanged (78 -> 78)**. SC-318's heading-scale restoration
  moved 0 of the 39 ids (measured, not assumed). Determinism: 2 full foreground `npm run shots`
  runs at the final head, byte-identical (544/544 PNGs).
- Gates: tsc/lint clean; jest **4218 passed / 1 skipped / 4219 total, 213/214 suites** (clean,
  0 failures); lifecycle **19/19 ok**; shots **544, 0 FAIL**; freeze FAILED-set == rebaseline
  set exactly, scratch-substituted baseline **262/262**.
- Evidence (Before = rebased develop `dfb7395`): `r12-evidence/sc232-names.png`,
  `sc232-slots.png`, `sc232-print.png` + 3 DOM-verified JSON files.
- Scratch worktrees removed: **yes** (`sc232-r12-scratch-develop`, `sc232-r12-scratch-head`).

## Base moved mid-round (course correction)

Partway through this round `origin/develop` moved again, from `6dca388` to **`dfb7395`**
(SC-318: restores Obsidian's own heading scale on screen, widens the shared freeze baseline
260 -> **262** lines, additions-only, no existing hash moved). I had already completed step 1
(rebase + parity reconciliation) onto `6dca388` and started step 3 (freeze) when notified.
Response: `git fetch`, rebased the dse branch a second time onto `dfb7395` (clean, 0 conflicts —
SC-318 touches `styles-source.css`/`tokens.ts`/`entry.ts`, no overlap with the card-head
selectors this branch touches), rebuilt both scratch worktrees at the new shas, re-ran the full
freeze verification and all evidence captures with `Before = dfb7395`, and re-ran every gate.
Every git command from this point on used `git -C <absolute path> …`, never `cd`.

**A jest failure surfaced only after the second rebase**: `test/dom/framework/
token-coverage.test.ts` (`D3 Task 1`) failed — 6 missing rows (`fs-h1`..`fs-h6`, SC-318's new
heading tokens) in `docs/superpowers/dse-overhaul/D3-token-map.md`, a **workspace-superproject**
doc (not in the dse submodule) that this test reads by relative path. Root cause: my worktree's
own superproject branch had never picked up SC-318's own workspace-level doc commit
(`6381169`, "D3-token-map.md gets the six --dse-fs-h1..h6 rows", already on `origin/main`).
Confirmed base-only, not caused by SC-232: the same test passes cleanly on a clean scratch
checkout of dse `dfb7395` alone when it can see the SHARED main checkout's already-current copy
of that doc, and fails only because my WORKTREE superproject was stale. Fix: `git -C
<worktree> rebase origin/main` (e1aa610) — one real conflict (`CHANGELOG.md`, resolved by
keeping both sides' bullets, my SC-232 bullet appended after the newer ones) and one submodule
gitlink conflict per historical dse-pointer-bump commit in my own branch history (resolved by
keeping the upstream/target gitlink value at every step — `git update-index --cacheinfo
160000,<target-sha>,draw-steel-elements` — never replaying an old pointer bump, consistent with
this round's own "do not bump the pointer" rule; one now-content-free pointer-bump-only commit,
`d66c6fe`, was `git rebase --skip`ped once its only change had nothing left to apply). Verified
after: `token-coverage.test.ts` passes (9/9), full jest clean, `git status` on both repos shows
only the expected dirty submodule pointer.

## Step 1 — Rebase + parity reconciliation

`git fetch origin` -> `dfb7395` (after the course correction above). `git -C
.../draw-steel-elements rebase origin/develop`: 2 real conflicts (both in the SAME early
commit, `cd5a857`/renumbered — this branch's own first parity-pairs commit), both in
`test/unit/parity/compare.test.ts` (the documented-count guard's comment + `toEqual` array)
and `visual-harness/parity/README.md` (the "currently declared" count line, twice). Resolved
by computing each intermediate state's REAL `declaredDeferrals` count from the auto-merged
`selector-map.json` (which conflicted at none of the 21 replayed commits) rather than
hand-merging prose: **7 (develop, post-SC-235) -> 15 (this branch's first parity commit, +8
ink rows) -> 17 (this branch's `MEDIUM-1` fix, +2 more for `name-kit-signature`)** — 17 is the
final entry count, matching `selector-map.json`'s own contents at every step (verified by
loading the JSON directly after each conflict resolution, not assumed). 17 entries x
(7 scheme-agnostic x2 + 10 scheme-explicit x1) = **24 rows**, the target the brief named.
`visual-harness/parity/README.md`'s longer "Declared deferrals" table already carried the
correct final wording without conflict (SC-368 citations, the 5-family ink finding) — only its
two summary-count lines needed resolving.

Verified after the full 21-commit rebase completed: `selector-map.json` has exactly 17
`declaredDeferrals` entries; `npm run parity` (below) reports 24 declared, matching.

## Step 2 — CHANGELOG fix (r11 LOW-1)

Worktree superproject `CHANGELOG.md`, second SC-232 bullet. Was: "...a statblock or
featureblock ability keeps today's layout, matching the site." Now: "...a statblock or
featureblock ability keeps its action type in the keyword band (the site's own placement), and
its cost now reads beside the name." — the reviewer's own suggested wording (r11 LOW-1),
text-only, no pointer bump. Commit `a341acd` (later carried forward through the superproject
rebase as `9ba7798`... — see the commit list in Artifacts for the exact chain).

## Step 3 — Freeze (final head `9ded832` on `dfb7395`)

Two full foreground `npm run shots` runs: 544 PNGs each (up from 540 — SC-318's own widening
added one new capture id, 4 combos), byte-identical across both runs (`diff` empty).
`check-freeze.sh` against the shared 262-line baseline: `FREEZE VIOLATED (78 checksum
mismatches, 0 missing)`. Cross-checks (both exit 0 / empty diff):
- The 78 FAILED filenames == `rebaseline.txt`'s 78 filenames exactly.
- Every `rebaseline.txt` hash == the real sha256 of that file at this head. **No
  regeneration needed** — `rebaseline.txt` is unchanged from round 10b (78 lines / 39 ids),
  and SC-318's heading-scale restoration moved 0 of them (measured: I diffed the sha256 of
  all 78 rebaseline filenames between a fresh scratch build of develop `dfb7395` and this
  head — 0 differences beyond what round 10b already accounted for; SC-318 touches h1-h6/
  section headings inside a card's markdown BODY, not the card HEAD this ticket's rule table
  owns).
- A SCRATCH copy of the shared baseline (never the shared file) with the 78 lines substituted
  in: **`freeze OK (262/262 frozen print PNGs byte-identical)`, exit 0.**

**Old vs new: 78 -> 78, unchanged.**

## Step 4 — Evidence (`r12-evidence/`, Before = rebased develop `dfb7395`)

Method: a detached scratch worktree at `dfb7395` ("Before") and one at this branch's own
`HEAD` ("This branch"), each with `node_modules` symlinked from the real worktree and a
**scratch-only** (never committed) one-line patch to `visual-harness/entry.ts`
(`r7-survey/scripts/scratch-copy-entry.patch`, reapplied by hand since its stored diff headers
don't `git apply` cleanly) adding a `?src=<base64 yaml>` override so real/trimmed corpus
content can render through the harness's own `FIXTURES` registry gap — both scratch
`entry.ts` copies are LOCAL to the removed scratch worktrees, never touched the real branch.
Rebuilt with `npm run harness:build` after patching. Removed both scratch worktrees at the end
(`git worktree remove --force`, verified via `git worktree list`).

Every capture: `deviceScaleFactor: 1` (1 image px = 1 CSS px), `.dse-head`/`.sc-head`
bounding-box crops only (no rescaling), text labels (no color-coding), Site captured with
`colorScheme: 'dark'` (confirmed live via `data-md-color-scheme="slate"`), every tile's text
DOM-verified via `querySelector` into a JSON next to each image, row labels word-wrapped in a
widened label column (never truncated).

- **`sc232-names.png`** (869px tall): 6 rows (ability, statblock, featureblock, kit head, kit
  signature, trait) x 4 columns (Before `dfb7395` | This branch `9ded832` | Option B 27px
  probe — `r1-survey/scripts/probe-B.css` applied on top of the Before/develop state, the
  same file round 1's own survey used | Site). Matches the row set from
  `r4-evidence/sc232-compare-wide.png` (re-verified by opening that file first). The
  ability-card row's Coverage-Strike/Mark entity mismatch (no site page for the harness's
  hand-authored default ability) is UNCHANGED from every prior round — resolving it would need
  a `FIXTURES` registry change (source, out of scope for an evidence round); disclosed, not
  silently left out.
- **`sc232-slots.png`** (1047px tall): 8 rows (Determination trait, Mark ability, Growing
  Ferocity class feature, Devil Malice featureblock, Devastating Rush kit signature, Human
  Bandit Chief statblock, Whip and Magic Longsword statblock sub-feature, Kneel Peasant!
  statblock ability) x 3 columns (Before | This branch | Site). Growing Ferocity and Devil
  Malice use real corpus content via `src=` (Growing Ferocity's effect body TRIMMED from the
  real multi-table wall of text — metadata copied verbatim — same "TRIMMED not hand-invented"
  convention `entry.ts`'s own `featureTraitProvenance`/`featureAbilityProvenance` literals
  use; Devil Malice used verbatim). Every row's `this-branch` DOM text matches `site` exactly
  (see `dom-verified-slots.json`).
- **`sc232-print.png`** (695px tall): steel-print, Before | After, 5 rows covering all 6
  named items — W3 (feature, cost to name row), W2 (Level chip; **not one of the 39 frozen
  ids, shown via the harness's own non-frozen `ability-provenance` fixture** since the real
  frozen corpus carries 0 bytes for this item, measured in round 8b/10b), W7 + W1b (kit,
  combined in one row — W1b is PRINT-NEUTRAL by design, confirmed visually: "Panther" never
  appears in either column), W4 (statblock own head), and Signature wording (statblock
  sub-feature). Each row labeled with its capture id and item.

## Step 5 — Gates (final head `9ded832` on `dfb7395`; superproject `9ba7798` on `e1aa610`)

| Gate | Result |
|---|---|
| `npm run tsc` | clean |
| `npm run lint` | clean (0 errors; 1 unrelated ESLint deprecation info-warning) |
| `rm -f main.js styles.css && npx jest` | **4218 passed / 1 skipped / 4219 total, 213 of 214 suites, 3 snapshots, exit 0.** Base measurement at `dfb7395` alone (before the superproject rebase fix): 4144 passed / 1 failed / 3 skipped / 4148 total — the 1 failure was `token-coverage.test.ts` (fixed by the superproject rebase, see above) **plus** one load-shaped flake in `sidebarEncounterHandoff.test.ts` that reproduced clean in isolation (10/10) — neither is a real base regression. `/proc/loadavg` 0.7-1.9 throughout, not load-sensitive. |
| `DSE_LIFECYCLE_PORT=9362 npm run obsidian-lifecycle` | `OBSIDIAN-LIFECYCLE done: 19/19 ok, 0 failed`, exit 0 |
| `npm run shots` (x2) | 544 PNGs each run, 0 FAIL, byte-identical |
| `check-freeze.sh` | FAILED set == `rebaseline.txt`'s 78-line set exactly; scratch-substituted baseline `freeze OK (262/262)` |
| `npm run parity` | **0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)**, exit 0 |

## Step 6 — Cleanup

`pgrep -af "sc232-r12-scratch"` before each removal: no real process (only the grep's own
invocation matched). `git -C .../draw-steel-elements worktree remove --force` for both
`sc232-r12-scratch-develop` and `sc232-r12-scratch-head`; re-listed, only the real worktree
remains.

## Rules compliance

- Every command ran in the foreground with `timeout: 600000` on every long gate; no
  `run_in_background`, `&`, `nohup`, `Monitor`. Every git command used `git -C <absolute
  path> …`.
- Never touched dse `main`, never tagged, never pushed, never ran `just deploy*`.
- Never edited the shared `freeze-baseline.sha256` or `check-freeze.sh` — only read from them
  (scratch copies for the substitution checks).
- Committed after each coherent step: parity reconciliation is embedded in the rebase replay
  itself (each historical commit re-committed with its conflict resolved); CHANGELOG fix is
  its own commit (`a341acd`, carried through the later superproject rebase).
- Did not bump the submodule pointer — `git status` on the superproject worktree shows
  `draw-steel-elements` modified/new-commits by design.
- Killed no processes this round (no hangs).

## Follow-ups (for the owner)

- The ability-card evidence row's Coverage-Strike/Mark entity mismatch remains unresolved,
  same limitation every prior round recorded — would need a `FIXTURES` registry change
  (source) or live-Obsidian corpus-insert automation.
- My worktree's superproject branch was stale against `origin/main` by 7 commits (mostly
  SC-318/SC-235 landing mechanics) before this round's mid-course rebase — worth a note for
  whoever lands this: the superproject itself, not just the dse submodule, needs periodic
  `git -C <worktree> fetch && rebase origin/main` during a long-running effort, or a
  workspace-level doc change elsewhere in the queue can silently fail a worktree's jest run
  the way `D3-token-map.md` did here.

## Artifacts

- Report (this file):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/sc232-r12-report.md`
- Rebaseline (verified current, unchanged):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/rebaseline.txt` (78 lines)
- Rebaseline map (unchanged this round — no new attribution needed, SC-318 moved 0 ids):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/rebaseline-map.md`
- Evidence:
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r12-evidence/sc232-names.png`,
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r12-evidence/sc232-slots.png`,
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r12-evidence/sc232-print.png`,
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r12-evidence/dom-verified-names.json`,
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r12-evidence/dom-verified-slots.json`,
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r12-evidence/dom-verified-print.json`
- dse commits (branch `sc232-cardname-scale`, worktree
  `/home/scott/code/steelCompendium/worktrees/sc232-cardname-scale/draw-steel-elements`, final
  head **`9ded832`**, base `origin/develop` **`dfb7395`**) — every commit from round 8a onward
  was re-shad by the two rebases in this round; the round-10-fix commits now read
  `dc2e126` (HIGH-1/LOW-2/LOW-3, was `6f19b8b`), `19c7aed` (empty left-deck, was `31f54d8`),
  `3f60461` (MEDIUM-1, was `e1705ba`), `9ded832` (MEDIUM-2 comments+LOW-4/LOW-5, was
  `f3085d5`, **final dse head**).
- Superproject commits (worktree
  `/home/scott/code/steelCompendium/worktrees/sc232-cardname-scale`, final head **`9ba7798`**,
  base `origin/main` **`e1aa610`**): `d2cebf3` (original CHANGELOG entry, re-shad),
  `1f10074` (LOW-1 narrow wording, re-shad), `f2925ed` (round 8a CHANGELOG, re-shad — its
  paired pointer-bump commit `d66c6fe` was dropped/skipped, see "Base moved mid-round"),
  `2a36fc5` (round 8b CHANGELOG, re-shad), `cb384e1` (round 10 LOW-5 CHANGELOG, re-shad),
  `9ba7798` (round 12 CHANGELOG wording fix, r11 LOW-1 — **final head**).
- Gate logs (scratch, session-local):
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/a56f19e1-5165-4bc8-92ee-d6eeff34f029/scratchpad/sc232r12/{tsc,lint,jest3,lifecycle,parity,shots-run1b,shots-run2b,freeze-check2,jest-base-develop,jest-flake-recheck,jest-token-check}.log`
- Scratch worktrees `sc232-r12-scratch-develop` / `sc232-r12-scratch-head`: **removed**
  (`git worktree remove --force`, verified via `git worktree list`).
