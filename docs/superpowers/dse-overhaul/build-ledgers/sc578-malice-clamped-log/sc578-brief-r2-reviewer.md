# SC-578 r2 reviewer brief — independent adversarial review of the r1 fix

Your final text goes to the SC-578 ticket-owner, not a human. **Workers never call the
tracker** (Linear) — not to read history, not to post.

## 1. Context loading

- Spec: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc578-malice-clamped-log/decisions.md`
  (decision D1 — review against it, item by item).
- The implementer's brief and report (read the report's executive summary; the body only
  where you need it): `sc578-brief-r1-implementer.md`, `sc578-r1-impl-report.md` in the same dir.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc578-malice-clamped-log`; plugin at
  `.../draw-steel-elements` (`$DSE`), branch `sc578-malice-clamped-log`. Review the diff
  `git -C $DSE diff eaa8742a..HEAD` (or the base the report names) plus the superproject
  `CHANGELOG.md` commit. Do NOT edit the branch; any scratch probe lives in your private
  scratch folder or is reverted before you finish (`git -C $DSE status` must be clean at the end).
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.

## 2. What to do — execute and probe, do not just read

- D1 conformance, all 7 items. In particular: the log's amounts sum to the pool's movement
  across a sequence that mixes capped and uncapped quick-adds and Advance rounds; `requested`
  is absent on every uncapped entry; zero renders `0`; Advance round from 0 with negative gain
  still logs.
- Data integrity (this writes into user notes): parse→serialize round-trip of a note holding
  old-shape entries, new capped entries, and a hand-edited entry with `requested` equal to
  `amount` / a non-number `requested` / a stored negative `value` (SC-577's "counts as 0");
  content above and below the fence survives; two trackers in one note do not cross-talk; the
  50-entry log cap still trims correctly.
- One code path really serves both Advance round and the quick-add (no second
  `appendMaliceLogEntry` call computing its own amount). Any other caller of
  `addToMalicePool` / `appendMaliceLogEntry` / readers of `log[].amount` (grep `src/`, other
  elements, read-only views, embeds) left inconsistent?
- Tests: are the new jsdom rows and the converted e2e INIT-M09 non-vacuous? Temporarily
  revert the fix in a scratch copy (or `git stash` and restore) and confirm they fail; restore
  and confirm clean. No bracketed ticket id in any test title.
- Docs: plugin CHANGELOG, `docs/initiative-tracker.md`, workspace CHANGELOG bullet accurate.
- Re-run the gates yourself: tsc, lint, jest, e2e (full), and at least lifecycle parts that
  touch initiative if the full five is too slow — the full five-part lifecycle is preferred.
  Base is dse develop `eaa8742a` (SC-584 landed after the brief was cut; the branch must be rebased onto it). Expected: jest all green (7177 + new rows passed / 2 skipped in a fresh worktree; SC-568 load timeouts green alone are fine) · lifecycle 54/54 · e2e
  `0 failed`, **5 known-bug**, `coverage: Y/Y pairs` · freeze 280/280 if you run shots ·
  parity 0/0/24.

Lifecycle runs in FIVE `--only` parts, each its own foreground Bash call
(`G-S7a … G-S9a` 21; `G-S9b … G-S40` 16; `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` 9;
`G-S57 G-S62 G-S61 G-S56` 4; `G-S59 G-S49 G-S73 G-S77` 4); G-S56 stays LAST in SCENARIOS order. Part 3 can take ~480 s under load: redirect its output to a file.

## 3. Footguns

- **Never a compound `cd`.** `git -C <abs path>`; `devbox run -c <abs dse path> -- …`.
- **Private scratch:** `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc578-rev-r2-<yourAgentId>/`, unique script/log names; Write tool for scratch files.
- **Never `rm` with a variable target; never a glob `rm` under /tmp.**
- **One gate per Bash call, foreground.** No background gates or Monitor, except shots (then
  poll its own log in your folder). Redirect long output to files; record exit codes from a
  script file run through devbox; read each gate's summary line.
- **Never set `DSE_LIFECYCLE_PORT`.** Private `DSE_CAMERA_TMP` per run.
- **Kill only by literal PID** whose cwd/command line is inside this worktree. Never pkill by pattern.
- Never key a wait-loop on a scratch filename or its contents.
- The main checkout's dse vault dirt (`demo-vault/Welcome.md`, `compendium-manifest.json`,
  `demo-vault/*.md`) is Scott's and expected.
- If the report-file write is blocked, return the report inline.
- You cannot `SendMessage` me; end with `STATUS: NEEDS_CONTEXT` if you need input. Any message
  you send anyway starts with `SC-578:`.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc578-malice-clamped-log/sc578-r2-review-report.md`,
opening with a ≤10-line executive summary (verdict APPROVE / CHANGES, counts by severity,
gate numbers measured). Findings by severity (HIGH / MEDIUM / LOW / INFO) with file:line,
failure scenario, prescribed fix.

## 5. Return contract

Raw facts: verdict, sha reviewed, findings list (severity · file:line · one line), measured
gate numbers, and absolute paths of the report and every log.
