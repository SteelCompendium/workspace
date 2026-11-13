# SC-613 r1 implementer brief

You are the r1 implementer for SC-613. Your final text goes to the ticket-owner, not a human.

## 1. Context loading

- Read first: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc613-conditions-type-to-search-focus/decisions.md`. It is the current state of every ruling. Never call the tracker (Linear) — not to read history, not to post. Workers never touch the tracker.
- Prior art (read the parts you need): `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc580-conditions-type-to-search/` — especially `sc580-r2-review-report.md` LOW-1 (this bug, probe RVW-P08 and the suggested fix), `decisions.md`, `sc580-r1-implementer-report.md`. Also `sc585-conditions-last-remove-focus/` for the Conditions window focus tests.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc613-conditions-type-to-search-focus`. Plugin at `.../draw-steel-elements` on branch `sc613-conditions-type-to-search-focus`, cut from dse develop `14521bf0`. Superproject on branch `sc613-conditions-type-to-search-focus` at workspace main `f58d5f02`. First: `git -C <plugin> fetch origin` and confirm `origin/develop` is still `14521bf0`; if it moved, `git -C <plugin> rebase origin/develop` and report the new base. `npm ci` (through devbox, `devbox run -c <plugin abs path> -- npm ci`) — a fresh worktree has no `node_modules`.
- Verify `pwd`/paths before any write: every edit goes in the worktree, NEVER under `/home/scott/code/steelCompendium/workspace/` (the shared main checkout). Workspace-level files (`CHANGELOG.md`) live in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc613-conditions-type-to-search-focus/CHANGELOG.md`.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault and expected; ignore it.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (about 370 KB: read "The battery, in order", "Devbox wrapping", "Lifecycle and e2e notes", and the top "CURRENT" entry of "Current expected numbers" — use `sed -n` ranges, the lines are long).

## 2. The task

Bug (ticket text): "It does not work after you click the window's title or an empty part of it. That click moves focus out of the window to the page, so the next letter does nothing." Repro: "open an initiative tracker, click a row's Add Condition, click the window's title, type `daz`. Expected: the Add search opens with "daz" typed. Actual: nothing happens."

Owner ruling, verbatim from the ledger:

> **option (a)** is the fix. Reasons: it covers every way focus can fall to `<body>` while the window is on top (title click, blank-space click, any later path), not only clicks; it adds no DOM attribute, so shots / freeze / parity / host-leak cannot move; no focus-ring question. Option (b) is not used. Constraints: route only when the key's target is the document's `body` or `documentElement`, this window's `containerEl` is the top-most `.modal-container` in its own document (a stacked modal keeps its keys), the event is not `defaultPrevented`, and the same key filter as SC-580's in-modal router (printable, no Ctrl/Meta/Alt, not Space) applies — reuse the existing router, do not fork it. Listener on the modal's own document (popout windows), registered through the modal's lifecycle so it is removed on close. Must not double-fire with the existing modalEl listener.

Code: `src/views/ConditionsModal.ts` (the SC-580 keydown listener is on `modalEl`, around l.215; its router near l.576). Things to check and decide inside the ruling (report what you chose and why):
- If Obsidian has a menu / suggest popover open over the window (e.g. a right-click menu), a key with target `body` must not be stolen from it. Measure what Obsidian does there and guard it (a `.menu` / `.suggestion-container` present in the document, or a scope that already handled the key) if needed.
- After the routed key opens the search, Escape behaviour per SC-580's r3 ruling: a search opened by a routed key returns focus on Escape to the control that had it if still connected, else "+ Add condition". With focus on `body` there was no control: it must go to "+ Add condition" (do not try to refocus `body`). Confirm.
- The listener is removed when the window closes (assert in jest: after close, a body key does nothing and no listener leaks).

Tests, all red on `14521bf0` and green on the fix:
- jest in the existing Conditions modal suites (`test/dom/views/conditions-modal*.test.ts`): title click then letter opens the search with the letter; blank-space click same; key on body with a second modal stacked on top does nothing for the Conditions window; modifier keys / Space on body do nothing; defaultPrevented key does nothing; no double-routing when focus is inside (exactly one letter in the input); after close nothing happens.
- e2e: one or more new scenarios in the Conditions modal spec (real mouse click on the window's title, then real typing `daz`, assert the search is open with "daz"; and a blank-space click variant). Pick fresh `COND-*` ids — grep every spec for the id first (scenario ids are global; a duplicate makes the runner exit 2). **Never put a bracketed ticket id like `[SC-613]` in a test title** — the runner reads bracketed text as a scenario id. Mention SC-613 in a comment instead. No new control, so coverage should stay 176/176 pairs.
- Lifecycle: no new scenario expected. If you believe one is needed, use id G-S116 only and say why.
- CHANGELOG: one bullet under `## Unreleased` in the worktree's superproject `CHANGELOG.md` (user-facing, plain words), committed on the superproject branch. Do NOT commit a submodule pointer bump on the superproject branch — the owner handles the single pointer bump at the end.

Commit in the plugin after every coherent step (fix, tests, e2e).

Mutant check: revert only the fix (keep the tests), confirm the new jest tests and new e2e scenarios fail; restore. Log it.

## 3. Gates (full dse-verify battery, in order) and expected numbers

Baseline at `14521bf0`: tsc and lint clean · jest **11833 passed / 2 skipped** fresh (without the shots cache; 11834 / 1 once a shots run cached `visual-harness/dist/obsidian-app.css`) · lifecycle **63/63** · e2e **`OBSIDIAN-E2E done: 334/337 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`** (known bugs SC-257, SC-355, SC-384) · shots **592**, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze **280/280** · parity **0 GAPs / 0 undeclared / 24 DECLARED**.

Expected after your change: jest = 11833 + your new tests; e2e = (334 + new)/(337 + new) ok, 0 failed, 3 known-bug, 176/176; everything else unchanged (no CSS / DOM attribute change, so shots, freeze, parity, host-leak must be identical).

Lifecycle runs as SEVEN `--only=` parts (comma-separated ids), one Bash call each, output to a log:
1. `G-S7a … G-S9a` (21) — take the exact id lists from dse-verify's battery table
2. `G-S9b … G-S40` (16)
3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9)
4. `G-S57,G-S62,G-S61,G-S56` (4)
5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7)
6. `G-S92,G-S96,G-S97,G-S99` (4)
7. `G-S108,G-S112` (2)
G-S91: a FAIL is a real signal unless it says the host was too slow after two re-runs. G-S97: if it fails, first check `git -C <plugin> status` for a dirty `demo-vault/.obsidian/appearance.json` (SC-622: the camera tool can leave it dirty); restore it with `git -C <plugin> checkout -- demo-vault/.obsidian/appearance.json` and re-run before blaming the change. Load-sensitive jest timeouts: check `/proc/loadavg` and re-run before believing them.

## 4. Footguns (each has cost real time)

- Devbox: `devbox run -c <abs plugin path> -- bash <script-file>`; never `cd X && devbox …` in a compound command. Record exit codes from a script file (devbox eats `$?`); read each gate's summary line. Never pipe a gate into `tail`.
- Bash calls over 180 s are moved to the background by the tool even with a long timeout; nothing is lost, the log file gets everything. One lifecycle part per call, output redirected to a log. While waiting, a read-only wait is `timeout 175 tail --pid=<pid> -f /dev/null` on YOUR OWN node pid (pick the one whose `readlink /proc/<pid>/cwd` is your worktree). Run gates as blocking foreground calls where they fit; if one goes to the background, poll its own log / rc file — never sit waiting for a completion notice, it does not wake you.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Use per-run unique paths.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Scratch: use a private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc613-r1-impl/` with uniquely named scripts and logs. Write scratch files with the Write tool.
- **Never `rm -rf` or `rm -f` a glob**, never `rm` with a shell-variable target, never touch `/tmp/dse-obsidian-lifecycle-*` or any other shared glob, never `rm -rf` `.superpowers/`. Delete only a literal path you created, or just leave scratch in place.
- Never `pkill`/`killall` by pattern; kill only a PID whose cwd/command line is in your worktree.
- `git -C <absolute path>` for every git command; never `cd X; git …`.
- `rm -f main.js styles.css` in the plugin root before `npx jest` (stale bundle shadows source) — literal paths only.
- e2e: never `--headed`; never use `DISPLAY=:1`.
- `grep` is ugrep with `-I` and reads `e2e/run.mjs` as binary; use `command grep -a` on it.
- Never create a tag or release. Never push. Never run `just deploy*`, `just wt-finish` or `just wt-rm`.
- If a single tool call hangs on a permission prompt, rewrite the step another way (Write tool, literal paths).
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` reaches the dispatcher, not me. If you need input, stop with `STATUS: NEEDS_CONTEXT` and the question in your report; I will resume you. If you ever send a message anyway, its FIRST WORD must be `SC-613:`.
- If the report-file write is blocked by your harness, return the report inline.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc613-conditions-type-to-search-focus/sc613-r1-implementer-report.md`. It must OPEN with an executive summary of at most 10 lines (verdict, plugin head sha, superproject head sha, gate numbers). Copy gate logs into the ledger dir as `sc613-r1-gate-<gate>.log` (lifecycle `sc613-r1-gate-lifecycle-part<N>.log`) and mutant logs as `sc613-r1-mutant-*.log`.

## 6. Return contract

Final text: raw facts, no prose — STATUS (DONE / NEEDS_CONTEXT / BLOCKED), plugin sha + commit list, superproject sha, each gate's measured number, mutant result, the design choices from section 2 with one line each, `Drive-by fixes:` and `Follow-ups:` lists, and the absolute filesystem path of every artifact (report, logs, any screenshots).
