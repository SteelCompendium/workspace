# SC-457 implementer brief — round 1

You are the implementer for SC-457. Your final text goes to the ticket-owner, not a human.

## 1. Context loading (do this first)

- Read the ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc457-fence-space-lang/decisions.md` — ticket text verbatim, the dispatcher constraints, and owner rulings O1–O7. The rulings ARE your task; they are quoted in §2.
- Background (read only the parts named): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc290-info-string/sc290-review-report.md` INFO-2 (and LOW-1 if you want the test history). SC-460's ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc460-stray-cr/decisions.md` for the line-break helper that just landed in the same code.
- Read `draw-steel-elements/AGENTS.md` in your worktree and the dse-verify skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (battery, devbox shapes, lifecycle scenario conventions).
- **Workers never call the tracker** (Linear) — not to read history, not to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc457-fence-space-lang`; dse checkout `/home/scott/code/steelCompendium/worktrees/sc457-fence-space-lang/draw-steel-elements`, branch `sc457-fence-space-lang`, cut from dse `develop` @ `84636a9`. Verify `pwd` / `git -C <abs> rev-parse HEAD` before any write. First: `git -C <dse abs> fetch origin` and `git -C <dse abs> rebase origin/develop`; if `origin/develop` has moved past `84636a9`, report the new base sha. Run `npm ci` in the dse checkout (fresh worktree).
- **Never work in `/home/scott/code/steelCompendium/workspace/`** (the shared main checkout). Its dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, not yours, do not touch or report it. Any workspace-level file you edit (e.g. `CHANGELOG.md`) is YOUR worktree's copy: `/home/scott/code/steelCompendium/worktrees/sc457-fence-space-lang/CHANGELOG.md` — never under `workspace/`.
- Every git command uses `git -C <absolute path>`, never `cd X; git …`.
- SC-456 (e2e note-integrity helper) is in flight concurrently in another worktree. **Do not edit `e2e/driver/` or any existing e2e spec.**

## 2. The task

Ticket (verbatim): "Obsidian renders ```` ``` ds-counter ```` (space between the backticks and the language) as a DSE block, but DSE's fence parse gives it an empty language: `getBlockInfo().language === ''` and a block key like `Note.md::::1`. When the section snapshot goes stale (the note was edited around the block), the relocate-by-body fallback matches on language, so it can never find this block and the write is dropped."

Owner rulings (verbatim from the ledger):

- O1. **Fix it so the write lands.** A block's language identity is the first whitespace-delimited token of the TRIMMED info string (CommonMark / Obsidian semantics; the same rule as `anchor.ts` `fenceAlias`), so ```` ``` ds-counter ```` has language `ds-counter`. ONE shared definition used by every host/locate site — not per-site patches. `info` (the verbatim remainder SC-290 re-emits) is unchanged: the leading space round-trips byte-for-byte.
- O2. Measure first, in real Obsidian (the version the lifecycle gate runs), on current `develop`: which leading-whitespace variants Obsidian renders as the DSE block (one space, several spaces, a tab) in Reading view and Live Preview, and confirm the dropped write on the stale-snapshot path (silent, or the SC-455 Notice). The fix follows what Obsidian renders — a variant Obsidian does not render as the block must not be claimed by DSE either.
- O3. Survey every language-identity site — `ReadingModeBlockHost` (section read, `listFences`, `locateByBody`, `locateUnterminatedTrailingFence`, the SC-455 section-window locate, `getBlockInfo`, `blockKey`), `LivePreviewBlockHost`, `SidebarBlockHost`, `sidebar/anchor.ts` + `registration.ts`, the encounter view, and anything else that compares a fence's language. Fix the in-scope ones with the shared helper; report the rest.
- O4. `blockKey` changes from `Note.md::::1` to `Note.md::ds-counter::1` for these blocks. Accepted. Report whether the key is persisted anywhere (collapse state, settings data) and what a user sees once (e.g. a collapse state resetting) — document it in the commit / CHANGELOG bullet if user-visible.
- O5. No silent failure may remain on this path: if a write still cannot land, the SC-455 one-Notice rule applies.
- O6. Integrity probes required (write-back into user files): bytes above/below the block survive; the info string incl. its leading space survives; two same-kind blocks (one spaced, one not, same body) don't cross-talk; a CRLF note keeps CRLF; a lone `\r` (SC-460) above still works.
- O7. Tests: jest pins for the parse and every fixed site; ONE real-Obsidian regression for the stale-snapshot relocate of a spaced fence — as a new **lifecycle** scenario (G-S14), not in `e2e/`, so the change stays clear of SC-456's e2e driver/helper work. Do not edit `e2e/driver/` or existing e2e specs.

Approach: TDD — write the failing jest pins and the failing G-S14 scenario first (confirm G-S14 FAILS on the unfixed code; record that output), then fix. Commit after every coherent step (nothing sits uncommitted through a gate). Add one bullet under `## Unreleased` in your worktree's `CHANGELOG.md` (plain user-facing words) and update the dse-verify skill's lifecycle-scenario list in YOUR worktree's copy (`/home/scott/code/steelCompendium/worktrees/sc457-fence-space-lang/.claude/skills/dse-verify/SKILL.md`) to name G-S14 — do NOT edit its CURRENT numbers block (the dispatcher does that at landing). Commit those workspace-level edits in the worktree superproject; do not push anything.

## 3. Gates (dse-verify battery, in order; all required)

Expected at base `84636a9` (from dse-verify CURRENT): tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5329 passed / 1 skipped / 230 of 231 suites** (plus your new tests — state the delta) · lifecycle **28/28** → expect **29/29** with G-S14 · e2e **`OBSIDIAN-E2E done: 83/87 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs`** (unchanged) · shots **572**, 0 FAIL · freeze **`freeze OK (276/276 …)`** (no rebaseline expected — if freeze moves, STOP and report; never touch the baseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED**.

Footguns:
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc457-fence-space-lang/draw-steel-elements -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc457-fence-space-lang/draw-steel-elements && <cmd>'`. Devbox eats `$?`/`$PIPESTATUS` and piping (`| tail`) eats failures: run each gate via a wrapper script FILE that redirects output to a log and writes the exit code to a separate file.
- `rm -f main.js styles.css` in the plugin root before `npx jest` (stale `main.js` shadows `main.ts`).
- Set your own `DSE_LIFECYCLE_PORT` (pick 9300–9399, e.g. 9347) for lifecycle runs — another session may hold the default 9262.
- **Scratch:** use ONLY a private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc457-impl-<yourAgentId>/` with uniquely named scripts/logs inside (`sc457-impl-jest.sh`, `sc457-impl-lifecycle.log`, …). The scratchpad is shared by every agent; never write a generic name like `gate.sh` at its top level.
- Never `pkill`/`killall` by pattern. Kill only by PID whose command line contains `worktrees/sc457-fence-space-lang/` (`pgrep -af "worktrees/sc457-fence-space-lang/"`, check each line).
- Never `rm -rf` a shared `/tmp` glob (e.g. `/tmp/dse-obsidian-lifecycle-*`) or the shared `.superpowers/` dir. Delete only paths you created and recorded.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents. Run gates in the FOREGROUND (Bash timeout up to 600000 ms); do not background a gate and wait for a notification — it will not come.
- No tags, no releases, no pushes.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc457-fence-space-lang/sc457-impl-report.md`. It must OPEN with a ≤10-line executive summary (verdict, head sha, base sha, gate numbers, anything that needs a decision). Body: O2 measurements (what Obsidian renders, per variant, per view; the base-code failure mode), the O3 site survey (site → fixed / not affected / out of scope + why), O4 persistence finding, O6 probe results, the G-S14 fail-on-base output, gate numbers with log paths. If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Final text: raw facts, no prose — STATUS (DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED), base sha, head sha, commit list, gate numbers as measured, the report path, and the absolute path of every evidence artifact (logs, probe files). List `Drive-by fixes:` (already made — obviously correct, local to a file you touched, can't move a gate baseline) and `Follow-ups:` (left alone) separately.

You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report — I see your completion notification and will resume you with the answer. If you ever do send a message anyway, its FIRST WORD must be `SC-457:`.
