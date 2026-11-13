# SC-586 r2 — independent review brief

## 1. Context loading

- Ledger (the spec): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc586-conditions-yaml-display/decisions.md`.
- Implementer's report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc586-conditions-yaml-display/sc586-r1-impl-report.md`
  (read its executive summary; do NOT take its claims on trust — re-measure).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc586-conditions-yaml-display`; dse repo at
  `.../draw-steel-elements`, branch `sc586-conditions-yaml-display`, base dse `develop` `3a5986d3`.
  Review the diff `git -C <dse abs> diff 3a5986d3..HEAD` plus the superproject CHANGELOG commit.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
  (~430 KB, read in parts: l.20-220 and the first entry of "Current expected numbers", l.1496+).
- **Workers never call the tracker (Linear).** The main checkout's dse dirt (Scott's live vault:
  `demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is expected; never
  touch the main checkout.

## 2. The task — execute and probe, not just read

Adversarial review of the SC-586 fix in `src/views/ConditionsModal.ts` against the ledger's ticket
text and owner decisions D2-D4. Probe at minimum:

- Item 1 (colour chooser seed): named colours (`teal`, `Teal`, `rebeccapurple`), `#abc`, `#ABCDEF`,
  `rgb(0,128,128)`, `hsl(...)`, `rgba(...)` with alpha, `transparent`, `currentColor`, garbage
  (`banana`), empty string, a preset's hex in another case. What does the input start at, is the
  pipette's selected state / aria-label unchanged, and does opening + closing (and Escape) write
  nothing to the note? Does the parse work in real Obsidian, not only jsdom (check how the helper
  resolves names; if it relies on the DOM/canvas, run it in the e2e Obsidian or reason from the
  e2e result)?
- Item 2 (icon pressed state): `icon: ""`, `"  "`, `"skull "`, `"Skull"` (case — what does the row
  draw, what is pressed?), an icon id not in the suggested list, clicking "Use default" from a blank
  icon (what is written? the note must not gain junk), searching then clearing the search.
- Note integrity: content above/below the initiative block survives a pick; a second condition's
  colour/icon is not cross-talked; hand-edited YAML untouched until the user picks.
- Tests: confirm the two former `test.failing` markers are plain tests; revert the product change
  locally (in a scratch copy or `git stash`, then restore exactly) and count how many new jest and
  e2e tests fail; flag any vacuous test. Check no test title contains a bracketed ticket id.
- Re-run the full battery yourself (tsc, lint, jest, lifecycle seven parts, e2e, shots, freeze,
  parity) and compare with the expected numbers below.

## 3. Gates — expected

tsc + lint clean · jest 11794 passed / 2 skipped fresh (+ the new tests) · lifecycle 62/62 in seven
`--only=` parts (ids comma-separated; take each part's exact ids from SCENARIOS order in
`visual-harness/obsidian-lifecycle.mjs`): up to `G-S9a` (21); `G-S9b … G-S40` (16);
`G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9); `G-S57,G-S62,G-S61,G-S56` (4);
`G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7); `G-S92,G-S96,G-S97,G-S99` (4); `G-S108` (1) ·
e2e base `331/334 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` (known bugs SC-257, SC-355,
SC-384) plus the implementer's new tests · shots 592, host-leak 163/978, modal host-leak 40/240,
capture clip 147 · freeze 280/280 · parity 0 / 0 / 24.

Known noise: G-S91 timing flake (SC-616) — re-run part 5 before calling it a regression. SC-622:
a dirty `demo-vault/.obsidian/appearance.json` in the worktree fails G-S97 — check
`git -C <dse abs> status --short demo-vault/.obsidian/appearance.json` and restore it with
`git -C <dse abs> checkout -- demo-vault/.obsidian/appearance.json` before part 6. Any Bash call
over 180 s is backgrounded by the tool; redirect to a log, read its summary line; a read-only wait
on your own node pid is `timeout 175 tail --pid=<pid> -f /dev/null`.

## 4. Footguns (all apply)

- Devbox: `devbox run -c <dse abs> -- <cmd>`; never `cd` inside a compound command; devbox eats
  `$?` in any quoting — record exit codes via a script file run as `devbox run -c <dse abs> -- bash <script>`,
  read each gate's summary line; never pipe a gate into `tail`.
- `git -C <absolute path>` for every git command. Leave the branch exactly as you found it
  (`git -C <dse abs> status` clean, HEAD unchanged) — you do not commit.
- Private scratch dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc586-r2-review/`,
  uniquely named files; Write tool for scratch files.
- Never `rm -rf` a `/tmp` glob or the shared `.superpowers/` dir; no `rm` with a shell-variable
  target; delete only literal paths you created. Never `pkill`/`killall` by pattern — kill only a PID
  whose `readlink /proc/<pid>/cwd` is in this worktree.
- Gates in the foreground, one per call, redirected to a per-run log; no `Monitor`; never wait for a
  notice of a job you backgrounded — poll its own log. Never key a wait on a scratch filename or its
  contents. Never touch `.superpowers/sdd/freeze-baseline.sha256`.
- If the report-file write is blocked, return the report inline.
- You cannot `SendMessage` me; end with `STATUS: NEEDS_CONTEXT` + the question if you need input.
  If you ever message anyway, first word `SC-586:`.

## 5. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc586-conditions-yaml-display/sc586-r2-review-report.md`,
opening with a ≤10-line executive summary (verdict LAND / FIX). Findings by severity
(HIGH/MEDIUM/LOW/INFO) with file:line, a failure scenario and a prescribed fix each. Final text to
the ticket-owner: raw facts — verdict, findings list, measured gate lines, revert-proof counts, and
absolute paths of every log/evidence artifact.
