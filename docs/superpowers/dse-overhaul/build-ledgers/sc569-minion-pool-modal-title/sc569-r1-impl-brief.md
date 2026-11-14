# SC-569 r1 — implementer brief (replacement-ready)

You are the implementer for SC-569. Your final text goes to the ticket-owner, not a human.

## 1. Context loading

- Read first: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc569-minion-pool-modal-title/decisions.md`
  (the rule you implement is OD-1 there). Prior-round reports, if any, are in the same dir (`sc569-*`).
- **Workers never call the tracker (Linear)** — not to read history, not to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc569-minion-pool-modal-title`; the plugin is its
  `draw-steel-elements/` submodule, on branch `sc569-minion-pool-modal-title`, at dse `b1e4f027` (= `origin/develop`).
  First: `git -C /home/scott/code/steelCompendium/worktrees/sc569-minion-pool-modal-title/draw-steel-elements fetch origin`,
  and if `origin/develop` moved past `b1e4f027`, rebase onto it and say so in your report.
  Verify with `pwd` / `git -C <abs path> rev-parse --abbrev-ref HEAD` before any write. **Never write under
  `/home/scott/code/steelCompendium/workspace/`** (the shared main checkout) except your report file in the ledger dir.
  The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is
  Scott's live vault — expected, not yours, do not touch or report it.
- Read the workspace adapter's footguns (`/home/scott/code/steelCompendium/workspace/.claude/orchestrate/PROJECT.md` §8)
  and the `dse-verify` skill (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`, ~450 KB —
  read it in parts: "The battery, in order", "Devbox wrapping", "Stale main.js", "Jest timeouts under load",
  "Lifecycle and e2e notes", "THE exit-code footgun", and the CURRENT entry under "Current expected numbers").
- Prior art: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc435-e2e-minion-pool-ledger.md`
  (the minion pool e2e, `e2e/specs/minion-pool/`) and `sc417-minions-ledger.md`.

## 2. The task

Code: `src/views/MinionStaminaPoolModal.ts` `onOpen()` currently does
`this.setDseTitle(\`${this.group.name} - Minion Stamina Pool\`)`. Ticket text (verbatim):

> With two squads in one initiative group (for example two squads in "Wolves"), each squad's pool modal is titled
> "Wolves - Minion Stamina Pool". Only the minion row names tell you which squad you opened. Proposal: add the squad's
> name (or its first minion's name) to the title when the group holds more than one squad.

Implement the owner decision OD-1, quoted from the ledger:

> - Group with ONE minion squad (`squad_role === 'minion'`): title unchanged, `"<group> - Minion Stamina Pool"`.
> - Group with TWO OR MORE minion squads: `"<group> - <creature name> - Minion Stamina Pool"`.
> - If another minion squad in the same group has the same creature name: `"<group> - <creature name> (squad N) - Minion
>   Stamina Pool"`, N = 1-based position of this squad among the same-named minion squads, in the order the tracker
>   lists them (top to bottom).

Notes:
- Put the title computation in a small pure helper (exported, unit-testable), in the modal file or next to it.
- Verify that "the order the tracker lists them" is `group.creatures` order (read `src/elements/initiative/view.ts`
  where squads are rendered). If the tracker renders squads in a different order, use the tracker's order and say so.
- Count only creatures with `squad_role === 'minion'` (captains and `attached` creatures are not squads). Respect how
  the modal already identifies its squad (`this.creature`; identity, not name).
- Compare creature names exactly as the tracker displays them (if the tracker trims/normalises, match it; say what you did).
- Any other place that shows this modal's title (aria-labelledby, the DseModal title element) should follow from
  `setDseTitle` — check, don't add a second source.
- Do not change anything else about the modal. Other modals with a similar ambiguity are a **Follow-up** for your
  report, not this change.

Tests:
- Jest: helper cases (one squad; two differently named squads; two same-named squads → squad 1 / squad 2; a group with
  one minion squad plus a captain and an attached creature → unchanged title; three squads with two same-named) and a
  DOM test that opening the modal shows the right title for each squad of a two-squad group.
- e2e: add a test (or tests) under `e2e/specs/minion-pool/` that opens each squad's pool modal in a group holding two
  squads and asserts the two titles differ and read as specified. Reuse the existing two-squad fixture if SC-435 has one.
  **Never put a bracketed ticket id (e.g. `[SC-569]`) in a test title** — the e2e runner reads test titles for scenario
  ids. Follow the existing POOL-* id scheme for the new id(s).
- TDD: show the new tests red without the fix (state how many) and green with it.

Commit after every coherent step (code+jest; e2e) with clear messages that mention SC-569 in the body or subject
(no Co-Authored-By / AI attribution trailers). Do not push. Do not touch the superproject pointer.

## 3. Gates (dse-verify, full battery, in order)

Expected at base `b1e4f027`: tsc and lint clean · jest **11857 passed / 2 skipped** (quiet; +your new tests) ·
lifecycle **63/63** in SEVEN `--only` parts (one part per Bash call, log to file):
1. `G-S7a,G-S7b,G-S6a,G-S6b,G-S6u,G-S28,G-S5n,G-S1,G-S2,G-S3,G-S4,G-S5,G-S6c,G-S6d,G-S6e,G-S6f,G-S6g,G-S6h,G-S6i,G-S8,G-S9a` (21);
2. `G-S9b,G-S9d,G-S9e,G-S9f,G-S9c,G-S10,G-S11,G-S12,G-S13,G-S15,G-S14,G-S18,G-S32,G-S36,G-S33,G-S40` (16) (both lists
   from dse-verify SKILL.md line 30 — cross-check there); 3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9);
4. `G-S57,G-S62,G-S61,G-S56` (4; G-S56 stays LAST); 5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7);
6. `G-S92,G-S96,G-S97,G-S99` (4); 7. `G-S108,G-S112` (2). `--only=` takes comma-separated ids.
· e2e **`OBSIDIAN-E2E done: 338/341 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`** plus your new tests
(known bugs SC-257, SC-355, SC-384) · shots **592**, host-leak 163/978, modal host-leak 40/240, capture clip 147 ·
freeze **280/280** (a title-text change must not move print bytes; if freeze moves, STOP and report — never touch the
baseline) · parity **0 / 0 / 24** last.

Gate notes:
- A G-S91 FAIL is a real signal unless it says the host was too slow after two re-runs.
- If G-S97 fails, check `git -C <worktree>/draw-steel-elements status` for a dirty `demo-vault/.obsidian/appearance.json`
  (the Obsidian camera tool leaves it dirty, SC-622); restore it (`git -C … checkout -- demo-vault/.obsidian/appearance.json`)
  and re-run before blaming the change.
- Jest's default timeout is 30 s: an "Exceeded timeout" is a real hang until proven otherwise (re-run the suite alone).
- Calls over 180 s are moved to the background by the Bash tool even with a long timeout; keep one lifecycle part / e2e
  / shots per call with output to a log, and when it backgrounds, wait with
  `timeout 175 tail --pid=<YOUR pid> -f /dev/null` (pick the pid whose `/proc/<pid>/cwd` is in YOUR worktree), then
  READ THE LOG. Never wait for a notification that might not come; never key a wait on a scratch filename.
- `rm -f main.js styles.css` in the plugin root before `npx jest` (stale-main.js footgun) — that literal command in the
  plugin root is fine; no other `rm`.

## 4. Footguns (every one has cost real time)

- devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc569-minion-pool-modal-title/draw-steel-elements -- bash <script file>`;
  devbox eats `$?` and pipes eat failures — record exit codes from a script file, read each gate's summary line.
  Never `cd` inside a compound command; use `git -C <absolute path>` for every git command.
- Scratch: use ONLY your private folder
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc569-impl-r1/`
  with uniquely named scripts/logs (create files with the Write tool). **Never `rm`, `rm -f`, `rm -rf` or `rmdir`
  anything in /tmp or the scratchpad** (and never an `rm` with a shell variable) — leave throwaway files in place.
- Never `pkill`/`killall` by pattern; kill only a PID whose cwd/command line is in YOUR worktree.
- Never `rm -rf` any shared `/tmp` glob (lifecycle vaults) or `.superpowers/`.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- No background jobs, no Monitor.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question.
  If you ever send a message anyway, its FIRST WORD must be `SC-569:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc569-minion-pool-modal-title/sc569-r1-impl-report.md`,
opening with a ≤10-line executive summary. Body: dse commit shas; the helper's signature; the tracker-order finding;
red-without-fix counts; every gate's measured summary line; new e2e ids; `Drive-by fixes:` and `Follow-ups:` lists.

## 6. Return contract

Final text: raw facts, no prose — verdict (DONE / BLOCKED / NEEDS_CONTEXT), branch + head sha, each gate's number,
new test counts, and the absolute path of every evidence artifact (report, gate logs, any screenshot).
