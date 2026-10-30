# SC-518 r2 brief — independent adversarial review (reviewer C1, fresh identity)

## 1. Context loading
- Read first: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc518-form-save-focus/decisions.md`, the r1 brief `sc518-brief-r1-impl.md` (the spec the implementer worked to) and the implementer's report `sc518-r1-impl-report.md`, both in the same dir.
- Background: SC-509 LOW-1 in `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc509-form-save-refresh/sc509-r3-review-report.md` (its §0 real-Obsidian probe method is a good model); focus-restore precedent in `.../build-ledgers/sc505-collapse-pin-focus/` and `.../build-ledgers/sc465-heal-focus/`.
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (battery, command shapes, CURRENT block).
- Review tree: `/home/scott/code/steelCompendium/worktrees/sc518-form-save-focus` (plugin `.../draw-steel-elements`, branch `sc518-form-save-focus`). **Do not edit or commit in it.** Probe in your own scratch worktrees (`git -C <plugin abs path> worktree add <your scratch subfolder>/base <base sha>` and `/head HEAD`), and remove them with `git worktree remove` when done. Record `git status --porcelain` of the review tree before and after.
- **Workers never call the tracker** (Linear).
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected.

## 2. The task
Review the branch's diff against its base adversarially: plugin base `ed368f6` (dse origin/develop; plugin source identical to `c558759`, SC-513 was harness-only), commits red `958932e`, fix `88ced3f`, G-S50 `6386a8f` (HEAD); superproject CHANGELOG `76d68d5`. The implementer measured base behaviour on `c558759`; use either `c558759` or `ed368f6` as your base for probes and say which. **Execute and probe, do not just read.** At minimum:
1. Red/green re-run: the new jest tests fail on base source and pass on HEAD; G-S50 fails against a base bundle (`DSE_LIFECYCLE_BUNDLE`) and passes on HEAD.
2. Real Obsidian probes (real keyboard and real mouse, Obsidian 1.15.0 via the lifecycle harness or a scratch scenario): Reading view, sidebar panel, Live Preview; montage, counter, stamina-bar, hero "Edit definition"; where focus lands after Save, after Cancel, after Escape, after Save with no change, after a Save that fails validation; whether the focus ring shows for keyboard and stays off for mouse; twin blocks of the same kind in one note; a second redraw afterwards (outside edit, editing another block, switching notes, reopening the note) must not steal focus; the hint must not leak if the note closes before the redraw; scroll position after the focus move (does focusing scroll the page unexpectedly?).
   Also, owner-folded follow-ups from r1 (each must be probed in real Obsidian): (FU1) the MOUSE path in the sidebar panel and in Live Preview; (FU2) a form opened while an in-card click's write is still pending (the SC-519 path: click Increase, open the pencil within 400 ms), then Saved — where does focus land, and is the click kept?; (FU3) the hero "Edit definition" path end to end.
3. Integrity: the note's bytes outside the edited value are unchanged (this is a focus-only change).
4. Mutation probes: break the mechanism in 3–6 plausible ways and confirm the tests catch each.
5. Code quality: one mechanism, small diff, no per-element code, comments name SC-518, no leaked timers/listeners, nothing that runs on every mount for unrelated blocks beyond a cheap check.
6. Re-run the full battery on HEAD and compare with the implementer's numbers. Expected at dse develop ed368f6: jest 6112 passed / 1 skipped / 247 of 248 suites plus the new tests · lifecycle 40/40 with G-S50 · e2e 124/124, 0 known-bug, coverage 87/87 · shots 592, 0 FAIL, button host-leak 145/870 (28-record boundary), modal 228, input 15 kinds/176, checkbox 7 kinds/116, prose 106 [212] · freeze 280/280 · parity 0/0/24.

## 3. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc518-form-save-focus/sc518-r2-review-report.md`, opening with a ≤10-line executive summary (verdict LAND-READY / NOT LAND-READY, counts by severity). Findings by severity (HIGH/MEDIUM/LOW/INFO) with file:line, the failure scenario, the measured evidence, and a prescribed fix. Evidence files `sc518-r2-*` in the same dir.

## 4. Return contract
Your final text goes to the ticket-owner, not a human: raw facts — verdict, reviewed sha + base sha, finding list (one line each, severity + file:line), each gate's measured summary line, `Follow-ups:` — no prose, **plus the absolute path of every evidence artifact**.

## Footguns (all mandatory)
- If the report-file write is blocked by your harness, return the report inline.
- Scratch: the session scratchpad `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/` is SHARED by every agent. Use only a private subfolder `.../scratchpad/sc518-r2-review-<your agentId>/` with uniquely named scripts and logs. Write scratch files with the Write tool, not heredocs.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents.
- Run every gate as ONE blocking foreground Bash call (timeout up to 600000 ms); lifecycle, e2e and shots are separate calls. No `run_in_background`, no Monitor, no background jobs.
- Devbox: `devbox run -c <abs plugin path> -- <cmd>`. Never `cd` inside a compound command. `$?` is eaten by devbox's wrapper: record exit codes from a script file (`devbox run -c <path> -- bash <script>`) and read each gate's summary line.
- Every git command: `git -C <absolute path>`. Never `cd X; git …`.
- No `rm` whose target is a shell variable or a glob. Use fresh uniquely named files, overwrite with `>`, or literal absolute paths. Never `rm -rf` any shared `/tmp/*` glob (other efforts' lifecycle vaults live there) or anything under `.superpowers/` except your own `sc518-*` files.
- Never `pkill`/`killall` by pattern. Kill only by PID, and only a PID whose command line contains your own worktree path or whose `readlink /proc/<pid>/cwd` is inside it.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher, not me. If you need input, end your turn with `STATUS: NEEDS_CONTEXT` and the question. If you ever message anyway, its FIRST WORD must be `SC-518:`.
