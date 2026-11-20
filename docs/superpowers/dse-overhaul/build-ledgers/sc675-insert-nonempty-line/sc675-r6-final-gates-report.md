# SC-675 r6 final gates report (dse `3b47e55b`)

**Executive summary**
- Sha `3b47e55b710c1bbf7afe9f245c4c1b99e0ea8672`, no code change, no commits; `git status --short` empty before and after.
- e2e: `OBSIDIAN-E2E done: 658/667 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs` (exactly the expected line).
- Lifecycle, all seven parts fresh: 60/60 in parts 1-3 and 5-7 plus part 4 at 3/4; the union is **63/64 ok, 1 failed: G-S61**, the same torn-read failure as in the superseded r4 run.
- G-S61 re-run alone 3 times (more than the 2 asked for: 2 re-runs on this sha plus 1 diagnostic on a clean base build): all 3 FAIL with the same signature ("the recorder's disk read was torn in N frames in a row, so its stale-frame check did not run"). The base diagnostic fails too, so the failure is not caused by this branch (SC-668).
- `styles.css` sha256 `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` (unchanged).

## Lifecycle (one `--only=` part per call)
| part | ids | summary line |
|---|---|---|
| 1 | G-S7a ... G-S9a | `OBSIDIAN-LIFECYCLE done: 21/21 ok, 0 failed` |
| 2 | G-S9b ... G-S40 | `done: 16/16 ok, 0 failed` |
| 3 | G-S45 ... G-S64 | `done: 9/9 ok, 0 failed` |
| 4 | G-S57 G-S62 G-S61 G-S56 | `done: 3/4 ok, 1 failed` (G-S61 FAIL, phase (b) "LP callouts, upper, middle, lower", 7 frames torn) |
| 5 | G-S59 ... G-S91 | `done: 7/7 ok, 0 failed` |
| 6 | G-S92 G-S96 G-S97 G-S99 | `done: 4/4 ok, 0 failed` |
| 7 | G-S108 G-S112 G-S115 | `done: 3/3 ok, 0 failed` |

Union: 63/64 ok, 1 failed (G-S61).

## G-S61 runs
| run | build | result |
|---|---|---|
| r4 (superseded, `f94be393`) | f94be393 | FAIL, phase (a), 9 frames torn |
| part 4 (this round) | 3b47e55b | FAIL, phase (b), 7 frames torn |
| rerun 1, alone | 3b47e55b | FAIL, phase (a), 8 frames torn |
| rerun 2, alone | 3b47e55b | FAIL, phase (a), 5 frames torn (loadavg 1.6-4.0, so not heavy load) |
| diagnostic, alone, clean `129beb18` (`git archive` copy built in the r1 scratch dir `.../sc675-r1-impl/base129`, not the worktree) | 129beb18 | FAIL, phase (f), 6 frames torn |

Every failure line reads "0 frame(s) of N with a pending edit on a block the card was not clicked on, 0 frame(s) with a card that did not match its block": the stale-frame check itself found nothing; the recorder's own disk read was torn, so it refused to judge. G-S61 does not involve the insert commands this branch changes. Kept temp dirs (left in place, not removed): `/tmp/dse-obsidian-lifecycle-2hnL0Y`, `-TaxBRq`, `-ne77by`, `-K11Gcz`.

## e2e
`npm run e2e` full run, rc 0, final line verbatim: `OBSIDIAN-E2E done: 658/667 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs`.

## Logs
All in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/5812b474-3aec-46a6-8f06-0ef85cf1e10a/scratchpad/sc675-r6-gates/` (each with `.rc`): `lifecycle-p1-run1.log` ... `lifecycle-p7-run1.log`, `lifecycle-gs61-rerun1.log`, `lifecycle-gs61-rerun2.log`, `lifecycle-gs61-base129.log`, `e2e-run1.log`.
