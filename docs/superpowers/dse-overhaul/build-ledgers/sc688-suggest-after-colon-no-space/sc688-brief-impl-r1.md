# SC-688 implementer brief, round 1

## 1. Context loading

- Read first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc688-suggest-after-colon-no-space/decisions.md` (the ledger; it is the spec). Also read the dse repo's `AGENTS.md`/`CLAUDE.md` and the dse-verify skill at `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (battery, command shapes, exit-code footguns, "Current expected numbers").
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc688-suggest-after-colon-no-space`. Work ONLY in `/home/scott/code/steelCompendium/worktrees/sc688-suggest-after-colon-no-space/draw-steel-elements` (branch `sc688-suggest-after-colon-no-space`). Verify `pwd`/branch before any write. Use `git -C <absolute path>` for every git command; never `cd X; git ...`.
- First: `git -C <plugin dir> fetch origin` and confirm `origin/develop` is `23f3e61b`. If develop moved, rebase onto it and note the new sha. A fresh worktree has no `node_modules`: run `npm ci` first (via a script file through `devbox run -c <abs plugin dir> -- bash <script>`, output to a log).
- **You never call the tracker** (Linear) — not to read history, not to post. The ledger is your context.
- The main checkout `/home/scott/code/steelCompendium/workspace` is shared and off-limits for edits. Its dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault and is expected — do not flag or touch it.

## 2. The task

Owner rulings, quoted from the ledger:

> 1. **Fix option: write the space.** Accepting a value whose replaced range starts right after the `:` (no whitespace between) writes `: <value>`-style, i.e. a single space then the value: `mode:` + accept `power-roll` -> `mode: power-roll`. The list keeps opening on `mode:` with no space (the plain matrix row at `test/dom/authoring/schemaSuggestMatrix.test.ts:81`, `['mode:', [...]]`, stays green and unchanged).
> 2. **The mid-word value case is in scope** (its jsdom `test.failing` in `test/dom/authoring/authoringKnownBugs.test.ts` cites SC-688). An enum (value) accept replaces the whole value word under the cursor: from `start` through the end of the run of non-whitespace characters after the cursor. `mode: op|posed` + accept `opposed` -> `mode: opposed`.
> 3. **The KEY path is OUT of scope** — that is SC-678 (Backlog, its own `test.failing` marker). Do not change key-accept behaviour; SC-678's marker must stay `test.failing` and still fail.

Code: `src/authoring/schemaSuggest.ts` — `onTrigger` (enum branch, the `enumCtx` regex) and `selectSuggestion`. Keep the SC-679 behaviour (cursor ends right after the accepted value; `this.close()` after accept). With the space written, the cursor must land after the value (e.g. `mode: power-roll|`), not one short.

Markers to flip (they cite SC-688 and must become plain passing tests, with comments updated to describe the fixed behaviour; tighten assertions to the exact expected text now that the behaviour is decided):
- `test/dom/authoring/schemaSuggestMatrix.test.ts` ~line 169: `test.failing('an enum value right after the colon ...')` -> plain `test`, assert `mode: flat` exactly and the cursor position.
- `test/dom/authoring/authoringKnownBugs.test.ts` ~line 213: the SC-688 mid-word `test.failing` -> plain test (move it next to the other enum-accept tests if that is the file convention for fixed bugs; follow whatever SC-679's fixed test did). Update the file-header comment (~line 4) that lists SC-688 as a known bug.
- `e2e/specs/authoring/gate-on.e2e.ts` ~line 208: `knownBug('SC-688', '[AUTH-G21] ...')` -> a plain e2e test (look at how SC-687's `AUTH-I27` was flipped from known-bug to plain for the exact form). Assert the saved line is `mode: power-roll` exactly, not just "parses".

New tests (jsdom, in the existing schemaSuggest test files):
- no-space accept with a partial query: `mode:te|` + accept `test` -> `mode: test`, cursor after it.
- mid-word with no space: `mode:op|posed` + accept `opposed` -> `mode: opposed`.
- mid-word with trailing text after a space: `mode: op|posed # c` (or `mode: op|p xyz`) -> only the word under the cursor is replaced; text after the whitespace survives.
- `difficulty:` no-space accept -> `difficulty: easy`.
- integrity: lines above and below the block are untouched; the existing `mode: ` (with space) accept still writes exactly one space (no double space).
- the key path is unchanged (SC-678 marker still `test.failing` and failing — confirm by the jest summary).
Add one e2e test next to AUTH-G21 for the mid-word value case in real Obsidian (new id: next free `AUTH-G2x`), if the gate-on spec structure allows; it must assert the exact saved line. If adding it needs a new coverage pair, report that.

CHANGELOG: the dse repo's changelog under `## Unreleased` gets one user-facing bullet (note `ds-roll` is behind the experimental setting). Follow the file's existing style.

Commit after each coherent step (code, tests, e2e, changelog). Conventional messages prefixed `fix(SC-688):` / `test(SC-688):` / `docs(SC-688):`. Do NOT push. No tags, ever.

Drive-by fixes allowed only if obviously correct, local to a file you touched, and cannot move a gate baseline — list them under `Drive-by fixes:`. Anything else goes under `Follow-ups:` untouched.

## 3. Gates (dse-verify; run in order, each as a blocking FOREGROUND call)

Expected numbers at dispatch (dse develop @ 23f3e61b, from dse-verify CURRENT):
- tsc (incl. `tsc -p e2e`) and lint clean.
- jest baseline **14724 passed / 2 skipped** without the shots cache. Your expected: 14724 + (new jsdom tests you add) passed, 2 skipped, 0 failed. (Flipping a `test.failing` to `test` does not change the count.)
- lifecycle **64/64** — run as the seven `--only` parts described in dse-verify and report the union.
- e2e baseline `OBSIDIAN-E2E done: 841/851 ok, 0 failed, 10 known-bug, coverage: 486/486 pairs`. Your expected after flipping AUTH-G21: **842/851 ok, 0 failed, 9 known-bug, coverage 486/486** plus +1 ok/+1 total per new e2e test (and any new pair you report). Must end `0 failed` with `coverage: Y/Y pairs`.
- shots 592 / freeze 280/280 / parity 0/0/24 may CARRY only if the built `styles.css` is byte-identical to a clean develop@23f3e61b build: build both (`npm run build` or the repo's build script; for the clean build use a `git worktree add` of `23f3e61b` into an absolute path in your private scratch folder) and `sha256sum` both. Report both hashes. If they differ, run shots, freeze, parity.

## 4. Footguns (all apply)

- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc688-suggest-after-colon-no-space/draw-steel-elements -- bash <script file>`. Never `cd` inside a compound command. Devbox's wrapper eats `$?`/`$PIPESTATUS`; never pipe a gate into `tail`. Record exit codes from inside a script file and read each gate's own summary line.
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc688-impl-<your agentId>/`, uniquely named scripts and logs inside it. Create files with the Write tool. No generic names like `gate.sh`.
- No `rm` with a shell-variable target, no glob `rm`, never `rm -rf` anything under `.superpowers/` or a shared `/tmp` glob (e.g. never `/tmp/dse-obsidian-lifecycle-*`). Delete only literal paths you created.
- Never `pkill`/`killall` by pattern. Kill only by PID, after checking `readlink /proc/<pid>/cwd` is inside your worktree.
- Run each gate as one blocking foreground call; split lifecycle/e2e into parts to stay under the 600 s tool timeout. No `run_in_background`, no `Monitor`, no waiting on completion notices. If a run must exceed 600 s, start it with output to a unique log plus an rc file and poll that log/rc file. Redirect long output to files rather than streaming it.
- Never key a wait-loop on a scratch filename or its contents from a previous run — the scratch dir is pre-populated across sessions and branches. Use per-run unique paths.
- Jest under load can time out (dse-verify "Jest timeouts under load"); re-run a flaky suite once and report it.
- You cannot `SendMessage` me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question in your report. If you ever do send a message anyway, its FIRST WORD must be `SC-688:`.
- If the report-file write is blocked by your harness, return the report inline.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc688-suggest-after-colon-no-space/sc688-impl-r1-report.md`. It must OPEN with a <=10-line executive summary (verdict, final sha, gate numbers).

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts, no prose. Include: STATUS (DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED), branch + final sha + base sha, commit list, files changed, each gate's summary line verbatim, styles.css hashes (yours vs clean), new test names / e2e ids, `Drive-by fixes:`, `Follow-ups:`, and the absolute path of every evidence artifact (report, gate logs).
