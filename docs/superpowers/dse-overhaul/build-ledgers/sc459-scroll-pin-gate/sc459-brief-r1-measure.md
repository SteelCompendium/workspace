# SC-459 r1 — measure the SC-198 clamp on Obsidian 1.14.4 (measure-only; no commits)

## 1. Context loading
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc459-scroll-pin-gate/decisions.md` — read it first. It holds the spec (quoted from the ticket) and owner notes.
- Prior evidence: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc260-noop-write/sc260-r1-review-report.md` (MEDIUM-1 + INFO-1 on Obsidian 1.14.4's `adapter.process` ordering) and `sc260-rev-gs8nopin-1792432383.log` in the same dir (G-S8 ok with the pin disabled).
- The SC-198 root-cause doc (`.superpowers/sdd/sc198/root-cause.md`) is NOT on this machine. Reconstruct "scenario C" from the header comment of `src/framework/host/previewScrollPin.ts` and commit `cfea821` (`git -C <dse> show cfea821`): a note that is mostly ONE tall element; on 1.13.7 a bare one-character `vault.process` (plugin uninvolved) dropped `.markdown-preview-sizer` inline min-height 4331px -> 246px and clamped `scrollTop` 2596 -> 0; pinned it held at 2596.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc459-scroll-pin-gate`; dse repo at `/home/scott/code/steelCompendium/worktrees/sc459-scroll-pin-gate/draw-steel-elements`, branch `sc459-scroll-pin-gate`, HEAD must be `188755b` (= origin/develop at dispatch). Verify with `git -C <dse> log --oneline -1` and `pwd` before anything. Use `git -C <absolute path>` for EVERY git command — never `cd X; git …`.
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` for the lifecycle gate's command shape (`npm run obsidian-lifecycle -- --only=G-S8`), its Xvfb/port rules, and devbox wrapping.
- **You never call the tracker (Linear)** — not to read history, not to post. Everything you need is in files.
- The main checkout's dse dirt (`demo-vault/Welcome.md` modified, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, ignore it, never touch it. You work only in the worktree above.

## 2. The task
Spec, verbatim from the ticket (the only ruling so far):

> **Fix:** re-measure SC-198 scenario C (from `.superpowers/sdd/sc198/root-cause.md`) on 1.14.4. If it still clamps without the pin, make G-S8 use a note that clamps unpinned and assert that `data-dse-scroll-pin` is applied. If it no longer clamps, propose retiring the pin (`src/framework/host/previewScrollPin.ts` plus its CSS rule).

This round is **measurement and design only**. Answer, with numbers from a real Obsidian (confirm the version the lifecycle harness launches — expected 1.14.4):

- **M1 — bare write, plugin uninvolved.** Scenario-C-shaped note (mostly one tall element — try at least two shapes, e.g. one very long DSE tracker block and one long non-DSE element such as a huge code fence or table). Scroll well down, do a bare one-character `app.vault.process` on the open note. Per animation frame for ~2 s record `scrollTop`, scroller `scrollHeight`/`clientHeight`, sizer inline `min-height`. Does `scrollTop` clamp toward 0 (or to scrollHeight-clientHeight)? Does the sizer min-height still collapse?
- **M2 — DSE write, pin disabled vs enabled.** Same note shape with a DSE control write (the kind G-S8 does). Pin disabled (temporary source mutation, e.g. the `&& Date.now() < 0` guard the SC-260 reviewer used — confirm it in built `main.js`) vs stock. Record the same per-frame series plus whether `data-dse-scroll-pin` is present on `.markdown-preview-view` during the write.
- **M3 — why today's G-S8 passes unpinned.** Read G-S8 in `visual-harness/obsidian-lifecycle.mjs` (~L1164-1180). Explain with measurements: note shape, scroll position vs max, whether the rebuild even happens (SC-340 view adoption may keep the tracker DOM), whether the sizer collapses.
- **M4 — verdict + design.**
  - If the clamp reproduces unpinned on 1.14.4: propose the concrete G-S8 change (note content, write, assertions — including "`data-dse-scroll-pin` present during the write" and scrollTop held). Prototype it in the worktree and prove it DISCRIMINATES: `--only=G-S8` FAILs with the pin disabled and passes stock, **3 runs each**. Save the prototype as a patch file (`git -C <dse> diff > <ledger>/sc459-r1-gs8-prototype.patch`) for the implementer, then revert the worktree to clean (`git -C <dse> status` must show nothing).
  - If it does NOT reproduce on 1.14.4 in any shape: say so with the series, and state what retiring the pin would remove (files, CSS rule, tests, the G-S8 scenario) — do not remove anything.
- Scope: G-S8 only. SC-460 is concurrently editing `visual-harness/obsidian-lifecycle.mjs` elsewhere — your prototype must touch only the G-S8 scenario (and a new fixture note if needed), nothing shared.

**No commits this round.** Every source mutation is temporary and reverted before you return.

## 3. Gates
None required (measure-only). Each `--only=G-S8` run must exit 0 (ok) or 1 (FAIL with message); exit 2 = environment — fix the environment, it is not data. For reference, today's full lifecycle is `OBSIDIAN-LIFECYCLE done: 27/27 ok, 0 failed`.

## 4. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc459-scroll-pin-gate/sc459-r1-measure-report.md` — opens with a ≤10-line executive summary (verdict CLAMPS / DOES-NOT-CLAMP, the deciding numbers, discrimination result 3/3 + 3/3). Logs and probe scripts go in the same ledger dir, every filename prefixed `sc459-r1-`.

## 5. Footguns (all apply)
- If the report-file write is blocked by your harness, return the report inline.
- Scratch: your private folder is `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc459-r1-<yourAgentId>/` — the scratchpad is shared by every agent; never write a generic script name (`gate.sh`) anywhere shared.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents. Run the lifecycle in the FOREGROUND with output redirected to a file (`--only=G-S8` takes well under 10 minutes); never background it and wait for a notification that will not come.
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc459-scroll-pin-gate/draw-steel-elements -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc459-scroll-pin-gate/draw-steel-elements && …'`. Devbox's sh wrapper eats `$?`/`$PIPESTATUS` — capture exit codes inside a wrapper script file that writes rc to a file. Never pipe a gate into `tail`.
- Set your own `DSE_LIFECYCLE_PORT` (pick something in 9300–9399) — other efforts run lifecycle concurrently on 9262.
- Never `pkill`/`killall` by pattern. Kill only by PID whose command line contains `worktrees/sc459-scroll-pin-gate/`.
- Never `rm -rf` a `/tmp` glob (e.g. `/tmp/dse-obsidian-lifecycle-*`) — other efforts' vaults match it. Delete only paths you created and recorded. Never delete anything under `.superpowers/` except files you created with the `sc459-r1-` prefix.
- If `npm ci` is needed (fresh worktree has no node_modules), run it in the dse worktree dir.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever do send a message anyway, its FIRST WORD must be `SC-459:`.

## 6. Return contract
Your final text goes to the ticket-owner, not a human: raw facts — verdict, measured numbers, discrimination counts, worktree clean (`git status` output), and the absolute path of every artifact you produced (report, patch, logs, probe scripts, any screenshots). No prose.
