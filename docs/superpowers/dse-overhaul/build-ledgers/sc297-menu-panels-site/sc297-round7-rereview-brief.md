# SC-297 round 7 brief — scoped re-review of the round-6 delta (rebase + three folds)

You are the SC-297 independent reviewer (rounds 3 and 5). Scoped re-review of the round-6
delta only. **You never call the tracker.**

## 1. Context

- Ledger `decisions.md` (ledger dir
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/`):
  "Round 5" owner rulings and the "Round 6" section.
- Your `sc297-round5-rereview-report.md` (the three findings you raised) and the implementer's
  `sc297-round2-report.md` → "## Round 6" (its conflict-resolution log — read every hunk).
- Worktree `/home/scott/code/steelCompendium/worktrees/sc297-menu-panels-site`. `v2` on
  `sc297-menu-panels-site` @ `27a021adbf47279c3882492d6e7fbc823efb5eb3`, now rebased onto
  `origin/main` `e83421a61d` (5 commits ahead); superproject @
  `117911b70706060a770f9cbe003a7fe8912b041e` rebased onto its `origin/main` `f5fe049437`
  (4 commits ahead). SC-177's two new e2e files need `PLAYWRIGHT_PATH` / `E2E_BASE` set per
  `v2/.repo-docs/development.md`. Verify `pwd` before any write; never write under
  `/home/scott/code/steelCompendium/workspace/`. Leave the branch as you found it.

## 2. What to verify (execute and measure)

1. **The `sc-pins*` merge is right.** Diff `origin/main..HEAD` for `sc-pins.js` and
   `sc-pins-core.js`. Confirm SC-177's behaviour survives (read its two commits on main; run
   its tests/e2e if it added any; exercise its "section excerpts" pin path in the browser) AND
   the branch rule survives (pin mounts only via `SCChrome.anchor()` into the plate on card
   pages; nothing mounts when `panel()` is null). Pin from a card plate → pinboard/My Table
   shows it → unpin. Screenshot the pinboard.
2. **The superproject merge is right.** `DESIGN.md` has main's pinboard-row text merged with
   the branch's plate wording, no conflict markers, no duplicated sections; `CHANGELOG.md` has
   main's dated SC-177 section intact and the branch's `## Unreleased` bullets above it. Every
   submodule pin equals main's except `v2` (= the branch tip). Grep for `<<<<<<<` everywhere.
3. **Your three round-5 findings** closed by measurement: the 3 minion pages show one title
   (h1 hidden, hr hidden), no other page type lost its heading (re-run `page-titles.e2e.cjs`
   with the added cases; spot-check a Read chapter and an index page); `DESIGN.md` lines fixed.
4. **Nothing regressed across the rebase:** unit (expected 86/86), original e2e (6/8 with the
   same two pre-existing failures, plus SC-177's two files green), `chrome-panel.e2e.cjs`
   (expected 245/245), `page-titles.e2e.cjs` (expected 9/9), your `r5-affordance` / `r5-gatecrawl` /
   `r5-sweep` censuses on a fresh build: `both=0`, `cardpage-no-plate=0`, `stray=0`,
   `no-permalink=0`.
5. Only if the delta introduced it: new findings by severity with file:line.

Out of scope: SC-298; the two pre-existing e2e failures; the main checkout's `AGENTS.md` dirt.

## 3. Footguns

Devbox wrapper form; never pipe a gate through `tail`; per-run unique logs; mutations only in
the gitignored `v2/site/` copy, reverted; never `git checkout -- .` in v2; no `devbox run`
from inside `v2/`; foreground builds. You cannot message the ticket-owner; if blocked end
with `STATUS: NEEDS_CONTEXT`. If the report write is blocked, return it inline.

## 4. Report and return

`sc297-round7-rereview-report.md`, ≤10-line executive summary first: verdict (APPROVE /
FIX ROUND NEEDED), per-item result, measured counts, artifact paths. Return raw facts.
