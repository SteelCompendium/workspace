# SC-561 round 3 brief — independent adversarial review of the G-S59 fix (reviewer)

You are the independent reviewer for ticket SC-561. You did not write this code. Your final text goes to the ticket-owner, not a human.

## 1. Context loading
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc561-gs59-timeout/decisions.md` (owner rulings OWNER-1..OWNER-4).
- r1 diagnosis: `.../sc561-gs59-timeout/sc561-r1-diagnosis-report.md` (exec summary, §4). r2 implementer report: `.../sc561-gs59-timeout/sc561-r2-impl-report.md`. dse-verify proposal: `.../sc561-gs59-timeout/sc561-dse-verify-proposal.md`.
- `dse-verify` skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`; footguns `/home/scott/code/steelCompendium/workspace/.claude/orchestrate/PROJECT.md` §8.
- Code under review: plugin repo `/home/scott/code/steelCompendium/worktrees/sc561-gs59-timeout/draw-steel-elements`, branch `sc561-gs59-timeout`, head `d344e1e1`, base `6270e84a` (origin/develop). `git -C <repo> fetch origin` first; if origin/develop moved, report it, do not rebase. Review `git diff 6270e84a..d344e1e1`.
- **You never call the tracker (Linear).** Never modify the branch (no commits, no edits in the worktree). Probes run from private copies / scratch worktrees (`git -C <repo> worktree add <scratch path> <sha>`) and are removed by literal path at the end.
- The main checkout's dse dirt (`demo-vault/Welcome.md`, `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault — ignore it.

## 2. The task
Rulings under review, verbatim:

> OWNER-1: Adopt r1 Fix 1 — remove the CDP throttle from G-S59 (keep BUSY_MS 4000, CAP_MS 30000), update header/block comments and result string. This supersedes SC-472's owner ruling "Lifecycle: new G-S59 under CDP 8x throttle" (owner ruling, not Scott's). Justification: r1 measured that without the throttle the controls still discriminate (pre-SC-472 build 367a2f1d fails (a)+(b) 6/6, plain-2.5 s-timer build fails 6/6) and head passed 30/30 writes at load 6-35.

> OWNER-2: FOLD r1 Fix 2 (phase (c) environment precondition "scroll took N ms, past the 2400 ms" failed 6/12 runs at load >= 8) into SC-561 — same scenario, and the ticket's expectation is "G-S59 passes reliably". Implementer measures options (a) fewer/larger wheel steps and (b) wheel centre computed before the write first; (c) bounded env-only retry only as an addition. GO_AT stays (must stay below PIN_TTL_MS).

Execute and probe, do not just read. Questions:
1. **Reliability:** re-run G-S59 alone yourself — at least 2 idle runs and at least 4 under synthetic load (8+ busy loops; record loadavg). Any FAIL is a finding, with its log line.
2. **Teeth (vacuity check — the most important question):** does G-S59 still fail on the bugs it was written to catch? Independently rebuild and run at least the `367a2f1d` control and the `b8f7fcb2` "any removal counts" control (b8f7fcb2 is no longer in the object store: use the SC-472 r4 bundle the r2 report names, main.js sha256 `d719e745…`, and verify that hash) (and the plain-2.5 s-timer control if time allows) against the NEW harness; each must FAIL in the phase it targets. Also check: could any change in phase (c) (larger wheel steps, centre computed earlier, retry) let a real product failure pass — e.g. does a retry ever evaluate product assertions on an env-invalid attempt, or mask a product failure as an env failure?
3. **Diff correctness:** throttle fully removed with no dangling helper/comment, no other scenario affected, comments accurate (no stale "8x"), result string accurate, scenario order unchanged (G-S56 still last in SCENARIOS), lifecycle count unchanged at 52.
4. **Byte-identity:** `main.js` and `styles.css` from head equal the `6270e84a` build (sha256).
5. **Gates:** re-run lifecycle part 5 (`G-S59 G-S49`) and part 4 (`G-S57 G-S62 G-S61 G-S56`) yourself; spot-check the implementer's battery logs for the rest against expected: jest 6492 / 1 skipped / 257 of 258 · lifecycle 52/52 · e2e 128/128 ok, coverage 89/89 · shots 592, 0 FAIL, host-leak 163/978 · freeze 280/280 · parity 0/0/24 (or the dse-verify rule quoted for skipping shots/freeze/parity on a byte-identical harness-only change — check the quote is real and applies).
6. **Proposal file:** is every SKILL.md passage that describes G-S59 covered, with accurate old/new text and measured timing?

## 3. Footguns (all mandatory)
- No compound `cd`. `git -C <abs path>` for every git command; `devbox run -c <abs plugin path> -- <cmd>` for node/npm.
- Devbox's `sh` wrapper eats `$?`; record exit codes from a script FILE run via `devbox run -c <path> -- bash <script>`; read each gate's own summary line; never pipe a gate into `tail`.
- One gate per Bash call, in the foreground. No `run_in_background`, no Monitor. Redirect long output to a file, then read it.
- Lifecycle runs only in the five `--only` parts (`G-S7a … G-S9a` 21; `G-S9b … G-S40` 16; `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` 9; `G-S57 G-S62 G-S61 G-S56` 4; `G-S59 G-S49` 2) or single-id runs. Never set `DSE_LIFECYCLE_PORT`. Private `DSE_CAMERA_TMP` per run.
- Private scratch folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc561-r3-review-<4 random chars>/`, uniquely named files.
- Never `rm` with a shell-variable target, never a glob `rm` (never `/tmp/dse-obsidian-lifecycle-*`). Delete only literal paths you created.
- Kill by literal PID only, after checking its command line or `readlink /proc/<pid>/cwd` is yours. Never `pkill`/`killall` — SC-556 and SC-486 run the same gates concurrently.
- Never key a wait-loop on a scratch filename or its contents.
- Never edit dse-verify SKILL.md or the freeze baseline.
- If the report-file write is blocked, return the report inline.
- You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher. If you need input, end with `STATUS: NEEDS_CONTEXT` and the question. Any message you do send starts with `SC-561:`.

## 4. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc561-gs59-timeout/sc561-r3-review-report.md`, opening with a ≤10-line executive summary: verdict (LAND / FIX FIRST), findings count by severity, control results, re-run results. Findings by severity (HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario, prescribed fix.

## 5. Return contract
Final text: raw facts only — verdict, findings by severity with file:line, measured numbers, and the absolute path of every evidence artifact.
