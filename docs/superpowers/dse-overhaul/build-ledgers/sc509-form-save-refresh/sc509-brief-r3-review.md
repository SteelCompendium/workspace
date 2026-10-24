# SC-509 r3 brief — independent adversarial review (reviewer C)

## 1. Context loading
- Read: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc509-form-save-refresh/decisions.md` (ledger), `sc509-r1-diagnose-report.md` (root cause + option A + test plan), `sc509-brief-r2-impl.md` (what was asked), `sc509-r2-impl-report.md` (what was done) — all in that ledger dir.
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc509-form-save-refresh`, plugin `.../draw-steel-elements`, branch `sc509-form-save-refresh`. Expected HEAD: a426882 (dse; red dac643f, fix 731f3e1, G-S40 a426882; superproject CHANGELOG d93f8d3 on origin/main f007a2a) on base 7046eb0. Verify with `git -C <abs> log --oneline -5`. Do not rebase. Review range: `git -C <plugin abs> diff 7046eb0..HEAD` and the superproject's CHANGELOG commit.
- **Workers never call the tracker** (Linear).
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected.
- You did not author this code. Do not fix it; report findings. Restore any probe edits with `git -C <abs> checkout -- <file>`; `git status --porcelain` must be empty when you finish.

## 2. The task
Execute and probe, do not just read. The fix (option A): `replaceSource(body, { fromView })`; only view-originated writes get a view-adoption claim ticket (ReadingModeBlockHost) or a sidebar `lastWritten` self-echo mark (SidebarBlockHost); FormModal and pipeline untouched. Ticket expectation: "the card redraws with the saved content right after Save."

Probe at least:
1. Red/green: new jest tests fail on 7046eb0 source and pass on HEAD; G-S40 fails against a 7046eb0 bundle and passes on HEAD (re-run it, do not trust the report).
2. Mutants: drop the `fromView` flag from `flushPersist`; make ReadingModeBlockHost always ticket; make SidebarBlockHost always set lastWritten; invert the flag. Each must turn a test red.
3. Adoption contract held: in-card clicks still adopt with no re-mount/flash (same root), the ~400ms debounce coalescing still gives one write, SC-478 reading position still holds after a form save and after an in-card click, the sidebar's own writes are still self-echo-swallowed.
4. Integrity probes (this writes into user files): content above/below the block survives a form save; two same-kind blocks in one note don't cross-talk (save one; the other card is unchanged and still interactive); a hand edit after a form save re-renders; a form save followed immediately by an in-card click (and the reverse) — no lost write, no stale card, no stale ticket left in the registry; a form save that returns false (block moved) leaves no ticket.
5. Real Obsidian: Reading view montage, counter, stamina-bar, the sidebar panel, and Live Preview (still fine). Hero "Edit definition" if reachable. Take screenshots after Save (`sc509-r3-*.png`).
6. Every other `replaceSource` caller or implementer (grep src and test) handles the new parameter; no type hole.
6a. The implementer showed G-S40 failing against a 054c9c5 bundle. Re-run it against a **7046eb0** bundle, which is the real base. Also drive the hero card's "Edit definition" Save (`src/elements/hero/view.ts:257`, same `openFormEditor` path, no test drives it) once in real Obsidian, and report whether the card redraws.
6b. SC-494 interplay (landed on 7046eb0 just before this branch rebased): SC-494 changed `src/authoring/FormModal.ts`, and `withReservedKeys` (`src/framework/chrome/collapsedKey.ts`) now runs on every pipeline write-back. Check that a form Save on a block that carries a `collapsed:` line, `prefs:` or other reserved keys redraws with the correct content and keeps those keys. Also check that collapsing or expanding a card, which is a view write, still adopts and does not re-mount.
7. Run the full battery on HEAD. Expected: tsc/lint clean · jest 6026 + new / 1 skipped / 243+ of 244+ suites (base 7046eb0) · lifecycle 37/37 · e2e `114/114 ok, 0 failed, 0 known-bug, coverage: 79/79 pairs` · shots 592, 0 FAIL · freeze `280/280` · parity 0 GAPs / 0 undeclared / 24 DECLARED.

Findings by severity (HIGH/MEDIUM/LOW/INFO), each with file:line, a failure scenario, and a prescribed fix. Verdict: LAND-READY or NOT LAND-READY.

## 3. Report path
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc509-form-save-refresh/sc509-r3-review-report.md`, opening with a ≤10-line executive summary (verdict, finding counts, battery numbers).

## 4. Return contract
Your final text goes to the ticket-owner, not a human: raw facts (verdict, findings with severity + file:line, measured gate numbers, shas), no prose, **plus the absolute path of every evidence artifact**.

## Footguns (all mandatory)
- If the report-file write is blocked by your harness, return the report inline.
- Scratch: the session scratchpad `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/` is SHARED by every agent. Use only a private subfolder `.../scratchpad/sc509-r3-review-<your agentId>/` with uniquely named scripts and logs. Write scratch files with the Write tool, not heredocs. For a 7046eb0 bundle use `git -C <plugin abs> worktree add <your scratch subfolder>/base 7046eb0` (absolute path; never re-point it), and remove it with `git -C <plugin abs> worktree remove <literal abs path>` at the end.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents.
- Run every gate as ONE blocking foreground Bash call (timeout up to 600000 ms); lifecycle, e2e and shots are separate calls. No `run_in_background`, no Monitor, no background jobs.
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc509-form-save-refresh/draw-steel-elements -- <cmd>`. Never `cd` inside a compound command. `$?` is eaten by devbox's wrapper: record exit codes from a script file (`devbox run -c <path> -- bash <script>`) and read each gate's summary line.
- Every git command: `git -C <absolute path>`. Never `cd X; git …`.
- No `rm` whose target is a shell variable or a glob. Use fresh uniquely named files, overwrite with `>`, or literal absolute paths. Never `rm -rf` any shared `/tmp/*` glob (other efforts' lifecycle vaults) or anything under `.superpowers/`.
- Never `pkill`/`killall` by pattern. Kill only by PID, and only a PID whose command line contains `worktrees/sc509-form-save-refresh/` or your scratch subfolder, or whose `readlink /proc/<pid>/cwd` is inside them.
- Never touch the freeze baseline. If freeze moves, report it.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher. If you need input, end with `STATUS: NEEDS_CONTEXT` and the question. If you ever message anyway, its FIRST WORD must be `SC-509:`.
