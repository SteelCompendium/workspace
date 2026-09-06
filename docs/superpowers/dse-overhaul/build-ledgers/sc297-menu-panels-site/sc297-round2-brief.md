# SC-297 round 2 brief — rollout of the chrome panel to all sanctioned card families

You are an implementation worker for the SC-297 ticket-owner. **You never call the tracker
(Linear) — not to read history, not to post.** Everything you need is in files.

## 1. Context loading (do this first)

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/decisions.md`
  — read in full. Scott's rulings are quoted there; they are the spec.
- Round-1 report and spec, same dir: `sc297-round1-report.md` (read the executive summary and
  §2) and `sc297-round1-port-spec.md` (read ALL of §2 "What round 1 shipped", §3 "Rollout —
  file by file", §4 "Gates", §7 defects). The spec is the port plan you are executing.
- Round-1 geometry gate script: `sc297-round1-chrome-panel.e2e.cjs` in the same dir — you
  will extend it and move it into the repo (see §3).
- Design contract: workspace `DESIGN.md` → "Card header system" and "The element chrome panel".
- Worktree (your ONLY write location):
  `/home/scott/code/steelCompendium/worktrees/sc297-menu-panels-site`. Every submodule is on
  branch `sc297-menu-panels-site`. **Verify `pwd` starts with that path before any write.**
  Never write under `/home/scott/code/steelCompendium/workspace/` — that is the shared main
  checkout. Workspace-level files (`DESIGN.md`, `CHANGELOG.md`) live in YOUR worktree's
  superproject at `/home/scott/code/steelCompendium/worktrees/sc297-menu-panels-site/DESIGN.md`
  and `.../CHANGELOG.md`.
- Fetch-and-rebase first, inside the worktree's clones:
  - `v2`: `git fetch origin && git rebase origin/main`. Branch tip at dispatch:
    `7613cbc8798769bc20be51c9affa3ac0d4a56f41` (the round-1 prototype commit, one commit
    above `f9347707dd`). Tracked branch `main`. Record the resulting sha.
  - `steel-etl`: `093da2980c`, untouched; leave it unless the spec's rollout requires a
    template change (it should not — the strip is client-mounted).
  - `draw-steel-elements`: read-only reference, do not edit.

## 2. The task

Roll the round-1 prototype out per Scott's rulings, fix the two survey defects, update the
docs, and get the branch to review-ready.

**Scott's ruling (2026-09-05 14:26Z), verbatim:** *"agree with all"* — in reply to ask 1, which
offered one recommendation per question and stated that "Agree with all" is a complete answer.
The ledger (`decisions.md` → Rulings) spells out what that adopts; quoted here so this brief
stands alone:

1. **Scope:** all five families that carry buttons today — statblock, featureblock, ability,
   trait, kit.
2. **Collapse toggle:** no collapse toggle on the site panel.
3. **Plain pages:** the `.sc-pageact` page-link + pin cluster on non-card pages stays as is.
4. **Embedded cards inside Read chapters:** card pages only; no panel on embedded cards. The
   two Read-chapter bugs (encounter chip on the first embedded statblock; copy-link on an
   embedded card copying the chapter link) are fixed in the rollout.
5. **Ability card corner clipping:** sanctioned — clipping turned off for cards carrying a
   panel (`overflow: visible` + `border-radius: inherit`, scoped to the panel-bearing card);
   no wrapper element.
6. **Hover lift:** keep the ability card's 2px hover lift; the plate rises with the card.
7. **Level scaler:** the −/+ steppers stay inside the Level chip; leave for now, do not touch.

Anything not covered by these seven is out of scope for this round — report it as a
`Follow-up:`, do not do it.

### 2a. Rollout

Follow spec §3 file by file for every family the Q1 ruling names. The prototype was built so
a family is "two declarations"; if you find that is not true for a family, stop and say so in
the report rather than special-casing.

### 2b. Defect fixes (owner ruling 2026-09-05: fold into this round)

- D1 — `sc-encounter.js:36` uses the descendant selector `.md-content .sb-wrap .sb__head`,
  so the encounter chip mounts on the first *embedded* statblock in a Read chapter. Use the
  same strict card-page discriminator every other consumer uses (the `h1 + hr + card`
  adjacency), unless the Q4 ruling says embedded cards get panels — then follow the ruling.
- D2 — `scc-card-copy.js:83`'s parent gate lets copy-link mount on an embedded card in a Read
  chapter and copy the chapter's permalink. Same fix, same caveat.
- Verify both on `/Read/bestiary/retainers/` (21 `.sb-wrap` on that page): after the fix,
  zero encounter chips and zero copy-links on embedded cards (or one per card with the correct
  per-card target, if Q4 says embedded).

### 2c. Docs (part of "done")

- Worktree `DESIGN.md` → "Card header system": replace the top-center control strip paragraph
  with the new shared plate (one paragraph, current-state only; point at the plugin section
  for geometry/material; name the file pair `sc-chrome.js` / `steel-chrome.css`; keep the
  level-scaler exception sentence per the Q7 ruling). Do not add dated history to DESIGN.md.
- Worktree `CHANGELOG.md` → `## Unreleased`: one user-facing bullet for the panel, one for
  the two Read-chapter fixes.
- `v2/.repo-docs/` and `v2/CLAUDE.md`: update the "Interactive table tools" bullet that says
  page actions live in the top-center strip; point at the plate.
- `v2/.repo-docs/troubleshooting.md` §"A control placed in the card head's right column
  overlaps the Level chip": leave the rule, add one sentence that the plate is the home.

## 3. Gates

- v2 unit: `node --test tests/*.test.js` (glob, not the dir). Expected: **78/78** before;
  after must be ≥78 with zero failures (add unit tests for any new pure logic in
  `sc-chrome.js`; if you add a `-core.js`, it gets a `tests/*.test.js`).
- e2e: all of `tests/e2e/*.e2e.cjs`. Expected before: 6/8 pass; `featureblock-fixture` and
  `settings-panel` fail pre-existing (reproduce against production — do NOT fix them here).
  After: same two failures only, everything else green.
- Move the round-1 geometry gate into the repo as `v2/tests/e2e/chrome-panel.e2e.cjs`,
  extended to every family the Q1 ruling names, and to the D1/D2 negative checks. Expected:
  every assertion green; report the count.
- Screenshots (Scott reviews from images): for every newly-covered family, dark + light,
  hovered + phone; plus one Read-chapter shot showing no stray chip/copy-link on embedded
  cards. Same capture procedure as round 1 (report §1 and spec §4 describe it). Files
  `sc297-r2-<family>-<scheme>-<state>.png` under the ledger dir `shots/`.

Commit in `v2` on `sc297-menu-panels-site`; commit the superproject pointer bump in the
worktree (`git add v2 && git commit`) — the worktree superproject currently shows ` M v2`
uncommitted from round 1. Do not commit shots or scratch `data/`.

## 4. Footguns

- Devbox: always `devbox run -- bash -c 'cd <abs path> && <cmd>'`; its `sh` wrapper eats `$?`
  and `$PIPESTATUS`; never pipe a gate through `tail`; redirect to a file and read it.
- **Never `git checkout -- .` in `v2`** — `docs/javascripts/` and `docs/stylesheets/` are
  hand-authored inside the generated tree. Safe form:
  `git clean -fdq docs site && git checkout -- docs/Browse docs/Read docs/scc`.
- Do not run `devbox run` from inside `v2/` — round 1 did once and it bumped `v2/devbox.lock`;
  if it happens, `git checkout -- devbox.lock` before staging.
- Never key a wait-loop on a scratch filename or its contents — write per-run unique paths and
  read the process's own output.
- Redirect long-running output to a file; run the site build and shots in the foreground —
  never background them and wait (a job you start does not wake you).
- You cannot `SendMessage` the ticket-owner; `to: 'main'` reaches the dispatcher, not me. If
  blocked, end your turn with `STATUS: NEEDS_CONTEXT` and the question in your report. If you
  ever do message, the FIRST WORD must be `SC-297:`.
- If the report-file write is blocked, return the report inline.
- Verify `git -C /home/scott/code/steelCompendium/workspace status` is unchanged from
  ` M draw-steel-elements` (pre-existing) before reporting.

## 5. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/sc297-round2-report.md`,
opening with a ≤10-line executive summary (verdict, shas, gate counts before/after, the 2–3
deciding shots by path, any family that was not "two declarations").

## 6. Return contract

Final text goes to the ticket-owner, not a human: raw facts only. Verdict, `v2` sha,
superproject sha, unit/e2e/geometry counts, absolute paths of report and every screenshot,
`Drive-by fixes:` and `Follow-ups:` lists (empty stated as empty).
