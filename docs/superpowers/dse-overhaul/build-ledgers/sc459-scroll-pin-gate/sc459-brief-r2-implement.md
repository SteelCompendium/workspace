# SC-459 r2 — land the discriminating G-S8 (implementer)

## 1. Context loading
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc459-scroll-pin-gate/decisions.md` — read it in full first ("Owner rulings (2026-10-20)" is your task definition).
- Prior round: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc459-scroll-pin-gate/sc459-r1-measure-report.md` (read the executive summary + M2b, M3, M4), the prototype `sc459-r1-gs8-prototype.patch`, and r1's discrimination scripts `sc459-r1-build-bundles.sh` / `sc459-r1-run.sh` in the same dir (reuse them for the discrimination proof; copy into your private scratch folder before editing).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc459-scroll-pin-gate`; dse repo `/home/scott/code/steelCompendium/worktrees/sc459-scroll-pin-gate/draw-steel-elements`, branch `sc459-scroll-pin-gate`. First: `git -C <dse> fetch origin` and confirm `origin/develop` is still `188755b`; if it moved, `git -C <dse> rebase origin/develop` (then `npm ci` if package.json's obsidian version changed) and report the new base. Verify `pwd` and `git -C <dse> status` before any write. Use `git -C <absolute path>` for EVERY git command — never `cd X; git …`.
- `node_modules/` is already installed in the worktree (r1 ran `npm ci`).
- **You never call the tracker (Linear)** — not to read, not to post.
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected; never touch the main checkout at all.

## 2. The task
Spec (ticket, verbatim): "If it still clamps without the pin, make G-S8 use a note that clamps unpinned and assert that `data-dse-scroll-pin` is applied."

Owner rulings, verbatim from the ledger:
> - **Path:** the spec's "still clamps" branch applies → land the discriminating G-S8 (r1 prototype). The pin is NOT proposed for retirement: it remains the backstop for every write that adoption misses (claim miss, collision, `viewAdoption:false`), which is the spec's clamp path. Mentioned to Scott as information, not an ask.
> - **F2** (previewScrollPin.ts header describes the 1.13.7 mechanism) → FOLD into r2: comment-only update to the header stating the 1.14.4 measurement (collapse comes from a DSE block drawn fresh; adoption keeps the writer's own write off that path; pin is the backstop for adoption misses). No code change.

Steps:
1. `git -C <dse> apply <ledger>/sc459-r1-gs8-prototype.patch`. Read the result critically — you own it now. It must touch ONLY the G-S8 scenario object in `visual-harness/obsidian-lifecycle.mjs` (SC-460 is concurrently editing that file elsewhere; keep the conflict surface to those lines). Confirm `t.reg`, `t.tag`, `t.sameRoot` are existing harness helpers (do not add shared helpers). Confirm the adoption kill switch is restored in `finally` even on a FAIL.
2. F2: update the header comment of `src/framework/host/previewScrollPin.ts` to add the 1.14.4 measurement (numbers from r1: M1 one-tracker 2416->0 / 4831->0 with sizer inline min-height 5276px->93px; non-DSE tall elements never clamp; adoption-off G-S8 note 2779->2001 unpinned, held pinned). Keep the 1.13.7 history; mark it as such. Comment only — no code change. Also add a line to the dse-verify-documented G-S8 description if `visual-harness` has a README/scenario list that describes G-S8 (search; do not edit the workspace `.claude/skills/dse-verify/SKILL.md` — the owner handles workspace docs).
3. Commit in the dse worktree: one commit, message `test(lifecycle): SC-459 — G-S8 now fails when the SC-198 scroll pin is off` with a short body. **No co-author trailers, no Claude/AI attribution of any kind.**
4. **Discrimination proof on the committed head:** build nopin-js and nopin-css bundles (r1's scripts) and run `--only=G-S8` once each → both must FAIL with the phase-2 messages; stock `--only=G-S8` → ok. Revert any temporary mutation; `git -C <dse> status --porcelain` must be empty afterwards.
5. Built-output check: sha256 of built `main.js` and `styles.css` at your head vs at `188755b` (build both). State whether they are byte-identical.

## 3. Gates — `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (read it; command shapes and devbox wrapping are there)
Expected at dse develop `188755b` (CURRENT block):
- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean
- jest **5257 passed / 1 skipped / 229 of 230 suites** (on a worktree where shots has not cached `visual-harness/dist/obsidian-app.css`: one fewer passed and 2 skipped — say which you saw)
- lifecycle **`OBSIDIAN-LIFECYCLE done: 27/27 ok, 0 failed`**, exit 0, with the new G-S8 ok line (both phases)
- e2e **`OBSIDIAN-E2E done: 83/87 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs`**, exit 0
- shots / freeze / parity: required ONLY if step 5 shows `main.js` or `styles.css` differ from `188755b`. If byte-identical, skip them and report the shas as the justification. If they run: shots 572, 0 FAIL; freeze `freeze OK (276/276 …)`; parity 0 GAPs / 0 undeclared / 24 DECLARED.

## 4. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc459-scroll-pin-gate/sc459-r2-implement-report.md`, opening with a ≤10-line executive summary. All logs/scripts in the ledger dir with prefix `sc459-r2-`.

## 5. Footguns (all apply)
- If the report-file write is blocked by your harness, return the report inline.
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc459-r2-<yourAgentId>/`. The scratchpad is shared by every agent — never use a generic script name anywhere shared.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents. Run every gate in the FOREGROUND with output redirected to a per-run log (lifecycle ~4.5 min, e2e ~36 s). Never background a gate and wait for a notification — it will not come.
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc459-scroll-pin-gate/draw-steel-elements -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc459-scroll-pin-gate/draw-steel-elements && …'`. Its sh wrapper eats `$?`/`$PIPESTATUS`: capture rc inside a wrapper script file that writes rc to a file. Never pipe a gate into `tail`.
- Set your own `DSE_LIFECYCLE_PORT` in 9300–9399 for every lifecycle run.
- Never `pkill`/`killall` by pattern. Kill only by PID whose command line contains `worktrees/sc459-scroll-pin-gate/`.
- Never `rm -rf` a `/tmp` glob (e.g. `/tmp/dse-obsidian-lifecycle-*`) — other efforts' vaults match it. Delete only exact paths you created and recorded. Never delete anything under `.superpowers/` except your own `sc459-r2-` files.
- Commit after each coherent step so nothing sits uncommitted through a gate.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever do send a message anyway, its FIRST WORD must be `SC-459:`.

## 6. Return contract
Your final text goes to the ticket-owner, not a human: raw facts — STATUS, dse head sha + base sha, every gate's measured line + exit code, discrimination results (the exact FAIL lines), built-output shas, `git status` cleanliness, `Drive-by fixes:` and `Follow-ups:` lists, and the absolute path of every artifact (report, logs, scripts, screenshots). No prose.
