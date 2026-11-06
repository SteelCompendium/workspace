# SC-526 r2 — implementation brief (orchestration:implementer)

## 1. Context loading
- Read FIRST: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc526-recoveries-popover-hostleak/decisions.md` (Scott's ruling, baselines) and the r1 report `sc526-r1-report.md` in the same dir (exec summary, the CSS section, "Recipe for the landing sweep"). r1's measurement mount patch is `sc526-r1-measure-mount.patch` there (reference only — develop's sweep code has changed a lot since).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc526-recoveries-popover-hostleak`. Plugin `…/draw-steel-elements`, branch `sc526-recoveries-popover-hostleak` (currently at A30 `1f409bc` on top of A `8266ea0`, base `08c086c` — FAR behind). Local branch `sc526-option-a` = `8266ea0`. Measurement branches `sc526-measure*` never land; leave them.
- Rebase: `git -C <dse path> fetch origin`; confirm `origin/develop` is `d689b719` (if it moved, use the newer one and say so). Reset the working branch to option A only and port it: e.g. `git -C <dse> checkout sc526-recoveries-popover-hostleak && git -C <dse> reset --hard sc526-option-a && git -C <dse> rebase origin/develop`, resolving conflicts in `styles-source.css` and `test/dom/theme/hostRegrounding.test.ts` (keep both sides). The A30 commit `1f409bc` is DROPPED (Scott chose A). Then `npm ci` (package.json has moved).
- Superproject: the worktree's superproject branch has no commits of its own; fast-forward it to `origin/main` (`git -C /home/scott/code/steelCompendium/worktrees/sc526-recoveries-popover-hostleak fetch origin && git -C … merge --ff-only origin/main`), then make sure the submodules other than draw-steel-elements sit at their new pins (`git -C <superproject> submodule update` for the others only — never touch draw-steel-elements' branch with it). Expected `origin/main` `0d0f210e` or newer.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — battery table rows 1–7 (row 4 lists the FIVE lifecycle `--only` parts), the "Button host-leak sweep" bullet (~line 249) and the CURRENT block (~line 1282). Read it from that main-checkout path; DO NOT edit it — the owner writes the dse-verify proposal.
- **Workers never call the tracker** (Linear) — not to read history, not to post.
- Every git command is `git -C <absolute path> …`; never `cd X; git …`, never `cd` inside a compound command.
- The main checkout's dse dirt (`demo-vault/Welcome.md` modified, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, never touch it.

## 2. The task
Scott's ruling, verbatim from the ledger:
> A looks better than A30

(A = the popover buttons' own authored look at natural compact height: − and + ~18px, Catch breath ~26px, on desktop and phone.)

1. **CSS:** land option A (`8266ea0`) ported onto develop — CSS only, SC-203 re-grounding family, no markup change, no exemption/allowlist; its jest tests in `test/dom/theme/hostRegrounding.test.ts` keep passing (re-check the `conditions-modal.test.ts` selector-list pin r1 hit).
2. **Sweep (the ticket's task, verbatim):** "add `staminaRecoveryPopover:true` to the button sweep's prefs and real-click the gallery hero's `.dse-stamina-rec__pips` LAST, after every other mount (any later click outside closes the popover)." On develop, `visual-harness/shoot.mjs` already reserves this: the comment at ~:2779 names SC-526 as an open gap, and ~:2962 says SC-526 adds the popover at the end of `mountClickRevealedForSweep` (after SC-527's `reachStateKindsForSweep`). Put the mount there: button sweep only (input/checkbox sweeps don't need the pref — the popover has no inputs/checkboxes; confirm). It must FAIL by name if no popover opens, if it holds fewer than the 3 expected buttons, or if the sweep did not tag `hero|dse-stamina-rec__pop-btn` and `hero|dse-stamina-rec__pop-cb` (follow the SC-513 / SC-527 / SC-530 "the sweep tagged no `<key>` button" pattern). Rewrite the ~:2779 open-gap comment to describe the mount (cite SC-526) — do not leave a stale "open gap" note.
   Owner rulings, verbatim: "ds-stamina-bar popover sweep mount: DROP — same RecoveriesStrip component and selectors as the hero, measured green under A and A30 in r1; the hero mount (the ticket's ask) covers the CSS." and "StaminaEditModal check: DROP — the modal has no popover (measured)". "No exemption/allowlist for the popover buttons (SC-205 "never widen silently")."
3. **jest:** if shoot.mjs's sweep mounts are unit-tested (e.g. `test/dom/visual-harness/*.test.ts` pins expected-key lists like `SC527_EXPECT`/`SC530_EXPECT`), extend them for the popover keys.
4. **CHANGELOG** bullet under `## Unreleased` in YOUR worktree's superproject: `/home/scott/code/steelCompendium/worktrees/sc526-recoveries-popover-hostleak/CHANGELOG.md` — NEVER under `/home/scott/code/steelCompendium/workspace/`. User-facing wording, e.g. "Recoveries popover: the −, + and Catch breath buttons keep the plugin's own compact look in Obsidian instead of taking Obsidian's taller button style." Commit it on the superproject branch (not the pointer bump — the dispatcher lands).
5. **Anti-vacuity** (report each with rc + the named lines, then revert): (a) revert the CSS fix (keep the mount) → button sweep `VIOLATED` naming `hero|dse-stamina-rec__pop-btn` / `-cb`; (b) remove the pips click (keep CSS) → named FAIL "tagged no …pop-btn…" (or equivalent). One shots run may carry one break; two runs are fine.
6. Commit after every coherent step. Never push. Never tag (standing order: no tags on draw-steel-elements, ever).

## 3. Gates — the full dse-verify battery on your final head, in order
Expected (CURRENT @ `d689b719`):
- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean.
- jest **6460 passed / 1 skipped / 256 of 257 suites** + your new tests (state the delta; r1 added 5) — compare only after a shots run has cached `visual-harness/dist/obsidian-app.css` (fresh worktree reads 6459 / 2).
- lifecycle **51/51** as the FIVE `--only` parts of row 4 (21 + 16 + 9 + 4 + 1; G-S56 last, its own part), each part its own foreground Bash call, report the union. No new scenario expected (if one is needed, ids G-S65 / G-S66).
- e2e **`OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`**.
- shots **592, 0 FAIL**; expected button line `button host-leak OK (163 … 978 …)` (161/966 + the 2 popover kinds × 6) with the **34-record boundary unchanged** — list any boundary record naming a popover kind and explain every count difference; modal 228, input 15/176, checkbox 7/116, prose 106 [212] unchanged. All 592 PNGs byte-identical (sha256) to a run on `origin/develop` — the CSS touches only the popover, which no capture opens. Use a private `DSE_CAMERA_TMP` for shots.
- freeze **`freeze OK (280/280 …)`**, no rebaseline.
- parity **0 GAPs / 0 undeclared / 24 DECLARED**, LAST.

Command shapes (adapter footguns): `devbox run -c /home/scott/code/steelCompendium/worktrees/sc526-recoveries-popover-hostleak/draw-steel-elements -- bash <script file>`; record exit codes from inside the script file, never `bash -c '…; echo rc=$?'` (devbox's sh records 0). One blocking gate per Bash call, FOREGROUND (timeout 600000). No `run_in_background`, no Monitor, no background jobs — the ONLY exception is shots if it would pass 600 s: start it with `nohup … > <unique log> 2>&1 &` inside a script and poll that run's OWN log / rc file (or `tail --pid=<pid>`), never a notification. No private `DSE_LIFECYCLE_PORT` is needed (SC-551).

## 4. Footguns (mandatory)
- Scratch: the session scratchpad `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/` is SHARED by every agent. Make a private folder `…/scratchpad/sc526-r2-impl-<4 random chars>/` and put every script, log, rc file and `DSE_CAMERA_TMP` there, uniquely named. Write scratch files with the Write tool, not heredocs.
- Never `rm` with a shell-variable target (held by a safety prompt nobody answers). No glob `rm`, never a glob under `/tmp`. Never `rm -rf` the shared `.superpowers/` dir. Delete only paths you created, by literal absolute path.
- Never `pkill`/`killall` by pattern. Kill only by literal PID, and only a PID whose command line contains your worktree path or whose `readlink /proc/<pid>/cwd` is inside your worktree.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- If the jest token-coverage test fails reading `docs/superpowers/dse-overhaul/D3-token-map.md`, compare the worktree superproject's copy with the main checkout's (stale pin, adapter footgun 4) before believing it.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` reaches the dispatcher, not me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever send a message anyway, its FIRST WORD must be `SC-526:`.
- If the report-file write is blocked by your harness, return the report inline.

## 5. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc526-recoveries-popover-hostleak/sc526-r2-impl-report.md`, opening with a ≤10-line executive summary.

## 6. Return contract
Final text goes to the ticket-owner, not a human: raw facts, no prose. STATUS, dse head sha + commit list on develop, superproject head sha, every gate's summary line and rc, the button host-leak line + boundary kinds, PNG identity result, anti-vacuity results, `Drive-by fixes:` / `Follow-ups:`, and the absolute path of EVERY evidence artifact (report, logs).
