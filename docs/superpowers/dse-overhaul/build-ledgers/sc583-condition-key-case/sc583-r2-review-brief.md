# SC-583 r2 brief — independent adversarial review (reviewer)

You are the independent reviewer for SC-583. You did not write this code. Your final text goes to the
ticket-owner, not a human. **Workers never call the tracker** (Linear) — not to read history, not to post.

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc583-condition-key-case/decisions.md`
  (ticket text + design rules O1–O7 — the spec you review against).
- Implementer's report: `…/sc583-condition-key-case/sc583-r1-report.md` (read its summary; treat its claims as
  claims to verify, not facts).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc583-condition-key-case`, dse branch
  `sc583-condition-key-case`, head `6453bc5d`, base dse `develop` `93e8e48c`. Diff: `git -C <wt>/draw-steel-elements diff 93e8e48c..HEAD`.
  Do NOT commit to this branch. Verify paths before any write; write nothing under the worktree except
  throwaway probe edits you revert (prefer a private scratch copy / `git stash` and restore — and confirm
  `git status` is clean and HEAD unchanged when you finish).
- Every git command as `git -C <absolute path> …`.

## 2. The task — execute and probe, don't just read

Review the diff against O1–O7. Probe at runtime, not only by reading:
- Find every condition-key comparison site in `src/` yourself (grep `key ===`, `.key`, `find(`, `includes(`,
  `some(`, `filter(`, conditions lookups/maps keyed by key) and check each one is routed through the
  case-insensitive helper or provably doesn't need it. Missed sites are the most likely defect.
- Mixed-case flows: hand-written `Dazed` → pick Dazed (no dup); remove/toggle-off Dazed; edit duration/colour of
  `Dazed`; `DAZED`, `dAzEd`; plain-string form `- Dazed` vs object form `{ key: Dazed }`; custom `Hexed` + add
  custom "hexed"; minion pool modal (SC-574) and squad paths; sidebar; existing `Dazed`+`dazed` duplicates (O5:
  nothing lost); unrelated writes leave `Dazed` byte-identical (O3).
- Integrity: content above/below the written block survives; two initiative blocks in one note don't cross-talk.
- Re-run jest for the touched suites and the new e2e tests (`--only`/filter per e2e/README.md if available, else
  full e2e), and check that each new test fails on the base behaviour (mutate the helper back to strict `===` and
  confirm the tests go red — the vacuous-test check).
- Check e2e titles: ids in the `[COND-K..]` family, no bracketed ticket id in any title.

Gates you run yourself: tsc, lint, jest (full; baseline 10746 passed / 2 skipped on a fresh worktree, plus the
new tests), e2e (full; base `285/288 ok, 0 failed, 3 known-bug, coverage: 172/172 pairs`). The
implementer ran lifecycle/shots/freeze/parity; spot-check their logs' summary lines rather than re-running.
Gate mechanics: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (read in parts:
"Devbox wrapping", "Stale main.js", "Load-sensitive jest suites", "Lifecycle and e2e notes", "THE exit-code
footgun").

## 3. Footguns

- Devbox: `devbox run -- bash -c 'cd <abs> && <gate>'` with the gate LAST, or a script file via
  `devbox run -c <abs dse dir> -- bash <script>`. Never trust echoed `$?`; read gate summary lines. No pipes on gates.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc583-r2-review/`,
  uniquely named files, created with the Write tool.
- Never `rm -rf` a `/tmp` glob or any shared dir; no `rm` with shell-variable paths. Never `pkill` by pattern;
  kill only a PID whose `/proc/<pid>/cwd` is in this worktree.
- Gates run blocking in the foreground, output to logs. A Bash call over 180 s is backgrounded by the tool; then
  wait with `timeout 175 tail --pid=<your node pid> -f /dev/null` and read the log — never end your turn waiting.
  Never key a wait on a pre-existing scratch filename.
- You cannot SendMessage me; if you need input end with `STATUS: NEEDS_CONTEXT`. Any message you send anyway starts `SC-583:`.
- If the report-file write is blocked, return the report inline.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc583-condition-key-case/sc583-r2-review.md`,
opening with a ≤10-line executive summary (verdict APPROVE / FIX-REQUIRED, counts by severity, gate numbers).
Findings by severity (HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario, and prescribed fix.

## 5. Return contract

Final text: raw facts — verdict, findings one line each (severity, file:line, gist), gate numbers, absolute
paths of the report and every log/probe artifact. No prose.
