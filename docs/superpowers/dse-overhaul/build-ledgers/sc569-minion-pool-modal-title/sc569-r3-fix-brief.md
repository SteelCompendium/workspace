# SC-569 r3 — fix round brief (replacement-ready)

You are the implementer for the SC-569 fix round. Final text goes to the ticket-owner, not a human.

## 1. Context loading

- Read: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc569-minion-pool-modal-title/decisions.md`
  (OD-1, "Baseline moves", and the r2 owner rulings), the r1 brief `sc569-r1-impl-brief.md` (all its footguns and gate
  notes still apply verbatim), the r1 report, and the r2 review report `sc569-r2-review-report.md` (same dir).
- **Workers never call the tracker.**
- Worktree `/home/scott/code/steelCompendium/worktrees/sc569-minion-pool-modal-title`; dse branch
  `sc569-minion-pool-modal-title` at `8dbd9698` on dse `origin/develop` `27120710`. `git -C <plugin> fetch origin` first;
  if develop moved, rebase and say so.

## 2. Tasks (owner rulings from the ledger, verbatim)

> - LOW-1 (amount-0 squad still counted → "(squad 2)" on the only visible squad) → FOLD: count only the minion squads the
>   tracker actually draws (verify what it draws for `amount: 0` / no instances; match it), add jest case.
> - LOW-2 (names differing only by case / surrounding spaces look identical, Steel uppercases) → FOLD: compare
>   `name.replace(/\s+/g,' ').trim().toLocaleLowerCase()`, display the raw name; jest case.
> - LOW-3 + ruling (c) → FOLD: a `[FEATURE]` bullet in dse `CHANGELOG.md` (follow SC-566/573 precedent) AND a bullet under
>   `## Unreleased` in the workspace `CHANGELOG.md` (precedent SC-613 / SC-581 bullets).
> - INFO-2 (no detail-row-route test; `[Flow, Boss(captain), Flow]` sweep) → FOLD: adopt the reviewer's probe as jest tests.

The reviewer's probe is
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc569-review-r2/probe/sc569-r2-probe.test.ts`
(it ran under a private jest config outside the worktree); bring its detail-row route test and the
`[Flow, Boss(captain), Flow]` grid sweep into the repo's test tree in the repo's conventions.

**Out of scope** (filed as their own tickets — do not touch): SC-634 (`captain_of` links by name), SC-635 (420 px Apply
row overflow), SC-636 (Stamina / Conditions window titles; SC-614 is concurrently editing `ConditionsModal`).

Workspace CHANGELOG bullet: write it in **YOUR worktree's superproject** at
`/home/scott/code/steelCompendium/worktrees/sc569-minion-pool-modal-title/CHANGELOG.md` — **never** under
`/home/scott/code/steelCompendium/workspace/`. Plain user-facing wording in the style of the SC-613 bullet: bold first line
naming the visible change and the ticket key `(SC-569)`, then 1-3 lines with the example titles from OD-1. Read the
dse CHANGELOG's SC-566/573 bullets for that file's style.

## 3. Superproject (last step, after all gates are green)

The superproject branch `sc569-minion-pool-modal-title` must end on current workspace `origin/main` with exactly ONE
pointer-bump commit and no interim pointer commits:
1. `git -C /home/scott/code/steelCompendium/worktrees/sc569-minion-pool-modal-title fetch origin`; rebase the superproject
   branch onto `origin/main` (was `f05d3192`; use whatever it is now and report the sha). Do not let the rebase or any
   `submodule update` move the dse submodule off your branch head — check `git -C <plugin> rev-parse HEAD` after.
2. Commit the workspace `CHANGELOG.md` bullet (its own commit, docs only).
3. Commit the dse pointer bump to your final dse head, message `chore: bump draw-steel-elements to <sha8> (SC-569: ...)`
   in the style of `git -C <superproject> log origin/main --oneline -5`. No other submodule pointer may change
   (`git -C <superproject> diff origin/main --stat` must show only `CHANGELOG.md` and `draw-steel-elements`).
No Co-Authored-By / AI attribution trailers. Do not push.

## 4. Gates — full battery on the final dse head

Expected at base `27120710` (ledger "Baseline moves"): tsc and lint clean · jest 11892 passed / 2 skipped fresh (no shots
cache) + SC-569's tests (r1: +7, now + your new ones; with the shots cache it reads one more passed and 1 skipped) ·
lifecycle **64/64** in seven parts, part 7 = `G-S108,G-S112,G-S115` (~200 s) · e2e
`OBSIDIAN-E2E done: 340/343 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` (r1's figure incl. POOL-E06/E07) ·
shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24 last.

G-S115 rule (from the SC-621 owner, verbatim in the ledger): "a G-S115 (g) red that shows the "changed on disk first"
Notice on a loaded host is a suspected flake; re-run part 7 once. A red on the re-run, on a quiet host, or in any other
G-S115 cell (a)-(f), (h), (i) is a real signal." Report any G-S115 red with its cell letter, the load average and the
re-run result.

TDD: show each new jest case red against `8dbd9698`'s helper (or state why it cannot be) and green after.

## 5. Footguns

All of r1 brief §3 gate notes and §4 apply. Private scratch folder:
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc569-impl-r3/`
(new, unique file names). **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad.** `git -C <abs>`
always; devbox `-c <abs plugin path> -- bash <script>`; no background jobs/Monitor; one lifecycle part per Bash call;
calls over 180 s get backgrounded — wait with `timeout 175 tail --pid=<your pid> -f /dev/null`, then read the log. Never a
bracketed ticket id in a test title. Report-write blocked → return inline. You cannot SendMessage me; end with
`STATUS: NEEDS_CONTEXT` if you need input.

## 6. Report and return

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc569-minion-pool-modal-title/sc569-r3-fix-report.md`, ≤10-line
executive summary first. Return: verdict, dse head sha + commit list since `8dbd9698`, superproject head sha + its two
commits + the origin/main sha it sits on, `diff --stat` vs origin/main, every gate line, the LOW-1 tracker-render finding,
new test counts (red/green), absolute paths of all artifacts. `Drive-by fixes:` / `Follow-ups:` lists.
