# SC-318 round 5 — scoped re-review of fix round 1 (delta only)

You reviewed SC-318 in round 3 (`sc318-r3-review-report.md`). Re-review ONLY the fix-round
delta. Workers never call the tracker. Final text goes to the ticket-owner: raw facts.

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc318-card-headings/decisions.md`
  → "Owner rulings, round 3" is the spec for this delta.
- Fix report: `sc318-r2-implement-report.md` → "## Fix round 1" (same dir).
- Worktree `/home/scott/code/steelCompendium/worktrees/sc318-card-headings`; delta =
  `git -C <wt>/draw-steel-elements diff 236d593..HEAD` (if the branch was rebased, use
  `git range-diff`) and the superproject delta since `5478d94`.

Check:
1. LOW-1: `.dse-skills__group-title` line-height 21.6px and `.dse-mt__guide-title` 20.4px at
   default on the branch screen (== develop), with scaling units; nothing else about them moved.
2. LOW-3 comment fixed.
3. MED-1 evidence in `r4-evidence/`: "Today" columns match YOUR real-`5a20d5f` measurements
   (e.g. "On Humans" gap 18.72 today / 40 branch; h1 mt 21.44 today); all columns same CSS-px
   scale; no stray text; blockquote-h6 row present; ladder Option C visibly applied;
   measure table includes blockquote-h6 row (LOW-2 disclosure) and matches your numbers.
4. Gates (reproduce in the foreground): shots 0 FAIL, freeze 260/260, parity 0/0/16, jest 0
   failures (count should equal round 2's 4142/1/4143 unless a test was added — explain any
   delta). Lifecycle only if the delta touched TS.
5. Rebase: dse on current origin/develop; superproject on current origin/main.

Report: `sc318-r5-rereview-report.md` in the ledger dir, <=10-line executive summary first
(LAND-READY-AS-PROPOSAL / FIX-FIRST, severity counts).

Footguns: run everything in the FOREGROUND (plain Bash, timeout 600000, output redirected to a
per-run log under `r5-rereview/`); never run_in_background / Monitor; never end your turn
waiting on a job. Kill only by PID whose command line contains `worktrees/sc318-card-headings/`;
never pkill/killall by pattern. Never touch the freeze baseline; never rm -rf under
`.superpowers/` except your own `r5-rereview/`. Do not commit to the branch. If the report
write is blocked, return it inline. Never key a wait-loop on a scratch filename. You cannot
SendMessage me — if you need input, end with STATUS: NEEDS_CONTEXT; any message you do send
must start with `SC-318:`.
