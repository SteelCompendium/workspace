# SC-509 r1 brief — DIAGNOSIS ONLY (reviewer A)

## 1. Context loading
- Read first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc509-form-save-refresh/decisions.md` (the ledger — current state; no thread needed).
- Background: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc493-form-empty-yaml/sc493-r1-review-report.md` → INFO-6 (the original finding, line ~54) and its "Probe execution" section (how that reviewer drove real Obsidian 1.15.0 and took screenshots).
- Read `/home/scott/code/steelCompendium/worktrees/sc509-form-save-refresh/draw-steel-elements/AGENTS.md` (if present) and `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (how lifecycle `npm run obsidian-lifecycle` drives real Obsidian; you may reuse its harness for probes).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc509-form-save-refresh`, plugin at `.../draw-steel-elements`, branch `sc509-form-save-refresh`, HEAD must be dse develop `054c9c5`. Verify with `git -C <abs path> log --oneline -1` before anything. Do not rebase; it is current.
- **Workers never call the tracker** (Linear) — not to read history, not to post.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, not yours, do not touch it. Never write under `/home/scott/code/steelCompendium/workspace/` except your report into the ledger dir.

## 2. The task
Find the confirmed root cause of SC-509. **Diagnosis only: make no commits on the branch.** Throwaway probe edits are fine if you restore them (`git -C <abs> checkout -- <file>`) and `git -C <abs> status` is clean at the end.

Repro (ticket): open the block edit form (pencil, authoring controls on) on a `ds-montage` with `title: The Heist`. Change it to `title: Other Job`, Save. The note file reads `title: Other Job`, but 3 s later the card still reads "The Heist"; it shows the new content only after leaving the note and coming back. Expected: "the card redraws with the saved content right after Save."

Suspected cause (NOT confirmed — test it, don't assume it): view adoption treats the form's `cx.host.replaceSource` write as the view's own write and keeps the old model. Starting points: `src/framework/view.ts` (persist / pending writes ~l.86, 242-330), `src/framework/host/viewRegistry.ts` (claim tickets, l.11, 87), `src/framework/host/ReadingModeBlockHost.ts`, `src/framework/pipeline.ts` (~l.550-610), `src/authoring/FormModal.ts` (how Save writes).

Answer, with file:line evidence:
1. Reproduce in real Obsidian (both Reading view and Live Preview if both expose the pencil). Does it hit every element the form edits, or only some (montage, a raw-box one like counter, a typed-field one)? Does it hit Live Preview, Reading view, the sidebar copy?
2. The exact mechanism: which code path decides not to re-render / keeps the old model after the form's write, and why. Show it with a runtime probe (a console log or a lifecycle-style probe), not only by reading.
3. Why jest, e2e and lifecycle miss it.
4. Fix options — where each would live, its risk to the adoption contract (in-card clicks must still not flash/re-mount; SC-478 reading position must hold), and **whether it can live outside `src/authoring/FormModal.ts`** (SC-494 is editing that file now; dispatcher constraint: "prefer a fix outside FormModal; if FormModal must change, coordinate via rebase"). Recommend one.
5. The test plan: a jest red test at the unit level, and a real-Obsidian lifecycle scenario **G-S40** that saves from the form and reads the card (the ticket asks: "A fix should add a real-Obsidian check (lifecycle or e2e) that saves from the form and reads the card."). Name the file(s) and the assertion.

Bound: this is a diagnosis round. Do not run the full battery. Stop when you have 1-5 answered with evidence.

## 3. Gates
None required (no commits). If you run lifecycle for a probe, CURRENT is `lifecycle 36/36` at 054c9c5.

## 4. Report path
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc509-form-save-refresh/sc509-r1-diagnose-report.md`. Open it with a ≤10-line executive summary (root cause in one sentence with file:line, recommended fix location, inside/outside FormModal). Screenshots/logs: name them `sc509-r1-*` in the ledger dir.

## 5. Return contract
Your final text goes to the ticket-owner, not a human: raw facts (root cause file:line, recommended fix, scope of affected elements/views, measured observations), no prose, **plus the absolute path of every evidence artifact** (report, screenshots, logs).

## Footguns (all mandatory)
- If the report-file write is blocked by your harness, return the report inline.
- Scratch: the session scratchpad `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/` is SHARED by every agent. Use only a private subfolder `.../scratchpad/sc509-r1-diag-<your agentId>/` with uniquely named scripts and logs. Write scratch files with the Write tool, not heredocs.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents.
- Run every gate/probe as ONE blocking foreground Bash call. No `run_in_background`, no Monitor, no background jobs.
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc509-form-save-refresh/draw-steel-elements -- <cmd>`. Never `cd` inside a compound command. `$?` is eaten by devbox's wrapper: record exit codes from a script file (`devbox run -c <path> -- bash <script>`) and read each gate's summary line.
- Every git command: `git -C <absolute path>`. Never `cd X; git …`.
- No `rm` whose target is a shell variable or a glob (it hangs on an unanswered prompt). Use fresh uniquely named files, overwrite with `>`, or literal absolute paths. Never `rm -rf` any shared `/tmp/*` glob (other efforts' lifecycle vaults live there) or anything under `.superpowers/`.
- Never `pkill`/`killall` by pattern. Kill only by PID, and only a PID whose command line contains `worktrees/sc509-form-save-refresh/` or whose `readlink /proc/<pid>/cwd` is inside that worktree.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher, not me. If you need input, end your turn with `STATUS: NEEDS_CONTEXT` and the question. If you ever message anyway, its FIRST WORD must be `SC-509:`.
