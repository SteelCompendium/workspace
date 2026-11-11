# SC-593 round 1 — independent reviewer brief

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc593-census07-load-timeout/decisions.md`.
- Implementer report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc593-census07-load-timeout/sc593-r1-impl-report.md` (read its summary; verify its claims yourself — do not trust them).
- Implementer brief (what was asked): `sc593-brief-r1-impl.md` in the same dir.
- dse-verify skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` lines 20-217 (~300 KB file; read only those parts). Adapter footguns: `/home/scott/code/steelCompendium/workspace/.claude/orchestrate/PROJECT.md` §8.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc593-census07-load-timeout`, dse submodule `draw-steel-elements/` on branch `sc593-census07-load-timeout`. Review the diff `git -C <abs>/draw-steel-elements diff c3fd8323..HEAD` (base = develop c3fd8323 unless the report says it rebased). Do NOT commit to that branch; probes go in uncommitted scratch or a private copy, and leave the worktree clean when you finish (`git -C … status` clean, revert any probe edits by literal path).
- **You never call the tracker.** Main checkout dse dirt (demo-vault files) is Scott's live vault — ignore.

## 2. The task — execute and probe, not just read

The change aims to stop e2e `[CENSUS-07]` from hitting its 45 s mocha timeout under heavy load, by making `eventfulNodes` (`e2e/driver/census.ts`) cheaper and/or by a measured per-test timeout. Ticket ask (verbatim): "A gate that fails only under load costs a re-run each time it fires. Make it robust to load, or give it a load-aware timeout."

Probe in particular:
1. **Result equivalence.** The census's whole value is finding every node with a click/pointer/key listener. Prove the new `eventfulNodes` returns the SAME node set and events as the old per-node method, on every census scope (CENSUS-01..09) — e.g. a temporary probe that runs old and new side by side in real Obsidian and diffs. Specifically consider: listeners on the scope root vs descendants, `excludeInside` handling, nodes in shadow DOM/iframes if any, listeners added via `on*` properties, capture vs bubble, duplicate nodes from overlapping selectors, `backendNodeId` attribution if used, and whether the census still FAILS when it should (plant an unidentified `div` with a click listener in scope and confirm a finding appears — a vacuous census is the worst outcome).
2. **Timing claims.** Re-measure CENSUS-07 alone, quiet and under synthetic load (N ≈ 2x cores busy-loop `node -e 'for(;;){}'` processes you start and kill by recorded PID), old (c3fd8323) vs new.
3. **Any per-test timeout**: is it justified by measurements, scoped to CENSUS-07 only, and does it not mask a real hang?
4. **Runner rules**: no bracketed ticket id in any test title (SC-577); scenario ids unchanged; coverage `164/164 pairs`.
5. Re-run `npm run e2e` in full on the branch head: expect `260/265 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs` (known bugs SC-257, SC-355, SC-384, SC-580, SC-588). Plus `npm run tsc`, `npm run lint`. (Lifecycle/shots/freeze/parity: spot-check the implementer's logs; re-run only if the diff touches anything outside `e2e/`.)

Findings by severity (HIGH/MEDIUM/LOW/INFO) with file:line, a failure scenario, and a prescribed fix.

## 3. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc593-census07-load-timeout/sc593-r1-review-report.md`, opening with a ≤10-line executive summary (verdict: LAND-READY / FIX-ROUND, counts by severity, measured timings, e2e line). Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc593-r1-review/` with uniquely named files.

## 4. Return contract

Final text goes to the ticket-owner: raw facts (verdict, shas, numbers, findings list), no prose, plus absolute paths of every evidence artifact.

## Footguns (all apply)

- If the report-file write is blocked, return the report inline.
- Never key a wait-loop on a scratch filename or its contents; use per-run unique paths.
- Redirect long output to files; the 600 s stream watchdog kills silent agents. Run every gate as one blocking foreground call; never background a gate and wait for a notice.
- **Never `rm` a glob, a shared `/tmp` path, or a variable-expanded path** (a worker today wiped other efforts' lifecycle FAIL dirs with a `/tmp` glob). Delete only literal paths you created, or nothing. Never touch `.superpowers/` outside `sc593-census07-load-timeout/`.
- Never `pkill`/`killall` by pattern; kill only PIDs you started.
- `git -C <absolute path>` always; no `cd` in compound commands; `devbox run -c <abs path> -- bash <script-file>` for gates whose exit code matters (devbox eats `$?`; never pipe a gate to `tail`).
- You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher. If you need input, end with `STATUS: NEEDS_CONTEXT`. Any message you do send starts with `SC-593:`.
