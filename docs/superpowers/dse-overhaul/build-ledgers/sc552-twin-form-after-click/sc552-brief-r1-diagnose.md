# SC-552 r1 brief — reproduce, diagnose, design (no commits)

You are the r1 diagnosis/design worker for Linear ticket SC-552. Your final text goes to the ticket-owner, not a human.

## 1. Context loading (do this first)
- Read the effort ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc552-twin-form-after-click/decisions.md`. It quotes the ticket verbatim, the constraints and the baselines. It is current state; trust it over anything else.
- Prior art (read what you need; the summaries first):
  - SC-544 (quick clicks on twins; `ViewRegistry.flushPendingWrites`; G-S61): ledger `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc544-lp-callout-quick-clicks-ledger.md`; r1 diagnosis `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc544-lp-callout-quick-clicks/sc544-r1-diag-report.md` (mechanism, option B = position mapping); r3 review `.../sc544-r3-review-report.md` MEDIUM-1 (line 38 on: THIS ticket) and probes `.../sc544-r3-probes.log` (`formA-lp`, `formA-rv`, `formA-pl-lp`, `formA-slow-lp`); r5 re-review `.../sc544-r5-rereview-report.md` (the script-only "form open on middle + middle's own click waiting" case).
  - SC-519 (`ElementView.openAfterPendingWrite`; G-S45): ledger `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc519-form-stale-open-ledger.md`.
  - SC-537 (G-S57) and SC-481 (twins) ledgers are in the same `build-ledgers/` dir if you need them.
  - Reuse SC-544's probe harness/scripts where you can — they are in the sc544 ledger dir.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc552-twin-form-after-click`, plugin at `.../draw-steel-elements`, branch `sc552-twin-form-after-click`, HEAD must be `711f740d` (= origin/develop). Run `git -C /home/scott/code/steelCompendium/worktrees/sc552-twin-form-after-click/draw-steel-elements fetch origin` and confirm `origin/develop` is still `711f740d`; if it moved, report the new sha and keep working on 711f740d (you make no commits).
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` for command shapes (lifecycle row 4, footguns), and `draw-steel-elements/AGENTS.md` in your worktree.
- **You never call the tracker (Linear)** — not to read history, not to post.
- The main checkout's dse dirt (`demo-vault/Welcome.md` modified, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault; it is expected. Never work in `/home/scott/code/steelCompendium/workspace/draw-steel-elements`.

## 2. The task
This round makes **no commits**. Prototypes go in scratch or as uncommitted edits you revert before you finish (`git -C <worktree>/draw-steel-elements status --short` must be clean at the end, report it).

### 2a. Reproduce in real Obsidian 1.15.0 on 711f740d
The ticket's steps (verbatim): "three identical blocks holding the same `ds-counter` (callouts or plain fences, Live Preview or Reading view). Click + on the upper one, then within about 400 ms open the MIDDLE block's edit form (pencil), change the name, and Save." Expected bad result: "disk [6,5,5], names [Twin, Twin, **Edited**]".
Measure, with repeats (at least 3 each):
- LP callouts, LP plain fences, Reading-view callouts, Reading-view plain fences.
- The window: pencil-open gaps after the + (e.g. 50 / 150 / 300 / 450 / 700 ms). Where does it stop misrouting?
- Control: form opened after the click's save has landed (should be clean).
- Two panes on one note (LP+LP, RV+RV, LP+RV) — at least one combo.
- 2 twins and 4 twins.
- SC-523 interaction in LP: does the LP form close by itself here? Record it; SC-523 is not ours.
LP probe rule (from SC-544): scroll each block into view; never count `.cm-embed-block`. The LP pencil cannot be clicked by mouse (SC-523) — open it by keyboard (Enter on the pencil) as the SC-544 r3 probes did.

### 2b. Mechanism, with file:line on 711f740d
Trace pencil → `openAfterPendingWrite` (`src/framework/view.ts` ~327; pipeline.ts ~559-563; hero view.ts ~260) → FormModal Save → `ReadingModeBlockHost.replaceSource` (fromView:false) → section resolution. **Key question the owner needs answered by measurement:** after the upper's write settles and Obsidian's rebuild runs, which BLOCK does the clicked (middle) view's element sit on? If it sits on the lower block, then the ticket's fix idea ("flush the note's other waiting clicks, wait for the save to settle, then open") would still open the form on the lower block. Measure it, do not reason it.

### 2c. Options — compare, prototype the leading one(s), recommend one
At least:
- **A (ticket's idea):** widen `openAfterPendingWrite` from "this card" to "this note": flush every other pending view of the note (`ViewRegistry.flushPendingWrites`), await the save AND the rebuild, then open the form — on what? Say exactly which view/element the form binds to after the settle, and whether that is the clicked block.
- **B (position-based target):** capture the clicked block's position when the pencil is pressed, map it through each edit until Save (LP: `update.changes.mapPos`; Reading view: line mapping), and save to that block. This is SC-549's fix idea; say whether it would also cover the residual ("a write that lands while the form is open (an outside edit, Sync) can still move it") and the script-only r5 case.
- Anything better you find. No body search / refusal to choose between equal twins (SC-480 is parked on Scott).
For each: lines of code, files touched, which surfaces it fixes (measured with an in-page or source-built prototype bundle where feasible), risk, and overlap with: SC-545 (LP callout click path after plugin off/on), SC-472 (`previewScrollPin.ts`, `livePreviewScrollHold.ts`, `redrawBackstop.ts`), SC-551 (lifecycle/e2e/camera CDP port handling), the SC-540 click shield in `pipeline.ts` (do not touch).
**State plainly whether your recommendation also fixes SC-549** ("a + on a card, then typing or an outside edit to an identical block within 400 ms, can write the + into the twin"), and if a narrow fix and a wider fix differ in cost, give both so the owner can rule on scope.

### 2d. Test design (for the implementer)
- Jest: what to test red-then-green.
- Lifecycle G-S64: phases (surfaces, panes), placed in part 3 (`G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52`, 254 s today) or part 4 (`G-S57 G-S62 G-S61 G-S56`, 295 s) before G-S56. Estimated runtime; part must stay under ~540 s. dse-verify rule: never a timed delay inside a lifecycle step — hold Obsidian at a hook (G-S45 holds the 400 ms debounce timer; G-S61 is the closest model). Say which mutants G-S64 must catch.

## 3. Gates
No full battery this round (no commits). Any prototype check you run: `tsc`, focused jest, and lifecycle `--only` runs as in dse-verify row 4, each with `DSE_LIFECYCLE_PORT` set to your own port — use **9652** (and 9653 if you need a second). Baselines at 711f740d are in the ledger.

## 4. Footguns (mandatory)
- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc552-twin-form-after-click/draw-steel-elements -- <cmd>`; never `cd` inside a compound command; `git -C <abs path>` for every git command.
- Scripts and logs go in a private scratch subfolder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc552-r1-<your agentId>/`, uniquely named files, created with the Write tool. Evidence you keep goes in the ledger dir with the `sc552-r1-` prefix.
- Never `rm` with a shell-variable target; never a glob `rm` under /tmp. Delete only dirs your own run created, by literal path, and list in your report any lifecycle `/tmp/dse-obsidian-lifecycle-*` dirs you created and left.
- Never `pkill`/`killall` by pattern. Kill only by PID whose cwd (`readlink /proc/<pid>/cwd`) is inside your worktree.
- One gate per Bash call, foreground, output redirected to a file; no background jobs, no Monitor. Never key a wait on a scratch filename or its contents — the scratch dir is shared and pre-populated; read the process's own output or a per-run unique path.
- Redirect long output to files rather than streaming it (the 600 s stream watchdog kills silent agents).
- Never touch `.superpowers/` outside `sc552-*` names; never `rm -rf .superpowers`.
- Do not edit `.claude/skills/dse-verify/SKILL.md`.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question in your report; I will resume you. If you ever send a message anyway, its first word must be `SC-552:`.

## 5. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc552-twin-form-after-click/sc552-r1-diag-report.md`. It must open with a ≤10-line executive summary: reproduced yes/no per surface; the window; where the clicked view sits after the settle; recommended option and whether it covers the residual, the r5 case and SC-549; estimated size.

## 6. Return contract
Final text: raw facts, no prose — verdict, shas, measured numbers, recommendation, SC-549 coverage, worktree `git status --short` result, and the absolute path of every evidence artifact (report, logs, screenshots, probe scripts).
