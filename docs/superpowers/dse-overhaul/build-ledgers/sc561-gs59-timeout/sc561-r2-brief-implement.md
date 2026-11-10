# SC-561 round 2 brief — make G-S59 reliable (implementer)

You are the implementer for ticket SC-561. Your final text goes to the ticket-owner, not a human.

## 1. Context loading
- Read the ledger first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc561-gs59-timeout/decisions.md` — especially "Owner rulings" OWNER-1..OWNER-4.
- Read the r1 diagnosis report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc561-gs59-timeout/sc561-r1-diagnosis-report.md` (exec summary + §4 in full; other sections as needed). Its scripts and control-build recipe are in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc561-r1-diag-q7m3/` (`build-bundles.sh`, `bundle-base/` = pre-SC-472 `367a2f1d` control, `bundle-plain/` = plain-2.5 s-timer control, `run-stock.sh`, `busy-start.sh`/`busy-stop.sh`, `summ-sc561.py`). Reuse them (copy into your own scratch folder); do not modify that folder.
- Read the `dse-verify` skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (battery order, command shapes, lifecycle parts, freeze/parity rules) and `/home/scott/code/steelCompendium/workspace/.claude/orchestrate/PROJECT.md` §8 footguns.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc561-gs59-timeout`; plugin repo `/home/scott/code/steelCompendium/worktrees/sc561-gs59-timeout/draw-steel-elements`, branch `sc561-gs59-timeout`, HEAD `6270e84a` (= origin/develop). First: `git -C <plugin repo> fetch origin`; if `origin/develop` moved past `6270e84a`, rebase onto it and report the new base sha. `node_modules` is already installed (r1 ran `npm ci`); re-run `npm ci` only if a rebase changed package.json.
- **You never call the tracker (Linear)** — not to read history, not to post.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault and expected — ignore it, and never touch the main checkout. All your edits are inside the worktree; verify the path before every write.

## 2. The task (harness only — the plugin's `src/` must not change)
Owner rulings, verbatim from the ledger:

> OWNER-1: Adopt r1 Fix 1 — remove the CDP throttle from G-S59 (keep BUSY_MS 4000, CAP_MS 30000), update header/block comments and result string. This supersedes SC-472's owner ruling "Lifecycle: new G-S59 under CDP 8x throttle" (owner ruling, not Scott's). Justification: r1 measured that without the throttle the controls still discriminate (pre-SC-472 build 367a2f1d fails (a)+(b) 6/6, plain-2.5 s-timer build fails 6/6) and head passed 30/30 writes at load 6-35.

> OWNER-2: FOLD r1 Fix 2 (phase (c) environment precondition "scroll took N ms, past the 2400 ms" failed 6/12 runs at load >= 8) into SC-561 — same scenario, and the ticket's expectation is "G-S59 passes reliably". Implementer measures options (a) fewer/larger wheel steps and (b) wheel centre computed before the write first; (c) bounded env-only retry only as an addition. GO_AT stays (must stay below PIN_TTL_MS).

> OWNER-3: DROP the optional MutationObserver-based `ready` — reason: it only removes rAF frame lag, which is irrelevant once the throttle is gone (worst wait 9.4 s vs 30 s cap).

OWNER-4 (SC-491 perf) is OUT OF SCOPE — do not touch styles or plugin code.

Concretely, in `visual-harness/obsidian-lifecycle.mjs` (line numbers from r1 at 6270e84a):
1. Fix 1 per r1 §4: remove `RATE` (`:6019`), `throttle(RATE)` (`:6040`), the `throttle(1)` calls (`:6050`, `:6057`), the 10-frames comment (`:6047-6048`); update the scenario header (`:132-145`), the block comment (`:6005-6015`), and the result string (`:6295`). If the throttle helper becomes unused anywhere in the file, remove it only if no other scenario uses it.
2. Fix 2 for phase (c): measure option (a) and option (b) (alone and together) and adopt the smallest change that makes (c)'s environment precondition hold reliably. Add option (c) — re-run a variant at most twice ONLY when the environment precondition alone failed, product assertions evaluated only on env-valid attempts — only if (a)/(b) are not enough at the load levels below. Leave `GO_AT` unchanged. Keep (c)'s teeth: SC-472's third control (`b8f7fcb2`, "any removal counts") must still FAIL (c) — rebuild that control the way SC-472 / r1's `build-bundles.sh` did.
3. Comments must state what the scenario now relies on (the 4 s busy spin, not a throttle) and why, with the SC-561 key, so the next person does not re-add a throttle.
4. Write the dse-verify proposal (do NOT edit SKILL.md): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc561-gs59-timeout/sc561-dse-verify-proposal.md` — exact old/new text for every SKILL.md passage that describes G-S59 (e.g. "CPU throttled 8x", G-S59 part timing ~156 s), with measured new part-5 timing.
5. Commit on branch `sc561-gs59-timeout` in the plugin repo (`git -C`), message `test(SC-561): …`, no AI attribution trailers (Scott's global rule). Commit after each coherent step. Do NOT bump the superproject pointer and do NOT push.

## 3. Proof and gates (state every number you measure)
Proof that G-S59 is reliable AND keeps its teeth (one run per Bash call, foreground):
- (i) head: G-S59 alone, at least 3 runs at idle and at least 5 runs under synthetic load (8 busy `node -e 'for(;;){}'` loops, started and killed by literal PID; record loadavg per run). Expected 0 FAIL. Record (a)/(b) worst wait and (c) worst scroll time.
- (ii) control `367a2f1d` bundle FAILs (a)+(b).
- (iii) plain-2.5 s-timer control FAILs (a)+(b).
- (iv) `b8f7fcb2` control FAILs (c).
- (v) prove `main.js` and `styles.css` built from your head are byte-identical to the 6270e84a build (sha256 both).

Full battery per dse-verify, in order, each gate in its own foreground Bash call. Expected numbers at 6270e84a: jest 6492 / 1 skipped / 257 of 258 suites · lifecycle 52/52 (five `--only` parts, union) · e2e `128/128 ok, 0 failed`, `coverage: 89/89 pairs` · shots 592, 0 FAIL, host-leak 163/978, capture clip OK (147 …) · freeze 280/280 · parity 0/0/24. Plus tsc and lint clean. Lifecycle in FIVE parts exactly:
1. `G-S7a … G-S9a` (21) 2. `G-S9b … G-S40` (16) 3. `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9) 4. `G-S57 G-S62 G-S61 G-S56` (4) 5. `G-S59 G-S49` (2)
(full id lists for parts 1-2 are in dse-verify row 4). G-S56 stays LAST in SCENARIOS order — do not reorder scenarios. If dse-verify explicitly allows skipping shots/freeze/parity for a harness-only change with byte-identical `main.js`/`styles.css`, you may skip them; say which rule you relied on, quoting it. Otherwise run them.

## 4. Footguns (all mandatory)
- No compound `cd`. Use `git -C <abs path>` for every git command and `devbox run -c /home/scott/code/steelCompendium/worktrees/sc561-gs59-timeout/draw-steel-elements -- <cmd>` for node/npm.
- Devbox's `sh` wrapper eats `$?`; record exit codes from a script FILE run via `devbox run -c <path> -- bash <script>`, and read each gate's own summary line. Never pipe a gate into `tail`.
- One gate per Bash call, in the foreground. No `run_in_background`, no Monitor, no waiting on notifications. Redirect long output to a file (the 600 s stream watchdog kills silent agents), then read the file.
- Never set `DSE_LIFECYCLE_PORT`. Give each lifecycle/e2e run a private `DSE_CAMERA_TMP` inside your scratch folder.
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc561-r2-impl-<4 random chars>/`. Uniquely named scripts and logs inside it. Use the Write tool for scratch files.
- Never `rm` with a shell-variable target, never a glob `rm` (never `/tmp/dse-obsidian-lifecycle-*` — concurrent efforts' vaults match it). Delete only literal paths you created and recorded.
- Kill processes by literal PID only, and only a PID whose command line or `readlink /proc/<pid>/cwd` is inside your worktree / scratch folder. Never `pkill`/`killall` by pattern — SC-556 and SC-486 run the same gates concurrently.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Never edit dse-verify SKILL.md; never edit the freeze baseline.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher. If you need input, end your turn with `STATUS: NEEDS_CONTEXT` and the question. If you ever send a message anyway, its FIRST WORD must be `SC-561:`.
- Report extras in two lists: `Drive-by fixes:` (already made, obviously correct, local to the file, cannot move a gate) and `Follow-ups:` (left alone).

## 5. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc561-gs59-timeout/sc561-r2-impl-report.md`, opening with a ≤10-line executive summary: commits (shas), which Fix 2 option(s) adopted and why, proof (i)-(v) results, every battery number vs expected.

## 6. Return contract
Final text: raw facts only — verdict, branch + head sha, measured numbers, and the absolute path of every evidence artifact (report, logs, screenshots, scripts, proposal file). No prose.
