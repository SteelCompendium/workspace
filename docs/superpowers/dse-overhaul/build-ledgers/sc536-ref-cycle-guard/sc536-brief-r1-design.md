# SC-536 r1 — reproduce in real Obsidian + design survey (orchestration:reviewer)

You are the r1 reproduce-and-design worker for SC-536. You write NO branch code this round (throwaway probe files only, deleted by literal path; the branch must end `git status --porcelain` empty).

## 1. Context loading (read first)
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc536-ref-cycle-guard/decisions.md` (current state; read instead of any ticket thread).
- Prior evidence (SC-525 review, landed): `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc525-ref-nesting-retype/`
  - `sc525-r2-review-report.md` — MEDIUM-1 (real cycle never stopped), MEDIUM-2 (false nesting error, one block live twice), INFO-1 (why a depth cap backstop matters).
  - Real-Obsidian probe kit to reuse: `sc525-r2-obsidian-assemble-build.sh.txt`, `sc525-r2-obsidian-cycle-scenario.js.txt`, `sc525-r2-obsidian-probe-scenario.js.txt`, `sc525-r1-obsidian-probe-kit.js.txt`, `sc525-r1-obsidian-probe-run.sh.txt`, `sc525-r1-obsidian-probe-bundles.sh.txt`, `sc525-r1-obsidian-probe-assemble.py.txt`; logs `sc525-r2-obsidian-{cycle,probe}-{head,base}.log`.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc536-ref-cycle-guard`, plugin at `.../draw-steel-elements`, branch `sc536-ref-cycle-guard`, HEAD must be `34f46cf` (dse `develop`). Verify with `git -C <abs path> log --oneline -1` and `pwd` before anything. Do not rebase; do not commit.
- Read `draw-steel-elements/AGENTS.md` and `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (lifecycle authoring rules, real-Obsidian command shapes).
- **You never call the tracker (Linear)** — not to read, not to post.
- The main checkout's dse dirt (`demo-vault/Welcome.md` modified, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, not foreign; never touch the main checkout at all.

## 2. Task
Ticket SC-536, two bugs, both pre-existing (seen on develop `4deb8cf` and SC-525 head):
- **Bug 1:** `Cyc.md` holds a feature whose effect contains a `ds-feature` fence with body `@Cyc.md`. A note's ds-feature block references `@Cyc.md`. Reading view nests the card inside itself with no limit (116 levels / 30 s, no error card).
- **Bug 2:** a note with a `@Ref.md` feature block open in two panes, plugin off and on → second pane shows "Feature: failed to render (render) Reference nesting too deep" (3/3). Split pane + redraw in the same tick (4–5/5). Two Reading-view redraws while the first lookup runs leave the error after the lookup finishes.
- Root cause per the SC-525 review: the guard in `src/elements/shared/RefUnwrapView.ts` (`IN_FLIGHT_REFS`, guard key from `host.blockKey()` + reference) is keyed on block identity; nested blocks in Obsidian get a different blockKey (`ReadingModeBlockHost.ts` ~723-731), and two live copies share one.

The ticket's suggested fix (not a Scott ruling; quoted verbatim from the ledger): "make the guard follow ancestry, not block identity. Either pass the chain of references being resolved down through `RenderContext`, or refuse only when a live owner's root contains the new root. Add a hard depth cap as a backstop. Add a lifecycle scenario using the review's `Cyc.md` fixture. This could replace SC-525's owner map."

Do, in order:
1. **Reproduce on 34f46cf in real Obsidian** both bugs (Bug 1 cycle; Bug 2 at least the two-pane plugin off/on case and the split+redraw case). Record counts per run.
2. **Instrument the nested render path** (throwaway console logging in a probe build, never committed). For a nested block inside a referenced card, record: its `blockKey()`, its `sourcePath`, which code path renders the effect markdown (Obsidian `MarkdownRenderer.render`? the plugin's own?), whether the nested block's element is a DOM descendant of the parent ElementView's root (a) when the nested view mounts and (b) when it reaches the reference-resolution step — i.e. is `parentRoot.contains(nestedEl)` true at both moments, including while the tree is still detached from `document`. Also: does any plugin `RenderContext`/host object survive into the nested block, or does Obsidian's code-block processor start fresh?
3. **Recommend ONE design** that fixes both bugs and keeps SC-525's guarantees (form-preview retype stays fixed; `resolveGen` stale-write protection stays). Cover: what identifies "the same reference" (resolved file path vs raw text; SCC codes; `@Ref.md` with trailing spaces), the ancestry signal and where it is stored (e.g. a data attribute or WeakMap on each RefUnwrapView root), the hard depth cap value and how depth is counted, whether `IN_FLIGHT_REFS` / `isUnloaded()` can be removed or must stay (and for what), the sidebar and Live Preview hosts, and the jsdom form preview. Whether `ReadingModeBlockHost.ts` must change at all — it is SC-481's area (identical-block reconcile/remountReused); prefer a design that does not touch it, and if it must, say exactly which lines and why.
4. **Lifecycle scenario G-S56 plan:** concrete, deterministic (no timer races — check dse-verify's authoring rules) steps for Bug 1 and Bug 2, what it asserts, and evidence it fails on 34f46cf (run the probe form of it on base).
5. **jsdom test plan:** which existing tests in `test/dom/elements/refUnwrapView.test.ts` and the SC-525 form tests must change (the cycle tests reuse one host so they never modeled real nesting), and red-then-green tests for both bugs plus the depth cap.

Bound yourself: this is a scoped round. Do not survey unrelated hosts or elements.

## 3. Gates
None required (no branch code). If you run anything on the branch, it must end clean. Current baselines for reference (dse-verify CURRENT @ 34f46cf): jest 6184 passed / 1 skipped / 248 of 249 suites; lifecycle 41/41 (halves 20 + 21); e2e `124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`; shots 592; freeze 280/280; parity 0 GAPs / 0 undeclared / 24 DECLARED.

## 4. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc536-ref-cycle-guard/sc536-r1-design-report.md`. Probe scripts/logs alongside it, all named `sc536-r1-*` (scripts saved as `.txt`). Open the report with a ≤10-line executive summary (repro counts, recommended design in 2–3 lines, whether ReadingModeBlockHost.ts is touched).

## 5. Footguns (obey all)
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it.
- Run every real-Obsidian run as ONE blocking foreground Bash call (≤ 600 s); no `run_in_background`, no `Monitor`, no waiting for notifications.
- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc536-ref-cycle-guard/draw-steel-elements -- bash <script file>`; never `cd X && …` compound commands; `git -C <abs path>` for every git command.
- Record exit codes from a script file run through devbox, not `bash -c '…; echo rc=$?'` (always records 0).
- Write scratch files with the Write tool, in a private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc536-r1-<yourAgentId>/` with uniquely named scripts and logs.
- No `rm` with a shell-variable target or a glob. Delete only literal absolute paths you created. Never `rm -rf` any `/tmp/dse-obsidian-*` glob or the shared `.superpowers/` dir.
- Never `pkill`/`killall` by pattern. Kill only a PID whose cwd (`readlink /proc/<pid>/cwd`) or command line is inside your worktree.
- Real Obsidian runs use their own Xvfb display — never `:1`.
- You cannot `SendMessage` me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question. If you ever do send a message anyway, its FIRST WORD must be `SC-536:`.

## 6. Return contract
Your final text goes to the ticket-owner, not a human: raw facts — verdict, repro counts, the recommended design (short), whether ReadingModeBlockHost.ts changes, the G-S56 plan in a few lines — plus the absolute path of every artifact you produced.
