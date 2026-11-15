# SC-640 r1 — implementer brief

You are the r1 implementer for SC-640. Your final text goes to the ticket-owner, not a human.

## 1. Context

- Read FIRST: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc640-negotiation-motivation-names/decisions.md`
  (ticket text verbatim + owner rulings 1-5). The rulings are the spec; quote nothing from memory.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc640-negotiation-motivation-names`
  - plugin: `.../draw-steel-elements`, branch `sc640-negotiation-motivation-names`, starts at dse develop `5f962390`.
  - superproject: branch `sc640-negotiation-motivation-names` at `f97c41bc` (workspace origin/main).
  - First: `git -C <plugin abs path> fetch origin` and confirm `origin/develop` is still `5f962390`; if it moved, rebase onto it and say so.
- **Never edit the main checkout** `/home/scott/code/steelCompendium/workspace/` (except writing your report into the ledger dir). Workspace-level files (CHANGELOG.md) live in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc640-negotiation-motivation-names/CHANGELOG.md`. The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault: expected, not yours, do not touch or report it.
- **Workers never call the tracker** (Linear): no reads, no posts.
- Prior art to read as needed (landed, tracked): `docs/superpowers/dse-overhaul/build-ledgers/sc649-negotiation-roll-counts-ledger.md`, `…/sc638-negotiation-wrong-type-values-ledger.md`, `…/sc627-montage-duplicate-hero-ledger.md` (main checkout paths are fine to READ).

## 2. Task

Implement owner rulings 1-4 of the ledger (rule 5 is the out-of-scope list — respect it: do not edit `src/elements/negotiation/focusRules.ts`, the Reset handler, or anything under `src/elements/montage/`).

Code starting points (at `5f962390`): `src/drawSteelAdmonition/negotiation/ArgumentView.ts` (`motivationChips` / `pitfallChips` maps, `buildAppeals`, `sync`, `paintMotivationChip`, `paintPitfallChip`, `onMotivationToggled`, `onPitfallToggled`, `resolveArgument`), `src/drawSteelAdmonition/negotiation/MotivationsPitfallsView.ts` (`rows` map, `refresh`, `addMotivations`, `paintChip`, `addPitfalls`), `src/model/NegotiationData.ts` (`setMotivationUsed`, `argumentReusesMotivation`, `argumentUsesMotivation`, `argumentUsesPitfall`, `argumentReuseChecked`, the SC-638 used-list snapshot `readUsedEntries` / `restoreUsed`). `grep` for every other `.name ===` / `includes(name)` / `indexOf(name)` on motivations or pitfalls in `src/` (chrome summary, end band, `src/elements/negotiation/*`) and bring each under ruling 2's one helper. List every site you changed in the report.

Tests:
- Flip the SC-640 markers to plain tests (remove `test.failing` / `knownBug` wrappers and the `[known bug SC-640]` title suffix): jsdom `[K06]`, `[K07]`, `[K10]` in `test/dom/elements/negotiation-bugs.test.ts`; e2e `[NEGO-W04]`, `[NEGO-W05]` in `e2e/specs/negotiation/wrong-values.e2e.ts`. Tighten them to assert the ruled behaviour (one chip per distinct name + the notice; nameless label), not just "non-empty".
- New jsdom tests (model + DOM) for: per-row Spent independence (toggling the SECOND same-named row's Spent flips only the second entry in the note); the merged chip spent when any same-named entry is spent; Complete Argument spends every same-named entry; casing/space variants (`motivationsUsed: [" higher authority "]` presses the "Higher Authority" chip; un-pressing removes that entry; pressing writes the entry's spelling); `Power` + `power` entries merge with the notice; nameless chip label/aria/tooltip and that it toggles and round-trips without writing "Unnamed" into the note; same for pitfalls; read-only host shows the notice; SC-638 typed round trip still holds (`motivationsUsed: [5]` untouched stays the number 5); SC-649 roll/Same Argument/Complete checks still read what the card shows under the new rule. Integrity probes: text above/below the block survives a chip write; two negotiation blocks in one note don't cross-talk.
- New e2e (real Obsidian) for at least: same-named motivations — one chip + notice, the second row's Spent writes only the second entry; nameless chip clicks and writes `""` to `motivationsUsed`. Scenario ids: next free `NEGO-*` ids (scenario ids are global; check `command grep -a -rn "NEGO-" e2e/`). **Never put a bracketed ticket id like `[SC-640]` in a test title** — the e2e runner reads titles for scenario ids. Coverage pairs: no new control expected; if you add one it needs a `data-dse-control` id + manifest row.
- CHANGELOG: one bullet under `## Unreleased` in YOUR worktree superproject's `CHANGELOG.md`, user-facing wording (e.g. two motivations with the same name now share one labelled chip with a note saying so; a motivation with no name is labelled "Unnamed Motivation"; each row's Spent works on its own; casing and spaces are ignored when matching names). Commit it on the superproject branch as its own commit. **Do NOT commit a submodule pointer bump** — the owner does ONE bump at the end.
- Commit inside the plugin after each coherent step (fix, jsdom, e2e), messages prefixed `SC-640:`. No co-author or AI attribution lines in commit messages.

## 3. Gates — the `dse-verify` skill

Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (≈480 KB; read in parts: "The battery, in order", "Devbox wrapping", "Stale main.js", "Jest timeouts", "Lifecycle and e2e notes", "THE exit-code footgun", "Freeze semantics" head, "Current expected numbers" top entry). Run the full battery in order: tsc, lint, jest, lifecycle (7 parts), e2e (full), shots, freeze, parity last.

- Fresh worktree has no `node_modules`: run `npm ci` once first (script file through `devbox run -c <abs plugin dir> -- bash <script>`, output to a log).
- `rm -f main.js styles.css` in the plugin root before jest — use the LITERAL absolute paths, no variables.
- Baseline at `5f962390`: jest **13345 passed / 1 skipped** with the shots cache (fresh 13344 / 2) · lifecycle **64/64** · e2e **`598/613 ok, 0 failed, 15 known-bug, coverage: 417/417 pairs`** · shots **592**, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze **280/280** · parity **0 / 0 / 24**.
- Expected after: jest = baseline + your new tests (markers flip in place, count unchanged for them) · lifecycle 64/64 (no lifecycle scenario needed) · e2e `(600+N)/(613+N) ok, 0 failed, 13 known-bug, coverage: 417/417` · shots 592 · freeze 280/280 (no frozen fixture has duplicate or nameless entries; any moved frozen byte is a STOP — report it, never touch the baseline) · parity 0/0/24.
- Lifecycle: SEVEN parts with `--only=` (EQUALS sign — with a space the runner silently runs the whole suite; check the first log lines show only that part's ids). Ids comma-separated:
  1. `G-S7a … G-S9a` (21) — 2. `G-S9b … G-S40` (16) — take the exact id lists for parts 1-2 from dse-verify's lifecycle row
  3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64`
  4. `G-S57,G-S62,G-S61,G-S56`
  5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91`
  6. `G-S92,G-S96,G-S97,G-S99`
  7. `G-S108,G-S112,G-S115`
  G-S56 stays LAST in SCENARIOS order (don't reorder anything). One part per Bash call, output to a unique log file. Part 7 takes ~200 s: the Bash tool moves calls over 180 s to the background — start it with output to a log + rc file, then poll with `timeout 175 tail --pid=<your own node pid> -f /dev/null` (pick the pid whose `readlink /proc/<pid>/cwd` is your worktree's draw-steel-elements), then read the log.
- Known flakes: a G-S91 FAIL is real unless it says the host was too slow after two re-runs. G-S115 (g) is a suspected flake (SC-633): re-run part 7 once on a loaded host; any other failure is real. INIT-W10 e2e flaked once under heavy load (SC-654). SET-X03 / SET-X04 e2e flake now and then (SC-657); a re-run passes. If G-S97 fails, first check `demo-vault/.obsidian/appearance.json` in YOUR worktree is unmodified (`git -C <plugin> status`) — the camera tool can dirty it (SC-622); restore it with `git -C <plugin> checkout -- demo-vault/.obsidian/appearance.json` before blaming the change.
- Jest default timeout is 30 s (SC-568): an "Exceeded timeout" is a real hang until proven otherwise.
- Report each gate's own summary line (jest "Tests:" line, `OBSIDIAN-LIFECYCLE done:` per part, `OBSIDIAN-E2E done:` line, shots count, freeze result, parity counts). Exit codes only from a script file run through devbox, never an echoed `$?` inside `bash -c`.

## 4. Footguns (all of them apply)

- Run every gate as a blocking FOREGROUND call (split into calls under the tool timeout). No `run_in_background` waits on completion notices, no `Monitor`. If something must run detached, poll its own log / rc file. Never key a wait on a scratch filename or its contents from another run — use per-run unique paths.
- Redirect long output to a file rather than streaming it (the 600 s stream watchdog kills silent agents).
- Your private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc640-r1-impl/` — unique script/log names inside it. Write scratch files with the Write tool, not heredocs.
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad, never a glob, never a shell-variable path.** Leave throwaway files in place. The only `rm` you run is the literal `rm -f /home/scott/code/steelCompendium/worktrees/sc640-negotiation-motivation-names/draw-steel-elements/main.js /home/scott/code/steelCompendium/worktrees/sc640-negotiation-motivation-names/draw-steel-elements/styles.css` before jest.
- `devbox run -c <abs plugin path> -- bash <script file>`; never `cd` inside a compound command; `git -C <absolute path>` for every git command.
- Never `pkill`/`killall` by pattern. Kill only a PID whose `/proc/<pid>/cwd` or command line is inside your worktree.
- `grep` is ugrep with `-I` and reads `e2e/run.mjs` as binary — use `command grep -a`.
- Never touch the shared freeze baseline or `.superpowers/` outside `sc640-negotiation-motivation-names/`.
- Never tag or release draw-steel-elements. Never push.
- You cannot `SendMessage` me — `to: 'main'` reaches the dispatcher, not me. If you need input, end your turn with `STATUS: NEEDS_CONTEXT` and the question; I will resume you. If you ever do send a message, its FIRST WORD must be `SC-640:`.
- If the report-file write is blocked, return the report inline.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc640-negotiation-motivation-names/sc640-r1-implementer-report.md`. It must OPEN with a ≤10-line executive summary (verdict, plugin head sha, superproject CHANGELOG sha, gate numbers). Body: every changed site (file:line), the notice wording you chose, new test ids, deviations from the rulings with reasons, `Drive-by fixes:` and `Follow-ups:` lists.

## 6. Return contract

Final text to me: raw facts, no prose — STATUS (DONE / NEEDS_CONTEXT / BLOCKED), plugin head sha + commit list, superproject CHANGELOG commit sha, each gate's summary line, and the absolute path of every evidence artifact (report, gate logs, any failure bundles).
