# SC-606 r1 — implementer brief (survey + fix + tests + battery + real-Obsidian probe)

You are a worker for the SC-606 ticket-owner. Your final text goes to the ticket-owner, not a human.
**Workers never call the tracker** (Linear) — not to read history, not to post.

## 1. Context loading

- Ledger (read first; it is current state): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc606-montage-edit-no-skills/decisions.md`. Owner decisions O1-O4 there are binding.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc606-montage-edit-no-skills`, the plugin at `.../draw-steel-elements` on branch `sc606-montage-edit-no-skills`, at dse develop `8b84b635`. Verify `pwd`/branch before any write. Fetch and rebase first: `git -C <plugin path> fetch origin && git -C <plugin path> rebase origin/develop` (expect it to stay at or near `8b84b635`; if develop moved, report the new base sha). Use `git -C <absolute path>` for every git command, never `cd X; git ...`.
- Gate reference: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (about 310 KB; read the "battery, in order" table, "Devbox wrapping", "Stale main.js", "Load-sensitive jest suites", "Lifecycle and e2e notes" and "THE exit-code footgun" sections; grep for the rest). Do NOT edit SKILL.md.
- Prior art: SC-598's preserved ledger `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc598-hover-modal-fast-second-click/` — `sc598-r3-review-report.md` INFO-4 (the finding), the probe `sc598-r3-probe-scenario.js.txt`, `sc598-r3-make-probe.py.txt`, `sc598-r3-probe-final.sh.txt`, logs `sc598-r3-probe-final-{head,base}.log`, `sc598-r3-probe-head2.log` (trial `monttextns`). SC-597's `gs87-mont` fixture (in `visual-harness/obsidian-lifecycle.mjs`) is a participant with no `skills_used`.

## 2. The task

The bug (ticket text): "On a Montage board, click a recorded action to edit it. If that hero's entry in the block has no `skills_used` list, the window opens half-built and an error is thrown. In a hover preview, the half-built window and the preview then close on the next click." Stack: `src/elements/montage/model.ts:367` `p.skills_used.slice()` in `wouldReuseSkill`, via `LogActionModal`'s `refreshSkillWarning` in `onOpen`; because `onOpen` throws, `DseModal.open` never reaches `keepHoverPreviewAlive`.

Do, in order, committing after each coherent step:

1. **Survey** every read and write of `skills_used` (and any other optional participant field the same way) in `src/elements/montage/` and anything else that touches a montage participant. List each site and whether it crashes on a missing key (e.g. `model.ts:341` indexOf, `:348` push, `:367` slice). Check whether logging a NEW action for such a hero also fails today.
2. **Red first**: jest tests that fail on base — a model unit test per crashing site, and a DOM test that opens `LogActionModal` in EDIT mode for an entry whose hero has no `skills_used` and asserts the window is fully built (its fields present, the reuse warning state correct) and nothing throws. Put them beside the existing montage tests (`test/unit/model/montage-tally.test.ts`, `test/dom/elements/montage.test.ts`) or a new montage test file. Never put a bracketed ticket id in a test title (the e2e runner reads titles for scenario ids; keep the habit everywhere).
3. **Fix** per ledger O1/O2: a hero with no key works at every site; a write that does not change that hero's skills must not add `skills_used: []` (or any key) to the hero's entry in the note; a hero with no key who logs a skill gets the key with that skill; `serialize` keeps §B.5 key order. Add a test that proves O2 (parse a block with a key-less hero, perform an unrelated write such as logging an action for ANOTHER hero, serialize: the key-less hero's entry is byte-identical). Keep the fix minimal and local to the montage element.
4. **CHANGELOG**: one user-facing bullet under `## Unreleased` in YOUR worktree's superproject file `/home/scott/code/steelCompendium/worktrees/sc606-montage-edit-no-skills/CHANGELOG.md` — never under `/home/scott/code/steelCompendium/workspace/`. Plain words, e.g. "Montage: clicking a logged action to edit it now opens its window when the hero's entry has no skills list (it opened half-built and, in a hover preview, closed on the next click)." Commit it in the superproject worktree on its branch.
5. **Real-Obsidian probe** (evidence, not committed): rebuild the SC-598 r3 probe in a private scratch dir and run trial `monttextns` (Reading view, and Live Preview if the probe has it) against a base bundle (`8b84b635`, built from a `git archive` export) and against your head, pinned via `DSE_LIFECYCLE_BUNDLE`. Expected: base reproduces the `onOpen` throw / half-built window / preview closing on the next click; head opens the full window, the second click keeps it and the preview, no page error. Also a plain (non-hover) Reading-view edit of the logged action if the probe can do it cheaply. Do not commit the probe.

## 3. Gates (dse-verify battery, in order; run each as one blocking FOREGROUND call)

Baseline at `8b84b635`:
- tsc clean, lint clean.
- jest: `7341 passed / 2 skipped` on a fresh worktree (before a shots run). Yours = 7341 + your new tests. `rm -f main.js styles.css` in the plugin root before `npx jest`. Timeout-shaped reds in the load-sensitive suites listed in the skill: check `/proc/loadavg`, re-run those suites alone.
- lifecycle `57/57 ok, 0 failed`, run as FIVE `--only` parts (each its own foreground call, output to a unique log): `G-S7a G-S7b G-S6a G-S6b G-S6u G-S28 G-S5n G-S1 G-S2 G-S3 G-S4 G-S5 G-S6c G-S6d G-S6e G-S6f G-S6g G-S6h G-S6i G-S8 G-S9a` (21); `G-S9b G-S9d G-S9e G-S9f G-S9c G-S10 G-S11 G-S12 G-S13 G-S15 G-S14 G-S18 G-S32 G-S36 G-S33 G-S40` (16); `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9); `G-S57 G-S62 G-S61 G-S56` (4; G-S56 LAST); `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87 G-S91` (7). Report the union. Add no lifecycle scenario (ledger O3).
- e2e: `272/276 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs` (known bugs SC-257, SC-355, SC-384, SC-580).
- shots: 592 shots; host-leak 163/978, modal host-leak 39/234, capture clip 147 (read the in-run gate lines).
- freeze: `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh <plugin>/visual-harness/shots` → 280/280, 0 FAILED. A montage fixture in the shots set uses `skills_used` already, so expect no byte change; if any frozen shot moves, STOP and report (do not touch the baseline).
- parity LAST: 0 GAPs / 0 undeclared WARNs / 24 declared.
- After the shots run, re-read jest if you want the "+1 passed, 1 skipped" CURRENT form; report both numbers you measured.

## 4. Footguns (all binding)

- Devbox: tools are not on PATH. Use `devbox run -c <abs plugin path> -- bash <script file>` with the script file written by the Write tool; never `cd` inside a compound command; never trust an echoed `$?` inside `bash -c` — record exit codes from a script file and read each gate's own summary line. No pipes after a gate.
- Private scratch: everything goes in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc606-r1-<yourAgentId>/` with uniquely named scripts and logs (the scratchpad is shared by every agent).
- **Never `rm -rf` a `/tmp` glob** (a worker once wiped other efforts' kept lifecycle FAIL dirs with `rm -rf /tmp/dse-obsidian-lifecycle-*`). Delete only a literal path you created and recorded. No `rm` with a shell-variable target (it hangs on a permission prompt). Never `rm -rf` `.superpowers/`.
- Never `pkill`/`killall` by pattern; kill only by PID whose cwd (`readlink /proc/<pid>/cwd`) or command line is inside YOUR worktree.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents. Split lifecycle into the five parts so each call stays under 600 s. If shots must run past 600 s, run it with output to a unique log plus an rc file and poll that log/rc — never wait on a background-completion notice, never key a wait-loop on a scratch filename you did not just create for this run.
- Workspace-level files (CHANGELOG.md) live in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc606-montage-edit-no-skills/` — never under `/home/scott/code/steelCompendium/workspace/` (except the ledger dir for your report).
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault and expected; ignore it, never touch the main checkout.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me (a depth-2 agent cannot address its parent; `to: "main"` reaches the dispatcher, not me). If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question; I will resume you. If you ever do send a message anyway, its FIRST WORD must be `SC-606:`.
- Do not push. Do not land. Commit on the branch only (plugin and superproject worktree).

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc606-montage-edit-no-skills/sc606-r1-impl-report.md`. It must open with a ≤10-line executive summary (verdict, head shas, every gate number). Then: the survey table (site, crashed on base y/n), the fix and why it satisfies O2, the tests added (names, red-on-base proof), probe results base vs head (with log paths), `Drive-by fixes:` and `Follow-ups:` lists.

## 6. Return contract

Final text: raw facts, no prose — STATUS, plugin head sha, superproject worktree head sha, rebase base sha, each gate's measured number, probe verdict base/head, and the absolute path of every evidence artifact (report, gate logs, probe logs, any screenshots).
