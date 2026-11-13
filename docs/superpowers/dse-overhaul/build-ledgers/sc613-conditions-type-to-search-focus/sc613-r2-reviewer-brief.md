# SC-613 r2 independent review brief

You are the independent reviewer for SC-613 r1. Your final text goes to the ticket-owner, not a human.

## 1. Context loading

- Ledger (current state of every ruling): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc613-conditions-type-to-search-focus/decisions.md`. Implementer's brief: `sc613-r1-implementer-brief.md`; report: `sc613-r1-implementer-report.md` (same dir). Never call the tracker (Linear) — not to read, not to post.
- Prior art: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc580-conditions-type-to-search/` (`sc580-r2-review-report.md` LOW-1 is this bug; its probe spec `sc580-r2-probe-spec.e2e.ts.txt` is a template for real-Obsidian probes).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc613-conditions-type-to-search-focus`; plugin `.../draw-steel-elements`, branch `sc613-conditions-type-to-search-focus`, base dse develop `14521bf0`. The diff under review: `git -C <plugin> diff 14521bf0..HEAD` plus the superproject's CHANGELOG commit(s) (`git -C <worktree> log origin/main..HEAD`). Do NOT commit to the branch; put probes in scratch, and restore any source you mutate (`git -C <plugin> status` clean at the end).
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (read "The battery, in order", "Devbox wrapping", "Lifecycle and e2e notes", and the top CURRENT entry of "Current expected numbers" with `sed -n` ranges; the lines are long).

## 2. The task

The ruling the code must satisfy, verbatim from the ledger:

> **option (a)** is the fix. Reasons: it covers every way focus can fall to `<body>` while the window is on top (title click, blank-space click, any later path), not only clicks; it adds no DOM attribute, so shots / freeze / parity / host-leak cannot move; no focus-ring question. Option (b) is not used. Constraints: route only when the key's target is the document's `body` or `documentElement`, this window's `containerEl` is the top-most `.modal-container` in its own document (a stacked modal keeps its keys), the event is not `defaultPrevented`, and the same key filter as SC-580's in-modal router (printable, no Ctrl/Meta/Alt, not Space) applies — reuse the existing router, do not fork it. Listener on the modal's own document (popout windows), registered through the modal's lifecycle so it is removed on close. Must not double-fire with the existing modalEl listener.

Execute and probe, do not just read. At least:
- Real-Obsidian probes (scratch e2e spec, `--only=` your probe ids, never committed): title click + `daz`; blank-space click + `daz`; a second modal stacked over the Conditions window (e.g. the colour chooser or a stamina window opened from elsewhere if reachable, or any Obsidian modal) + key on body; an Obsidian right-click menu / suggest open + letter; Escape after a body-routed open (focus should land on "+ Add condition"); close and reopen the window several times then a body key (exactly one letter typed, no leaked listeners — count listeners or letters); the window opened from the hover / pinned-sidebar openers if the e2e driver can reach them; a key on body with NO Conditions window open does nothing (the plugin must not route keys globally); IME / dead-key composition (`isComposing`) if the router handles it in-modal.
- Does the body route fire for a key typed in the Obsidian editor behind (target is the editor, not body)? It must not.
- Mutants: revert the fix and confirm the new tests fail; remove each guard (top-most check, defaultPrevented, target check, cleanup on close) one at a time and report which tests kill it.
- Re-run the full battery yourself (or at least tsc, lint, jest, e2e full, and lifecycle part 4 that holds G-S1/G-S56 Conditions-related scenarios if any — check which parts touch the Conditions modal via `command grep -a` in `visual-harness/obsidian-lifecycle.mjs`). Shots + freeze + parity: run them if `styles.css` or any DOM attribute changed; if the diff touches no CSS and no rendered markup, say so with evidence (`git diff --stat`, `styles.css` byte compare against a `14521bf0` build) instead.

Expected numbers at base `14521bf0`: jest **11833 passed / 2 skipped** fresh (11834 / 1 with the shots cache) · lifecycle **63/63** (seven `--only=` parts: `G-S7a … G-S9a` 21; `G-S9b … G-S40` 16; `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` 9; `G-S57,G-S62,G-S61,G-S56` 4; `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` 7; `G-S92,G-S96,G-S97,G-S99` 4; `G-S108,G-S112` 2) · e2e **`334/337 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`** (+ the new scenarios) · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24. G-S91 FAIL is real unless "host too slow after two re-runs". G-S97 red: first check for a dirty `demo-vault/.obsidian/appearance.json` (SC-622) and `git -C <plugin> checkout --` it before blaming the change.

Findings by severity (HIGH / MEDIUM / LOW / INFO) with file:line, a failure scenario, and a prescribed fix. Verdict: LAND or FIX.

## 3. Footguns

- Devbox: `devbox run -c <abs plugin path> -- bash <script-file>`; never `cd X && devbox …`. Exit codes from a script file; read summary lines; never pipe a gate into `tail`.
- Bash calls over 180 s are backgrounded by the tool; output to a log; wait read-only with `timeout 175 tail --pid=<pid> -f /dev/null` on YOUR node pid (`readlink /proc/<pid>/cwd` in your worktree). Never wait on a completion notice; poll the log / rc file.
- Never key a wait-loop on a scratch filename or its contents (stale logs from other branches match). Unique per-run paths.
- Redirect long output to files; the 600 s stream watchdog kills silent agents.
- Scratch: private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc613-r2-review/`, Write tool for files.
- **Never `rm -rf` / `rm -f` a glob**, never `rm` with a shell-variable target, never touch `/tmp/dse-obsidian-lifecycle-*` or `.superpowers/` wholesale. Never `pkill`/`killall` by pattern.
- `git -C <absolute path>` always. `rm -f main.js styles.css` (literal) in the plugin root before `npx jest`.
- e2e: never `--headed`, never `DISPLAY=:1`. No bracketed ticket id in a test title (the runner takes it for a scenario id). Scenario ids are global — pick probe ids that exist nowhere (e.g. `RVW613-P01`).
- `grep` is ugrep `-I`; use `command grep -a` on `e2e/run.mjs` and other files read as binary.
- Never push, tag, release, deploy, `wt-finish`, `wt-rm`.
- You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher. Need input: stop with `STATUS: NEEDS_CONTEXT`. If you send a message anyway, first word `SC-613:`.
- If the report-file write is blocked, return the report inline.

## 4. Report and return contract

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc613-conditions-type-to-search-focus/sc613-r2-review-report.md`, OPENING with an executive summary of at most 10 lines (verdict, counts by severity, gate numbers). Copy logs as `sc613-r2-*.log` and your probe spec as `sc613-r2-probe-spec.e2e.ts.txt` into the ledger dir.

Final text: raw facts — verdict, findings (severity, file:line, one line each), measured gate numbers, mutant kill table, absolute paths of every artifact.
