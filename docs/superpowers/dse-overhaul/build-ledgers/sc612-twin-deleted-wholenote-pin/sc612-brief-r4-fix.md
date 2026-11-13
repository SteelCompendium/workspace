# SC-612 r4 — fix round (resume of impl-r2)

## Context loading
1. Ledger, the NEW section "owner rulings on r3" (binding; quoted verbatim there; rule R is superseded by rule P for twinned pins): /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc612-twin-deleted-wholenote-pin/decisions.md
2. The review report — read §2 (every finding, file:line, scenarios, prescribed fixes) and §3 (the prototype): sc612-r3-review-report.md (same dir).
3. Templates from the reviewer (same dir): `sc612-r3-prototype-oracle-rule.diff.txt` (the rule, O(n*m) DP — NOT production), `sc612-r3-repro.test.ts.txt` (named H1/H1b/H1c, M1-M6), `sc612-r3-fuzz.test.ts.txt` + `sc612-r3-classify.py.txt` (seeded fuzz), `sc612-r3-lc-h1-patch.py.txt` (G-S108 H1 cell), `sc612-r3-timing.test.ts.txt`.
4. Common brief (gates, footguns, return contract; binding): sc612-brief-common-gates-footguns.md (same dir). Base is dse c0995beb; `git -C <dse> fetch origin` and rebase if origin/develop moved (report the sha); the superproject branch the same against workspace origin/main.

Workers never call the tracker.

## The task
Implement exactly the "owner rulings on r3" in the ledger:
- HIGH-1 + HIGH-2: rule P in production form — capped Myers `editDistance(a, b, cap)` factored out of `mapLineOf` (common head/tail trimmed first, cap `LINE_MAP_MAX_EDITS`); a capped give-up keeps today's behaviour (head map + body check); no O(n*m) DP. Keep `strictPins`' SC-607 tail-first check; twinned strict pins also get the P check. Remove `mapLineGreedy` / `greedyDissents` and their tests if nothing else needs them. `mapLine` / `mapLineFromTail` / `mapLineStrict` results unchanged.
- MEDIUM-1, LOW-1, LOW-2, LOW-3 folds and the tests listed in the ledger, plus the G-S108 H1 cell.
- Update the `sc612-dse-verify-proposal.md` (rule, guarantees with numbers, residuals, test files, G-S108 cells, CURRENT block) and the CHANGELOG bullet in YOUR worktree's superproject (amend or add a commit on the superproject branch; still no pointer commits).
- Measure the cost inside `vault.process` with the timing harness (twin note 2000 / 5000 lines, 20 / 100 / 198 changes per side; non-twin 5000 lines) and report it next to r3's tip/base numbers.
- Re-run the r3 fuzz on your build: report twinned-ambiguous writes (must be 0) and unambiguous new refusals (must be 0), and the mutant set (r3's 13, adapted to rule P: e.g. drop the uniqueness test, drop the twin gate, place on a non-unique minimum, ignore the deleted option, cap not honoured).

Commit in dse after each coherent step (no pushes, tags or AI attribution).

## Gates
Full battery (common brief): tsc + lint, jest 11682 / 2 at base + your delta, lifecycle 62/62 in seven parts (part 7 `G-S108`), e2e `328/331 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`, styles.css sha = `5e5ff488…2b27` (else STOP, NEEDS_CONTEXT). G-S91 flake (SC-616): re-run part 5 alone before blaming the change. Red-on-base (c0995beb source / bundle) for the new refusal tests and the new G-S108 H1 cell.

## Report
/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc612-twin-deleted-wholenote-pin/sc612-r4-fix-report.md (<=10-line executive summary first; a finding-by-finding table: finding -> what changed -> test that pins it), logs `sc612-r4-*`.

## Return contract
STATUS, dse sha + base, superproject sha + base, every gate number, fuzz numbers, mutants, timing, red-on-base, `git status --porcelain` (dse, superproject), absolute paths of every artifact. Raw facts. `Drive-by fixes:` / `Follow-ups:`. SC-621 out of scope (`rebaseCardPin` / `mapLineStrict` part-pin placement untouched).
