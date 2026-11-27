# SC-692 r2 — independent reviewer brief: several-cursor insert layout

You are an independent reviewer for ticket SC-692. Your final text goes to the ticket-owner (an agent), not a human.
**You never call the tracker (Linear)** — not to read, not to post. You review; you do not fix (no commits on the branch;
scratch probes live outside the branch or are removed before you report, and the branch must be left exactly at the head
you were given).

## 1. Context loading

1. Spec: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc692-insert-several-cursors/sc692-decisions.md`
   (owner calls O1–O6). The implementer's brief: `sc692-brief-r1-impl.md` in the same dir. The implementer's report:
   `sc692-r1-impl-report.md` (read its exec summary; check its claims, do not trust them).
2. Worktree `/home/scott/code/steelCompendium/worktrees/sc692-insert-several-cursors`, plugin repo
   `…/draw-steel-elements`, branch `sc692-insert-several-cursors`, head `6b290e01` on `develop` @ `17187e4c`.
   Diff: `git -C <plugin abs path> diff 17187e4c..6b290e01`. **Every git command uses `git -C <absolute path>`.**
   Never write under `/home/scott/code/steelCompendium/workspace/` except your report in the ledger dir.
   The main checkout's `draw-steel-elements` dirt (`demo-vault/…`, `compendium-manifest.json`) is Scott's live vault: ignore it.
3. Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — huge, do NOT read it whole:
   lines 1–30, 146–266, 1551–1556; grep for what else you need.

## 2. What to do — execute and probe, not just read

- Re-run the gates yourself: tsc (incl. `tsc -p e2e`), lint, jest (fresh: `rm -f main.js styles.css` in the plugin root
  first, literal path), and one full e2e run. Compare with the implementer's numbers. Verify the styles.css hash claim
  against a clean `17187e4c` build. Lifecycle: re-run only if a finding touches it.
- Probe O2 hard, in jsdom AND in real Obsidian 1.14.4 (a scratch e2e spec, not committed): compare the multi-cursor
  result with single-cursor inserts run one at a time bottom-up, byte for byte. Shapes to try at minimum: same-line
  cursors (with spaces / text between, at line start and end), adjacent empty lines, a selection spanning lines next to a
  cursor, a selection ending on the same line another cursor starts on, cursors in a callout, under `- `, `1. `, `10. `,
  a nested list, a list item inside a callout, text after the cursor, CRLF if the editor holds it, many cursors (10+),
  main cursor first / middle / last, reversed selections (anchor after head).
- Undo: one Ctrl+Z restores the note byte for byte in real Obsidian; redo re-applies it; cursors after undo.
- Cursors after the write: where O3 says, main index kept; typing right after the insert goes into every block's first
  body field.
- O4: any range inside a block or the properties still refuses everything with one Notice.
- O5: single-cursor output byte-identical to `17187e4c` (diff `planBlockInsert` / `insertBlock` outputs on a probe set
  at both shas); `/ds` pick and Shift inline link unchanged.
- Integrity probes (this writes into user notes): content above / between / below survives; two same-kind blocks inserted
  at once do not cross-talk (each draws its own values); an existing block between two cursors is intact; a hand-edited
  note (odd spacing, tabs) is not damaged.
- Tests: are the new tests able to fail? (break the implementation in a scratch copy and see them go red.) Is anything
  existing weakened or deleted?
- Docs and changelogs true and in plain words.

## 3. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc692-insert-several-cursors/sc692-r2-review-report.md`.
**Open with a ≤10-line executive summary**: verdict (LAND-READY | FIX-REQUIRED), head sha, gates measured vs claimed,
finding counts by severity. Then findings by severity (HIGH / MEDIUM / LOW / INFO), each with file:line, a reproducible
scenario (note text, cursor positions, what is written, what Obsidian draws), and a prescribed fix. Then `Follow-ups:`
(out of scope, left alone). If the report-file write is blocked, return the report inline.

## 4. Return contract

Raw facts, no prose: verdict; head sha; every gate's measured summary line; finding list (severity, file:line, one line
each); absolute paths of every artifact you produced (report, logs, screenshots, probe files).

## 5. Footguns

- **You cannot `SendMessage` me** — `to: 'main'` routes to the dispatcher, not to me. If you need input, end your turn
  with STATUS: NEEDS_CONTEXT and the question. If you ever message anyway, the FIRST WORD must be `SC-692:`.
- **Devbox**: `devbox run -c <abs plugin dir> -- bash <script file>`. Never `cd` inside a compound command. Echoed `$?`
  inside `bash -c '…'` always reads 0 — record exit codes in a script FILE; read each gate's own summary line. Never pipe a gate.
- **Scratch**: private folder
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc692-review-r2/`,
  uniquely named scripts and logs, created with the Write tool, not heredocs.
- **Each gate one blocking foreground call**, output redirected to a log. No `run_in_background`, no Monitor. If the Bash
  tool backgrounds a call itself, poll YOUR OWN pid (`timeout 100 tail --pid=<pid> -f /dev/null`, pid chosen by
  `readlink /proc/<pid>/cwd` inside your worktree) and read the gate's own log.
- **Never key a wait-loop on a scratch filename or its contents** — stale logs from other branches will match.
- **No `rm` with a shell-variable or glob target.** Never `rm -rf` a shared `/tmp` glob; never touch `.superpowers/`
  outside `sc692-insert-several-cursors/`.
- **Never `pkill`/`killall` by pattern.** Kill only by PID whose `readlink /proc/<pid>/cwd` is inside your worktree.
- Known e2e flakes (SET-X03 / SET-X04, SC-657): re-run alone before believing a red; report either way.
- Stale superproject pin: a `token-coverage.test.ts` red on a row nobody touched — compare the worktree's
  `docs/superpowers/dse-overhaul/D3-token-map.md` with the main checkout's; clear with `DSE_TOKEN_MAP_PATH`.
