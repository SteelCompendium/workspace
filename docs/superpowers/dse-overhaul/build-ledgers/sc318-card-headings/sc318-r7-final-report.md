# SC-318 round 7 (final) — rebase + full battery + widening re-verify — report

## Executive summary

- dse rebased clean onto `origin/develop` `6dca388` (SC-235 landed) → final dse `dfb7395`
  (10 commits). Superproject rebased onto `origin/main` `fa0fcb7` → final `e205a42`.
- Full battery all green at the final tip: tsc/lint clean; jest 4147 passed/1 skipped/4148
  total (212/213 suites); obsidian-lifecycle 19/19 ok; shots 536 PNGs/0 FAIL (x2 runs);
  freeze 260/260 (x2 runs); parity 0 gaps/0 undeclared/**14 declared** — matches develop's
  own base (also re-measured: 14 declared), so SC-318 adds none, as expected post-SC-235.
- Develop base (re-measured at `6dca388`): jest 4122 total (4119/3 skip, 211/212 suites);
  parity 0/0/14; shots 532 PNGs.
- Widening re-verified: `perk-headings--steel-print.png` / `--steel-realprint.png` hashes
  identical across 2 clean runs at the rebased tip AND byte-identical to `widening.txt`'s
  pre-rebase hashes — SC-235 moved zero pixels of this fixture. `widening-final.txt` written.
- Conflicts: 1 CHANGELOG content conflict (kept both bullets), 4 submodule-gitlink conflicts
  during the superproject rebase (dse's own rebase rewrote its shas; resolved by mapping
  each old pre-rebase pointer-bump to its commit-count-equivalent rebased dse commit).
- **Self-caused incident, fully recovered (see §5):** a failed `cd` mid-command caused a
  `git remote set-url` + `git reset --hard` to run in the shared main workspace checkout
  instead of a scratch dir, repointing its origin and discarding its tree. Caught
  immediately, restored via reflog + `gh repo list`, verified byte-identical to the
  session's starting state (`fa0fcb7`, correct remote, only pre-existing known dirt). No
  push occurred; no other worktree was affected.
- No freeze baseline change. No tags/releases/pushes. Status: **DONE**.

## 1. Rebase

### draw-steel-elements
- `git fetch origin` (re-run right before this report): `origin/develop` = `6dca388` — tip
  unmoved since the brief was written.
- `git rebase origin/develop`: **one conflict**, `CHANGELOG.md` (both SC-235's section-title
  bullet and SC-318's heading bullet targeted the same `## Unreleased`/`7.0.0` insertion
  point). Resolved by keeping BOTH bullets, SC-235's first then SC-318's (matches the
  brief's "disjoint, keep both" framing). No `package.json`/`package-lock.json` diff vs
  `origin/develop` (no `npm ci` needed for dse).
- Final dse head: `dfb7395f3199e94be245c7ade0f0e0d45c1daf3f` — 10 commits on `6dca388`,
  same commit count and content as the pre-rebase `2c55304` (10 commits on `5a20d5f`); only
  the base moved.
- Log: `r7-logs/sc318-r7-dse-fetch.log`, `sc318-r7-dse-rebase.log`,
  `sc318-r7-dse-rebase2.log`.

### Superproject
- `git fetch origin` (re-run right before this report): `origin/main` = `fa0fcb7` — tip
  unmoved.
- `git rebase origin/main`: **four submodule-gitlink conflicts**, one per pointer-bump
  commit in the replayed range (`1bb7f41`→`236d593`, `323970c`→`520aabf`,
  `1b338a2`→`29d68f8`, `af2f90a`→`2c55304`) — each conflicted because dse's own rebase gave
  every commit a new sha, so the pre-rebase target sha named in each bump commit no longer
  existed on dse's rebased branch. Resolved by mapping each old dse sha to its
  commit-count-equivalent new sha (verified 1:1 by commit message + position:
  `236d593`(7 commits)→`8a261ad`, `520aabf`(8)→`feb025a`, `29d68f8`(9)→`f0ff3b8`,
  `2c55304`(10)→`dfb7395`) via `git update-index --cacheinfo 160000 <newsha> draw-steel-elements`
  at each conflict, then `git rebase --continue`.
- The final commit was reworded (`git commit --amend -m`, tip only, no history rewrite
  beyond the rebase itself) from its stale "bump to 2c55304" message to
  `chore: bump draw-steel-elements to dfb7395 (SC-318 final round — rebased onto
  origin/develop 6dca388/SC-235)` since the gitlink it carries is `dfb7395`, not `2c55304`.
  **Known cosmetic gap:** the three earlier pointer-bump commits (`55a95e0`, `20b42ab`,
  `f843e0a`) still say "bump to 236d593/520aabf/29d68f8" in their messages even though their
  gitlinks now correctly hold the rebased shas (`8a261ad`/`feb025a`/`f0ff3b8`) — I judged
  rewriting 3 mid-history commit messages purely for prose accuracy not worth a broader
  history rewrite; only the final tip's content and message need to be trustworthy for
  landing, and it is.
- Final superproject head: `e205a42` — `CHANGELOG.md` (+6, one bullet), `D3-token-map.md`
  (+30, the six `--dse-fs-h1..h6` rows), `draw-steel-elements` (gitlink → `dfb7395`).
  `git diff --stat fa0fcb7..HEAD` confirms exactly those 3 files, 36 insertions / 2
  deletions total.
- Log: `r7-logs/sc318-r7-wt-fetch.log`, `sc318-r7-wt-rebase.log` through `-rebase5.log`.

## 2. Develop's own base numbers (re-measured at `6dca388`)

Fresh clone in scratchpad (`.../scratchpad/sc318-r7/develop-base`), `npm ci`:
- jest: **4119 passed / 3 skipped / 4122 total**, 211 of 212 suites (`sc318-r7-develop-jest.log`).
- parity: **0 gap(s), 0 undeclared warning(s), 14 declared deferral(s)**, exit 0
  (`sc318-r7-develop-parity.log`) — matches the brief's stated expectation exactly.
- shots: **532 PNGs**, 0 FAIL (`sc318-r7-develop-shots.log`).

## 3. Full battery at the final tip (`dfb7395` / `e205a42`)

| Gate | Result | Log |
|---|---|---|
| tsc | clean, exit 0 | `sc318-r7-tsc.log` |
| lint | clean, exit 0 | `sc318-r7-lint.log` |
| jest (`rm -f main.js styles.css` first) | **4147 passed / 1 skipped / 4148 total**, 212 of 213 suites, exit 0 | `sc318-r7-jest.log` |
| obsidian-lifecycle (port 9291, private) | **19/19 ok, 0 failed**, exit 0 | `sc318-r7-lifecycle.log` |
| shots (run 1) | **536 PNGs** (develop's 532 + 4 `perk-headings--steel-*`), 0 FAIL, exit 0 | `sc318-r7-shots-run1.log` |
| freeze (against `536`-PNG run 1) | **260/260** frozen print PNGs byte-identical, exit 0 (baseline itself is 260 lines) | `sc318-r7-freeze-run1.log` |
| parity (LAST) | **0 gap(s), 0 undeclared warning(s), 14 declared deferral(s)**, exit 0 — SC-318 adds none vs. develop's own 14 | `sc318-r7-parity-run1.log` |

jest delta vs. develop base: +28 passed / +26 total tests / +1 suite — matches the branch's
own new tests (heading-scale token tests, can-fail invariants, the `perk-headings` fixture)
carried across the rebase intact.

## 4. Widening re-verification

Ran `npm run shots` a **second** time at the final tip (`sc318-r7-shots-run2.log`): 536
PNGs, 0 FAIL, exit 0. Freeze re-checked against the run-2 tree too: `sc318-r7-freeze-run2.log`
→ 260/260, exit 0.

sha256, each run:
```
run1: 30c1a61b35ddd4ac9f57d32a37512a1976fe611f4e4af271241c904d40528287  perk-headings--steel-print.png
      007c274765cbcc059fdc7ad7618c240b80cfb697aa851a6451fc6c61d25b5c8b  perk-headings--steel-realprint.png
run2: 30c1a61b35ddd4ac9f57d32a37512a1976fe611f4e4af271241c904d40528287  perk-headings--steel-print.png
      007c274765cbcc059fdc7ad7618c240b80cfb697aa851a6451fc6c61d25b5c8b  perk-headings--steel-realprint.png
```
(`sc318-r7-widening-run1.sha256`, `sc318-r7-widening-run2.sha256` — `diff` empty.)

**Match vs. `widening.txt`'s pre-rebase hashes: YES, byte-identical.** SC-235's rebase moved
zero pixels of the `perk-headings` fixture. Wrote
`.superpowers/sdd/sc318-card-headings/widening-final.txt` with the same two `<sha256>
<filename>` lines plus the re-verification context, per the brief (freeze baseline itself
untouched — this is still the "sanctioned, apply at landing" deliverable, not an applied
change).

## 5. Self-caused incident: shared main-checkout mutation, fully recovered

While measuring develop's base numbers I intended to clone dse into a scratch dir. The
first attempt's `cd "$SC/develop-base"` **failed** (directory didn't exist yet — I hadn't
`mkdir`'d it in that command) but the shell script kept going (no `&&`/`set -e`), so the
following three commands — `git remote set-url origin
git@github.com:SteelCompendium/draw-steel-elements.git`, `git fetch origin develop`, `git
reset --hard origin/develop` — ran in whatever the tool's default cwd was, which turned out
to be the **shared main workspace checkout**
(`/home/scott/code/steelCompendium/workspace`), not a linked worktree of it. This:
- repointed that repo's `origin` remote (shared by **every** linked worktree of it, since
  worktrees share `.git/config`) to the dse repo's URL, and
- hard-reset the main checkout's `main` branch to dse's `origin/develop` tip (`6dca388`),
  turning every one of the superproject's own directories (`compendium/`, `steel-etl/`,
  `v2/`, etc.) into untracked content matching dse's tree instead.

**Caught immediately** (next command's `pwd`/`git remote -v`/`git log` output was
unmistakably wrong). Recovery, in order:
1. `git -C workspace reflog` → `HEAD@{1}` was `fa0fcb7` (the pre-mistake state, matching
   this conversation's session-start `gitStatus`). `git reset --hard fa0fcb7`.
2. Correct origin URL: `gh repo list SteelCompendium` confirmed the repo is
   `SteelCompendium/workspace`; `git remote set-url origin
   git@github.com:SteelCompendium/workspace.git`.
3. The `git fetch origin develop` had also created a stray `refs/remotes/origin/develop`
   (dse's ref, under the wrong remote) — deleted (`git update-ref -d`) and re-fetched
   cleanly from the correct origin.
4. **Verified fully restored:** `HEAD` = `fa0fcb7` (byte-identical, `git diff --stat
   fa0fcb7..HEAD` empty), branch `main`, origin correct, `git status --short` shows only
   the pre-existing documented dse vault dirt inside the `draw-steel-elements` submodule
   (`demo-vault/Welcome.md`, `justfile`, `compendium-manifest.json`, `demo-vault/montage
   1.md` — the ledger's own "Scott's known vault state, never touch" entry, unchanged), no
   stray branches, `git worktree list` shows every other worktree's own HEAD untouched
   (only the main checkout's HEAD/index/tree are worktree-local; `.git/config` is the only
   shared state, now restored).
5. **No push was ever run** during the mistake — only `fetch`/`reset` — so nothing reached
   `origin` on GitHub; the damage was local-only and is now fully undone.

I'm reporting this in full per the brief's transparency expectation even though it never
touched the actual deliverable, was caught in the same turn, and is independently verified
undone — the ticket-owner should feel free to spot-check
`/home/scott/code/steelCompendium/workspace` (`git remote -v`, `git log -1`) independently.

## 6. Artifacts

- dse final: `dfb7395f3199e94be245c7ade0f0e0d45c1daf3f` (branch `sc318-card-headings`, on
  `origin/develop` `6dca388`).
- Superproject final: `e205a42` (branch `sc318-card-headings`, on `origin/main` `fa0fcb7`).
- `.superpowers/sdd/sc318-card-headings/widening-final.txt` — this report.
- `.superpowers/sdd/sc318-card-headings/r7-logs/` — every gate's raw output:
  `sc318-r7-dse-fetch.log`, `sc318-r7-dse-rebase.log`, `sc318-r7-dse-rebase2.log`,
  `sc318-r7-wt-fetch.log`, `sc318-r7-wt-rebase.log` … `-rebase5.log`,
  `sc318-r7-tsc.log`, `sc318-r7-lint.log`, `sc318-r7-jest.log`, `sc318-r7-lifecycle.log`,
  `sc318-r7-shots-run1.log`, `sc318-r7-shots-run2.log`, `sc318-r7-freeze-run1.log`,
  `sc318-r7-freeze-run2.log`, `sc318-r7-parity-run1.log`, `sc318-r7-widening-run1.sha256`,
  `sc318-r7-widening-run2.sha256`, `sc318-r7-develop-npmci.log`, `sc318-r7-develop-jest.log`,
  `sc318-r7-develop-parity.log`, `sc318-r7-develop-shots.log`.
- This report: `.superpowers/sdd/sc318-card-headings/sc318-r7-final-report.md`.

## 7. Landing notes (unchanged from prior rounds, re-confirmed)

- Parity unchanged (14 == develop's own 14) → no conflict with SC-232's declared-count
  overlap bookkeeping.
- No selector overlap with `.dse-head*` / `.dse-section__title` (SC-235's territory) —
  confirmed by the CHANGELOG conflict being purely textual (adjacent bullets, no shared
  code).
- Widening applies only on "sanctioned" (already given: Scott ruling 1, comment `8ee73a15`,
  "Option A is good. Sanctioned") — re-verified at this final tip per §4; a landing
  dispatcher can apply `widening-final.txt`'s two lines directly.
- No rebaseline needed; frozen print bytes unchanged (260/260 both runs).

STATUS: DONE
