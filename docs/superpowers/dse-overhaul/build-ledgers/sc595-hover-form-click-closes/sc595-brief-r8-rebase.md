# SC-595 r8 — rebase onto ec26b709 + r7 INFO-1 + full battery (implementer)

Final text goes to the ticket-owner. Replacement-ready: load context from the ledger (`decisions.md`, O10) and `sc595-r6-rebase-report.md`, `sc595-r7-recheck-report.md` in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc595-hover-form-click-closes/`. Worktree `/home/scott/code/steelCompendium/worktrees/sc595-hover-form-click-closes`; dse `6725243c` on `c3fd8323`; superproject `6152eb69`. Workers never call the tracker.

## Task
1. `git -C …/draw-steel-elements fetch origin`; rebase onto `origin/develop` **`ec26b709`** (SC-574: minion pool modal custom conditions, e2e POOL-C07/C08; the owner checked it shares no file with SC-595). Report `git range-diff` (expect all `=`).
2. O10, verbatim: "r7 INFO-1 (G-S83 `stamtext` press never checks it landed on the number text) — fold into r8: assert `elementFromPoint` at the press point is the bar's number text and record the hit in the outcome line." Show the assertion bites: once, in scratch, offset the press point off the text and record that G-S83 fails on that assertion (then revert).
3. Superproject: rebase onto workspace `origin/main` if trivial (keep every CHANGELOG bullet, SC-595 on top); else leave and say so. Workspace-level files only in YOUR worktree's superproject, never under `/home/scott/code/steelCompendium/workspace/`. Pointer stays unstaged.
4. Update `sc595-dse-verify-proposal.md` CURRENT numbers to the final head.

## Gates — full battery on the final head
Baselines at `ec26b709` (dispatcher, verbatim): "jest 7207 passed / 1 skipped · lifecycle 54/54 · e2e `262/267 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs` · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24".
Expected: tsc (+ `-p e2e`) and lint (+ `e2e/`) clean · jest 7207 + 32 passed / 1 skipped (fresh worktree: 7206 + 32 = 7238 / 2 skipped; SC-568 suites green alone) · lifecycle **55/55** in five `--only` parts (part 5 `G-S59 G-S49 G-S73 G-S77 G-S83`, G-S56 last) · e2e **`262/267 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`** (RECOV-R07 load flake: re-run alone) · styles.css byte-identical to a clean `ec26b709` build (then shots/freeze/parity carry). Mutants carry (src unchanged) — say so.

## Footguns
No compound `cd` (`git -C`, `devbox run -c <abs>`); exit codes via a script file; never pipe a gate into `tail`; never `rm` a variable target and NEVER a glob `rm` under /tmp (literal paths you created only); one gate per Bash call in the foreground, no background gates/Monitors; long output to files; never set `DSE_LIFECYCLE_PORT`; private `DSE_CAMERA_TMP`; kill by literal PID inside your worktree only; private scratch `…/scratchpad/sc595-r8-impl-<agentId>/`; never key a wait-loop on a scratch filename; Scott's main-checkout vault dirt is expected; if the report write is blocked return inline; you cannot SendMessage me — `STATUS: NEEDS_CONTEXT` (stray messages start `SC-595:`). Commit after each step; no tags; no push.

## Report + return
`sc595-r8-rebase-report.md` (≤10-line executive summary first), logs `sc595-r8-gate-*.log`, `sc595-r8-stamtext-offset-proof.log`. Final text: STATUS, dse head + superproject head, range-diff summary, gate summary lines, the recorded stamtext hit, absolute artifact paths.
