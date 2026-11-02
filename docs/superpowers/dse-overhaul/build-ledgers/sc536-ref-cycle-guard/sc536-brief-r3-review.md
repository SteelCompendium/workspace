# SC-536 r3 — independent adversarial review (orchestration:reviewer, fresh identity)

## 1. Context loading
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc536-ref-cycle-guard/decisions.md` ("Owner rulings on r1" is the spec).
- Design: `sc536-r1-design-report.md` (§4–§6); implementation report: `sc536-r2-impl-report.md` (read its executive summary, then the body as needed); both in the ledger dir. Real-Obsidian probe kit from r1: `sc536-r1-obsidian-kit.js.txt`, `sc536-r1-obsidian-scenarios.js.txt`, `sc536-r1-obsidian-run.sh.txt`, `sc536-r1-build-bundles.sh.txt`.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc536-ref-cycle-guard`, plugin `.../draw-steel-elements`, branch `sc536-ref-cycle-guard`, base `458abe3` (dse develop after SC-481), head `432c50e2` (verify with `git -C <abs> log --oneline -1`). Do not commit to the branch; probes go in throwaway files deleted by literal path, or a scratch copy; branch must end `git status --porcelain` empty.
- `draw-steel-elements/AGENTS.md`, `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
- **You never call the tracker (Linear).**
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected; never touch the main checkout.

## 2. Task
Review `458abe3..432c50e2` (plugin) and the superproject worktree's doc commits. You did not write any of it. **Execute and probe, do not just read.**
- Correctness of the ancestry guard against the ruled design; target identity (alias, trailing spaces, `#anchor`, SCC vs `@path` to the same file); `claimChain` ordering vs `resolveGen`; `REF_CHAIN.delete` on every `onMount` path; cap counts only reference-resolved roots.
- Regression risk: SC-525's form-preview retype case still fixed (`formModalStalePreview.test.ts`), every `resolveGen` re-entrance test still meaningful, SC-519's `unloaded` flag untouched, no behavior change for legitimate nesting (A→B, siblings, diamond).
- **Real Obsidian probes** (reuse the r1 kit against a build of HEAD): Bug 1 cycle (self, alias, A→B→A, Live Preview) stops with one "Reference loop" card; 7-chain shows 5 cards + cap card; Bug 2 (two panes + plugin off/on; split + redraw same tick, natural timing ×5) shows no false error. **Sidebar** — r1 only reasoned it: pin the `@Cyc.md` card to the sidebar and confirm it stops with one loop card and settles; also a pinned `@Ref.md` card while the same note is open in Reading view shows no false error.
- Interaction with SC-481 (landed in `458abe3`): its identical-twin reuse / `remountReused.ts` re-parents or reuses card roots. Probe that a reused root carrying a `REF_CHAIN` entry cannot make a legitimate nested reference read as a loop, and that two identical `@Ref.md` blocks in one note both render.
- Test quality: the 6-mutant table (re-run at least 3 of them yourself, including "claimChain before the last gen check" and "drop REF_CHAIN.delete"); confirm G-S56 is deterministic (holds at hooks, no timers) and really fails on 458abe3's src.
- Re-run gates yourself: tsc, lint, jest, lifecycle both halves, e2e. (shots/freeze/parity: re-run only if the diff could move DOM output outside error cards.)
- Wording matches the ledger exactly; CHANGELOG bullet is plain and accurate; the dse-verify CURRENT block was NOT edited.

Findings by severity (HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario, and a prescribed fix. Verdict: LAND-READY or not.

## 3. Expected numbers
As measured by r2 (superproject worktree doc commit `2f5eb7d1`): tsc/lint clean · jest 6221 passed / 1 skipped / 249 of 250 (base 6201; +22 added, −2 deleted) · lifecycle 43/43 (21 + 22) · e2e `124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs` (CHR-F02 known flake SC-539) · shots 592, 157/942 / freeze 280/280 / parity 0/0/24.

## 4. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc536-ref-cycle-guard/sc536-r3-review-report.md`; logs/scripts `sc536-r3-*`. Open with a ≤10-line executive summary.

## 5. Footguns (obey all)
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it.
- Each gate / real-Obsidian run is ONE blocking foreground Bash call ≤ 600 s; lifecycle as two `--only` halves. No `run_in_background`, no `Monitor`.
- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc536-ref-cycle-guard/draw-steel-elements -- bash <script file>`; never `cd X && …`; `git -C <abs path>` always.
- Exit codes from a script file run through devbox, never `bash -c '…; echo rc=$?'`.
- Scratch files via the Write tool in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc536-r3-<yourAgentId>/`, uniquely named.
- No `rm` with a variable target or glob; only literal absolute paths you created. Never `rm -rf` `/tmp/dse-obsidian-*` globs or the shared `.superpowers/`.
- Never `pkill`/`killall` by pattern; kill only PIDs whose cwd/command line is inside your worktree or scratch dir.
- Real Obsidian on its own Xvfb — never `:1`.
- You cannot `SendMessage` me. If you need input, end with `STATUS: NEEDS_CONTEXT` + the question. If you ever do send a message, its FIRST WORD must be `SC-536:`.

## 6. Return contract
Final text goes to the ticket-owner: verdict, finding counts with one line each, measured gate numbers, probe counts — plus the absolute path of every artifact.
