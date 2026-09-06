# SC-297 round 3 brief — independent adversarial review of the chrome-panel rollout

You are an independent reviewer for the SC-297 ticket-owner. You did not write this code.
**You never call the tracker (Linear) — not to read history, not to post.** Everything you need
is in files. **Execute and probe; do not just read.**

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/decisions.md`
  — read in full. Scott's ruling of 2026-09-05 (*"agree with all"*, adopting the seven
  recommendations listed under it) is the spec the branch must satisfy. Anything the branch
  does beyond those seven is a finding.
- Round-1 port spec `sc297-round1-port-spec.md` (§2 DOM contract, §3 rollout plan, §7 defects)
  and round-2 report `sc297-round2-report.md` (executive summary + what it claims). Read the
  claims so you can try to break them.
- Design contract: workspace `DESIGN.md` → "The element chrome panel" (option D geometry,
  E3 material, tuck depth, hover/mobile/print rules) and "Card header system".
- Worktree (read + run; write only test scaffolding and your report):
  `/home/scott/code/steelCompendium/worktrees/sc297-menu-panels-site`. Verify `pwd` before any
  write. Never write under `/home/scott/code/steelCompendium/workspace/`.
- Branch under review: `v2` on `sc297-menu-panels-site` at
  `3c733f312f8db470ca18371ff487135aea90ba21` (worktree superproject at `99f065862e`), i.e. the
  range `f9347707dd..HEAD` (three commits: round-1 prototype `7613cbc879`, round-2 rollout
  `406104ad9f`, round-2b trait fix `3c733f312f`). Also review the superproject-level diff in the
  worktree (`DESIGN.md`, `CHANGELOG.md`) against `origin/main`. Do not rebase or amend; if `origin/main` has moved, note it and review
  the branch as it stands.

## 2. What to probe (findings by severity, each with file:line, failure scenario, prescribed fix)

1. **Geometry gate is real, not vacuous.** Run `tests/e2e/chrome-panel.e2e.cjs` yourself.
   Then break it on purpose (temporarily change `--sc-chrome-inset`-equivalent or the bottom
   offset in `steel-chrome.css` by 2px) and confirm it fails naming what moved. Revert.
2. **Every family Scott named** (statblock, featureblock, ability, trait, kit) shows the plate
   on its card page and NOT on embedded instances in Read chapters. Measure on real pages:
   at least one card page per family, plus `/Read/bestiary/retainers/` (21 embedded statblocks)
   and one Read chapter with embedded abilities. Count `.sc-chrome` (or whatever the plate's
   class is) per page; count stray encounter chips and copy-links on embedded cards (D1/D2 —
   expected zero).
3. **The strip is gone, not hidden.** No consumer still mounts into the card head; no CSS
   still reserves the old offsets; no dead `order`/position rules left for the removed strip.
   Grep the four consumers and the head CSS.
4. **Each action still works end to end** in a real browser (playwright-core + Brave, per
   `v2/.repo-docs/troubleshooting.md` → "Playwright via Brave"): copy-link copies the card
   permalink (check clipboard or the button's target), pin toggles the pinned state and the
   pins list updates, encounter-add adds the creature to the encounter builder, MD and PNG
   exports fire. Instant-nav swap: navigate card page → card page via a same-site link and
   confirm exactly one plate exists (no doubled mounts, no orphaned plate from the previous
   page).
5. **Print:** print-media render shows no plate on every family.
6. **Phone width (375px):** plate always visible; card reserves top space; nothing overlaps
   the breadcrumb or the card above.
7. **Keyboard:** tabbing into a card reveals the plate (`:focus-within`); every button is
   reachable and has an accessible name.
8. **Scope discipline:** the level scaler is untouched (ruling 7); `.sc-pageact` untouched
   (ruling 3); no collapse toggle (ruling 2). Diff review of `f9347707dd..HEAD` for anything
   beyond the seven rulings.
9. **Docs:** worktree `DESIGN.md` "Card header system" no longer describes the top-center
   strip as the home for page actions; `CHANGELOG.md` `## Unreleased` has the entries;
   `v2/CLAUDE.md` bullet updated. Check for dated-history creep in `DESIGN.md` (router rule).
10. **Gates re-run by you, not read from the report:** v2 unit (`node --test tests/*.test.js`,
    expected 78 pass, 0 fail), all e2e (`tests/e2e/*.e2e.cjs`; expected only the two
    pre-existing failures `featureblock-fixture` and `settings-panel`, which reproduce
    against production), and `chrome-panel.e2e.cjs` expected 135/135.
11. **Round-2b delta:** `steel-traits.css` gained an `h1 + hr` hide rule mirroring the other
    four families. Confirm a trait leaf page shows one title, not two, and that no other page
    type lost a heading (the selector must be scoped to the strict card-page adjacency, not a
    bare `h1 + hr`).

Known and out of scope (do not report as findings): kit cards show only the pin because kit
leaf pages lack the export island — filed as **SC-298** (`steel-etl` pipeline gap). The two
pre-existing e2e failures. The shared main checkout's `CLAUDE.md` → `@AGENTS.md` dirt.

## 3. Footguns

- Devbox: `devbox run -- bash -c 'cd <abs path> && <cmd>'`; never pipe a gate through `tail`;
  redirect to a per-run unique file and read it. Do not run `devbox run` from inside `v2/`
  (it bumps `devbox.lock`).
- **Never `git checkout -- .` in `v2`.** Safe form:
  `git clean -fdq docs site && git checkout -- docs/Browse docs/Read docs/scc`. If you
  temporarily edit `steel-chrome.css` for probe 1, revert that one file by path.
- Never key a wait-loop on a scratch filename; run builds/shots in the foreground with output
  redirected; a job you start does not wake you.
- You cannot `SendMessage` the ticket-owner; `to: 'main'` reaches the dispatcher. If blocked,
  end with `STATUS: NEEDS_CONTEXT` in your report. If you ever do message, FIRST WORD `SC-297:`.
- If the report-file write is blocked, return the report inline.
- Leave the branch exactly as you found it (`git status` clean in `v2`, HEAD unchanged).

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/sc297-round3-review-report.md`,
opening with a ≤10-line executive summary: verdict (APPROVE / FIX ROUND NEEDED), finding
count by severity, gate numbers you measured, the one or two shots that decide it. Findings
in the body as `SEVERITY — file:line — scenario — fix`. Any probe screenshots as
`sc297-r3-<what>.png` under the ledger dir `shots/`.

## 5. Return contract

Final text to the ticket-owner, not a human: raw facts only — verdict, finding counts by
severity, measured gate numbers, absolute paths of the report and every artifact.
