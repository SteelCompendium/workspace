# SC-460 implementer brief — round 1

## 1. Context loading
- Read FIRST: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc460-stray-cr/decisions.md` (ticket text + owner rulings; quote it, never paraphrase).
- Background (read only the parts named): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc453-crlf/sc453-review-report.md` — executive summary and INFO-1/INFO-2 (lines ~1-60); the probe evidence P-R3/P-R5/P-R6 is described there. `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc455-callout-write/sc455-impl-report.md` executive summary + its write/locate-site survey (SC-455 just landed a blockquote-prefix helper and the "unsavable write shows one Notice" rule; your fix must compose with it and with SC-453's `src/framework/host/lineEnding.ts`).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc460-stray-cr`, repo `draw-steel-elements/`, branch `sc460-stray-cr`, cut from dse `develop` @ `b6b08f3`. Before any write: `git -C /home/scott/code/steelCompendium/worktrees/sc460-stray-cr/draw-steel-elements fetch origin && git -C /home/scott/code/steelCompendium/worktrees/sc460-stray-cr/draw-steel-elements rebase origin/develop` (expect b6b08f3 or a fast-forward of it; report the sha). Use `git -C <absolute path>` for EVERY git command — never `cd X; git …`. Verify `pwd`/paths before every write.
- NEVER edit anything under `/home/scott/code/steelCompendium/workspace/` (the shared main checkout) except writing your report/logs into the ledger dir named below. The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault and expected — do not touch or flag it. Any workspace-level file lives in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc460-stray-cr/…`.
- Workers never call the tracker (Linear) — not to read history, not to post.

## 2. The task
Ticket SC-460, verbatim (from the ledger):

> If a note has a lone `\r` (a carriage return without a following newline) anywhere above a DSE block, clicking a control in Reading view does nothing: the file is not changed and no Notice appears. A lone `\r` below the block is fine. Happens on LF and CRLF notes, and on code from before SC-453 (measured in real Obsidian 1.14.4).
>
> Likely cause: Obsidian's section numbering counts a lone `\r` as a line break, so the section's `lineStart` is one line off from DSE's `split('\n')`. `readSection` then can't parse the fence, and `resolveWriteTarget` aborts without a Notice.
>
> Where: `draw-steel-elements/src/framework/host/ReadingModeBlockHost.ts` (`readSection`, `resolveWriteTarget`).

Owner ruling (ledger, 2026-10-20), verbatim:
> **Fix it so the write lands**, not merely add a Notice. … Scope:
> 1. Measure first, in real Obsidian 1.14.4, on current `develop`: what `getSectionInfo` counts as a line break (lone `\r`, `\r\n`, `\n`; also U+2028/U+2029 / NEL if cheap to probe) in Reading view AND Live Preview, and whether the SC-455 Notice ("unsavable write shows one Notice") now fires for this case or it is still silent.
> 2. Map Obsidian's section line numbers onto the file's text using Obsidian's own line-break rule, so `readSection` / `resolveWriteTarget` find the fence. One shared helper, not per-site patches; compose with SC-453 `lineEnding.ts` and SC-455's blockquote-prefix helper, don't duplicate them.
> 3. Byte integrity: the lone `\r` itself and every byte outside the written block survive unchanged (LF note, CRLF note, mixed). A lone `\r` INSIDE the block body: decide and document; it must not lose content.
> 4. Survey every other locate/write site (sidebar `SidebarBlockHost`, `sidebar/registration.ts` splice, `anchor.ts` find/stamp, Live Preview path) for the same off-by-N; fix in-scope ones with the same helper, report the rest.
> 5. No silent failure may remain on this path: if a write still cannot land, the SC-455 one-Notice rule applies.

Leads (verify yourself; not a design):
- Measure step 1 in real Obsidian BEFORE designing. The lifecycle harness (`visual-harness/obsidian-lifecycle.mjs`) and the e2e driver (`e2e/`) both launch real Obsidian headless; a throwaway probe built on either is fine (keep it out of the commit unless it becomes a test). Record the raw measurements in your report.
- Prefer the smallest correct shape: e.g. a helper that splits text into lines by Obsidian's rule while keeping each line's original terminator, so the write re-joins byte-exactly. Every index into the file that is derived from `getSectionInfo().lineStart/lineEnd` must go through it. Do not refactor unrelated code; keep the SC-453 CRLF behaviour (an all-CRLF note stays all-CRLF) and SC-455 prefix behaviour green.
- `anchor.ts` / sidebar locate by content (fence scanning), not by Obsidian line numbers — check whether a lone `\r` breaks them anyway (e.g. a lone `\r` on a fence line or in the body), and report.
- Correct any code comment that claims a different line-break rule than the one you measured.

Tests (TDD — write each failing test first and record FAIL-on-base counts by running the new tests against the unfixed src):
- jest for `ReadingModeBlockHost` (and the helper, and any other site you touch): lone `\r` above the block in an LF note, in a CRLF note, and several lone `\r`s above it; lone `\r` below the block (regression guard); lone `\r` inside a callout above a callout block (composes with SC-455); write lands, the lone `\r`s are preserved byte-for-byte, every byte outside the block unchanged; two same-kind blocks with a lone `\r` between them do not cross-talk (both write orders); a note with no lone `\r` produces output byte-identical to today; lone `\r` inside the block body (your documented decision); a case that still can't land → exactly one Notice, file unchanged; identical-content no-op → no Notice.
- Real Obsidian: add a scenario (lifecycle `G-S*` or e2e — follow dse-verify's guidance on which; SC-453 put its CRLF scenario in lifecycle as G-S10) with a lone `\r` above a block, click a control in Reading view, and assert the on-disk bytes: the edit landed, the lone `\r` survived, nothing else changed. Cover Live Preview too if step 1 shows its numbering differs or matters.
- Commit after every coherent step (tests, fix, real-Obsidian scenario, docs) on branch `sc460-stray-cr`. Conventional commit messages ending `(SC-460)`. No co-author / AI attribution trailers.
- CHANGELOG: one user-facing bullet under `## Unreleased` in `draw-steel-elements/CHANGELOG.md` if the repo keeps one (plain words: "Edits in Reading view now save in notes that contain a stray carriage-return character above the block"). The workspace-level CHANGELOG is NOT yours — put any bullet text for it in your report.
- If you add a lifecycle scenario, update the expected count line in YOUR worktree's copy of dse-verify ONLY if dse-verify lives in the dse repo; it lives in the workspace (`.claude/skills/dse-verify/SKILL.md`) — do NOT edit it; report the new number instead.

## 3. Gates — the `dse-verify` skill (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`), full battery in order
Expected numbers at base b6b08f3 (dse-verify CURRENT row): tsc (incl. `tsc -p e2e`) + lint (incl. `e2e/`) clean · jest **5242 passed / 1 skipped / 230 of 231 suites** (+ your new tests) · lifecycle **27/27** (+ any you add) · e2e **`OBSIDIAN-E2E done: 80/85 ok, 0 failed, 5 known-bug, coverage: 51/51 pairs`** (+ your additions; must end `0 failed` with `Y/Y pairs`) · shots **572**, 0 FAIL, with the in-run line `pressed toggle parity OK (96 comparisons …)` · freeze **`freeze OK (276/276 …)`** (no rebaseline expected — this change must not move any print bytes; if it does, STOP and report) · parity **0 GAPs / 0 undeclared / 24 DECLARED**.

## 4. Footguns (all mandatory)
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc460-stray-cr/draw-steel-elements -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc460-stray-cr/draw-steel-elements && <cmd>'`. Devbox's sh wrapper eats `$?`/`$PIPESTATUS`, and `| tail` eats failures: run gates via a wrapper script FILE that writes the exit code to a file, or redirect output to a file and read the gate's own summary line. Never treat an echoed `$?` inside `bash -c` as truth.
- `npm ci` if `node_modules` is missing in the fresh worktree or `package.json` changed in the rebase. `rm -f main.js styles.css` in the plugin root before `npx jest` (stale bundle shadows sources).
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents. Run gates in the FOREGROUND (timeout up to 600000 ms; split if needed). Do not end your turn "waiting for a notification" from a job you started — it will never wake you.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path (include `sc460` and a timestamp).
- Never `pkill`/`killall` by a bare command pattern — concurrent efforts run the same gate commands. Kill only by PID whose command line contains `worktrees/sc460-stray-cr/` (`pgrep -af "worktrees/sc460-stray-cr/"`).
- Never `rm -rf` a shared `/tmp` glob (e.g. `/tmp/dse-obsidian-lifecycle-*`) — every concurrent effort's lifecycle/e2e vault matches it. Delete only a path you created and recorded.
- Never touch the shared freeze baseline `.superpowers/sdd/freeze-baseline.sha256`. Never `rm -rf` anything under `.superpowers/` except your own `sc460-*` files.
- ⛔ Never create a tag or release on draw-steel-elements. Never push. Never run `just deploy*` / `just wt-finish`.
- **Private scratch only (dispatcher, 2026-10-20):** the session scratchpad is shared by every agent (another effort's reviewer overwrote a shared `gate.sh`; an e2e run hit the wrong worktree). Keep every gate/wrapper script and log in a private subfolder `<scratchpad>/sc460-impl-<timestamp>/` with uniquely named scripts (`sc460-impl-gate-<step>.sh`); never a bare `gate.sh`/`run.sh`. Every script hard-codes the absolute sc460 worktree path; verify it before running.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the top-level dispatcher, not me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question in your report; I will resume you. If you ever do send a message anyway, its FIRST WORD must be `SC-460:`.

## 5. Report
Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc460-stray-cr/sc460-impl-report.md`; gate logs under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc460-stray-cr/logs/` (prefix `sc460-`). The report must OPEN with a ≤10-line executive summary (verdict, head sha, gate numbers, FAIL-on-base counts). Body: step-1 measurements (raw); the helper's design and line-break rule; every locate/write site surveyed with disposition (changed / already fine + evidence / out of scope); the lone-`\r`-inside-the-body decision; Notice behaviour; files changed; tests added; full gate numbers with log paths; `Drive-by fixes:` and `Follow-ups:` sections.

## 6. Return contract
Your final text goes to the ticket-owner, not a human: raw facts only — STATUS (DONE / NEEDS_CONTEXT / BLOCKED), head sha, commit list, measured gate numbers, FAIL-on-base counts — plus the absolute filesystem path of every evidence artifact (report, gate logs, probe output). No prose.

> **UPDATE 2026-10-20 (supersedes the base sha and numbers in §1/§3):** rebase onto dse `develop` @ `ab34293` (SC-431) and run the final full battery there. Base numbers at ab34293: jest **5262 passed / 1 skipped / 230 of 231 suites** · lifecycle **27/27** · e2e **`OBSIDIAN-E2E done: 83/87 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs`** · shots 572 + pressed-toggle line · freeze 276/276 · parity 0/0/24. Main-checkout dse dirt now also includes untracked `demo-vault/montage 1.md` — Scott's live vault, expected.

> **UPDATE 2 2026-10-20 (supersedes UPDATE 1's base):** rebase onto dse `develop` @ `71ac43a` (SC-454: dead `src/utils/CodeBlocks.ts` + its test deleted). jest base **5257 passed / 1 skipped / 229 of 230 suites**; all other numbers as UPDATE 1.

> **UPDATE 3 2026-10-20 (supersedes UPDATE 2's base):** rebase onto dse `develop` @ `188755b` (SC-364: dead collapse-prefs code removed; main.js byte-identical). Numbers unchanged from UPDATE 2.
