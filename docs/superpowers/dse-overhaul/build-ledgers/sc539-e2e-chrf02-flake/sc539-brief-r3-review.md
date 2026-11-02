# SC-539 r3 — independent adversarial review of the pointer-park fix

You are an independent reviewer. Your final text goes to the ticket-owner, not a human. **Workers never call the
tracker** (Linear) — not to read history, not to post. Execute and probe; do not just read.

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc539-e2e-chrf02-flake/decisions.md`
- Diagnosis: `…/sc539-e2e-chrf02-flake/sc539-r1-diag-report.md` (summary + Q5). Probe kit (copy, never edit):
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc539-r1-a3360303193e5c4ae/`
- Implementation report: `…/sc539-e2e-chrf02-flake/sc539-r2-impl-report.md` and its gate logs `sc539-r2-gate-*.log`.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc539-e2e-chrf02-flake`; plugin branch
  `sc539-e2e-chrf02-flake`, HEAD `ec576f5b` on base `fb24f8a2` (dse `develop`). Review `git -C <plugin> diff fb24f8a2..HEAD`.
  Do not commit to the branch; any probe edits must be reverted before you finish (`git status` clean).
- Main checkout dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is
  Scott's live vault, expected.

## 2. What to probe

1. **Does it fix the flake?** Re-run the r1 150 ms foreign-window churn harness against the hover tests (CHR-F02,
   CHR-F03, CHR-L01, INIT-DEF-E04) at HEAD (≥ 2 runs) and with the park disabled (≥ 1 run). k/n each.
2. **Safety of the pointer move.** The ledger's latest ruling (raw X11 client from node, no xdotool — read
   "Owner ruling on the course-correction") is what should have been built; if r2 fell back to xdotool, check the
   stated blocker is real. Prove the park can only ever touch the private e2e display: the socket/display number comes
   from the private Xvfb, never from an inherited `DISPLAY`; `--headed` path untouched; with `DISPLAY=:1` exported in
   the caller's env it still targets the private display. Read-only check of `:1`'s pointer before/after if a tool is
   available — never move anything on `:1`.
3. **Failure modes.** Ruling: degrade loudly but safely — any failure (socket missing, setup refused, timeout, readback
   ≠ 0,0) prints `OBSIDIAN-E2E WARN pointer NOT parked: …` (also in the final summary) and the run CONTINUES; it must
   never exit 2, hang, or stay silent. Probe each you can (non-existent display number, a socket that accepts but never
   answers, a malformed/short setup reply if you can fake one with a local unix-socket server). Check the X11 protocol
   code against the core spec: byte order byte, setup-reply parsing (vendor length padding, pixmap formats, root
   window offset), WarpPointer/QueryPointer request layout, little-endian handling, socket closed afterwards.
   Confirm `.github/workflows/` (ci.yml, plugin-ci.yml) do not run e2e/Xvfb. No new dependency in package.json/devbox.
3b. **The keeper window (r2 discovery).** r2 found a one-shot WarpPointer does not stick on a bare Xvfb — the pointer
   snaps back to 800,600 when the last mapped window goes away — so `e2e/x11-pointer.mjs` holds a 1x1 InputOnly window
   mapped at 0,0 for the whole run. Verify that claim independently (does the snap-back really happen without the
   keeper?), and that the keeper: never overlaps an Obsidian window or receives input a test relies on; cannot stop the
   run from exiting (socket ref/unref, event-loop hang); is torn down with Xvfb (`reapAll`) and leaves no fd/process;
   and cannot be broken by Obsidian windows mapping/unmapping (pointer stays 0,0 across a whole full run — sample it).
4. **Does it hold for every shard and every window lifetime?** Is the pointer parked once per Xvfb, and is there one
   Xvfb for all shards (or one per shard)? Could anything later move the X pointer back inside a window (wdio, Obsidian
   window placement, a spec's real-mouse step — e.g. CHR-L01's CDP pointer, any `xdotool`/`performActions` usage)? If a
   spec uses real OS-level mouse input, does parking break it?
5. **Nothing weakened.** No spec or `src/` change; CHR-F02 still proves Tab→Expand, Enter expands, focus on Collapse
   with ring, panel opacity 1. Built `main.js` / `styles.css` byte-identical to base (check the sha256 claim).
6. **Battery spot-check:** one full e2e run yourself: expect
   `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs` and the pointer-parked log line.
   tsc + lint clean. (No need to re-run jest/lifecycle unless the diff touches something they cover.)
7. Read `sc539-dse-verify-proposal.md` in the ledger dir for accuracy against the code.

## 3. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc539-e2e-chrf02-flake/sc539-r3-review-report.md`, opening
with a **≤10-line executive summary** (verdict: LAND / FIX-FIRST, finding counts by severity, proof k/n). Findings by
severity (HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario, prescribed fix.

## 4. Return contract

Final text: raw facts — verdict, findings by severity with file:line, proof numbers, e2e summary line — plus the
**absolute path of every evidence artifact**. `Follow-ups:` separately. No prose padding.

## 5. Footguns (all apply)

- If the report-file write is blocked by your harness, return the report inline.
- Scratch: private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc539-r3-<yourAgentId>/`,
  uniquely named files; Write tool for scratch files (no heredocs).
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and
  branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Every gate/run as ONE blocking foreground Bash call (< 10 min). No `run_in_background`, no Monitor, no background jobs.
- devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc539-e2e-chrf02-flake/draw-steel-elements -- <cmd>`;
  never `cd` inside a compound command; record exit codes from a script file run via devbox; never pipe a gate to `tail`.
- Every git command as `git -C <absolute path> …`.
- Never `rm` with a shell-variable target, never a glob `rm`, never `rm -rf` a shared `/tmp` glob or `.superpowers/`.
- Never `pkill`/`killall` by pattern; kill only PIDs whose command line contains `worktrees/sc539-e2e-chrf02-flake/`
  (or whose `readlink /proc/<pid>/cwd` is inside it).
- e2e Xvfb is `:200–:239`; on `:1` (Scott's real display) only read-only queries, never a move/click/key.
- `grep` in agent shells is ugrep `-I` and skips `e2e/run.mjs` as binary: use `command grep -a`.
- You cannot `SendMessage` me. If you need input, end with `STATUS: NEEDS_CONTEXT` and the question. If you ever do
  send a message anyway, its first word must be `SC-539:`.
