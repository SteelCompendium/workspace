# SC-433 r2 brief — rebase + fold LOW-1

Same rules as your r1 brief (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc433-temp-stamina-minus/sc433-brief-r1-impl.md` §1, §3 command rules, §5 return contract all still apply — re-read them). Re-read the ledger `decisions.md` (round log has the r1 review rulings). Workers never call the tracker. Final text goes to the ticket-owner.

## 1. Rebase

- dse: `git -C <dse> fetch origin`; rebase `sc433-temp-stamina-minus` onto `origin/develop` = `424f47b` (SC-361 landed; it shares no files with this branch). If origin/develop is newer than 424f47b, rebase onto the newest and say so.
- Superproject: `git -C /home/scott/code/steelCompendium/worktrees/sc433-temp-stamina-minus fetch origin`; rebase the superproject branch onto `origin/main` = `415c086` (or newer). The CHANGELOG `## Unreleased` conflict with SC-361's bullet resolves by keeping both bullets. The superproject shows ` M draw-steel-elements` (the unbumped pointer) — do not commit the pointer; stash or leave it, but the rebase must not commit it.
- After the dse rebase, `npm ci` only if `package.json`/lockfile changed.

## 2. Fold LOW-1 (reviewer finding, verbatim)

> LOW-1: a hand-edited negative stored temp still breaks Damage and Full Heal. `StaminaEditModal.ts:296`, `:400-403`, `:528`, `:545`. With temp −3, Damage 5 takes 8 Stamina and the label says "Lose 8 Stamina and Gain 3 Temp Stamina"; Full Heal says "Gain 3 Temp Stamina". The fix is to read the stored temp as `Math.max(0, …)` for the math.

Owner ruling (ledger): fold into r2 — "one-line clamp: read stored temp as Math.max(0, …) for all math. Must not write a key/value the user didn't change unless the user acts (Apply after Damage/Full Heal writes the clamped result)."

Concretely: treat a negative stored `temp_stamina` as 0 everywhere the modal does temp math (stepper start value, Damage absorption, Full Heal, Kill, labels, Apply). Opening and cancelling the modal writes nothing. Add jsdom tests: stored temp −3 → Damage 5 takes 5 Stamina, label has no "Gain … Temp"; Full Heal label has no temp gain; the temp field shows 0 and "−" is disabled. The reviewer's probe file `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc433-r1-review/probe2-negative-temp.test.ts` shows the scenario — read it, do not copy it into the repo wholesale. Commit separately (`fix(SC-433): …`).

Out of scope (do not touch): initiative writing `temp_stamina: 0` on untouched creatures (SC-485).

## 3. Gates — full battery on the rebased head

Baselines at 424f47b: jest **5703 / 1 skipped / 238 of 239** · lifecycle **31/31** · e2e **96/99 ok, 0 failed, 3 known-bug, 66/66** · shots **580**, 0 FAIL, no ALLOWLISTED line · freeze **280/280** · parity **0/0/24**.

Expected after: tsc/lint clean; jest ≈ 5706 + your LOW-1 tests, 1 skipped; lifecycle 31/31; e2e **101/101 ok, 0 failed, 0 known-bug, coverage 66/66**; shots 580, 0 FAIL; freeze 280/280; parity 0/0/24. Use a new private scratch folder `.../scratchpad/sc433-r2-impl/` and logs `sc433-r2-<gate>.log` in the ledger dir. One blocking foreground gate per Bash call; no background jobs; no glob rm; kill only your own PIDs.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc433-temp-stamina-minus/sc433-r2-fix-report.md`, ≤10-line executive summary first (verdict, new dse head + commit list, new superproject head, gate numbers, conflicts hit). Return raw facts + absolute paths. If you need input, end with STATUS: NEEDS_CONTEXT.
