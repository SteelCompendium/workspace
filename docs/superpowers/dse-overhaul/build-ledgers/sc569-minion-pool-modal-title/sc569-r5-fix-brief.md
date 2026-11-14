# SC-569 r5 — final fix round brief (replacement-ready)

Implementer, SC-569. Final text goes to the ticket-owner. Context: the ledger `decisions.md` (r4 entry + ruling), the r4
report `sc569-r4-rereview-report.md`, and the r1 / r3 briefs (all footguns and gate notes apply verbatim), all in
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc569-minion-pool-modal-title/`. Workers never call the tracker.

State: dse branch `sc569-minion-pool-modal-title` head `c663a137` on develop `506786cb`; superproject `66f2f2c3` (CHANGELOG)
+ `e490a9ae` (pointer bump) on workspace origin/main `075b61e3`. Fetch both first; if either origin moved, rebase and say so.

## Tasks

1. MEDIUM-1 (r4 finding, verbatim): "`src/views/MinionStaminaPoolModal.ts:38` `squadNameKey = (name: string) =>
   name.replace(...)` (called `:59-60`): a creature `name:` written as a bare YAML number (`name: 300`) parses as a number
   ... every pool-modal open in that group throws `name.replace is not a function` ... no title. ... Fix: `const
   squadNameKey = (name: unknown): string => String(name).replace(/\s+/g, ' ').trim().toLocaleLowerCase();` + a tracker
   jest case `[{name: 300}, {name: "Flow"}]` expecting `River - 300 - Minion Stamina Pool`." Show the new case red on
   `c663a137` and green after. Make sure the DISPLAYED name in the title is also safe for a number (it must read `300`).
2. `docs/initiative-tracker.md`, section "Stamina Pool Modal for Minions" (~line 309): add one or two plain sentences
   saying the window's title names the squad when a group holds several squads, and numbers same-named squads
   "(squad 1)", "(squad 2)" in tracker order.
3. One new dse commit for both (or two commits; your call). Then in the superproject: keep `66f2f2c3`, and REPLACE the
   pointer bump so there is still exactly ONE pointer-bump commit, pointing at the new dse head (e.g. reset the branch to
   `66f2f2c3` keeping the submodule checkout on your new head, then commit the bump again with the new sha in its message).
   `git diff origin/main --stat` must show only `CHANGELOG.md` and `draw-steel-elements`. No trailers. Do not push.

## Gates on the final dse head

tsc, lint clean · jest: r3 measured 11916 passed / 1 skipped warm → expect 11917 / 1 warm (+1 case; more if you add
more — state it) · e2e full: `OBSIDIAN-E2E done: 342/345 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` · lifecycle
64/64 in the seven parts (part 7 `G-S108,G-S112,G-S115`; G-S115 (g) rule in the r3 brief §4) · shots / freeze / parity:
do not re-run; instead prove `styles.css` is byte-identical to `c663a137`'s build (sha256 of both) so r3's 592 /
280/280 / 0/0/24 carry.

Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc569-impl-r5/`.
Never `rm`/`rmdir` anything in /tmp or the scratchpad; `git -C <abs>`; no background jobs/Monitor; one lifecycle part per
call; calls over 180 s get backgrounded — wait with `timeout 175 tail --pid=<your pid> -f /dev/null`, read the log.

Report: `sc569-r5-fix-report.md` in the ledger dir, ≤10-line summary first. Return: verdict, dse head + commits since
`c663a137`, superproject head + commits + origin/main sha, diff --stat, every gate line, styles.css hashes, artifact paths.
