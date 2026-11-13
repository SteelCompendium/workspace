# SC-612 r2 — implementation

## Context loading (read first)
1. Ledger (rulings, verbatim; binding): /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc612-twin-deleted-wholenote-pin/decisions.md — especially "owner rulings on r1 open questions".
2. Common brief (gates, expected numbers, footguns, return contract; binding): /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc612-twin-deleted-wholenote-pin/sc612-brief-common-gates-footguns.md
3. The r1 design report — §A (reproduction), §B2 (rule R), §C3 (flips), §D (test plan: implement it), §E (questions; the ledger has the rulings):
   /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc612-twin-deleted-wholenote-pin/sc612-r1-design-report.md
4. The probe diff to start from: `sc612-r1-probe-rule-R.diff.txt` (same dir). Sweep / oracle / Obsidian scenario templates: `sc612-r1-sweep.test.ts.txt`, `sc612-r1-ambiguity.py.txt`, `sc612-r1-p612-scenario.mjs.txt`, `sc612-r1-mutate.py.txt` (same dir).

Worktree: /home/scott/code/steelCompendium/worktrees/sc612-twin-deleted-wholenote-pin; dse on branch sc612-twin-deleted-wholenote-pin at 63e00d7e. `git -C <dse> fetch origin` and rebase onto origin/develop if it moved (report the sha). Workers never call the tracker.

## The task
Ticket Expected (verbatim): "Save writes nothing and shows the "changed on disk first" Notice. It must never go into a different block."
Standing ruling (Scott, 2026-11-10): "Save nothing with a notice is fine."

Implement rule R exactly as ruled in the ledger (Q1, Q2, Q3, Q5, Q7):
- `lineMap.ts`: `mapLineGreedy` (with doc comment); `mapLine` / `mapLineFromTail` / `mapLineStrict` results unchanged.
- `ReadingModeBlockHost.ts` `pinnedTarget`: for a whole-note pin whose known body is twinned (in `pin.text` or now), the tail-first map must agree AND neither greedy map dissents (`greedyDissents`), else null; the same greedy check at write time for `strictPins` when twinned. Notes without twins: byte-identical behaviour, no extra map. Card fallback unchanged.
- Update the `pinnedTarget` doc comment ("Known limit (SC-556)") and any `mapLine` doc that states the head-trim bias for whole-note pins.

Tests (r1 §D, all of it):
- Jest T1-T13 named tests (new `describe` in the pin test file r1 suggests, or a new `reading-mode-host-whole-pin.test.ts`), asserting outcome, Notice list and note text.
- The sweep ported as one jest test with the TS oracle (assert: no write and no OTHER in an ambiguous cell; every refusal exactly one "changed on disk first" Notice; every refused cell's next round saves; no-edit / unrelated-edit / own-round cells save). Pin the totals as r1 suggests if they are stable.
- `lineMap.test.ts`: the `mapLineGreedy` cases in §D.
- Show red-on-base: run the new jest tests against the 63e00d7e source (T1, T2, T3, T4, T13 and the sweep's ambiguity assertion must fail there); save the log.
- Mutants: re-run r1's M1-M8 against your implementation (report killed / survived; M2 is the accepted equivalent).
- Lifecycle G-S108 (ruling Q6): cells (a)-(k) of r1 §D, one note each, its own part 7 placed before G-S56 in SCENARIOS order (G-S56 stays last). Each refusal cell: nothing written, exactly one "changed on disk first" Notice, the outside text kept, the form open. Show (a)-(g) red on a 63e00d7e bundle and (h)-(k) green there; all green on your branch. No bracketed ticket id in any title.

Docs:
- CHANGELOG bullet under `## Unreleased` in YOUR worktree's superproject (/home/scott/code/steelCompendium/worktrees/sc612-twin-deleted-wholenote-pin/CHANGELOG.md — never the main checkout), plain user words: a form Save or + / - on one of two identical counters no longer writes the other one when an outside change (Sync, another app) deleted it; it is refused with the "changed on disk first" Notice.
- dse-verify SKILL proposal (do not edit SKILL.md): /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc612-twin-deleted-wholenote-pin/sc612-dse-verify-proposal.md — the new wording for the bullet "Two identical blocks separated only by blank lines", residual 6 of the drawn-from rule, the R residuals (ledger Q8), the new refusals, the jest files, G-S108 and part 7, and a CURRENT numbers block.

Commit in the dse submodule after each coherent step (no pushes, no tags, no AI attribution). The superproject branch gets the CHANGELOG commit only, rebased onto workspace origin/main; no dse pointer commits.

## Gates
Full battery per the common brief: tsc + lint, jest (11648 / 2 at base + your delta), lifecycle 62/62 in SEVEN parts (the six listed + part 7 `G-S108`), e2e 315/318 0 failed 3 known-bug 174/174, styles.css sha vs `5e5ff488…2b27` (identical -> shots/freeze/parity carry; else STOP, NEEDS_CONTEXT). Report walls per lifecycle part. G-S91 flake (SC-616): re-run part 5 alone before blaming the change.

## Report
/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc612-twin-deleted-wholenote-pin/sc612-r2-impl-report.md (<=10-line executive summary first), gate logs `sc612-r2-gate-*.log`, red-on-base logs, mutants log, all in that dir.

## Return contract
Final text: STATUS (DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT), dse sha + base sha, superproject sha + base sha, every gate number, red-on-base results, mutants killed/survived, `git status --porcelain` of dse and superproject, absolute path of every artifact. Raw facts, no prose. `Drive-by fixes:` / `Follow-ups:`. SC-621 (the `rebaseCardPin` residual) is OUT OF SCOPE — do not touch `rebaseCardPin` / `mapLineStrict`.
