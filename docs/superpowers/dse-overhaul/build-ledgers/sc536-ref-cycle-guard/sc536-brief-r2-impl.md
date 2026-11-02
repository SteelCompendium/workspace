# SC-536 r2 — implement the DOM-ancestry reference guard (orchestration:implementer)

## 1. Context loading (read first, in this order)
1. Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc536-ref-cycle-guard/decisions.md` — the "Owner rulings on r1" section is your spec.
2. Design report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc536-ref-cycle-guard/sc536-r1-design-report.md` (§4 design, §5.1 lifecycle G-S56, §5.2 jsdom tests + mutant table, §6 risks).
3. Prototype: `sc536-r1-proto-RefUnwrapView.diff.txt`; probe tests `sc536-r1-probe-jsdom.test.ts.txt`; real-Obsidian probe kit `sc536-r1-obsidian-kit.js.txt`, `sc536-r1-obsidian-scenarios.js.txt` (`S536-CYC`, `S536-B2`), `sc536-r1-obsidian-run.sh.txt` — all in the same ledger dir.
4. `draw-steel-elements/AGENTS.md`; `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (battery, command shapes, lifecycle authoring rules).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc536-ref-cycle-guard`; plugin `/home/scott/code/steelCompendium/worktrees/sc536-ref-cycle-guard/draw-steel-elements`, branch `sc536-ref-cycle-guard`, base `34f46cf` (dse `develop`). First: `git -C <plugin abs path> fetch origin` and confirm `origin/develop` is still `34f46cf`; if it moved, rebase onto it and report the new base (run `npm ci` if `package.json`'s obsidian version changed). Verify `pwd`/paths before every write.
- **You never call the tracker (Linear)** — not to read, not to post.
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — not yours, never touch the main checkout.

## 2. Task — owner rulings, quoted verbatim from the ledger
- "ADOPT r1's recommended design (report §4) as written: DOM-ancestry guard in `src/elements/shared/RefUnwrapView.ts` only — `REF_CHAIN = WeakMap<HTMLElement, {targets, depth}>`, `nearestChain` walks `parentElement`, `REF_CHAIN.delete(root)` at the top of `onMount` beside `this.resolveGen++`, cap check before any lookup, `claimChain` immediately before each `mountBase` after the last `resolveGen` check; target identity = resolved target (`file:<path>` for `@`/`[[ ]]`, fallback `raw:<base.id>|<trimmed>`; SCC = `scc:<code>` + `file:<entity.file.path>`). REMOVE `IN_FLIGHT_REFS` and `ElementView.isUnloaded()` (keep the private `unloaded` flag — SC-519 uses it). KEEP `resolveGen` exactly as is. Prototype diff `sc536-r1-proto-RefUnwrapView.diff.txt` is the starting point."
- "`ReadingModeBlockHost.ts`: NO change (SC-481's area). If the implementer finds it must change, stop and return NEEDS_CONTEXT."
- "Cap: `MAX_REF_DEPTH = 5` (reference-resolved roots on the DOM chain, outermost = 1)."
- "Wording (owner ruling): cycle card → `Reference loop: <raw ref> is already shown by a card this one is inside.`; cap card → `Reference nesting too deep: more than 5 references inside one another.` Drop \"already resolving in this block\". Any existing test/lifecycle/e2e matcher on the old text is updated deliberately, never loosened to pass."
- "Tests: r1 §5.2 verbatim — rewrite the 3 OOM cycle tests on the nested-host model, invert/delete the 3 Bug-2 pins, rewrite displayCardHybrid (d), add the 9 new tests (awaited + fire-and-forget variants, view brake ~30), run the 6-mutant table."
- "Lifecycle: add G-S56 per r1 §5.1 phases (a), (a′), (b), (c), (d) + the 7-chain cap anti-vacuity; in the second lifecycle half; must fail on 34f46cf (show it). Natural-timing variants stay out of the gate."
- "FOLD r1 §6: one line in `renderMarkdown`'s doc comment that the guard requires rendering into an element already inside the card. FOLD `view.ts:291-298` comment update."
- "Docs in the worktree superproject: CHANGELOG `## Unreleased` bullet; dse-verify SKILL lifecycle row gains G-S56 (lifecycle becomes 42). CURRENT block is the dispatcher's at landing — do not edit it."
  - The workspace-level files live in YOUR worktree's superproject: `/home/scott/code/steelCompendium/worktrees/sc536-ref-cycle-guard/CHANGELOG.md` and `/home/scott/code/steelCompendium/worktrees/sc536-ref-cycle-guard/.claude/skills/dse-verify/SKILL.md` — **never** under `/home/scott/code/steelCompendium/workspace/`. Commit them in the superproject worktree on branch `sc536-ref-cycle-guard`; do NOT stage the `draw-steel-elements` pointer bump (landing does it). CHANGELOG bullet in plain words for a user, e.g. a reference that points back to itself now shows one "Reference loop" card instead of nesting forever, and a note open in two panes no longer shows a false "Reference nesting too deep".

Order of work, committing after each coherent step (nothing sits uncommitted through a gate):
1. RED commit: the new/rewritten jsdom tests, failing on 34f46cf source (log it).
2. Fix commit(s): the guard, the comments.
3. Mutant table (r1 §5.2, 6 mutants), each must turn its named tests red; restore by `git checkout -- <file>` of literal paths / `git stash`, verify clean after.
4. Lifecycle G-S56 commit; show it FAILS on 34f46cf's `src/` (restore the two src files from `34f46cf`, run `--only=G-S56`, put HEAD back) and passes on HEAD.
5. Docs commits (superproject worktree).

## 3. Gates (dse-verify, in order, each one blocking foreground Bash call)
tsc (incl. `tsc -p e2e`), lint, jest, lifecycle as two `--only` halves (the existing 20 + the existing 21 plus G-S56 = 22), e2e, shots, freeze check, parity last.
Expected numbers (dse-verify CURRENT @ 34f46cf): tsc/lint clean · jest 6184 passed / 1 skipped / 248 of 249 suites before your change — report the new total and explain the delta (tests deleted vs added) · lifecycle **42/42** (20 + 22) · e2e `124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs` (CHR-F02 is a known flake, SC-539 — if it fails, re-run once and report both runs; do not change it) · shots 592, 0 FAIL · freeze `freeze OK (280/280 …)` · parity 0 GAPs / 0 undeclared / 24 DECLARED. jest on a fresh worktree reads one fewer passed and 2 skipped until `npm run shots` has run once — compare after shots.

## 4. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc536-ref-cycle-guard/sc536-r2-impl-report.md`, logs alongside as `sc536-r2-*.log`, scripts as `sc536-r2-*.txt`. Open with a ≤10-line executive summary (head sha, commits, jest delta, gate numbers, mutant result, G-S56 base-fail evidence).

## 5. Footguns (obey all)
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it.
- Each gate is ONE blocking foreground Bash call ≤ 600 s; lifecycle as two `--only` halves, separate calls. No `run_in_background`, no `Monitor`, no waiting on notifications.
- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc536-ref-cycle-guard/draw-steel-elements -- bash <script file>`. Never `cd X && …` compound commands. `git -C <abs path>` for every git command.
- Record exit codes from a script file run through devbox, never `bash -c '…; echo rc=$?'` (always 0). Never pipe a gate into `tail`.
- Write scratch files with the Write tool in a private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc536-r2-<yourAgentId>/`, uniquely named.
- No `rm` with a shell-variable target or a glob. Delete only literal absolute paths you created. Never `rm -rf` a `/tmp/dse-obsidian-*` glob or the shared `.superpowers/` dir.
- Never `pkill`/`killall` by pattern; kill only a PID whose cwd (`readlink /proc/<pid>/cwd`) or command line is inside your worktree.
- Real-Obsidian gates use their own Xvfb — never `:1`.
- Never touch the shared freeze baseline. If freeze moves bytes, stop and report (ship `rebaseline.txt` + crops per dse-verify).
- Report `Drive-by fixes:` (made; obviously correct, local to a touched file) and `Follow-ups:` (left alone) separately. Out of scope: SC-481 (ReadingModeBlockHost reconcile), SC-539 (CHR-F02 flake), SC-530.
- You cannot `SendMessage` me. If you need input, end your turn with `STATUS: NEEDS_CONTEXT` and the question. If you ever do send a message anyway, its FIRST WORD must be `SC-536:`.

## 6. Return contract
Final text goes to the ticket-owner, not a human: raw facts — verdict, plugin head sha + commit list, superproject worktree commit sha, measured gate numbers, mutant results, G-S56 base-fail line — plus the absolute path of every artifact (report, logs, any screenshots).
