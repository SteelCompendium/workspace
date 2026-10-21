# SC-459 r3 — independent review of the discriminating G-S8 (fresh reviewer)

## 1. Context loading
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc459-scroll-pin-gate/decisions.md` — read it in full first.
- Prior rounds (read executive summaries; dive in only where needed): `sc459-r1-measure-report.md` (measurement; the prototype's author), `sc459-r2-implement-report.md` (implementation + gates), both in the ledger dir.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc459-scroll-pin-gate`; dse repo `/home/scott/code/steelCompendium/worktrees/sc459-scroll-pin-gate/draw-steel-elements`, branch `sc459-scroll-pin-gate`, head `be5607c` on base `188755b`. `git -C <dse> fetch origin` and report whether `origin/develop` moved. Use `git -C <absolute path>` for EVERY git command.
- **You never call the tracker (Linear).**
- The main checkout's dse dirt is Scott's live vault — expected; never touch the main checkout.

## 2. The task
Review `git -C <dse> diff 188755b..be5607c`. Spec (ticket, verbatim): "If it still clamps without the pin, make G-S8 use a note that clamps unpinned and assert that `data-dse-scroll-pin` is applied." Owner rulings are in the ledger — quote them, don't reinterpret.

**Execute and probe, do not just read.** At minimum:
- Re-run the discrimination yourself on `be5607c`: pin disabled in JS (e.g. `&& Date.now() < 0` on the pin call in `ReadingModeBlockHost.ts`, confirmed in built `main.js`) and CSS rule deleted (`styles-source.css` SC-198 rule) must each FAIL `--only=G-S8`; stock must pass. At least 2 runs stock to look for flake.
- Vacuity probes: can phase 2 pass without a rebuild, without a collapse, or with the pin attribute set but the CSS rule broken? Is the MutationObserver catching the collapse reliably, or could a timing shift make `pinAtCollapse` null and the scenario still pass (or fail spuriously)?
- Is the adoption kill switch always restored (FAIL mid-phase, thrown error) so later scenarios are not run with adoption off? Run the full lifecycle once (expect `27/27 ok, 0 failed`) and check scenario ordering consequences.
- Scope: only the G-S8 scenario object in `visual-harness/obsidian-lifecycle.mjs` plus the comment in `src/framework/host/previewScrollPin.ts` (SC-460 is concurrently editing the lifecycle file elsewhere). Flag anything outside that.
- Comment accuracy of the new `previewScrollPin.ts` header against r1's numbers.
- Built-output claim: verify `main.js`/`styles.css` byte-identity vs `188755b` as r2 reported.

Findings by severity (CRITICAL/HIGH/MEDIUM/LOW/INFO) with file:line, a failure scenario, and a prescribed fix. Do NOT fix anything; revert all probe mutations (`git -C <dse> status --porcelain` empty when you return). Out of scope (already filed): SC-470 (second pane / external edits clamp).

## 3. Gates — `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
Expected: lifecycle `OBSIDIAN-LIFECYCLE done: 27/27 ok, 0 failed` exit 0; e2e `OBSIDIAN-E2E done: 83/87 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs` exit 0; jest 5257 passed / 1 skipped / 229 of 230 suites; tsc/lint clean.

## 4. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc459-scroll-pin-gate/sc459-r3-review-report.md`, opening with a ≤10-line executive summary (verdict APPROVE / APPROVE_WITH_NITS / REQUEST_CHANGES). Logs/scripts prefixed `sc459-r3-` in the ledger dir.

## 5. Footguns (all apply)
- If the report-file write is blocked by your harness, return the report inline.
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc459-r3-<yourAgentId>/`. Shared scratchpad — no generic script names.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents. Run gates in the FOREGROUND, output redirected; never background a gate and wait for a notification.
- Devbox: `devbox run -c <dse> -- bash -c 'cd <dse> && …'`; capture rc in a wrapper script file; never pipe a gate into `tail`.
- Own `DSE_LIFECYCLE_PORT` in 9300–9399.
- Never `pkill`/`killall` by pattern; kill only by PID whose command line contains `worktrees/sc459-scroll-pin-gate/`.
- Never `rm -rf` a `/tmp` glob (e.g. `/tmp/dse-obsidian-lifecycle-*`); delete only exact paths you created. Never delete anything under `.superpowers/` except your own `sc459-r3-` files.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input, end with STATUS: NEEDS_CONTEXT and the question. If you ever send a message anyway, its FIRST WORD must be `SC-459:`.

## 6. Return contract
Final text to the ticket-owner: raw facts — verdict, findings list (severity, file:line, one line each), measured gate lines + exit codes, discrimination results, tree clean, absolute paths of every artifact. No prose.
