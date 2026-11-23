# SC-672 r9 — rebase-only round onto SC-679 + full battery (counter: a block that is empty or is not a map of keys)

You are the implementer for one round. No behaviour change, no new tests, no rewording: rebase, run the whole
battery on the rebased head, report raw facts. Your final text goes to the ticket-owner (an agent), not a human.
You may be replaced by a fresh worker at any time.

## 1. Context loading

- Decisions ledger — the last section, "Baseline move 2026-11-23 #3":
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc672-counter-malformed-block/decisions.md`
- Prior report (executive summary only): `sc672-r7-rebase-report.md`, same dir.
- **Command-shape rules: `sc672-r7-rebase-brief.md` §3, "Command-shape rules" (same dir) — they apply unchanged.
  Read them again if you are a fresh worker.** In short: `devbox run -c <plugin repo abs path> -- bash <script
  file>`; exit codes recorded inside the script file; never pipe a gate; each gate ONE blocking foreground call
  with output redirected to a log; no `run_in_background`, no Monitor; scripts via the Write tool; no `rm` with a
  variable or glob; `git -C <abs path>` always; never `pkill` by pattern; never key a wait-loop on a scratch
  filename or its contents (the scratch dir is pre-populated across sessions and branches, and a stale log from
  another branch will match — read the process's own output, or write to a per-run unique path); redirect
  long-running output to a file rather than streaming it (the 600 s stream watchdog kills silent agents).
- Worktree (superproject) `/home/scott/code/steelCompendium/worktrees/sc672-counter-malformed-block`, head `0500eb78`
  (3 CHANGELOG commits) on workspace main `b034ff73`. Plugin repo `…/sc672-counter-malformed-block/draw-steel-elements`,
  branch `sc672-counter-malformed-block`, head **`28402e57`** (8 commits) on dse `develop` `d582e7ff`.
- Verify paths before any write. **Nothing is written under `/home/scott/code/steelCompendium/workspace/`** except
  your report file. **You never call the tracker (Linear).** Never push. **Never create a tag.**
- Scratch folder (create it; yours alone):
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc672-r9-rebase/`.
  Logs in the `sc672-r3-rebase/`, `sc672-r5-fix/`, `sc672-r7-rebase/` folders are from other heads: never read them
  as results.

## 2. The task

1. **Plugin repo.** `git -C <plugin repo> fetch origin`; `origin/develop` is expected to be **`8c08bce2`** (SC-679
   landed: `src/authoring/schemaSuggest.ts`, `test/dom/authoring/schemaSuggest.test.ts`,
   `test/mocks/obsidian-core.ts` (+2 lines), `docs/writing-blocks.md`, the plugin's own `CHANGELOG.md`; nothing in
   the counter). If it is past `8c08bce2`, rebase onto what you fetched and say so. `git -C <plugin repo> rebase
   <that sha>`. No conflict is expected. If one appears in a README / doc table, keep both sides. **If a conflict
   appears in a test body or under `src/`, resolve nothing by judgment: `git rebase --abort`, and return STATUS:
   NEEDS_CONTEXT with the conflict.** Save `git range-diff d582e7ff..28402e57 <new base>..HEAD`. After the rebase
   `git diff <new base>..HEAD --stat -- src/` must list exactly `src/model/Counter.ts` and
   `src/elements/shared/undeclaredDefaults.ts`. `package.json` / `package-lock.json` differ between `d582e7ff` and
   the new base → `npm ci` before any gate.
2. **Superproject.** `git -C <worktree> fetch origin`, `git -C <worktree> rebase origin/main` (expected `66b1e5ec`
   or later; its CHANGELOG gained an SC-679 bullet). Keep every bullet from main; the SC-672 bullet stays first
   under `## Unreleased`, wording unchanged. Do not stage the ` M draw-steel-elements` pointer (no `git commit
   -a`); no `just sync`, no `git submodule update`.
3. **Nothing else.**

## 3. Gates (all required, on the rebased head)

Base at dse `develop` `8c08bce2` (dse-verify CURRENT): tsc and lint clean · jest 13944 passed / 2 skipped fresh ·
lifecycle 64/64 · e2e `OBSIDIAN-E2E done: 668/673 ok, 0 failed, 5 known-bug, coverage: 418/418 pairs`.

Expected on your head:

- `tsc` (incl. `tsc -p e2e`) and lint: clean.
- jest: **`14013 passed / 2 skipped`, 0 failed** (13944 + this branch's 69).
- e2e, ONE full run: **`OBSIDIAN-E2E done: 682/687 ok, 0 failed, 5 known-bug, coverage: 418/418 pairs`**.
- lifecycle, all seven `--only` parts: **64/64** (G-S61 alone red with "disk read was torn" = the known SC-668
  busy-host red: re-run it alone once, report both and the loadavg).
- `npm run build`; `sha256sum styles.css` must equal a clean build of the new base (scratch `git -C <plugin repo>
  worktree add <your scratch folder>/base <new base>` with `node_modules` symlinked; remove it by its literal path
  with `git worktree remove` when done). Report both hashes. Equal → shots / freeze / parity carry, NOT run. Not
  equal → stop and report.
- Known e2e flakes under load: INIT-W09 / INIT-W10, NEGO-R05, SET-X03 / SET-X04. If ONLY those fail, re-run the
  full suite once and report both lines. Any other failure: report with the log excerpt; edit nothing.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc672-counter-malformed-block/sc672-r9-rebase-report.md`.
Open with a **≤10-line executive summary**: STATUS, new plugin head + base, new superproject head + base, each
gate's measured summary line, both `styles.css` hashes. Then conflicts (or "none"), the range-diff, `Drive-by
fixes:` and `Follow-ups:`. If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Final text to the ticket-owner: raw facts only — STATUS, shas and bases, measured gate lines, conflict list,
range-diff verdict, `git status` of both repos — no prose, **plus the absolute path of every evidence artifact**.

You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the
TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with
STATUS: NEEDS_CONTEXT and the question in your report — I see your completion notification and will resume you with
the answer. If you ever do send a message anyway, its FIRST WORD must be your ticket key (`SC-672:`) — the
dispatcher routes strays by that key and cannot judge content to guess.
