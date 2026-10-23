# SC-487 scoped re-review brief — r4 delta (fresh reviewer)

You are a fresh reviewer: you did not write any of this branch or its prescriptions. Review ONLY the r4 delta, and probe it in real Obsidian.

## Context
- Ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc487-pin-zwsp/decisions.md` — read O1–O6 and the newest entries (the MEDIUM-R3 ruling is the spec for this round).
- `sc487-rereview-r3-report.md` (the finding, measurements, prescribed fix) and `sc487-impl-r4-report.md` (what was done, gates) in the same dir.
- The prior reviewer's probe harness, reusable read-only: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc487-rev-r3/` (`rv-fixtures.mjs`, `rv-scenarios.mjs`, `rv-tilde-pair.sh`, `rv-cand.sh`, `candidate-fix.patch`). Copy what you need into your own folder; don't modify that one.
- Gate rules: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
- Worktree `/home/scott/code/steelCompendium/worktrees/sc487-pin-zwsp`, dse branch `sc487-pin-zwsp`; the r4 delta is `4ec83ea..HEAD` (dse) plus the new superproject commit(s) after `101bfdd`. Do not modify the branch; probes go in your own clone. **Never call Linear.** The main checkout's dse dirt (`demo-vault/…`, `compendium-manifest.json`) is Scott's vault — ignore it.

## Check
1. The delta implements the ruling exactly: `fenceChar` required at every caller (tsc), backtick fence keeps r3's behaviour, tilde fence uses `/^[^ \t]*/` when a backtick is present; the SC-476 schemaSuggest row back to `ds-counter`; every pre-existing backtick-fence row unchanged; CHANGELOG wording fixed.
2. Does the delta match the reference `candidate-fix.patch` in behaviour? Any difference: is it better or worse?
3. Real Obsidian (1.14.4 and/or 1.15.0), on the new head's bundle: `~~~ds-counter `x``, `~~~ds-counter x`y`, `~~~ds-counter<TAB>`x`` → Reading view draws the counter; in-note write lands; Pin to sidebar anchors, panel mounts, panel write lands; text above/below and the opening line kept byte for byte. `~~~ds-counter`x`, `~~~ds-counter<NBSP>`x``, ```` ```ds-counter`x ````, ```` ```ds-counter `x ```` → not claimed (Pin refused with one Notice, note byte-identical). Spot-check one zero-width opener (U+200B) still pins in Live Preview.
4. Hunt for any other caller of the fence-language rule that could now get the wrong `fenceChar` (e.g. a quoted or indented fence, `~~~~` vs `~~~`, a nested fence).
5. Re-run tsc, lint, jest, lifecycle, e2e at the head. Shots/freeze/parity may come from the implementer's r4 logs (`.../scratchpad/sc487-impl-r4/`) if the delta is src/test/e2e-driver only.

Expected: jest 5901 + the r4 rows / 1 skipped (a clone outside the workspace shows 2 extra doc-sync skips) · lifecycle 35/35 · e2e 108/108, 0 known-bug, 69/69 · shots 592, 0 FAIL, rc 0 · freeze 280/280 · parity 0/0/24.

## Command rules (each has stalled or broken a worker before)
- `devbox run -c <abs path> -- bash <script file>`; never `cd` inside a compound command; every git command `git -C <absolute path>`.
- Exit codes from a script FILE; read each gate's summary line.
- Private scratch ONLY: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc487-rev-r4/`, uniquely named files, created with the Write tool.
- No glob `rm`; delete only what you created. Never touch `.superpowers/` outside `sc487-pin-zwsp/`.
- One blocking foreground Bash call per gate; no `run_in_background`, no Monitor. Redirect output to a log file.
- Own `DSE_LIFECYCLE_PORT` (e.g. 9291). Never `pkill`/`killall` by pattern; kill only a PID verified yours (`readlink /proc/<pid>/cwd`).
- Never key a wait-loop on a scratch filename or its contents.

## Report and return
Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc487-pin-zwsp/sc487-rereview-r4-report.md`, ≤10-line executive summary first (verdict LAND-READY / FIX-FIRST, reviewed sha, counts by severity, gate numbers), then findings by severity with file:line, failure scenario and prescribed fix. If the write is blocked, return it inline. Final text: raw facts + absolute paths of every evidence artifact. You cannot `SendMessage` me; if you need input, end with `STATUS: NEEDS_CONTEXT` and the question. If you message anyway, first word `SC-487:`.
