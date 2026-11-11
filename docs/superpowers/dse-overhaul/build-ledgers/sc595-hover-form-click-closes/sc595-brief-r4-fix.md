# SC-595 r4 — fix round (implementer, resumed or replacement)

Your final text goes to the ticket-owner, not a human. Replacement-ready: if you are a fresh worker, load context from the files below.

## 1. Context

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc595-hover-form-click-closes/decisions.md` — read O4-O8.
- Your r2 brief `sc595-brief-r2-impl.md` (all its footguns, gates and expected numbers still apply) and r2 report `sc595-r2-impl-report.md`.
- **The findings to fix, verbatim:** `sc595-r3-review-report.md` (read in full: HIGH-1, HIGH-2, MEDIUM-3, MEDIUM-4, LOW-5, LOW-6), the reviewer's prototype `sc595-r3-proto-managedModal.diff.txt`, real-Obsidian probe `sc595-r3-probe-scenario.js.txt`, jsdom probes `sc595-r3-jsdom-probe.test.ts.txt`, mutants `sc595-r3-mutants.log`. All in the ledger dir.
- Worktree `/home/scott/code/steelCompendium/worktrees/sc595-hover-form-click-closes`; dse branch at `0f5c9c98` on `eaa8742a`; superproject `597f6203`. `git -C …/draw-steel-elements fetch origin`; if `origin/develop` moved past `eaa8742a`, rebase first and report.
- **Workers never call the tracker.**

## 2. Task — owner ruling O8 (verbatim)

> fold ALL into r4 fix round (resume I1): HIGH-1 (`composedPath()` instead of `contains()`), HIGH-2 (remove the guard one task after close), MEDIUM-3 (CHANGELOG + dse-verify proposal accurate after the fix), MEDIUM-4 (tests: a click on a control that redraws / closes a modal, in jest and one G-S83 step each; anchor tests that kill r3 mutants M8 M9 M10), LOW-5 (adopt the structural re-push ordering from the r3 prototype; replace the 200 ms margin), LOW-6 (child modal opened within the parent's re-push window must stay on top; push on the modal's own window). INFO items: no action (popout not probed — accept, note in report).

Details:
- HIGH-2: the closing click must not hide the preview and must not close a parent modal (free-heal Confirm/Cancel keeps the parent Stamina modal and its staged heal). The guard must still be gone soon after close (adjust the kit test to `await` the deferral rather than assert synchronous removal), and a later click outside must dismiss the preview normally.
- G-S83: add the real-mouse steps the reviewer proved red on head — "Add condition" in the tracker's Conditions modal from a preview (RV and LP if cheap, RV at least), form Cancel keeps the preview, free-heal Confirm keeps the parent Stamina modal (or the cheapest equivalent closing-click step). Keep G-S83 lean (it was ~50 s alone; stay ≤ 90 s). Still part 5, before G-S56. Add NO phases to G-S64.
- Re-run all mutants (yours M1-M4, r3's M5-M10) plus new ones for HIGH-1 (revert to `contains`) and HIGH-2 (synchronous removal): every one must be killed (M10's only red must not be the SC-568 timeout). Record in `sc595-r4-mutants.log`.
- Red on base: re-run G-S83 against the `eaa8742a` bundle and record in `sc595-r4-red-on-base-G-S83.log`; also run the NEW steps against `0f5c9c98` (head before this round) to show they catch HIGH-1/HIGH-2.
- CHANGELOG (worktree superproject ONLY: `/home/scott/code/steelCompendium/worktrees/sc595-hover-form-click-closes/CHANGELOG.md`, never under `/home/scott/code/steelCompendium/workspace/`) and `sc595-dse-verify-proposal.md`: make every claim true of the final code; commit the CHANGELOG change on the superproject branch.
- Out of scope: SC-597, SC-594, SC-596, any write path.

## 3. Gates — full battery on the final head

tsc (+ `-p e2e`) and lint (+ `e2e/`) clean · jest 7193 + new tests non-skipped passed / 2 skipped (SC-568 suites green alone) · lifecycle 55/55 in the five parts (part 5 `G-S59 G-S49 G-S73 G-S77 G-S83`) · e2e `258/264 ok, 0 failed, 6 known-bug, coverage: 164/164 pairs` (RECOV-R07 load flake: re-run alone) · styles.css sha256 must still be `5e5ff488…` (then shots/freeze/parity carry; else run them: shots 592 / host-leak 163/978 / modal host-leak 39/234 / clip 147, freeze 280/280, parity 0/0/24).

## 4. Footguns

All of r2 brief §4 apply. Restating the critical ones: no compound `cd` (`git -C`, `devbox run -c <abs>`); exit codes via a script file; never `rm` a variable target or a /tmp glob; one gate per Bash call in the foreground, no background gates/Monitors; long output to files; never set `DSE_LIFECYCLE_PORT`; private `DSE_CAMERA_TMP` per run; kill by literal PID inside your worktree only; private scratch subfolder `…/scratchpad/sc595-r4-impl-<agentId>/`; never key a wait-loop on a scratch filename; Scott's main-checkout vault dirt is expected; if the report write is blocked return inline; you cannot SendMessage me — end with `STATUS: NEEDS_CONTEXT` if stuck (any stray message starts `SC-595:`). Commit after each coherent step; no tags; no push.

## 5. Report + return

`sc595-r4-fix-report.md` in the ledger dir, opening with a ≤10-line executive summary; a finding-by-finding table (finding → fix → commit sha → test that proves it). Logs `sc595-r4-gate-*.log`. Final text: raw facts — STATUS, dse head + superproject head, gate summary lines, mutant table, red-on-base results, absolute paths of every artifact.
