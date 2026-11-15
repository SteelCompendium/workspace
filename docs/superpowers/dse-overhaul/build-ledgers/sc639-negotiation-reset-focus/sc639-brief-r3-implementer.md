# SC-639 r3 implementer brief — fix review findings, rebase, superproject commits, full battery

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc639-negotiation-reset-focus/decisions.md` (read whole; rulings are current-state).
- Your r1 report and the r2 review: `.../sc639-r1-implementer-report.md`, `.../sc639-r2-review-report.md`.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc639-negotiation-reset-focus` (superproject) and its
  `draw-steel-elements/` (branch `sc639-negotiation-reset-focus`, head `8ef9b641` on `e1be1775`). `git -C <abs path>`
  for every git command. Verify `pwd`/branch before writes.
- **The workspace-level files (CHANGELOG.md) live in YOUR worktree's superproject at
  `/home/scott/code/steelCompendium/worktrees/sc639-negotiation-reset-focus/CHANGELOG.md` — never under
  `/home/scott/code/steelCompendium/workspace/`.** You write in the main checkout only your report in the ledger dir.
- **You never call the tracker.**
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (as in r1). Do not edit it.
- Main-checkout dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault: ignore.

## 2. The task

### 2a. Fix the review findings (verbatim from r2; the owner's ruling per finding is noted)

**LOW-1** (r2, verbatim): "the owner-ruled mouse path has no real-Obsidian test ... Fix: add NEGO-F08 (RV) and
NEGO-L09 (LP). Tab or `focusByScript` to a Patience seal, `openMenu(root)`, then `chooseReset`, and expect
`{ inCard: true, ctl: 'negotiation.menu' }`." Owner ruling: FOLD. (Grep the ids are unused first; no bracketed ticket id
in a title.)

**LOW-2** (r2, verbatim): "`src/elements/negotiation/view.ts:204` passes `ring: focusAtOpen.ring`. `focusState()` and
`focusAnywhere()` (`e2e/driver/negotiation.ts`) do not read `:focus-visible`, and no jsdom test checks the ring ...
Fix: add a `ring` field to `focusState` / `focusAnywhere` (`a.matches(':focus-visible')`) and assert `ring: true` in
NEGO-F01 and NEGO-L03, and in the LOW-1 tests if they are added." Owner ruling: FOLD. Run the `ring: false` mutant at
view.ts:204 and confirm it now goes red in e2e; restore it.

Out of scope (do not touch): SC-660 (LP Escape from the options menu sends focus to the editor) and SC-661 (Reset from a menu left open across an outside edit resets nothing): both filed Backlog, pre-existing; do not fix them here. Still: no `NegotiationData.ts`, nothing changing what Reset resets (SC-641), nothing in SC-649's roll / motivation-matching code.

### 2b. Rebase the plugin branch

`git -C <plugin> fetch origin`; confirm `origin/develop` is `2777484c` (SC-631 landed; montage files only, no overlap
expected). If it moved again, stop and report NEEDS_CONTEXT. `git -C <plugin> rebase 2777484c`. Re-run `npm ci` only
if `package.json`/lockfile changed between e1be1775 and 2777484c. Push the plugin branch: `git -C <plugin> push -u origin sc639-negotiation-reset-focus` (force-with-lease if it was pushed before).

### 2c. Superproject branch

The superproject worktree branch `sc639-negotiation-reset-focus` must sit on CURRENT workspace `origin/main`
(`git -C <superproject> fetch origin`; it was `0a6aaebf` at dispatch — use whatever origin/main is now, and report it).
Rebase/reset the superproject branch onto it (it has no commits of its own yet; check `git log origin/main..HEAD`).
Then make exactly TWO commits, in this order, and no other superproject commits:
1. `docs(changelog): SC-639 negotiation Reset keeps keyboard focus on the card` — add this bullet under `## Unreleased`
   at the TOP of the list in `CHANGELOG.md` (verbatim from `.../sc639-changelog-bullet.md`, adjusted only if the r2
   fixes change behaviour):

   - **DSE plugin: in a Negotiation, the keyboard stays on the card after you choose Reset (SC-639).**
     Open the options menu (the ⋮ button) from the keyboard and choose Reset: the negotiation was reset, but keyboard
     focus dropped to the page, so the next Tab started again from the top of the note. Focus now returns to the ⋮ button
     of the reset card, in Reading view and Live Preview. A Reset never pulls focus into the negotiation when you were
     working somewhere else on the page.

2. `chore: bump draw-steel-elements to <short sha> (SC-639: negotiation Reset keeps keyboard focus on the card)` —
   the ONE pointer bump, to the final rebased plugin head. If you make further plugin commits after this, amend this
   pointer commit rather than adding a second.
Do not push the superproject (the dispatcher lands). Commit messages: NO co-author trailers, NO Claude/AI attribution.

### 2d. Full battery on the final rebased head

Expected at baseline 2777484c (dispatcher): tsc/lint clean · jest **13334 passed / 2 skipped** fresh · lifecycle
**64/64** · e2e **`597/612 ok, 0 failed, 15 known-bug, coverage: 417/417 pairs`** · shots 592, host-leak 163/978,
modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24.
With r1's delta (+8 jsdom, +5 e2e, 2 known-bug flipped) expect about jest 13342/2 and e2e 604/617 ok, 13 known-bug,
417/417 pairs, plus whatever the r2 fixes add. Explain every difference test-by-test.

`rm -f main.js styles.css` (literal names, from a script file) in the plugin root before `npx jest`.
Lifecycle in SEVEN parts with `--only=` (EQUALS SIGN; check the log's first lines show only that part's ids):
1. `G-S7a,G-S7b,G-S6a,G-S6b,G-S6u,G-S28,G-S5n,G-S1,G-S2,G-S3,G-S4,G-S5,G-S6c,G-S6d,G-S6e,G-S6f,G-S6g,G-S6h,G-S6i,G-S8,G-S9a`
2. `G-S9b,G-S9d,G-S9e,G-S9f,G-S9c,G-S10,G-S11,G-S12,G-S13,G-S15,G-S14,G-S18,G-S32,G-S36,G-S33,G-S40`
3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64`
4. `G-S57,G-S62,G-S61,G-S56`
5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91`
6. `G-S92,G-S96,G-S97,G-S99`
7. `G-S108,G-S112,G-S115` (~200 s: the tool backgrounds it; poll YOUR node pid with `timeout 175 tail --pid=<pid> -f /dev/null`, then read the log)
Known flakes: G-S91 real unless "host too slow" after two re-runs; G-S115 (g) re-run part 7 once on a loaded host;
e2e INIT-W10 (SC-654), SET-X03/X04 (SC-657) flaked once under load; SC-622: restore
`demo-vault/.obsidian/appearance.json` before blaming a G-S97 fail. Jest timeout 30 s: "Exceeded timeout" is a real
hang until proven otherwise.

## 3. Footguns

- `devbox run -c <plugin abs path> -- bash <script-file>`; never `cd` in a compound command; record exit codes inside the script; never pipe a gate.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc639-r3-<yourAgentId>/`, unique names, Write tool.
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad**; no `rm` with a variable target. Leave throwaway files.
- Never `pkill`/`killall` by pattern; only PIDs whose `/proc/<pid>/cwd` is in this worktree. SC-649 runs gates concurrently.
- One blocking foreground call per gate; no background job you wait on for a notification. Redirect long output to files.
- Never key a wait-loop on a scratch filename or its contents.
- You cannot `SendMessage` me; end with `STATUS: NEEDS_CONTEXT` if you need input. Any stray message starts `SC-639:`.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc639-negotiation-reset-focus/sc639-r3-implementer-report.md`,
≤10-line executive summary first; inline if blocked.

## 5. Return contract

Raw facts to the ticket-owner: STATUS; plugin head sha (rebased) and commit list; superproject branch base
(origin/main sha) and its two commit shas; `git -C <superproject> log --oneline origin/main..HEAD` output; per-finding
fix with file:line; every gate's measured number vs expected; absolute paths of every evidence artifact.
