# SC-606 r3 — rebase onto dse develop da2bdbc6 + full battery (+ any fix round folded in)

You are a worker for the SC-606 ticket-owner. Your final text goes to the ticket-owner, not a human. **Workers never call the tracker.**

## 1. Context
- Ledger (binding): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc606-montage-edit-no-skills/decisions.md`. Prior reports in that dir: `sc606-r1-impl-report.md`, the review report `sc606-r2b-review-report.md`.
- Worktree `/home/scott/code/steelCompendium/worktrees/sc606-montage-edit-no-skills`; plugin `.../draw-steel-elements`, branch `sc606-montage-edit-no-skills`, head `df250b20` on `8b84b635`. Superproject worktree head `7ab086d2` (CHANGELOG `d12a014d` + pointer bump).
- `git -C <plugin> fetch origin && git -C <plugin> rebase da2bdbc6` (dse develop since SC-594). Use `git -C <absolute path>` for every git command. If the rebase conflicts in anything but montage files, STOP and report. After the rebase, update the superproject worktree's pointer-bump commit so it points at the rebased plugin head (amend `7ab086d2` or add a new bump commit on the branch); if `package.json`'s obsidian version changed, `npm ci`.
- CHANGELOG: the bullet lives in `/home/scott/code/steelCompendium/worktrees/sc606-montage-edit-no-skills/CHANGELOG.md` — never under `/home/scott/code/steelCompendium/workspace/`. If the superproject worktree's branch is behind workspace `origin/main` in CHANGELOG, do not rebase the superproject; the dispatcher's landing handles that.
- Gate reference: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (do not edit).

## 2. Task
**Fix round first (on the rebased branch), then the battery.** The review findings are in `sc606-r2b-review-report.md` sections "MEDIUM-1", "LOW-1", "LOW-2" (lines ~24-40) — read them verbatim there. The owner's rulings, quoted from the ledger:

> - MEDIUM-1 (an edit that leaves the hero+skill unchanged writes `skills_used` into a key-less hero; reorders a keyed hero's list): FOLD — take the reviewer's prescribed fix (skip the remove/add skill calls when `existing.hero === next.hero && existing.skill === next.skill`; tally delta unchanged) plus a DOM test (note-only edit writes no key) and a model test (order unchanged). This also fixes the pre-existing reorder, so no Backlog ticket. O2 and the CHANGELOG wording stand.
> - LOW-1 (hand-typed scalar `skills_used: Climb` ignored, then replaced / written back): FOLD — treat a non-empty string as a one-item list in `skillsOf`, add, remove and reset (add -> [Climb, X]; remove of Climb -> []; reset -> []), with tests. Writes normalize the scalar to a list only when that hero's skills change (O2).
> - LOW-2 (`jest.useRealTimers()` at the end of the test body): FOLD — move to afterEach.
> - INFO-1, INFO-2, INFO-3: DROP, no action.

Out of scope (do not touch): SC-610 (null / nameless participant), `addMontageHero` writing `skills_used: []` for a new hero. Commit the fix as its own commit(s) on top of the rebased branch. Keep the CHANGELOG bullet true (re-read its last clause after the fix; adjust wording only if needed and say so).
Then the full battery on the rebased head.

## 3. Gates — expected (CURRENT at da2bdbc6 + this branch's 15 tests)
- tsc clean, lint clean.
- jest `7686 passed / 2 skipped` on a fresh tree (7671 + 15; adjust by any tests the fix round adds and say so); after shots one more passed, one fewer skipped. `rm -f main.js styles.css` in the plugin root before jest (a literal path inside a script file).
- lifecycle `58/58` in SIX `--only` parts, each its own foreground call, output in its own log: `G-S7a G-S7b G-S6a G-S6b G-S6u G-S28 G-S5n G-S1 G-S2 G-S3 G-S4 G-S5 G-S6c G-S6d G-S6e G-S6f G-S6g G-S6h G-S6i G-S8 G-S9a` (21); `G-S9b G-S9d G-S9e G-S9f G-S9c G-S10 G-S11 G-S12 G-S13 G-S15 G-S14 G-S18 G-S32 G-S36 G-S33 G-S40` (16); `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9); `G-S57 G-S62 G-S61 G-S56` (4; G-S56 last); `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87 G-S91` (7); `G-S92` (1). Report the union.
- e2e `272/276 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs` (known bugs SC-257, SC-355, SC-384, SC-580).
- shots 592; host-leak 163/978, modal host-leak 39/234, capture clip 147.
- freeze `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh <plugin>/visual-harness/shots` → 280/280, 0 FAILED. If a frozen shot moves, STOP and report.
- parity LAST: 0 / 0 / 24.

## 4. Footguns (binding)
- Command shapes: `devbox run -c <absolute plugin path> -- bash <absolute script path>`, scripts written with the Write tool; no `cd` inside a compound command; no `rm` with a variable target and no glob deletes (prefer no `rm` at all; write fresh uniquely named files); never trust an echoed `$?` in `bash -c` — record rc inside the script file and read each gate's own summary line; no pipes after a gate.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc606-r3-<yourAgentId>/`, uniquely named files.
- **Never `rm -rf` a `/tmp` glob** (a worker once wiped other efforts' kept lifecycle FAIL dirs). Never touch `.superpowers/` outside this effort's dir.
- Never `pkill`/`killall` by pattern; kill only a PID whose cwd or command line is inside your worktree.
- One gate per blocking foreground call, output redirected to a file (600 s watchdog); no background jobs, no Monitor. Never key a wait on a scratch filename you did not just create.
- Never put a bracketed ticket id in a test title.
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — ignore it; never touch the main checkout.
- If the report-file write is blocked, return the report inline. You cannot `SendMessage` me; end with `STATUS: NEEDS_CONTEXT` and the question if blocked. Any message you send anyway starts with `SC-606:`.
- Do not push or land.

## 5. Report & return
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc606-montage-edit-no-skills/sc606-r3-rebase-report.md`, opening with a ≤10-line executive summary. Final text: STATUS, plugin head sha, base sha, superproject worktree head sha, each gate's measured number, absolute paths of every log/report.
