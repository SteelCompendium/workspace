# SC-606 r2 — independent adversarial review brief

You are the independent reviewer for the SC-606 ticket-owner. You did not write this code. Your final text goes to the ticket-owner, not a human. **Workers never call the tracker** (Linear) — not to read history, not to post.

## 1. Context loading

- Ledger (current state, binding decisions O1-O4): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc606-montage-edit-no-skills/decisions.md`.
- The implementer's report: `.../sc606-montage-edit-no-skills/sc606-r1-impl-report.md` (read its summary; treat its claims as claims to verify, not facts).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc606-montage-edit-no-skills` (plugin at `.../draw-steel-elements`, branch `sc606-montage-edit-no-skills`). Head under review: plugin `df250b20` on base `8b84b635`; superproject worktree `7ab086d2` (CHANGELOG bullet). Use `git -C <absolute path>` for every git command. Do not commit to the branch; do probes in a private scratch copy (`git archive` export or a `git worktree add` into your private scratch dir).
- Gate reference: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (large; read the battery table and the devbox / exit-code / load-sensitive sections; grep for the rest). Do not edit it.
- Prior art: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc598-hover-modal-fast-second-click/` (`sc598-r3-review-report.md` INFO-4, the r3 probe scripts `sc598-r3-probe-scenario.js.txt`, `sc598-r3-make-probe.py.txt`, `sc598-r3-probe-final.sh.txt`).

## 2. The task — execute and probe, not just read

The bug: "On a Montage board, click a recorded action to edit it. If that hero's entry in the block has no `skills_used` list, the window opens half-built and an error is thrown. In a hover preview, the half-built window and the preview then close on the next click."

Review the diff `git -C <plugin> diff 8b84b635..df250b20` and probe:

1. **Completeness (O1)**: grep every `skills_used` read/write (and other optional participant fields) yourself; for each, build a key-less-hero case and run it (jest scratch test outside the committed tree, or node against the model). Log a new action, edit one, correct its skill, remove it, reset, end round, tally, reuse warning, add/rename/remove a hero, a hero named in `entries` but absent from `participants`, `participants` absent entirely, `skills_used: null`, `skills_used: "Climb"` (a scalar, as a user might hand-type), YAML `skills_used:` with no value.
2. **No churn (O2)**: parse → unrelated write → serialize must leave a key-less hero's entry byte-identical; a key-less hero who logs a skill gets the key in schema position; removing that skill again — what is written (`[]` vs key removed)? Report the behaviour; flag it only if it churns a note the user did not change.
3. **Tests are not vacuous**: revert the fix (scratch copy) and confirm each new test goes red; mutate the fix (e.g. guard only one site) and see which test catches it.
4. **Real Obsidian**: re-run the SC-598 r3 `monttextns` probe (or the implementer's version from its report) against a base bundle and against head via `DSE_LIFECYCLE_BUNDLE`; confirm base red, head green. Also a plain Reading-view edit of a logged action for a key-less hero.
5. **Battery spot-check**: re-run tsc, lint, jest, e2e and lifecycle part 5 (`G-S59 G-S49 G-S73 G-S77 G-S83 G-S87 G-S91`) on head. Expected: jest 7341 + the new tests passed / 2 skipped on a fresh tree (+1 / 1 skipped after a shots run); lifecycle part 5 7/7; e2e `272/276 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs`. Trust the implementer's shots/freeze/parity numbers unless the diff touches CSS or a rendered DOM (then re-run freeze: 280/280).
6. CHANGELOG bullet: plain, user-facing, accurate.

Findings by severity (CRITICAL/HIGH/MEDIUM/LOW/INFO) with file:line, a failure scenario, and a prescribed fix. Separate `Follow-ups:` (out of scope) from findings.

## 3. Footguns (all binding)

- Devbox: `devbox run -c <abs path> -- bash <script file>` with the script written by the Write tool; never `cd` inside a compound command; never trust an echoed `$?` in `bash -c`; read each gate's own summary line; no pipes after a gate. `rm -f main.js styles.css` in the plugin root before jest.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc606-r2-<yourAgentId>/`, uniquely named files.
- **Never `rm -rf` a `/tmp` glob** (a worker once wiped other efforts' kept lifecycle FAIL dirs). Delete only literal paths you created. No `rm` with a shell-variable target. Never touch `.superpowers/` outside this effort's dir.
- Never `pkill`/`killall` by pattern; kill only a PID whose cwd/command line is inside your own paths.
- Run each gate as one blocking foreground call with output redirected to a file (600 s watchdog); no background jobs or monitors.
- Never put a bracketed ticket id in a test title.
- Never touch the main checkout (`/home/scott/code/steelCompendium/workspace/`) except writing your report into the ledger dir; its dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — ignore it.
- If the report-file write is blocked, return the report inline.
- You cannot `SendMessage` me. If you need input, end with `STATUS: NEEDS_CONTEXT` and the question. If you ever send a message anyway, its FIRST WORD must be `SC-606:`.

## 4. Report & return

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc606-montage-edit-no-skills/sc606-r2-review-report.md`, opening with a ≤10-line executive summary (verdict LAND / FIX, counts by severity, gate numbers measured). Final text: raw facts — verdict, findings one line each with file:line, measured numbers, and the absolute path of every artifact.
