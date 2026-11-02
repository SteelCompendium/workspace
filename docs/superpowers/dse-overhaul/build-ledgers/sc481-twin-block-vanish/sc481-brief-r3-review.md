# SC-481 r3 — independent adversarial review of the r2 fix (identical twin blocks)

You are the independent reviewer for ticket SC-481. You did not write this code. Your final text goes to the ticket-owner, not a human.
**Workers never call the tracker** (Linear) — not to read history, not to post.

## 1. Context loading
- Ledger (rulings + round history): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc481-twin-block-vanish/decisions.md`
- Spec: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc481-twin-block-vanish/sc481-r1-diag-report.md` §1–§3 (Option 1)
- Implementer's report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc481-twin-block-vanish/sc481-r2-impl-report.md` and its `sc481-r2-gate-*.log` files
- Real-Obsidian probe kit from the diagnosis round: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc481-r1-diag-a69a8a02591085ed8/`
- SC-518 twin-focus ledger: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc518-form-save-focus/decisions.md`
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
- **Worktree:** `/home/scott/code/steelCompendium/worktrees/sc481-twin-block-vanish`, plugin branch `sc481-twin-block-vanish`, HEAD `d250e97` on `4deb8cf` (dse develop moved 9be397e -> 4f73043 SC-527 -> 4deb8cf SC-531, both harness-only); superproject `f390b80f` (CHANGELOG only; pointer intentionally not bumped — the unstaged submodule modification is expected). Verify with `git -C`. `git -C <plugin> fetch origin`; report if `origin/develop` moved. Main checkout dse dirt (`demo-vault/Welcome.md` etc.) is Scott's live vault — ignore.

## 2. The task
Owner rulings (verbatim from the ledger, 2026-10-29):
- "Adopt Option 1. Option 2 (private renderer API) only as a fallback if Option 1's remount fails a gate; Option 3 rejected (leaves wrong-block writes)."
- "Scope: the vanish AND the wrong value AND the wrong-block write, Reading view + Live Preview — one root cause. Sidebar out of scope (not affected)."
- "No SC-480 park: independent, proceed." (How several equal bodies are chosen among is SC-480 — out of scope; flag only if the diff changes it.)

**Execute and probe, do not just read.** In real Obsidian (lifecycle harness):
- Re-run red/green: G-S53 fails on a 9be397e or 4deb8cf bundle and passes on HEAD; jest red on base source.
- Try to break it: 2 and 3 twins, upper/middle/lower clicks in every order, montage + one more block type, rapid double clicks (debounced write pending during the remount), form Save on each twin, adoption off, Live Preview, twins inside a callout/quote, twins in an embedded note, two panes on the same note, a twin made identical BY a write (converge: edit the lower to equal the upper), hand edit then click, delete one twin then click the other, undo (Ctrl+Z) in source after a click.
- Integrity: content above/between/below survives byte-for-byte; different-body blocks get no extra remounts (count renders); no leaked views (registry size after N clicks and after closing the note); no console errors.
- SC-518: keyboard Save on the upper twin ends focus with ring on the edited card's pencil; mouse leaves focus alone. SC-479 scroll: tall note scrollTop unchanged. SC-340: a non-twin card keeps its live view (open modal / focus) across its own write.
- Mutations: confirm the implementer's mutation claims; add any that survive.
- **Scrutinize the implementer's deviations** (reasons in `sc481-r2-impl-report.md`): (1) `reconcile` is scoped by `sourcePath`, not docId (Live Preview widgets get random docIds) — probe two panes on the same note (Reading + Live Preview side by side, Reading + Reading), the same note embedded in another note, and a different note with the same path segment; can a processor call in one view remount/release live views in another view wrongly? (2) `reusedBlockBody` skips an element still on the line of its own last write — can that skip hide a real reuse (e.g. the twin lands on exactly that line after an insert above)? (3) the changed existing test line in `view-adoption.test.ts` (`ctx1.getSectionInfo = () => null`) — does it weaken what that test pinned?
- Re-run e2e once on HEAD (the implementer's first run had a one-off CHR-F02 collapse timeout). Shots/freeze/parity were measured on 4f73043 + commits; 4deb8cf is harness-only — re-run only if you find a reason.
- Re-run the battery that matters for the delta: tsc, lint, jest, both lifecycle halves (expected 42/42), and spot-check the implementer's e2e/shots/freeze/parity logs (re-run e2e if anything in the diff could affect it).

## 3. Expected numbers
tsc/lint clean · jest 6153 + new / 1 skipped · lifecycle 42/42 (halves 21 + 21) · e2e 124/124, 0 known-bug, 87/87 · shots 592 0 FAIL host-leak 157/942 (34-record boundary) modal 228 input 15/176 checkbox 7/116 prose 106 [212] · freeze 280/280 · parity 0/0/24. Known flakes: SC-506 (jest initiative-default-keys timeout), SC-529 (e2e CHR-L01), SC-521 (shots montage wheel).

## 4. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc481-twin-block-vanish/sc481-r3-review-report.md`, opening with a **≤10-line executive summary** (verdict LAND-READY / NOT LAND-READY, counts by severity). Findings by severity (HIGH/MEDIUM/LOW/INFO) with file:line, a failure scenario, and a prescribed fix. Logs as `sc481-r3-*.log` in the same dir.

## 5. Return contract
Final text: raw facts, no prose — verdict, severity counts, each finding in one line, measured numbers, and the **absolute path of every evidence artifact**.

## Footguns (all apply)
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — stale logs from other branches match. Read the process's own output or write to a per-run unique path.
- Redirect long-running output to a file — the 600 s stream watchdog kills silent agents.
- Every gate/probe run is ONE blocking foreground Bash call under 600 s. No `run_in_background`, no Monitor. Lifecycle = two `--only` halves.
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc481-twin-block-vanish/draw-steel-elements -- bash <script file>`. Never `cd X && …`. `git -C <abs path>` always. Record exit codes inside script files; never pipe a gate into `tail`.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc481-r3-review-<your agentId>/`, unique names. Write tool for scratch files. No `rm` with a variable target, no glob `rm`.
- Never `pkill`/`killall` by pattern; kill only your own PIDs (cwd or command line inside your worktree/scratch). Never `rm -rf` a shared `/tmp` glob. Never touch `.superpowers/` beyond your own `sc481-` files.
- Unique `DSE_LIFECYCLE_PORT` (e.g. 94xx).
- Do not commit to the branch. Leave `git status --short` empty in plugin and superproject (restore anything you touch for a mutation).
- You cannot `SendMessage` me. If you need input, end with STATUS: NEEDS_CONTEXT and the question in your report. Any message you do send must start with `SC-481:`.
