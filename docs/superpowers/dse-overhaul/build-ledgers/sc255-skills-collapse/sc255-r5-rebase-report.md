# SC-255 r5 — rebase + re-gate + rebaseline report

## Executive summary

- **Verdict: DONE.** Rebase clean, full battery green on the rebased head, rebaseline
  recomputed and it is byte-identical to the old `rebaseline.txt` (no visible change since
  the last rebaseline was computed).
- New base sha: `origin/develop` = `ade5064c75a9654df5fa7173e93e795a3a09adba` (matches the
  dispatcher's 2026-09-27 note).
- Final rebased head sha: `b029baa32e4ed96a168dfab177c3e92552b399bf` (7 commits, un-squashed;
  superproject pointer bumped in commit `2a7402b`, not pushed).
- Conflicts: `CHANGELOG.md` only, on 2 of 7 commits, exactly as the brief predicted; no
  `src/` conflicts.
- Gates: tsc clean; lint clean; jest **4101 passed / 1 skipped / 4102 total, 211 of 212
  suites** (base 4100/1/4101, 211/212 — branch is +1 vs base, matching the predicted net);
  lifecycle `19/19 ok, 0 failed`; shots 524/0 FAIL (both of 2 runs); parity `0 gap(s), 0
  undeclared warning(s), 16 declared deferral(s)`, exit 0.
- Freeze: base (fresh `origin/develop` checkout) = `freeze OK (260/260 …)`. Branch =
  `FREEZE VIOLATED (20 checksum mismatches, 0 missing)` — names match the current
  `rebaseline.txt`'s 20 skills filenames exactly (empty diff).
- Rebaseline hashes changed vs old `rebaseline.txt`: **none — `diff` is empty, all 20 hashes
  identical.** Step 5 (before/after crop, pixel-shift check) is therefore not applicable this
  round.

## 1. Rebase

`git fetch origin` at start of round: `origin/develop` = `ade5064c75a9654df5fa7173e93e795a3a09adba`
("fix(feature): SC-236 r4 — fix round: false corpus/fixture comment claims, stale docs
image"), matching the dispatcher's expectation in decisions.md.

`git rebase origin/develop` replayed all 7 SC-255 commits. Conflicts occurred **only** in
`CHANGELOG.md`, on 2 of the 7 commits (`cbbb190`, `20b188c`) — exactly as the brief predicted.
No conflicts in any `src/` file; `styles-source.css` applied cleanly with no conflict at all
(brief flagged this as a possibility, not a certainty — did not occur).

### Conflict hunk 1 — `cbbb190` ("docs(skills): SC-255 drop the "Skills disclosure header"
from the docs")

Both sides added a new bullet to the `## 7.0.0 (unreleased...)` section: develop's side added
4 bullets (SC-236, SC-272, SC-230, already-present fflate/SC-328 entry below the conflict
marker), ours added 1 bullet (SC-255, "The skills element's own 'Skills' disclosure header is
gone..."). Resolution: kept both sides' bullets, ours appended after develop's 3 new ones and
before the pre-existing fflate/SC-328 entry (list-append, no content dropped or altered).

### Conflict hunk 2 — `20b188c` ("docs(skills): SC-255 r3 (LOW-3, LOW-4) — name the removed
header correctly, tag+detail the entry")

This commit's own diff rewrote the first 2 lines of the same SC-255 bullet resolved in hunk 1
(fixing "Skills" -> "Skill List" and adding the `[FIX]` tag, per r3's LOW-3/LOW-4 fold).
Resolution: took the incoming (`20b188c`) 2-line rewrite verbatim, kept the rest of the
bullet (which 20b188c's diff did not touch) as already resolved in hunk 1.

Post-rebase: `git diff origin/develop...HEAD --stat` shows exactly the 10 files SC-255 was
always expected to touch (`CHANGELOG.md`, 2 docs files, `src/elements/skills/{definition,view}.ts`,
`styles-source.css`, `test/dom/elements/skills.test.ts`,
`test/dom/framework/{chromeRound2,pref-overrides}.test.ts`), no collateral files.

`package.json`'s obsidian version did not change since `c524fd2` (well before this range) —
`npm ci` was not required; `node_modules/.bin/tsc` already present and current.

**New base sha:** `ade5064c75a9654df5fa7173e93e795a3a09adba`
**Final rebased head sha:** `b029baa32e4ed96a168dfab177c3e92552b399bf`
(commits, oldest to newest: `495c91b`, `fce7c00`, `28db3a4`, `4c213e3`, `08ccef7`, `e5db25c`,
`b029baa` — same 7 logical changes as the pre-rebase `8dc12b6..4ff0b88` series, renumbered by
the rebase; no squashing, no separate fix-up commit needed).

## 2. Base freeze check (against new base)

Throwaway detached worktree: `git worktree add /home/scott/code/steelCompendium/worktrees/sc255-skills-collapse/.base-check origin/develop`
(`ade5064`). `npm ci` was required (fresh checkout had no `node_modules`) — log
`sc255-r5-logs/base-npm-ci.log`, `EXIT=0`. `npm run shots` — log `sc255-r5-logs/base-shots.log`,
`EXIT=0`, ends "all shots written to .../.base-check/visual-harness/shots". Freeze check —
log `sc255-r5-logs/base-freeze.log`:

```
freeze OK (260/260 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)
```

`EXIT=0`. Matches the expected result exactly; the shared baseline and `origin/develop` agree.
Worktree removed afterward (`git worktree remove ... --force`, `EXIT=0`, confirmed gone from
`git worktree list`).

## 3. Full battery on rebased head

Rebased head `b029baa32e4ed96a168dfab177c3e92552b399bf`. `rm -f main.js styles.css` before jest
(SC-followups #77 protocol). `/proc/loadavg` before jest: `2.27 2.31 2.57` (low; no
load-sensitivity concern).

| Gate | Result | Log |
|---|---|---|
| `npm run tsc` | clean, exit 0 | `sc255-r5-logs/tsc.log` |
| `npm run lint` | clean, exit 0 | `sc255-r5-logs/lint.log` |
| `npx jest` | **4101 passed / 1 skipped / 4102 total, 211 of 212 suites, 3 snapshots**, exit 0 | `sc255-r5-logs/jest.log` |
| `npm run obsidian-lifecycle` (port 9283, own private port) | `OBSIDIAN-LIFECYCLE done: 19/19 ok, 0 failed`, exit 0 | `sc255-r5-logs/lifecycle.log` |
| `npm run shots` (run 1) | 524 PNGs written, 0 FAIL lines, exit 0 | `sc255-r5-logs/shots-1.log` |
| `check-freeze.sh` (branch, run-1 shots) | `FREEZE VIOLATED (20 checksum mismatches, 0 missing)`, exit 1 — names are **exactly** the 20 skills lines in the current `rebaseline.txt` (diff of sorted name lists is empty) | `sc255-r5-logs/freeze-1.log` |
| `npm run parity` (LAST) | `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`, exit 0 | `sc255-r5-logs/parity.log` |

Base-vs-branch jest (measured; brief said "if you measure base"): base `origin/develop`
(`ade5064`, fresh `npm ci` + `npx jest` in a second throwaway worktree
`.base-check2`) = **4100 passed / 1 skipped / 4101 total, 211 of 212 suites**, exit 0
(`sc255-r5-logs/base-jest.log`, `sc255-r5-logs/base-npm-ci2.log`). Branch is **+1 test, same
suite count** (`test/dom/elements/skills.test.ts` pre-exists on develop as the `ds-skills`
element's own test file — SC-255 edits its contents, it doesn't add a new suite) — matches
the brief's predicted net exactly: r1 was −1, r3 was +2, net +1 vs a develop baseline that
carries none of SC-255's own changes.

## 4. Rebaseline recomputation

Copied the 20 skills-family print PNGs (the exact filename set from the old
`rebaseline.txt` / freeze-1's mismatch list, confirmed identical above) out of run 1's shots
dir before running `npm run shots` a second time (log `sc255-r5-logs/shots-2.log`, 524
written, 0 FAIL, exit 0). Hashed each of the 20 files from both runs: **all 20 identical
across runs** — deterministic.

Wrote `.superpowers/sdd/sc255-skills-collapse/rebaseline-r5.txt`, 20 `<sha256>  <filename>`
lines, same line order as the old `rebaseline.txt` (iterated the old file's name order and
re-hashed).

`diff rebaseline.txt rebaseline-r5.txt`: **empty — exit 0, zero differences.** None of the 20
hashes changed. Develop's movement since the old rebaseline was computed (SC-236, SC-282,
SC-340, SC-243, SC-230, SC-272 all landed on top of the old base per the dispatcher's
2026-09-27 note) touched none of the bytes SC-255 moves; the skills-print family is
untouched by any of those tickets. `rebaseline.txt` itself was **not** modified (owner swaps
the files at landing, per the brief).

## 5. Before/after crop + pixel shift check

**Not applicable — skipped by the brief's own condition.** Step 5 triggers "if any of the 20
hashes changed vs the old rebaseline.txt"; none did (§4). No new crop or pixel-shift script
run was produced this round. The existing crops from the earlier rounds
(`sc255-skills-steel-print-before-after-labeled.png`,
`sc255-skills-steel-dark-before-after-labeled.png`, already in this ledger dir) remain the
correct visual evidence — they show the same pixels this round reconfirmed byte-identical.

## Drive-by fixes

None.

## Follow-ups

None yet.

## Artifacts

- Report (this file): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc255-skills-collapse/sc255-r5-rebase-report.md`
- New rebaseline (NOT applied, owner swaps at landing): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc255-skills-collapse/rebaseline-r5.txt`
- Logs (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc255-skills-collapse/sc255-r5-logs/`):
  - `base-npm-ci.log`, `base-shots.log`, `base-freeze.log` (base freeze check, throwaway worktree 1)
  - `base-npm-ci2.log`, `base-jest.log` (base jest measurement, throwaway worktree 2)
  - `tsc.log`, `lint.log`, `jest.log`, `lifecycle.log`
  - `shots-1.log`, `freeze-1.log`, `parity.log`
  - `shots-2.log` (second shots run, for the rebaseline determinism check)
- DSE worktree (branch `sc255-skills-collapse`, rebased): `/home/scott/code/steelCompendium/worktrees/sc255-skills-collapse/draw-steel-elements`, head `b029baa32e4ed96a168dfab177c3e92552b399bf`
- Superproject worktree pointer bump commit: `2a7402b033c35607139ac01efcc8cb2be532e11d` in `/home/scott/code/steelCompendium/worktrees/sc255-skills-collapse`
- No new crop produced this round (step 5 not applicable — see §5). Pre-existing crops
  untouched: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc255-skills-collapse/sc255-skills-steel-print-before-after-labeled.png`,
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc255-skills-collapse/sc255-skills-steel-dark-before-after-labeled.png`
