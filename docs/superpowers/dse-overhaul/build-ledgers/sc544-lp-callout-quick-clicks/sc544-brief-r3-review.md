# SC-544 r3 — independent adversarial review of the C1 fix (execute and probe, no commits)

You are the independent reviewer for ticket SC-544. You did not design or write this fix. Your final text goes to the ticket-owner, not a human.
**Workers never call the tracker** (Linear) — not to read history, not to post.

## 1. Context loading
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc544-lp-callout-quick-clicks/decisions.md` (ticket facts, owner rulings on r1 — they define scope).
- Design: `sc544-r1-diag-report.md` (§2 mechanism, §3 C1, §4 gate proposal). Implementation: `sc544-r2-impl-report.md` and its logs (same dir).
- r1's probe tooling (copy, never write into it): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc544-r1-diag-a89d389c7218bb144/`; r2's scratch folder is named in its report.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
- **Worktree:** `/home/scott/code/steelCompendium/worktrees/sc544-lp-callout-quick-clicks` (plugin `.../draw-steel-elements`, branch `sc544-lp-callout-quick-clicks`). HEAD = d3e426dd on dse develop 423e798d; superproject 1664d43b. Verify first. Never work in the shared main checkout `/home/scott/code/steelCompendium/workspace/` (its dse dirt is Scott's live vault — ignore it).
- Commit NOTHING. If you temporarily change a file, restore it; `git status --short` must be the same at the end as at the start (report both).

## 2. The task
Review `423e798d..HEAD` (plugin) and the superproject CHANGELOG commit. **Execute and probe, not just read**:
1. Re-run the gates yourself on HEAD: tsc/lint, jest, lifecycle 47/47 as three `--only` calls (part 3 `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S57 G-S61 G-S56`), e2e. Trust shots/freeze/parity only if the diff touches no CSS or shots harness (say so).
2. Red/green: G-S61 FAILs on a `423e798d` bundle (your own `git archive` build) with the r1 numbers per phase; PASSes on HEAD. Re-run the implementer's mutants and add 2 of your own aimed at weak spots (e.g. flush only callout views; flush after the section read; flush ignores the form path; skip released-entry filter).
3. Adversarial real-Obsidian probes, focused on what C1 changes — a pending edit of a sibling is written early:
   - Correctness across surfaces (LP callouts, LP plain, Reading view callouts/plain, two panes, sidebar both directions), 3–4 twins, two counters per block, quick triple clicks, gaps across the window.
   - Behaviour change: many quick clicks on ONE card still batch into one write (no extra writes); clicks alternating between two different (non-identical) blocks of the same note — count writes, check nothing is lost or doubled; a sibling flush while that sibling's block edit form is open (SC-519 `openAfterPendingWrite`); undo history (one undo step per write? compare base); a flush whose sibling block was deleted or edited by hand meanwhile (the integrity probes: content above/below survives, hand-edited content survives, deleted blocks don't come back).
   - Re-entrancy/ordering: does a flushed sibling's own `replaceSource` call `flushPendingWrites` again (recursion, ordering of `Vault.process` chains)? Different notes never flushed.
   - Plugin off/on, note closed with a pending write (does the flush hit an unloaded view?), renamed note mid-window.
   - Cost: per-write registry loop with many views open (e.g. 30 blocks) — measure.
4. Check the docs: `.repo-docs/architecture.md`, CHANGELOG bullet (accurate, plain words, every surface, no SC-549 claim), the dse-verify proposal file, lifecycle header counts.
Implementer's numbers to reproduce: jest 6279 passed / 1 skipped / 250 of 251 suites; lifecycle 47/47 as 21 + 16 + 10 (part 3 452 s); e2e 124/124 0 failed 0 known-bug 87/87. Also check where G-S61's fixtures come from (the diff adds no `Lifecycle/*.md` files — generated in the harness? does that match how G-S57 does it?).
Out of scope (report, don't fix): SC-550 (a sidebar click lost after a note-card click; pre-existing), SC-549 (typing/external edit inside the window), SC-540 (click shield), SC-545, SC-547, SC-480. SC-472 owns `previewScrollPin.ts`, `livePreviewScrollHold.ts`, `redrawBackstop.ts` — flag any diff that touches them.

## 3. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc544-lp-callout-quick-clicks/sc544-r3-review-report.md`, opening with a **≤10-line executive summary** (verdict LAND-READY / NOT, counts by severity, gate numbers). Findings by severity (HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario, measured evidence, prescribed fix. Logs `sc544-r3-*.log` in the ledger dir.

## 4. Return contract
Final text: raw facts — verdict, severity counts, gate numbers, and the **absolute path of every evidence artifact**.

## Footguns (all apply)
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated; read the process's own output or a per-run unique path.
- Redirect long-running output to a file — the 600 s stream watchdog kills silent agents.
- One gate per Bash call, blocking foreground; no `run_in_background`, no Monitor.
- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc544-lp-callout-quick-clicks/draw-steel-elements -- bash <script file>`; never `cd X && …`; `git -C <abs path>` always; record exit codes inside script files.
- Write tool for scratch files; no `rm` with a shell-variable target, no glob `rm`.
- Never `pkill`/`killall` by pattern; kill only your own PIDs (check `readlink /proc/<pid>/cwd`). Never `rm -rf` a shared `/tmp` glob or the shared `.superpowers/` dir; write only `sc544-` files there.
- Unique `DSE_LIFECYCLE_PORT` (e.g. 9546) for probes.
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc544-r3-review-<your agentId>/`.
- You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher, not me. If you need input, end with STATUS: NEEDS_CONTEXT. If you send anyway, the FIRST WORD must be `SC-544:`.
