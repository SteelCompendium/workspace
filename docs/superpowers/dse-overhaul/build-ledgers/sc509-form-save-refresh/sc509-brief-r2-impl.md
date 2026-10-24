# SC-509 r2 brief — implement the fix (implementer B)

## 1. Context loading
- Read first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc509-form-save-refresh/decisions.md` (ledger — current state) and the diagnosis report `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc509-form-save-refresh/sc509-r1-diagnose-report.md` (root cause, fix options, test plan).
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (the whole battery, command shapes, CURRENT numbers) and the plugin's AGENTS.md at `/home/scott/code/steelCompendium/worktrees/sc509-form-save-refresh/draw-steel-elements/AGENTS.md` if present.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc509-form-save-refresh`, plugin `.../draw-steel-elements`, branch `sc509-form-save-refresh`. First: `git -C <plugin abs path> fetch origin`, then `git -C <plugin abs path> rebase origin/develop`; expected base `054c9c5` (if origin/develop has moved, rebase onto it and record the new base sha). Verify `git -C <abs> log --oneline -1` and `git -C <abs> branch --show-current` before any write. If `package.json`'s obsidian version changed in the rebase, run `npm ci` first.
- The workspace-level files (CHANGELOG.md etc.) live in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc509-form-save-refresh/CHANGELOG.md` — never under `/home/scott/code/steelCompendium/workspace/`. The only thing you write under `workspace/` is your report in the ledger dir.
- **Workers never call the tracker** (Linear) — not to read history, not to post.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, not yours.

## 2. The task
Fix SC-509: after a block edit form Save, the card must show the saved content. Ticket: "Expected: the card redraws with the saved content right after Save." and "A fix should add a real-Obsidian check (lifecycle or e2e) that saves from the form and reads the card."

Root cause (reviewer A, r1 report §1-2, runtime-confirmed): every host write gets a view-adoption claim ticket whoever made it (`ReadingModeBlockHost.ts:571` `registry.noteWrite`, `:601` knownBody), so the form's `cx.host.replaceSource` at `FormModal.ts:444` is adopted on rebuild (`registerFrameworkElements.ts:75` claim → `adoptView.ts:113-117` re-parents the old root with the old model). The sidebar has the same flaw by `SidebarBlockHost.ts:336` `lastWritten` + self-echo guard `:438`.

**Implement option A from the r1 report §4, exactly — owner's ruling:**
- `BlockHost.replaceSource(newSource, opts?: { fromView?: boolean })` (`src/framework/host/BlockHost.ts:90`), documented.
- `ElementView.flushPersist` passes `{ fromView: true }` (`src/framework/view.ts:322-323`).
- `ReadingModeBlockHost.replaceSource` (`:541`, `:571`) creates the claim ticket only when `fromView` is true. The write itself, knownBody upkeep and the SC-478 scroll pin are unchanged for both kinds.
- `SidebarBlockHost.replaceSource` (`:302`, `~:344`) keeps `lastWritten` only when `fromView` is true (otherwise sets it null), so a form save reaches `SidebarPanel.handleExternalChange`.
- `LivePreviewBlockHost.replaceSource` accepts the parameter (signature only).
- **Do not change `src/authoring/FormModal.ts`** (dispatcher: "SC-494 (FormModal collapsed: line) is in flight in src/authoring/FormModal.ts — prefer a fix outside FormModal; if FormModal must change, coordinate via rebase."). Do not change `pipeline.ts`. If option A proves impossible without FormModal, STOP with STATUS: NEEDS_CONTEXT.
- Comments at each changed site name SC-509 and say why a non-view write must not adopt (it must re-render like an external edit).
- Reviewer A's throwaway diff is a reference, not gospel: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc509-r1-diag-abb0bbff5a200962d/candidate-fix-src.diff`. Its probe scenario sketch: `.../zz-sc509-probe-scenario.mjs.txt`; its jest probe: `.../zzSc509Probe.test.ts.bak`.

Tests (r1 report §5 has the detail), red commit FIRST (verify red against 054c9c5 source), then the fix:
1. Jest red test through the registered processor with the real pencil, real FormModal and real Save, then the rebuild: assert new text, fresh root, `claims === 0`, no ticket left. Cases: montage, counter, stamina-bar. Add the hero "Edit definition" path (`src/elements/hero/view.ts:257`) if it can be driven at reasonable cost; otherwise list it under Follow-ups.
2. In-card adoption pin: an in-card click (e.g. counter Increase) still adopts (same root, claim hit) — must stay green before and after.
3. Sidebar red test: a save from the sidebar panel's pencil reaches handleExternalChange and the panel shows the new content; a view's own sidebar write is still swallowed as self-echo.
4. Update the 13 existing tests that break mechanically (r1: 7 in `sidebarBlockHost.test.ts`, 2 in `view-registry.test.ts` ~`:176`/`:255`, 3 in `element-view.test.ts`, 1 in `pipeline.test.ts`) — add `{ fromView: true }` or the new argument; do not weaken any assertion.
5. Lifecycle **G-S40** (id fixed by the dispatcher): in real Obsidian, real click on the pencil and on Save in Reading view, wait for the card to show the new text; assert the claims count did not move and the old tagged root is gone, no Notice, no console errors. Add a sidebar phase and an in-card adoption control. Prove it FAILS against a 054c9c5 bundle and passes on yours (record both). Lifecycle 36 → 37.
6. CHANGELOG: one bullet under `## Unreleased` in YOUR worktree's superproject `/home/scott/code/steelCompendium/worktrees/sc509-form-save-refresh/CHANGELOG.md`, user-facing: the block edit form's Save (experimental authoring controls) now redraws the card right away in Reading view and in the sidebar, instead of showing the old content until the note is reopened. Commit in the superproject branch; do not bump the submodule pointer.

Out of scope: why the Live Preview claim misses (not needed — the fix only removes tickets); SC-510 (preview mount race); anything in FormModal.

## 3. Gates — full `dse-verify` battery, in its order, on your final HEAD
Expected (CURRENT at dse develop 054c9c5): tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6003 passed / 1 skipped / 242 of 243 suites** plus your new tests · lifecycle **36/36** → **37/37** with new G-S40 · e2e **`OBSIDIAN-E2E done: 114/114 ok, 0 failed, 0 known-bug, coverage: 79/79 pairs`** · shots **592**, 0 FAIL (with `button host-leak OK (113 … 678 …)`, `modal button host-leak OK (10 … 9 … 38 … 228 …)`, expected `OBSIDIAN APP.CSS PIN DRIFT` warning) · freeze **`freeze OK (280/280 …)`** (no rebaseline expected — if it moves, STOP and report, never touch the baseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED**.
On a fresh worktree jest reads one fewer passed and 2 skipped until `npm run shots` has run (dse-verify note) — compare jest after shots.

## 4. Report path
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc509-form-save-refresh/sc509-r2-impl-report.md`, opening with a ≤10-line executive summary. Evidence files `sc509-r2-*` in the same dir.

## 5. Return contract
Your final text goes to the ticket-owner, not a human: raw facts — STATUS, base sha, every commit sha (red test commit, fix commit, CHANGELOG commit), each gate's measured summary line, `Drive-by fixes:` and `Follow-ups:` lists — no prose, **plus the absolute path of every evidence artifact**.

Commit after every coherent step (red test, fix, docs). Do not push. Do not bump the superproject's submodule pointer (landing does that).

## Footguns (all mandatory)
- If the report-file write is blocked by your harness, return the report inline.
- Scratch: the session scratchpad `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/` is SHARED by every agent. Use only a private subfolder `.../scratchpad/sc509-r2-impl-<your agentId>/` with uniquely named scripts and logs. Write scratch files with the Write tool, not heredocs.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches; a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents.
- Run every gate as ONE blocking foreground Bash call (timeout up to 600000 ms); lifecycle, e2e and shots are separate calls. No `run_in_background`, no Monitor, no background jobs.
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc509-form-save-refresh/draw-steel-elements -- <cmd>`. Never `cd` inside a compound command. `$?` is eaten by devbox's wrapper: record exit codes from a script file (`devbox run -c <path> -- bash <script>`) and read each gate's summary line.
- Every git command: `git -C <absolute path>`. Never `cd X; git …`.
- No `rm` whose target is a shell variable or a glob (it hangs on an unanswered prompt). Use fresh uniquely named files, overwrite with `>`, or literal absolute paths. Never `rm -rf` any shared `/tmp/*` glob (other efforts' lifecycle vaults live there) or anything under `.superpowers/` except your own `sc509-*` files.
- Never `pkill`/`killall` by pattern. Kill only by PID, and only a PID whose command line contains `worktrees/sc509-form-save-refresh/` or whose `readlink /proc/<pid>/cwd` is inside that worktree.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher, not me. If you need input, end your turn with `STATUS: NEEDS_CONTEXT` and the question. If you ever message anyway, its FIRST WORD must be `SC-509:`.
