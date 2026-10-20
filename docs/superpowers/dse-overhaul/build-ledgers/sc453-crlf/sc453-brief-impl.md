# SC-453 implementer brief — round 1

## 1. Context loading
- Read FIRST: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc453-crlf/decisions.md` (the spec + rulings; quote it, never paraphrase).
- Background (read only the parts named): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc290-info-string/sc290-review-report.md` §INFO-4 and "Probe results by brief item" 1 (the list of every site that writes to a note); `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc290-info-string/sc290-impl-report.md` "Follow-ups".
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc453-crlf`, repo `draw-steel-elements/`, branch `sc453-crlf`, cut from dse `develop` @ `f818002`. Before any write: `git -C /home/scott/code/steelCompendium/worktrees/sc453-crlf/draw-steel-elements fetch origin && git -C ... rebase origin/develop` (expect it to be f818002 or a fast-forward of it; report the sha). Verify `pwd`/paths before every write. Use `git -C <absolute path>` for EVERY git command — never `cd X; git …`.
- NEVER edit anything under `/home/scott/code/steelCompendium/workspace/` (the shared main checkout) except writing your report into the ledger dir named below. The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault and expected — do not touch or flag it.
- Workers never call the tracker (Linear) — not to read history, not to post.

## 2. The task
Ticket SC-453, verbatim (from the ledger):

> In a note with CRLF line endings, `SidebarBlockHost` fails to locate its block, because the anchor lookup does not strip the trailing `\r` from each line. Sidebar writes to blocks in such notes do not land.
> ...
> Where: `draw-steel-elements/src/framework/host/SidebarBlockHost.ts` (anchor / fence-line matching). Check `ReadingModeBlockHost` for the same thing while you are there.
> ...
> Also (SC-290 review INFO-4): after any DSE write, a CRLF note ends up with mixed line endings — the rewritten block uses LF. Same on SC-290's base. Fix both together: detect the note's line ending and write it back consistently.

Owner ruling (ledger, 2026-10-19), verbatim:
> Scope = every DSE write path that rewrites or inserts text into an existing note (not only the two hosts) — a note that is all-CRLF stays all-CRLF after any DSE write; an all-LF note stays byte-identical to today's output. Mixed-ending notes: pick the dominant / first-line ending (implementer proposes, reviewer probes); must not crash or lose content.

Pointers (verify yourself; these are leads, not a design):
- `src/framework/sidebar/anchor.ts` — `FENCE_LINE` uses `.`, which never matches `\r`, so a CRLF note's fence lines don't parse; `findAnchoredBlock` / `findFenceByBody` / `listFences` used by `SidebarBlockHost`. `ReadingModeBlockHost.ts:143-150` already works around this locally with `content.replace(/\r(?=\n)/g, '')` (SC-343) — note its comment about lone `\r` and line-index alignment against `replaceSource`'s own `content.split('\n')`.
- Write sites: `SidebarBlockHost.ts` `vault.process` (~:307-326), `ReadingModeBlockHost.ts` `vault.process` (~:375-399) and its re-locate at ~:448-481, `sidebar/registration.ts:~209` (body splice), `elements/encounter/view.ts:~455` (appends a new fence), `authoring/{scaffold,insert,suggest,compendiumInsert,schemaSuggest}.ts` (insert new text), plus anything that stamps `_dse_anchor`. `fenceLine.ts:31` `trimEnd()` drops the `\r` from the open line by design. Survey for any other `vault.process` / `vault.modify` / `editor.replaceRange` site.
- Prefer ONE small shared helper (e.g. detect EOL of a note; normalize to LF for parsing; re-emit with the note's EOL) over per-site ad-hoc fixes, but do not refactor unrelated code. Fixing `anchor.ts` itself is in scope if that is the cleanest locate fix — but keep ReadingModeBlockHost's line-index invariant intact and make sure every other `anchor.ts` caller still behaves.
- Editor-based inserts (`editor.replaceRange` in authoring/*): CodeMirror normally normalizes to the doc's line separator — establish what actually happens (read Obsidian/CM6 behaviour or probe in real Obsidian) before changing anything there; if they're already fine, say so with evidence and leave them.

Tests (TDD — write each failing test first and record FAIL-on-base counts by running the new tests against the unfixed src):
- jest: sidebar locate + write on a CRLF note (block found, write lands, whole note is all-CRLF after, content above/below the block byte-identical); same for ReadingModeBlockHost write; an LF note stays byte-identical to today's output (regression guard); two same-kind blocks in one CRLF note do not cross-talk; a hand-edited CRLF note re-located after a write; a mixed-ending note does not crash or lose content; a CRLF note whose last line has no trailing newline; any other write site you change gets its own case.
- Real Obsidian: add an e2e scenario (or lifecycle scenario, whichever the suite's conventions say fits) that writes a CRLF note to disk, drives a sidebar write and a reading-mode write, and asserts the file bytes on disk are all-CRLF with the edit landed. Follow the e2e coverage-pair conventions in dse-verify (a new scenario may need a coverage-pair entry; the coverage gate must stay Y/Y).
- Commit after every coherent step (tests, fix, e2e) on branch `sc453-crlf`. Conventional commit messages with `(SC-453)`. No co-author / AI attribution trailers.
- CHANGELOG: add one user-facing bullet under `## Unreleased` in the DSE repo's CHANGELOG if the repo keeps one (check `draw-steel-elements/CHANGELOG.md`); the workspace-level CHANGELOG is NOT yours to edit — if it needs a bullet, give me the text in your report.

## 3. Gates — the `dse-verify` skill (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`), full battery in order
Expected numbers at base f818002 (dse-verify CURRENT row): tsc (incl. `tsc -p e2e`) + lint (incl. `e2e/`) clean · jest **4810 passed / 1 skipped / 227 of 228 suites** (+ your new tests) · lifecycle **25/25** (+ any you add) · e2e **`OBSIDIAN-E2E done: 63/73 ok, 0 failed, 10 known-bug, coverage: 47/47 pairs`** (+ your additions; must end `0 failed` with `Y/Y pairs`) · shots **572**, 0 FAIL · freeze **`freeze OK (276/276 …)`** (no rebaseline expected — this change must not move any print bytes; if it does, STOP and report) · parity **0 GAPs / 0 undeclared / 24 DECLARED**.

## 4. Footguns (all mandatory)
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc453-crlf/draw-steel-elements -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc453-crlf/draw-steel-elements && <cmd>'`. Devbox's sh wrapper eats `$?`/`$PIPESTATUS`, and `| tail` eats failures: run gates via a wrapper script FILE that writes the exit code to a file, or redirect output to a file and read the gate's own summary line. Never treat an echoed `$?` inside `bash -c` as truth.
- `npm ci` if `package.json`'s obsidian version changed in the rebase.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents. Run gates in the FOREGROUND (timeout up to 600000 ms; split if needed). Do not end your turn "waiting for a notification" from a job you started — it will never wake you.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path (include `sc453` and a timestamp).
- Never `pkill`/`killall` by a bare command pattern — concurrent efforts run the same gate commands. Kill only by PID whose command line contains `worktrees/sc453-crlf/` (`pgrep -af "worktrees/sc453-crlf/"`).
- Never touch the shared freeze baseline `.superpowers/sdd/freeze-baseline.sha256`. Never `rm -rf` anything under `.superpowers/` except your own `sc453-*` files.
- ⛔ Never create a tag or release on draw-steel-elements. Never push. Never run `just deploy*` / `just wt-finish`.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the top-level dispatcher, not me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question in your report; I will resume you. If you ever do send a message anyway, its FIRST WORD must be `SC-453:`.

## 5. Report
Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc453-crlf/sc453-impl-report.md`. It must OPEN with a ≤10-line executive summary (verdict, head sha, gate numbers, FAIL-on-base counts). Body: the EOL policy chosen (incl. mixed-ending rule) and why; every write site surveyed with its disposition (changed / already fine + evidence / out of scope); files changed; tests added; full gate numbers with log paths; `Drive-by fixes:` and `Follow-ups:` sections.

## 6. Return contract
Your final text goes to the ticket-owner, not a human: raw facts only — STATUS (DONE / NEEDS_CONTEXT / BLOCKED), head sha, commit list, measured gate numbers, FAIL-on-base counts — plus the absolute filesystem path of every evidence artifact (report, gate logs, any screenshots). No prose.
