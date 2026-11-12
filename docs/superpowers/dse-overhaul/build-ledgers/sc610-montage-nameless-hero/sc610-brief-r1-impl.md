# SC-610 r1 — implementer brief (survey + fix + tests + battery + real-Obsidian probe)

You are a worker for the SC-610 ticket-owner. Your final text goes to the ticket-owner, not a human.
**Workers never call the tracker** (Linear) — not to read history, not to post.

## 1. Context loading

- Ledger (read first; it is current state): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc610-montage-nameless-hero/decisions.md`. The ticket text and owner decisions O1-O6 there are binding; quote them, do not reinterpret them.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc610-montage-nameless-hero`; the plugin at `/home/scott/code/steelCompendium/worktrees/sc610-montage-nameless-hero/draw-steel-elements` on branch `sc610-montage-nameless-hero`, at dse develop `7866426e`. Verify `pwd`/branch before any write. Fetch and rebase first: `git -C <plugin path> fetch origin && git -C <plugin path> rebase origin/develop` (expect it to stay at `7866426e`; if develop moved, report the new base sha). Use `git -C <absolute path>` for every git command, never `cd X; git ...`.
- Gate reference: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (about 360 KB — read it in parts: the "battery, in order" table, "Devbox wrapping", "Stale main.js", "Load-sensitive jest suites", "Lifecycle and e2e notes" and "THE exit-code footgun" sections; grep for the rest). Do NOT edit SKILL.md.
- Prior art (landed, read what you need):
  - SC-606 ledger `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc606-montage-edit-no-skills/` — `decisions.md` (O2 no-churn), `sc606-r1-impl-report.md` (survey table of `skills_used` sites, probe method, and the follow-up that became this ticket), `sc606-r2b-review-report.md` (what a reviewer probed).
  - `sanitizeEntry` / `sanitizeEntries` and the `MontageEntry` L-2 doc comment in `src/elements/montage/model.ts` — the precedent for O2/O3.
  - Probe source: SC-598's `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc598-hover-modal-fast-second-click/` (`sc598-r3-make-probe.py.txt`, `sc598-r3-probe-scenario.js.txt`, `sc598-r3-probe-final.sh.txt`), as SC-606 r1 rebuilt it.

## 2. The task

Ticket (verbatim): "A hand-typed Montage block whose `participants` list holds an empty item (`- `) or an entry with no `name` throws when the board looks a hero up. The board should skip or show such an entry instead."

Do, in order, committing after each coherent step:

1. **Survey** every read and write of a montage participant (`participants`, `p.name`, `findParticipant`, BoardView / HeadView / OutcomeBandView / view.ts / LogActionModal / the cell keyboard opener / party view if it reads montage data / anything else grep finds). For each bad shape in ledger O1 (null `- `, scalar `- 7`, bare string `- Ash`, `{}` / no `name`, `name: ''`, `name: 7`) record which sites throw on base and which merely misbehave (e.g. a `"undefined"` row label, a hero row keyed by a non-string). Also record what a write does to those items today (dropped, kept, rewritten).
2. **Red first**: jest tests that fail on base — model unit tests per crashing site, and a DOM test that renders a board whose `participants` mixes good heroes with each bad shape, then logs and edits an action for a good hero, asserting: no throw, the bad items show no hero row and are not offered in the log window's hero picker (ledger O2), and the serialized note keeps each content-bearing bad item intact and in position (ledger O3). Put them beside the existing montage tests (`test/unit/model/montage-tally.test.ts`, `test/dom/elements/montage.test.ts`) or a new montage test file. **Never put a bracketed ticket id in a test title** (the e2e runner reads titles for scenario ids; keep the habit everywhere).
3. **Fix** per ledger O1-O3, minimal and local to the montage element. The ticket suggests a `sanitizeParticipants` beside `sanitizeEntries`; the O3 no-churn rule means a plain filter-at-parse would DELETE content-bearing items on the next write, so you need either (a) usable/unusable split with the unusable items re-emitted at their original positions on serialize, or (b) the raw list kept and every read site going through one usable-participants helper. Pick one and say why. `addMontageHero` (the ⋯ menu) must still work with bad items present. `serialize` keeps §B.5 key order. Add a console.warn per parse for skipped items in the `sanitizeEntries` style.
4. **CHANGELOG**: one user-facing bullet under `## Unreleased` in YOUR worktree's superproject file `/home/scott/code/steelCompendium/worktrees/sc610-montage-nameless-hero/CHANGELOG.md` — never under `/home/scott/code/steelCompendium/workspace/`. Plain words, e.g. "Montage: a hand-typed block whose hero list has an empty item or a hero with no name no longer breaks the board; the item is skipped on the board and left as typed in the note." Commit it in the superproject worktree on its branch.
5. **Real-Obsidian probe** (evidence, not committed): rebuild the SC-598 r3 / SC-606 r1 probe in your private scratch dir and render, in Reading view, a montage block with good heroes plus a `- ` item and a `- nmae: Ash` item; click a cell to log an action for a good hero, save. Against a base bundle (`7866426e`, built from a `git archive` export) and your head, pinned via `DSE_LIFECYCLE_BUNDLE`. Record: base — where it throws (render or click) and what the user sees; head — board renders, no page error, the write lands, the note text of both bad items is unchanged after the write (read the file). Do not commit the probe. Add no lifecycle scenario (ledger O4; G-S98 is reserved — report back instead if you think one is needed).

## 3. Gates (dse-verify battery, in order; run each as one blocking FOREGROUND call)

Baseline at `7866426e`:
- tsc clean, lint clean.
- jest: `7707 passed / 2 skipped` on a fresh worktree (before a shots run). Yours = 7707 + your new tests. `rm -f main.js styles.css` in the plugin root before `npx jest` (literal path, no variable). Timeout-shaped reds in the load-sensitive suites listed in the skill: check `/proc/loadavg`, re-run those suites alone.
- lifecycle `58/58 ok, 0 failed`, run as SIX `--only` parts (one part per call, output to a unique log): `G-S7a G-S7b G-S6a G-S6b G-S6u G-S28 G-S5n G-S1 G-S2 G-S3 G-S4 G-S5 G-S6c G-S6d G-S6e G-S6f G-S6g G-S6h G-S6i G-S8 G-S9a` (21); `G-S9b G-S9d G-S9e G-S9f G-S9c G-S10 G-S11 G-S12 G-S13 G-S15 G-S14 G-S18 G-S32 G-S36 G-S33 G-S40` (16); `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9); `G-S57 G-S62 G-S61 G-S56` (4; G-S56 LAST); `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87 G-S91` (7); `G-S92` (1). Report the union. Note from the skill: the Bash tool moves any call over 180 s to the background and announces completion by notification; keep one part per call with output to a log, and while waiting use a read-only `timeout 175 tail --pid=<your own node pid> -f /dev/null` (pick the pid whose `/proc/<pid>/cwd` is YOUR worktree's draw-steel-elements), then read the log's own summary line.
- e2e: `278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs` (known bugs SC-257, SC-355, SC-384, SC-580).
- shots: 592 shots; `button host-leak OK (163 … 978 …)`, modal host-leak 39 kinds / 234 comparisons, `capture clip OK (147 …)` (read the in-run gate lines).
- freeze: `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh /home/scott/code/steelCompendium/worktrees/sc610-montage-nameless-hero/draw-steel-elements/visual-harness/shots` -> 280/280, 0 FAILED. Expect no byte change; if any frozen shot moves, STOP and report (never touch the baseline).
- parity LAST: 0 GAPs / 0 undeclared WARNs / 24 declared.
- After the shots run jest reads one more passed and one fewer skipped (7708/1 form); report both numbers you measured.

## 4. Footguns (all binding)

- Devbox: tools are not on PATH. Use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc610-montage-nameless-hero/draw-steel-elements -- bash <script file>` with the script file written by the Write tool; never `cd` inside a compound command; never trust an echoed `$?` inside `bash -c` — record exit codes from inside a script file and read each gate's own summary line. No pipes after a gate.
- Private scratch: everything goes in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc610-r1-<yourAgentId>/` with uniquely named scripts and logs (the scratchpad is shared by every agent). Write scratch files with the Write tool, not heredocs.
- **Never `rm -rf` a `/tmp` glob** (a worker once wiped other efforts' lifecycle vaults with `rm -rf /tmp/dse-obsidian-lifecycle-*`). Delete only a literal path you created and recorded. No `rm` with a shell-variable target (it hangs on a permission prompt). Never `rm -rf` `.superpowers/` or anything in it but your own files.
- Never `pkill`/`killall` by pattern; kill only by PID whose cwd (`readlink /proc/<pid>/cwd`) or command line is inside YOUR worktree. Other efforts (SC-596, SC-601) run the same gates concurrently.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents. Never key a wait-loop on a scratch filename or its contents unless you created that file for this run — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. If shots runs past 600 s, run it with output to a unique log plus an rc file and poll that log/rc; never sit waiting on a background-completion notice for a job you started yourself.
- Workspace-level files (CHANGELOG.md) live in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc610-montage-nameless-hero/` — never under `/home/scott/code/steelCompendium/workspace/` (except the ledger dir for your report).
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault and expected; ignore it, never touch the main checkout.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me (a depth-2 agent cannot address its parent; `to: "main"` reaches the dispatcher, not me). If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question; I will resume you. If you ever do send a message anyway, its FIRST WORD must be `SC-610:`.
- Do not push. Do not land. Commit on the branch only (plugin and superproject worktree).

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc610-montage-nameless-hero/sc610-r1-impl-report.md`. It must open with a ≤10-line executive summary (verdict, head shas, every gate number). Then: the survey table (site x bad shape: throws / misbehaves / fine on base), what a write did to bad items on base, the fix (which option, why it satisfies O3, whether empty items are dropped), tests added (names, red-on-base proof), probe results base vs head (with log paths), `Drive-by fixes:` and `Follow-ups:` lists.

## 6. Return contract

Final text: raw facts, no prose — STATUS, plugin head sha, superproject worktree head sha, rebase base sha, each gate's measured number, probe verdict base/head, and the absolute path of every evidence artifact (report, gate logs, probe logs, any screenshots).
