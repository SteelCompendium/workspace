# SC-539 r2 — implement: park the private Xvfb's X pointer outside every Obsidian window

Your final text goes to the ticket-owner, not a human. **Workers never call the tracker** (Linear) — not to read
history, not to post.

## 1. Context loading

- Ledger (read fully first): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc539-e2e-chrf02-flake/decisions.md`
- Diagnosis report (read the summary + Q5 "prescribed fix"; the rest as needed):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc539-e2e-chrf02-flake/sc539-r1-diag-report.md`
- The diagnosis worker's probe kit (reuse it for the proof runs; do not commit it):
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc539-r1-a3360303193e5c4ae/`
  — `run-e2e.sh`, `zz-sc539-probe.e2e.ts.txt`, `probe-instrumentation.diff.txt`, the `churn150-*` logs. Copy
  anything you reuse into YOUR scratch folder; never edit theirs.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc539-e2e-chrf02-flake`; plugin at
  `/home/scott/code/steelCompendium/worktrees/sc539-e2e-chrf02-flake/draw-steel-elements`, branch
  `sc539-e2e-chrf02-flake`, at dse `develop` `fb24f8a2`. First: `git -C <plugin> fetch origin` and confirm
  `origin/develop` is still `fb24f8a2`; if it moved, `git -C <plugin> rebase origin/develop` and say so in the
  report (and run `npm ci` if `package.json` changed). Verify `pwd`/paths before every write: all edits go under
  `/home/scott/code/steelCompendium/worktrees/sc539-e2e-chrf02-flake/`, never under `…/workspace/` (except your
  report files in the ledger dir).
- The main checkout shows dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` /
  `demo-vault/*.md`) — Scott's live vault, expected; ignore it.

## 2. The task (owner ruling, quoted from the ledger)

> Fix = reviewer's plan: `xdotool mousemove 0 0` on the private display in `e2e/run.mjs` (headless only; never
> on a real display), `xdotool@latest` added to `draw-steel-elements/devbox.json` (precedent: `xvfb@latest` is
> already there), resolved like `resolveXvfb()`, EnvError exit 2 if missing. Zero spec changes.

Specifics:

1. `draw-steel-elements/devbox.json`: add `xdotool@latest`; let devbox update `devbox.lock` (e.g. `devbox install`
   run with `-c <plugin path>`). Commit both.
2. `e2e/run.mjs`, headless branch only: resolve `xdotool` the same way `resolveXvfb()` resolves Xvfb (devbox profile
   path first, then PATH; it is also at `/usr/bin/xdotool` on this host — keep the resolution order consistent
   with Xvfb's). Missing → `EnvError` (exit 2) with a message saying what to install. After `startXvfb()` and before
   wdio starts: run it with `DISPLAY` set explicitly to the private display (never inherit the caller's DISPLAY —
   that could be Scott's real `:1`) to move the pointer to 0,0; then read it back (`getmouselocation`) and fail with
   EnvError if it is not at 0,0. Log one line in the existing `OBSIDIAN-E2E` style, e.g.
   `OBSIDIAN-E2E pointer parked at 0,0 on :NNN (outside every window)`. `--headed` must be untouched.
3. A short code comment at the park site saying WHY (shared display, no WM, window at +288+200 1440x1100 contains
   the screen centre where Xvfb starts the pointer; a foreign window map/unmap there sends Leave/Enter and Chromium
   drops the synthetic CDP hover — SC-539, also SC-529/SC-534). If the window geometry is set elsewhere in
   run.mjs/wdio config, reference it so a future geometry change knows the pointer must stay outside.
4. `e2e/README` (the "Headless vs headed" section or nearest equivalent): one short paragraph — all shards share one
   private Xvfb display; the runner parks the X pointer at 0,0 so window churn from other shards cannot steal hover.
5. **Out of scope** (do not touch): any spec file, including `chrome-live-preview.e2e.ts`'s re-hover loop
   (SC-520/SC-529/SC-534 territory); any `src/` file; the dse-verify SKILL.md.
6. Write a proposal file (NOT an edit to SKILL.md):
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc539-e2e-chrf02-flake/sc539-dse-verify-proposal.md`
   — the exact text to add to the dse-verify e2e row/section: e2e needs `xdotool` (devbox), shards share one private
   Xvfb and the runner parks the pointer at 0,0, the new log line to expect; plus a one-line agent note that in agent
   shells `grep` is ugrep with `-I` and treats `e2e/run.mjs` as binary (use `command grep -a`). Also the CURRENT
   numbers line for your head sha if the battery numbers change (they should not).

Commit in coherent steps inside the plugin (`git -C <plugin> commit`), conventional messages (e.g.
`test(e2e): park the private Xvfb pointer outside every Obsidian window (SC-539)`). No AI attribution / no
Co-Authored-By trailer. Do not push. Do not touch the superproject pointer.

## 3. Proof + gates (expected numbers at `fb24f8a2`, from dse-verify CURRENT)

Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` for command shapes.

A. **Regression proof** (the point of the ticket): using the r1 probe kit's 150 ms foreign-window churn harness
   (temporary — not committed), run the hover tests (CHR-F02, CHR-F03, CHR-L01, INIT-DEF-E04):
   - at HEAD (fix in): expect **all pass, 0 foreign leaves**, ≥ 2 runs;
   - at base `fb24f8a2` behaviour (e.g. with the park call disabled by a temporary local edit, reverted after):
     expect the r1 failures to reproduce, ≥ 1 run.
   Report k/n for each. Revert all probe instrumentation before the battery; `git status` clean except commits.
B. **Battery**, each as one blocking foreground call:
   - tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`): clean.
   - jest: **6228 passed / 1 skipped / 249 of 250 suites** (fresh worktree without a shots cache may read one fewer
     passed / 2 skipped — say which).
   - lifecycle: **44/44**, run as two `--only` halves of 22 + 22 (split into three calls if a half nears 600 s).
   - e2e full: **`OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`**, exit 0, and the
     new pointer-parked log line present. Run it **3 times** (separate calls) and report each summary line.
   - shots / freeze / parity: NOT required **if** the built `main.js` and `styles.css` are byte-identical to base —
     prove it with `sha256sum` of each at base vs head (the change touches only `e2e/run.mjs`, README, devbox files).
     If they differ, stop and report STATUS: NEEDS_CONTEXT.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc539-e2e-chrf02-flake/sc539-r2-impl-report.md`, opening
with a **≤10-line executive summary** (head sha, commits, proof k/n head vs base, battery numbers). Gate logs as
`sc539-r2-gate-<name>.log` in the ledger dir (copy from your scratch).

## 5. Return contract

Final text: raw facts — STATUS, head sha + commit list, proof numbers, each gate's summary line, byte-identity
sha256 lines, `Drive-by fixes:` and `Follow-ups:` lists — plus the **absolute path of every evidence artifact**.
No prose padding.

## 6. Footguns (all apply)

- If the report-file write is blocked by your harness, return the report inline.
- Scratch: private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc539-r2-<yourAgentId>/`,
  uniquely named scripts/logs. Use the Write tool for scratch files (no heredocs).
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and
  branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Every gate as ONE blocking foreground Bash call (< 10 min). No `run_in_background`, no Monitor, no background jobs.
- devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc539-e2e-chrf02-flake/draw-steel-elements -- <cmd>`.
  Never `cd` inside a compound command. Devbox eats `$?`; record exit codes from a script file run via
  `devbox run -c <path> -- bash <script>`, and read each gate's summary line. Never pipe a gate into `tail`.
- Every git command as `git -C <absolute path> …`.
- Never `rm` with a shell-variable target, never a glob `rm`, never `rm -rf` a shared `/tmp` glob or the shared
  `.superpowers/` dir. Overwrite with `>` or use fresh unique filenames.
- Never `pkill`/`killall` by pattern. Kill only by PID whose command line contains
  `worktrees/sc539-e2e-chrf02-flake/` (or whose `readlink /proc/<pid>/cwd` is inside it).
- e2e has its own Xvfb `:200–:239`; never `:1`. The churn harness must target only YOUR run's private display.
- Workspace-level files for this effort live in YOUR worktree's superproject at
  `/home/scott/code/steelCompendium/worktrees/sc539-e2e-chrf02-flake/…` — never under
  `/home/scott/code/steelCompendium/workspace/` (except the ledger-dir report/proposal/log files named above).
- `grep` in agent shells is ugrep `-I` and skips `e2e/run.mjs` as binary: use `command grep -a`.
- You cannot `SendMessage` me. If you need input, end your turn with `STATUS: NEEDS_CONTEXT` and the question; I will
  resume you. If you ever do send a message anyway, its first word must be `SC-539:`.
