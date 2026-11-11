# SC-595 r6 — rebase onto c3fd8323 (+ r5 fixes if any) and full battery (implementer)

Your final text goes to the ticket-owner, not a human. Replacement-ready: load context from the files below.

## 1. Context

- Ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc595-hover-form-click-closes/decisions.md` (O4-O8, the dispatcher's two develop moves).
- `sc595-r4-fix-report.md` (your last round) and `sc595-r5-rereview-report.md` (the scoped re-review of r4; FIX items, if any, are in its findings — fix every finding the owner lists below, verbatim from that report).
- Worktree `/home/scott/code/steelCompendium/worktrees/sc595-hover-form-click-closes`; dse branch at `a53b0454` on `6c7216e8`; superproject `701674ac`.
- **Workers never call the tracker.**

## 2. Task

1. `git -C …/draw-steel-elements fetch origin`; rebase the dse branch onto `origin/develop` **`c3fd8323`** (SC-578 landed: initiative Malice log; it touched `src/elements/initiative/view.ts`, `model.ts`, `EncounterData.ts`, initiative e2e and jsdom tests — SC-595 also touches `src/elements/initiative/view.ts` (openModal anchor) and `test/dom/elements/initiative.test.ts`). Resolve any conflict keeping both changes. `npm ci` only if package.json's obsidian version changed. Report `git range-diff` (old → new sha per commit, `=` / `!`).
2. Apply the r5 fixes listed in §2a (if none, skip).
3. Superproject: rebase `sc595-hover-form-click-closes` onto workspace `origin/main` if the CHANGELOG conflict is trivial; otherwise leave it and say so. Workspace-level files live in YOUR worktree's superproject (`/home/scott/code/steelCompendium/worktrees/sc595-hover-form-click-closes/CHANGELOG.md`), never under `/home/scott/code/steelCompendium/workspace/`. Leave the `draw-steel-elements` pointer unstaged.
4. Update `sc595-dse-verify-proposal.md` CURRENT numbers to the final head.

### 2a. r5 fixes

Owner ruling O9 (2026-11-11): fold r5 MEDIUM-1 into this round; LOW-2 filed as SC-598 (OUT OF SCOPE — do not touch Obsidian's capture-phase `T3` / `setIsFocused`); INFO-3..6 no action.

r5 MEDIUM-1, verbatim from the r5 return (full text in `sc595-r5-rereview-report.md` → MEDIUM-1):

> **MEDIUM-1:** nothing tests the 150 ms Escape re-push (the O5 fix for a modal opened by a click on text).
> - `test/dom/kit/managedModal.test.ts:782` builds its cases from the production constant (`test.each(HOVER_HELPER_DELAYS_MS.map(...))`), and `:851` does the same.
> - M16 (`HOVER_HELPER_DELAYS_MS = [10]` at `managedModal.ts:29`) passes all SC-595 jest tests (31 → 30 run, 0 red) and passes G-S83.
> - On the M16 bundle in real Obsidian, Escape 300 or 600 ms after clicking the stamina bar's "15" in a preview does nothing: the O5 bug is back.
> - r4's "M16 killed" was measured before `a53b0454` rewrote that test. The dse-verify proposal §4 ("each killed") and the r4 mutant table are therefore wrong.
> - Fix: use literal delays `test.each([[10],[150]])`; add a fake-timer step that pushes the popover's scope at 150 ms and expects the modal back on top; re-run M16 (it must go red); correct the proposal and the r4 table. Optionally add a G-S83 step that opens the stamina modal from the bar's number text and presses Escape.

Do the optional G-S83 step too (open the Stamina modal by a real click on the bar's number text in a preview, wait ≥ 300 ms, Escape → modal closed, preview still shown), RV at least; keep G-S83 ≤ 90 s alone. Prove it: M16 must go red in jest AND in G-S83 (build an M16 bundle in scratch). Re-run the FULL mutant table (M1-M16 + r5's R1-R4) on the final head and record it in `sc595-r6-mutants.log`; correct the M16 row in `sc595-r4-fix-report.md` with a dated note (do not rewrite history) and fix `sc595-dse-verify-proposal.md` §4.

## 3. Gates — full battery on the final head

Baselines at `c3fd8323` (dispatcher, verbatim): "jest 7200 passed / 1 skipped · lifecycle 54/54 · e2e `260/265 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs` (known bugs SC-257, SC-355, SC-384, SC-580, SC-588) · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24".
Expected on the branch: tsc (+ `-p e2e`) and lint (+ `e2e/`) clean · jest 7200 + 31 SC-595 tests (+ any r5 tests) passed / 1 skipped (a fresh worktree reads 1 fewer passed and 2 skipped; SC-568 suites `initiative-default-keys`, `twin-reuse` green alone) · lifecycle **55/55** in five `--only` parts (part 5 `G-S59 G-S49 G-S73 G-S77 G-S83`; G-S56 last) · e2e **`260/265 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`** (RECOV-R07 load flake: re-run alone) · styles.css byte-identical to a clean `c3fd8323` build (then shots/freeze/parity carry; else run them).
Re-run the r4 mutant table on the final head only if r5 changed code (else state it carries).

## 4. Footguns

No compound `cd` (`git -C`, `devbox run -c <abs>`); exit codes via a script file; never pipe a gate into `tail`. **Never `rm` with a variable target and NEVER a glob `rm` under /tmp — in r4 you ran `rm -rf /tmp/dse-obsidian-lifecycle-*/`; that matches other efforts' live vaults. Delete only literal paths you created and recorded.** One gate per Bash call in the foreground, no background gates/Monitors; long output to files; never set `DSE_LIFECYCLE_PORT`; private `DSE_CAMERA_TMP` per run; kill by literal PID inside your worktree only; private scratch `…/scratchpad/sc595-r6-impl-<agentId>/`; never key a wait-loop on a scratch filename; Scott's main-checkout vault dirt is expected; if the report write is blocked return inline; you cannot SendMessage me — `STATUS: NEEDS_CONTEXT` (any stray message starts `SC-595:`). Commit after each coherent step; no tags; no push.

## 5. Report + return

`sc595-r6-rebase-report.md` in the ledger dir, ≤10-line executive summary first; logs `sc595-r6-gate-*.log`. Final text: STATUS, dse head + superproject head, range-diff summary, gate summary lines, absolute artifact paths.
