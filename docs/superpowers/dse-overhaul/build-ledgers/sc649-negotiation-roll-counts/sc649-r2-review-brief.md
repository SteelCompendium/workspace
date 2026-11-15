# SC-649 R2 independent review brief

Your final text goes to the ticket-owner, not a human. **You never call the tracker** (Linear).
You did not write this code; review it adversarially. **Execute and probe, do not just read.**

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc649-negotiation-roll-counts/decisions.md`.
- The implementer's brief and report in the same dir: `sc649-r1-brief.md`, `sc649-r1-report.md`
  (read the report's executive summary; treat its claims as claims to verify).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc649-negotiation-roll-counts`, plugin at
  `draw-steel-elements/`, branch `sc649-negotiation-roll-counts`, head sha: see the report. Diff base:
  dse develop `3e88b3f5` (`git -C <plugin abs> diff 3e88b3f5..HEAD`; the branch must be rebased onto it). Use `git -C <abs path>` always.
- Do NOT commit to the branch. Probes go in throwaway test files you do not commit (or in a scratch
  copy), and you leave the working tree as you found it (`git -C … status` clean at the end except for
  files the implementer left; list anything you could not restore).
- Read the `dse-verify` skill (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`,
  ~470 KB, in parts) before running gates. The full-battery footguns in `sc649-r1-brief.md` §3–§4 apply to
  you verbatim (lifecycle `--only=` with equals sign, seven parts, devbox script files, private scratch
  folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc649-r2-<your agent id>/`,
  **never rm/rmdir in /tmp or the scratchpad**, no pattern pkill, foreground gates, no Monitor).

## 2. What to check

The contract (ticket, verbatim): "**Expected:** the tiers and Complete Argument use exactly what the
card shows as chosen." Owner rulings 1–4 in the ledger (quote them, do not paraphrase).

Probe at least:
1. Case 1 / Case 2 from the ticket, plus combinations: a ghost motivation AND a real one; a ghost pitfall
   AND a real one; ghost motivation + `sameArgumentUsed: true` (what the card shows vs the roll); Reuse with
   a real spent motivation (must still count); `reusedMotivation: true` with a spent motivation that has been
   renamed away.
2. Complete Argument under each: Interest/Patience written to the note, motivations marked spent
   (`hasBeenAppealedTo`) — a ghost must not mark anything; the stray entries' fate after Complete.
3. Ruling 2: no write on render; a pure open/redraw leaves the YAML byte-identical; a chip toggle with a ghost
   entry present — what is written, and is it sane (no ghost resurrected wrongly, no real entry lost)?
4. Restoring the motivation's name brings the chip back pressed and the roll counts it.
5. SC-638 typed values (`motivationsUsed: [5]` vs a motivation named 5) and SC-637 unknown keys still survive.
6. Every caller: grep `src/` for `usesMotivation`, `usesPitfall`, `reusedMotivation`, `motivationsUsed`,
   `pitfallsUsed`; anything feeding the roll or a disabled state that bypasses the new single source is a finding.
7. Tests: are the new jsdom tests and the e2e scenario non-vacuous? Revert the product fix locally (stash
   only the `src/` hunks) and confirm K11–K13 and the new tests go red, then restore.
8. Re-run the full battery yourself (tsc, lint, jest, lifecycle seven parts, e2e full, shots, freeze, parity).
   Expected (baseline `3e88b3f5`, see the ledger's "Baseline moves"): jest = 13325 fresh (13326 / 1 with shots cache) + new tests; lifecycle 64/64; e2e
   `593/609 ok, 0 failed, 16 known-bug, coverage: Y/Y` (or as the report justifies); shots 592, host-leak
   163/978, modal host-leak 40/240, capture clip 147; freeze 280/280; parity 0/0/24.
   Known flakes as listed in `sc649-r1-brief.md` §3.

## 3. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc649-negotiation-roll-counts/sc649-r2-review.md`,
opening with a ≤10-line executive summary (verdict LAND-READY / FIX-NEEDED, head sha reviewed, gate numbers).
Findings by severity (HIGH / MEDIUM / LOW / INFO) with file:line, failure scenario, and prescribed fix. Gate
summary lines verbatim with log paths. If the write is blocked, return the report inline.

You cannot `SendMessage` me; for input end with `STATUS: NEEDS_CONTEXT` + question. Any message you do
send must start with `SC-649:`.

## 4. Return contract

Raw facts only: verdict, sha reviewed, findings count by severity, every gate number, report path, and the
absolute path of every evidence artifact. No prose.
