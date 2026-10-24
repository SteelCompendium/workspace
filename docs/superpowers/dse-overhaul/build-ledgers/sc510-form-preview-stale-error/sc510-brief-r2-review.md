# SC-510 r2 brief — independent reviewer: block edit form preview race

You are the independent reviewer for SC-510, round 2. You did not write this code. Your final text goes to the ticket-owner, not a human.

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc510-form-preview-stale-error/sc510-decisions.md` (ticket facts, D0–D4, rounds).
- Implementer report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc510-form-preview-stale-error/sc510-r1-impl-report.md` (read its summary; dive as needed).
- Origin finding: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc493-form-empty-yaml/sc493-r1-review-report.md` LOW-3.
- `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` and `draw-steel-elements/AGENTS.md`.
- **Worktree:** `/home/scott/code/steelCompendium/worktrees/sc510-form-preview-stale-error`. Review dse HEAD **be35c6a** on base **253aa5f**; superproject **dca5433** on 104dd85. `git -C <dse path> fetch origin` and say whether `origin/develop` is still 253aa5f.
- Never edit in the main checkout `/home/scott/code/steelCompendium/workspace/` (its dse dirt — `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md` — is Scott's live vault; ignore it). Do not commit to the branch; probes and mutants are applied, run, and restored with `git -C … checkout -- <file>`; the tree must end clean at be35c6a.
- **You never call the tracker (Linear).**

## 2. The task — execute and probe, not just read

Ticket expected behavior (quoted): "the preview always shows the current box text. Suggested fix: mount each preview into a fresh child element that is dropped on the next keystroke, and catch mount rejections."
Owner D1 (quoted): "each renderPreview mounts into a fresh child element of `.dse-form__preview` (the preview host's `containerEl` is that child too), the previous child is detached on the next render, and `view.mount` rejections are caught (no unhandled rejection). A stale mount that finishes late may write only into its own detached child."

1. **Red/green**: run the new tests against 253aa5f's `FormModal.ts` (fail) and HEAD (pass). Record counts.
2. **Mutants** (each applied, run, restored): e.g. mount back into `previewEl` directly; host `containerEl` left as `previewEl`; drop the `.catch`; old child not detached; old view not removed from the lifecycle. Each must turn a test red; report survivors.
3. **Probes**: any element whose view writes outside its mount target (via `host.containerEl`, `parentElement`, a sibling, or the modal) during an async mount — grep element views that are reachable from the form's preview and check. The read-only badge (`data-dse-readonly`, SC-493 r2) on valid vs emptied/invalid preview. CSS selectors on `.dse-form__preview` children (shots/freeze cover rendered look — re-run them). Leak: mounted views per keystroke after N keystrokes. What the user sees when a mount rejects. ds-scc bare code body.
4. **Real Obsidian probe** (lifecycle harness tooling or a throwaway scenario not committed): open the block edit form on a feature with authoring controls on, type `@Ref.md` one character at a time with real key input, confirm the final preview shows Ref.md and no "not found"; and a self-referencing `@Note.md` produces no unhandled rejection in the console. Take one screenshot of the final preview (`sc510-r2-shot-*.png` in the ledger dir). Never a timed delay to win a race — if you need to order resolutions, hold at a hook.
5. **Full battery** on HEAD (dse-verify order). Expected: tsc/lint clean; jest 6074 / 1 / 245 of 246 plus the new tests (after shots); lifecycle 38/38 (39/39 if G-S46 added); e2e `123/123 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`; shots 592, 0 FAIL; freeze 280/280; parity 0 GAPs / 0 undeclared / 24 DECLARED.

Findings by severity (HIGH/MEDIUM/LOW/INFO) with file:line, a failure scenario, and a prescribed fix. Verdict: LAND-READY or NOT LAND-READY.

## 3. Shell rules (obey exactly)

- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc510-form-preview-stale-error/draw-steel-elements -- <cmd>`; never `cd` inside a compound command; every git command as `git -C <absolute path>`.
- One blocking foreground gate per Bash call (timeout 600000); no `run_in_background`, no Monitor. Redirect long output to a log file and read the summary line.
- Exit codes from a script file run via `devbox run -c <dse path> -- bash <script>` writing rc to a fresh file (`bash -c '…; echo rc=$?'` under devbox always records 0).
- Scratch: only your private subfolder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc510-r2-review-<random suffix>/`, uniquely named files, written with the Write tool.
- No `rm` with a shell-variable target, no glob `rm`, never `rm -rf` a `/tmp` glob or `.superpowers/`. Delete only literal paths you created and recorded.
- Never `pkill`/`killall` by pattern; kill only by PID whose command line or `readlink /proc/<pid>/cwd` is inside your worktree.
- Lifecycle: own `DSE_LIFECYCLE_PORT` (e.g. 9294). Never `DISPLAY=:1` / `--headed`.
- Never key a wait-loop on a scratch filename or its contents; read the process's own output or a per-run unique path.
- Never tag, release, deploy, push, or run `just wt-finish`.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc510-form-preview-stale-error/sc510-r2-review-report.md`, opening with a ≤10-line executive summary (verdict, counts by severity, red/green, mutants, gate numbers). If the write is blocked, return it inline.

## 5. Return contract

Final text to the ticket-owner: raw facts — verdict, findings one line each with severity and file:line, measured gate numbers, and the absolute path of every evidence artifact (report, logs, screenshots). No prose.

You cannot `SendMessage` me (depth-2 cannot reach its parent; `to: 'main'` goes to the dispatcher). If you need input, end with `STATUS: NEEDS_CONTEXT` and the question. If you ever message anyway, first word `SC-510:`.

## 6. Two owner questions (answer each with evidence and a prescribed fix)

From the ledger (quoted):
- FU-1: "\"Reference nesting too deep\" in the preview when the same reference is retyped while an earlier mount of it is pending (IN_FLIGHT_REFS keyed on the constant preview blockKey `…::form-preview`) … reviewer measures whether a person can reach it in real Obsidian and prescribes the smallest fix that keeps D2 (e.g. does the unloaded view release its in-flight entry; what a per-render blockKey would actually reset in a read-only preview)."
- FU-2: "a rejected mount shows a blank box with the Read-only badge and no message … reviewer reports what the real card shows for the same body and prescribes the smallest consistent preview behavior."

Implementer's gate logs are in the ledger dir under generic names (tsc.log, jestfull1.log, lifecycle.log, …); write yours as `sc510-r2-*.log` so they do not collide.
