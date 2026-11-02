# SC-539 r1 — diagnose the CHR-F02 e2e flake (no fix yet)

You are an independent diagnosis worker for ticket SC-539. Your final text goes to the ticket-owner, not a human.
**Workers never call the tracker** (Linear) — not to read history, not to post. Everything you need is here and in
the files named below.

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc539-e2e-chrf02-flake/decisions.md` — read it
  first; it holds the owner's findings so far.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc539-e2e-chrf02-flake` (superproject); the plugin is
  `/home/scott/code/steelCompendium/worktrees/sc539-e2e-chrf02-flake/draw-steel-elements`, branch
  `sc539-e2e-chrf02-flake`, at dse `develop` `fb24f8a2`. Verify with
  `git -C <plugin path> log --oneline -1` before anything else. Do not rebase; do not commit.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — read the e2e row,
  the "concurrent batteries / load" section, and how to run one spec. CURRENT at `fb24f8a2`:
  e2e `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`.
- Evidence of the two failures (read the error + the screenshot, skim the logs):
  - `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc525-ref-nesting-retype/sc525-r4-e2e-CHR-F02-error.txt`, `…/sc525-r4-e2e-CHR-F02-screenshot.png`, `…/sc525-r4-e2e-run1.log`
  - `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc481-twin-block-vanish/sc481-r2-gate-e2e-run1-CHR-F02-fail.log`
- The main checkout (`/home/scott/code/steelCompendium/workspace`) shows dse dirt (`demo-vault/Welcome.md`,
  untracked `compendium-manifest.json` / `demo-vault/*.md`) — that is Scott's live vault, expected; ignore it.
  Never write in the main checkout except your report file in the ledger dir.

## 2. The task

The failing step is `e2e/specs/stamina-bar/chrome-focus.e2e.ts:69` — `await dse.click(root.control('chrome.collapse'))`
right after `await dse.hover(root.root)` (CHR-F02's MOUSE-Collapse setup), failing with
`element ("[data-dse-control="chrome.collapse"]") still not displayed after 8000ms` (via `e2e/driver/dse.ts:321`).
In the failure screenshot the bar is expanded and the hover-revealed chrome panel is not showing. It passed on
immediate rerun both times; it has been seen at load average ~6.5 and on an otherwise-quiet branch.

Answer, with evidence (runtime probes, not just reading):

1. **Mechanism.** How is the chrome panel revealed — CSS `:hover` on which element, a JS pointerenter/class toggle,
   a transition/delay? What does `dse.hover` actually do (WebDriver moveTo? CDP Input.dispatchMouseEvent?) and what
   does `dse.click` wait on before clicking (`waitForDisplayed`? what counts as "displayed" — opacity 0 → not
   displayed in the WebDriver atom)? Cite file:line.
2. **Why it can stay hidden for 8 s.** Candidates to confirm or kill: (a) the block re-renders after `openNote`/
   `startExpanded` (e.g. CHR-F01 left focus/state, the note re-opens, a late render replaces the hovered node), the
   pointer is stationary, and Chromium does not re-apply `:hover` to the new node until the mouse moves; (b) the
   hover lands at a stale position because the layout shifted after the hover; (c) something un-reveals the panel
   (focus-out / a "keyboard mode" class / CHR-F01's focus left on Collapse); (d) a real product race (the reveal
   logic itself can stick hidden for a real user who keeps the mouse over the bar). Reproduce the failure
   deterministically if you can — e.g. CDP `Emulation.setCPUThrottlingRate` on the Obsidian renderer, or forcing a
   re-render between hover and click in a probe — rather than loading the whole machine (other agents run gates on
   this machine; **do not run CPU-burn stress tools**).
3. **Verdict:** test-timing flake vs. real product race — and if a product race, what a real user would see
   (mouse resting over the bar and the panel never appears until they wiggle?). Judge whether that is a user-visible
   bug or only a synthetic-pointer artefact.
4. **Same cause as SC-529 / SC-534?** Those are CHR-L01 (`e2e/specs/stamina-bar/chrome-live-preview.e2e.ts`, Live
   Preview): "timed out waiting for the chrome panel to stay revealed before pressing Collapse" / "still not displayed
   after 8000ms" under load. Read that spec and its reveal wait; say whether the same mechanism applies and whether
   one fix (e.g. in the driver's hover/click) would cover both.
5. **Prescribed fix**, stated as a plan only (do NOT implement): where (src vs `e2e/driver` vs the spec), what exactly,
   and why it does not weaken what CHR-F02 proves (CHR-F02 must still prove: Tab reaches Expand, Enter expands,
   focus lands on Collapse with the ring, panel opacity 1). Name the minimal set of specs that would share the fix.

Probe code: you may add temporary instrumentation to the worktree to run probes, but **revert it before you finish**
(`git -C <plugin path> status` must be clean at the end) and save any probe source you want kept as `.txt` in your
scratch folder. No commits.

## 3. Gates

None required for a diagnosis round. If you run e2e, run the single spec (or a few specs) the way dse-verify says, as
one blocking foreground Bash call per run, output redirected to a uniquely named log in your scratch folder.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc539-e2e-chrf02-flake/sc539-r1-diag-report.md`.
It must open with a **≤10-line executive summary** (verdict, mechanism in one line, repro rate with/without the
condition, SC-529/534 same-cause yes/no, fix location). Body: evidence by question, file:line, commands run, logs.

## 5. Return contract

Final text: raw facts only — verdict, mechanism, repro numbers (k/n runs under which condition), SC-529/534 same-cause
answer, prescribed fix location — plus the **absolute path of every evidence artifact** you produced (logs, probe
sources, screenshots). Report `Follow-ups:` (things you saw but left alone) separately. No prose padding.

## 6. Footguns (all apply)

- If the report-file write is blocked by your harness, return the report inline.
- Scratch: make a private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc539-r1-<yourAgentId>/`
  and keep every script and log there, uniquely named. Use the Write tool for scratch files (no heredocs).
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and
  branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Run every gate/run as ONE blocking foreground Bash call (under 10 min). No `run_in_background`, no Monitor, no
  background jobs.
- devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc539-e2e-chrf02-flake/draw-steel-elements -- <cmd>`.
  Never `cd` inside a compound command; no `cd X && …`. Devbox eats `$?`; record exit codes from a script file run via
  `devbox run -c <path> -- bash <script>`, and read each run's summary line.
- Every git command as `git -C <absolute path> …`.
- Never `rm` with a shell-variable target, never a glob `rm`, never `rm -rf` a shared `/tmp` glob or the shared
  `.superpowers/` dir. Overwrite with `>` or use fresh unique filenames instead.
- Never `pkill`/`killall` by pattern. Kill only by PID whose command line contains
  `worktrees/sc539-e2e-chrf02-flake/` (or whose `readlink /proc/<pid>/cwd` is inside it).
- e2e uses its own Xvfb `:200–:239`; never `:1`.
- You cannot `SendMessage` me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question
  in your report; I will resume you. If you ever do send a message anyway, its first word must be `SC-539:`.
