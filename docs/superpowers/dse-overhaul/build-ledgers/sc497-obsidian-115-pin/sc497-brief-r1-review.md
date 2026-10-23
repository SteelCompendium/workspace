# SC-497 r1 independent review brief — Obsidian 1.15.0 host-copy pin bump

Your final text goes to the SC-497 ticket-owner, not a human. **Workers never call the tracker** (Linear).

## 1. Context loading
- Ledger (binding scope): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc497-obsidian-115-pin/sc497-decisions.md`.
- The implementer's brief and report in the same dir: `sc497-brief-r1-impl.md`, `sc497-r1-impl-report.md`
  (read the report's executive summary and its rule/token diff table; verify, do not trust).
- `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — "In-run gates inside `npm run shots`"
  and "Current expected numbers" (CURRENT @ d152ea4).
- Worktree plugin: `/home/scott/code/steelCompendium/worktrees/sc497-obsidian-115-pin/draw-steel-elements`, branch
  `sc497-obsidian-115-pin`, base `d152ea4`. Review `git -C <plugin> diff d152ea4..HEAD`. Do not edit the branch; you are a
  reviewer. Never write under `/home/scott/code/steelCompendium/workspace/` except your report. Scott's vault dirt in the
  main checkout (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is expected.

## 2. What to establish (execute and probe, do not just read)
1. **Fidelity of the copy.** Independently extract app.css from `/home/scott/.config/obsidian/obsidian-1.15.0.asar`
   (read-only — never write/move anything under `/home/scott/.config/obsidian/`) into your private scratch, and compare the
   six button-reaching rules and the 14 tokens × dark/light byte-for-byte against the new `OBSIDIAN_HOST_BUTTON_CSS` and
   the `styles-source.css` `[SC205-HOST-RULES]` listing. Confirm the implementer's classification of each difference
   (minifier spacing/quoting vs real declaration/selector change).
2. **Floor semantics.** With `PINNED_OBSIDIAN = '1.15.0'`, what happens on a machine whose newest asar is 1.14.4 (this
   machine also has one)? It should print `host-copy pin PARTIAL`, not fail. Probe it (e.g. call the pin module's
   functions against the 1.14.4 asar path from a scratch script) rather than reasoning.
3. **Scope.** Confirm `visual-harness/obsidian-app-css.pin.mjs` is untouched and nothing loosened the comparator. Any
   comment still naming 1.14.0 as the model's pin is a finding.
4. **Shots.** Re-run `npm run shots` yourself on the branch head and then the freeze check. Copy verbatim the
   `host-copy pin OK`, `button host-leak OK`, `modal button host-leak OK` (+ `not openable`), both text-scale lines,
   `pressed toggle parity OK`, `pipette selected look OK`, `chrome host-leak OK` lines, and note any ALLOWLISTED or app.css
   drift WARN line. Expected: 592 PNGs, 0 FAIL, rc 0; freeze 280/280. If numbers differ from the implementer's, say so.
5. jest only on suites touching the harness/pin (or full jest if a test was changed) — expected 5769 / 1 skipped / 238 of 239
   for full. You need not re-run lifecycle/e2e/parity unless the diff touches `src/` or `styles*.css` rules (not comments).

## 3. Command and process rules
- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc497-obsidian-115-pin/draw-steel-elements -- bash <script file>`;
  no `cd` inside compound commands; `git -C <abs path>` always; exit codes from a script file (`cmd > log 2>&1; echo $? > rc`).
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc497-r1-review-<random6>/`;
  write files with the Write tool; uniquely named scripts/logs.
- One blocking foreground gate per Bash call (timeout 600000); no `run_in_background`, no Monitor. Redirect output to files.
- Never key a wait-loop on a scratch filename or its contents — stale logs from other branches match.
- Never `pkill`/`killall` by pattern; kill only a PID verified yours (`readlink /proc/<pid>/cwd` inside the worktree).
  Never `rm` a glob; delete only paths you created.

## 4. Report
Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc497-obsidian-115-pin/sc497-r1-review-report.md`,
opening with a ≤10-line executive summary (verdict APPROVE / APPROVE_WITH_NITS / CHANGES_REQUIRED, measured numbers).
Findings by severity (HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario, prescribed fix. If the write is blocked,
return the report inline.

Return contract: raw facts (verdict, shas reviewed, measured numbers), no prose, plus absolute paths of every evidence
artifact. You cannot `SendMessage` me; end with STATUS: NEEDS_CONTEXT and the question if blocked. Any message you do send
must start with `SC-497:`.

## 5. Addendum after the implementer reported (owner, 2026-10-23)
Implementer head: plugin `6576fd4` (base `d152ea4`). Its claims to check:
- Gallery sweep reads `113 kinds / 678 comparisons` with a 20-record exemption boundary, not the skill's 112 / 672 / 10,
  and it claims base `d152ea4` prints the same under a fake HOME holding only the 1.14.4 asar
  (`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc497-r1-impl-k4w9zq/shots-base.log`).
  Read that log and judge whether the A/B is sound (same HOME isolation, same gallery). Do not re-run the base yourself
  unless the log is unconvincing.
- It reports an `OBSIDIAN APP.CSS PIN DRIFT` line (installed 1.15.0 vs pinned 1.13.7) that leaves rc 0. Confirm it is a
  warning that already printed before this change (installed 1.14.4 vs pinned 1.13.7), i.e. not new behavior.
