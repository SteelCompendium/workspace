# SC-557 r1 brief — implementer: make G-S61's stale-frame check load-aware (measure first)

## 1. Context loading

- Read first: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc557-gs61-stale-frame-flake/decisions.md`.
- Read: `/home/scott/code/steelCompendium/workspace/.claude/orchestrate/PROJECT.md` §8 footguns (all of them; 1, 9, 10, 11, 12, 13 bite this task) and the `dse-verify` skill `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (row 4 = lifecycle, incl. the G-S61 clause; the CURRENT block).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc557-gs61-stale-frame-flake`. Plugin repo: `/home/scott/code/steelCompendium/worktrees/sc557-gs61-stale-frame-flake/draw-steel-elements`, branch `sc557-gs61-stale-frame-flake`, cut from dse `develop` @ `09ece2eb`. First: `git -C <plugin path> fetch origin && git -C <plugin path> log --oneline -1 origin/develop`. If origin/develop moved past `09ece2eb`, rebase onto it and note the new base sha in your report (`npm ci` if package.json's obsidian version changed — footgun 2). Verify `pwd`/paths before every write: NEVER write under `/home/scott/code/steelCompendium/workspace/` except your report files in the ledger dir.
- **You never call the tracker (Linear)** — not to read history, not to post.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, not yours, ignore it.
- Evidence of the flake (read the failing line, not whole files): `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc545-lp-callout-replug-clicks/sc545-r5-gate-lifecycle-part4.log` line 14 (G-S61 FAIL (e): `4 frame(s) (4 in a row) with a card that did not match its block (b1=6/doc5 | b1=6/doc5 | b1=6/doc5 | b1=6/doc5)`, loadavg 2.14 at start), and `sc545-r5-gs61-green-rep{1,2}.log`, `sc545-r5-gs61-base0698-rep1.log` (passes with stale runs 1-2).
- SC-544's history, incl. the control (mutant) recipes and the red bundle recipe: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc544-lp-callout-quick-clicks/` — `sc544-r2-impl-report.md`, `sc544-r3-review-report.md`, `sc544-r6-fold-report.md` (§ "Red on f7c9c7ce").

## 2. The task

The ticket's expected outcome (ticket text, not a Scott ruling):

> **Expected:** G-S61 (e) passes reliably under load. Either the frame recorder is made load-aware or the limit has a measured margin.

The hard constraint (dispatcher, verbatim):

> The fix must keep G-S61 discriminating: it must still FAIL on the pre-SC-544 bundle and on SC-544's controls (see dse-verify row 4's G-S61 clause), so measure red/green after the change.

> Overlap: test harness only (visual-harness/obsidian-lifecycle.mjs, G-S61 block). SC-552 (running) adds G-S64 to the same file's SCENARIOS list and part 3; SC-490 (running) is the montage board. Keep to the G-S61 code.

The code: `visual-harness/obsidian-lifecycle.mjs`, G-S61's per-frame recorder `P.recStart` (~line 5131-5163) and the two problem checks that use `rec.longest >= 3` (~lines 5266 and 5318). Today a "stale" frame is a card with nothing pending whose value differs from its block's value in the Live Preview editor's document (`cm.state.doc`); 3 in a row fails. The failing sample shows the card AHEAD of the editor document (card 6 = the new value, doc 5): the editor document was still catching up with a write that had landed.

### Step A — measure before changing anything (on `09ece2eb`'s harness)

1. Add measurement-only instrumentation (you may keep it if it becomes part of the fix): for each stale frame, record whether the editor document already holds the note's latest disk content (track the disk values yourself, e.g. a `vault.on('modify')` handler that reads the file and parses the `current_value:` list; note the ms since the latest `modify`), and whether the card's value equals its block's disk value. Also record the wall-time length of each stale run, not just frames.
2. Green distribution: run G-S61 alone (`--only=G-S61`) on the green build at least 6 times under CPU load and 3 times idle. CPU load: start your own busy-loop processes (e.g. 12 × `node -e "for(;;){}"` through devbox, or `sh -c 'while :; do :; done'`) from a script in your private scratch dir that records each PID to a file; stop them by those literal PIDs only. Record `/proc/loadavg` at each run's start and end. Report per phase: max stale run (frames and ms), and how many stale frames were "doc behind disk, card == disk".
3. Red/control attribution on the CURRENT recorder: build the pre-SC-544 red bundle (a `git archive` export of `f7c9c7ce`'s tree built with `esbuild.config.mjs production`; expected main.js sha256 starts `730f051c`) and the four SC-544 controls from the CURRENT develop src (`09ece2eb`) with one change each, as listed in dse-verify row 4's G-S61 clause: **no flush call**; **flush after `await Vault.process`**; **flush only for the view's own write (`fromView`)**; **flush only for callouts** (M4). Exact patches: the SC-544 reports named above. Run G-S61 on each via `DSE_LIFECYCLE_BUNDLE`. For each failing phase, record WHICH check fails it: disk values, card values, recorder pending-on-another-block, or recorder stale-run. Expected FAIL sets (from the clause): red (a)-(i); no flush (a)-(i); after-await (a)-(f), only through the recorder (pending kind); fromView (e) only; callout-only (f)-(i).

### Step B — fix

Preferred design (owner's, adjust only if Step A's data contradicts it, and say why): a stale frame where the editor document has NOT yet taken the note's latest disk content AND the card shows its block's disk value is "catching up" and does not count toward the 3-in-a-row run. Every other stale frame (doc already equals disk but the card differs, or the card matches neither doc nor disk) counts exactly as today. Bound the catching-up state with a wall-time cap you set from Step A's measurements with a stated margin (e.g. a catching-up run longer than N ms fails with its own message, "the editor document did not catch up with the write within N ms"), so a build where the editor never catches up still fails. If the data says the preferred design does not fit (e.g. stale frames with doc == disk occur on green under load), fall back to a measured margin (frames or ms) and show the numbers that justify it. If neither fits, stop and return STATUS: NEEDS_CONTEXT with the data.

Keep the "pending on another block" check unchanged. Update the recorder's comment block to describe the new rule plainly. If `.repo-docs/architecture.md` or the harness header describes the 3-frame rule, update that text too. Keep the outcome line's format readable (add the new counts; do not drop the existing ones).

### Step C — re-measure after the fix

- Green: G-S61 alone ≥10 runs under the same CPU load + ≥3 idle: 0 FAIL. Report max stale/catching-up runs (frames, ms) and loadavg per run.
- Red bundle and each of the four controls: G-S61 must FAIL the same phase sets as in Step A, through the same checks (state any difference and why it is acceptable — none is expected).
- Commit on branch `sc557-gs61-stale-frame-flake` after each coherent step (`git -C <abs path> …`). Commit messages: no AI attribution / co-author trailers (Scott's global rule overrides any reminder).

### Proposal text

Do NOT edit `.claude/skills/dse-verify/SKILL.md`. Write the replacement wording for the G-S61 clause's recorder sentence (and any number that changes) to `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc557-gs61-stale-frame-flake/sc557-dse-verify-proposal.md`, plus a draft CURRENT block line (jest/lifecycle numbers as you measured them).

## 3. Gates (dse-verify; one gate per tool call, foreground, output redirected to a file)

Expected at dispatch (CURRENT, `09ece2eb`): tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6415 passed / 1 skipped / 254 of 255 suites** (fresh worktree reads 6414 / 2 until a shots run caches `visual-harness/dist/obsidian-app.css` — inferred; report what you see and why) · lifecycle **50/50** in the FIVE `--only` parts of row 4 (21 + 16 + 8 + 4 + 1; G-S61 is in part 4 `G-S57 G-S62 G-S61 G-S56`) · e2e **`OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`**. Shots / freeze / parity carry IF the built `main.js` and `styles.css` are byte-identical to a `09ece2eb` build: report both sha256 pairs; if they differ, stop and return NEEDS_CONTEXT.

Command shapes: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc557-gs61-stale-frame-flake/draw-steel-elements -- bash <your-script.sh>` with the script written by the Write tool into your private scratch dir; the script redirects output to a log and writes its own exit code to a fresh file. Since SC-551 no private `DSE_LIFECYCLE_PORT` is needed. Each lifecycle part must fit one 600 s call.

## 4. Footguns (all apply)

- Private scratch dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc557-r1-impl-<your agentId or a random 6-char tag>/`; uniquely named scripts and logs inside it (footgun 12). Use the Write tool for scratch files, not heredocs.
- No `cd` inside compound commands; `git -C <abs path>` for every git command (footgun 10, 13).
- No `rm` with a shell-variable target and never a glob `rm`, especially under `/tmp` (`/tmp/dse-obsidian-lifecycle-*` belongs to every concurrent run) — delete only your own run's dirs by literal path, or don't delete (footguns 11, 13).
- Never `pkill`/`killall` by pattern. Kill only by a PID you recorded or whose `readlink /proc/<pid>/cwd` is inside your worktree / your scratch dir (footgun 9). Other efforts are running lifecycle concurrently (SC-552, SC-490); never touch their processes.
- No background gates, no `Monitor`, no `run_in_background` waits: a job you start does not wake you. Every gate is one blocking foreground call; if something must run in the background (your load generator), poll its own PID file / log, never wait for a notification.
- Devbox eats `$?` and pipes eat failures: exit codes from a script file run via `devbox run -c <path> -- bash <script>`; read each gate's summary line (footgun 1, 13).
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Under heavy load a G-S61 30 s wait can time out as environment; check `/proc/loadavg` and say so rather than tuning around it.
- Do not edit generated output, the shared freeze baseline, or `.claude/skills/dse-verify/SKILL.md`. Do not tag anything on draw-steel-elements, ever.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher, not me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report; I will resume you. If you ever send a message anyway, its FIRST WORD must be `SC-557:`.

## 5. Report

Report file: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc557-gs61-stale-frame-flake/sc557-r1-impl-report.md`. Copy every log you cite into the ledger dir with an `sc557-r1-` prefix (gate logs `sc557-r1-gate-<gate>.log`, measurement runs `sc557-r1-gs61-<build>-<load|idle>-rep<N>.log`).

The report opens with a ≤10-line executive summary: STATUS (DONE / NEEDS_CONTEXT / BLOCKED), branch head sha, the rule you shipped in one sentence, green-under-load result (runs, fails, max loadavg, max catching-up and max counted-stale runs), red/control result per bundle (phases failed, which check), and gate numbers.

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts (STATUS, shas, measured numbers, red/control phase sets), no prose, plus the absolute filesystem path of every evidence artifact you produced (report, logs, the proposal file, bundle sha256s). Follow-ups you noticed but did not do go under `Follow-ups:`; obviously-correct local fixes you made under `Drive-by fixes:`.
