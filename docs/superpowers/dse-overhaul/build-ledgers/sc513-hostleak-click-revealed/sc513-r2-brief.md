# SC-513 r2 — implementation brief (orchestration:implementer)

## 1. Context loading
- Read FIRST: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc513-hostleak-click-revealed/decisions.md` (task verbatim, rulings, baselines) and the r1 survey report `sc513-r1-survey-report.md` in the same dir — especially §1 (inventory), §3 (mount recipe), §4 (measurements). The prototype is commit `1fce912` on the local branch `sc513-r1-proto` in your worktree's dse clone (patch copy: `sc513-r1-proto-1fce912.patch` in the ledger dir). `faee4f4` on that branch is a survey-only switch and must NOT land.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc513-hostleak-click-revealed`. The plugin is `…/draw-steel-elements`, branch `sc513-hostleak-click-revealed`, currently clean at `f89f69f` = origin/develop. Run `git -C <dse path> fetch origin` first and confirm `origin/develop` is `f89f69f`; if it moved, rebase onto it and say so. `node_modules` is installed (r1 ran `npm ci`); if `package.json` changed on a rebase, run `npm ci` again.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — battery order and command shapes, the "Button host-leak sweep" bullet (~line 197) and the CURRENT block (~line 1231). Read it from the main checkout path; DO NOT edit it (the owner drafts dse-verify text).
- **Workers never call the tracker** (Linear) — not to read history, not to post.
- Verify paths before any write. Every git command is `git -C <absolute path> …`; never `cd X; git …`, never `cd` inside a compound command.
- The main checkout's dse dirt (`demo-vault/Welcome.md` modified, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, never touch it. You work only in the worktree.

## 2. The task
Ticket, verbatim: "**Task:** list the click-to-mount controls in the gallery, then make the sweeps mount each one by a real click before tagging (the SC-205 rule "mount the chrome, don't exempt it"), with a failure if a mount produces nothing."

r1 listed them. Your job: productionize the r1 prototype (`1fce912`) for controls A, B and C on `sc513-hostleak-click-revealed`, WITHOUT control D. Cherry-pick or re-apply as you see fit, but the result must be clean, commented code (cite SC-513 in comments where the mechanism is non-obvious, as SC-501/SC-512 did).

Owner rulings, verbatim from the ledger:
- "Mount by REAL click (dispatch through the page, not by calling internals), in the sweep's own load only. Captures never perform these clicks, so zero shots/frozen bytes move. If a photographed-state change is unavoidable, it needs a widening file and Scott's sanction (owner asks)."
- "Every mount asserts it produced the expected controls (named FAIL, never skip). New kinds are ADDED; existing kinds stay compared."
- "D (popover): option (b). Product CSS bug FILED SC-526 (Backlog, related SC-513/SC-205), which also turns on the D mount and `staminaRecoveryPopover` in the sweep. OUT of scope for SC-513: do not add `staminaRecoveryPopover` to the sweep prefs, do not click the pips. Not an exemption — the mount is simply not added here; the dse-verify text names SC-526 as the open gap."
- "Pref route: ACCEPT `rollingEnabled:true` in the button, input and checkbox sweep URLs only (sweep-only; measured no kind lost / no first-node shift)."
- "Probe hero: ACCEPT gate-only `probeSource('hero','probe-inline-abilities')` (not in FIXTURES, no shot)."
- "Gallery-section clicks: B clicks ONLY the appended `[data-dse-harness-extra=…]` sections (gallery statblock click shifts statblock|dse-collapse__header first node). First-node assertion: DROP — the locator is scoped to the extra sections by construction."
- "Prose sweep coverage of C's body (hero ability body prose): FOLD into r2 — same ticket ("make the sweeps mount each one"); measure and report the prose line; if it goes red, stop and return NEEDS_CONTEXT."
- "Dice pinning: FOLD only if an existing sweep-only seam (e.g. `fixedDice`) pins these rolls with no capture change; otherwise leave unpinned and say so."
- "State-only kinds (pressed initiative/negotiation toggles, enabled Complete Argument, disabled-after-Respite): FILED SC-527 (Backlog). OUT of scope."

Also:
- A comment in shoot.mjs at the mount helper must say D (Recoveries popover) is deliberately not mounted until SC-526 fixes its CSS — so nobody "completes" it with an exemption.
- Ship tests per repo convention: extend `test/dom/visual-harness/fixtures.test.ts` (as SC-512 did) for the new `galleryExtra` sections and the probe hero source — e.g. the probe hero source parses, has inline abilities, is not in FIXTURES / the manifest; the new galleryExtra values append the expected `data-dse-harness-extra` sections and are ignored by captures.
- Anti-vacuity (required, report each with rc and the named lines, then revert): (1) drop `rollingEnabled` from the sweep prefs → rc 1 with named "no ability Roll button" lines; (2) break the probe hero source so it has no abilities → rc 1 with a named "no ability expand toggle" (or equivalent) line. One shots run may carry both breaks if their lines are distinguishable.
- Commit after every coherent step (nothing sits uncommitted through a gate). Never push. Never tag. Do not delete the `sc513-r1-proto` branch.
- No CHANGELOG bullet (harness-only). Do not edit any workspace-level file (dse-verify, CHANGELOG, docs) — if you think one needs a change, say so in the report.

## 3. Gates — the full dse-verify battery on your final head, in its order
Expected numbers (base = CURRENT at f89f69f; deltas = r1's measured prototype, popover off):
- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean.
- jest **6078 passed / 1 skipped / 245 of 246 suites** + your new tests (state the delta). On a fresh worktree jest reads one fewer passed and 2 skipped until a shots run has cached `visual-harness/dist/obsidian-app.css` — compare only after a shots run.
- lifecycle **38/38** (no new scenario expected; if you add one, it is G-S47).
- e2e **`OBSIDIAN-E2E done: 123/123 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`**.
- shots **592**, 0 FAIL, with expected `button host-leak OK (145 … 870 …)` and a **28-record** boundary (base 12 + 16 `focus-visible: disabled` on Reset and stepper for feature, featureblock, statblock, hero ×2 schemes — list the boundary kinds and confirm no other new record); modal **228** (unchanged); input **15 kinds / 176**; checkbox **7 kinds / 116**; plus the prose sweep line before vs after (measure the base line from r1's base log `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc513-r1-k7q2/shots-base-f89f69f.log`). If your numbers differ from r1's, explain each difference.
- All 592 PNG sha256 must equal base (r1's base list: `…/sc513-r1-k7q2/shots-base-f89f69f.sha256`); freeze **`freeze OK (280/280 …)`** — no rebaseline, no widening.
- parity **0 GAPs / 0 undeclared / 24 DECLARED** (last).
- Known flake under load: montage-board wheel check (SC-521). If it is the only FAIL, re-run shots once and report both.

## 4. Run rules (each of these has hung or broken a worker before)
- Dev env is devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc513-hostleak-click-revealed/draw-steel-elements -- bash <script file>`. Never `cd` inside a compound command.
- Scratch: a PRIVATE subfolder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc513-r2-impl-<random suffix>/`, uniquely named scripts and logs inside it. Write scripts with the Write tool. Record exit codes inside the script file (`npm run shots > <log> 2>&1; echo $? > <unique rc file>`), never `bash -c '…; echo rc=$?'` (devbox eats `$?`). Never pipe a gate into `tail`.
- Run each gate as ONE BLOCKING FOREGROUND Bash call (timeout 600000), output redirected to a file. Split lifecycle / e2e / shots into separate calls.
- **Shots took 456–897 s in r1 under load**, past the 600 s tool limit. For shots (and any gate that may exceed it): launch the script with `run_in_background: true`, note the PID it records (have the script write `$$` to a unique pid file), then poll in FOREGROUND calls: `while kill -0 <pid> 2>/dev/null; do sleep 15; done; echo EXITED` with timeout 590000, repeated until EXITED; then read the rc file and the log. Never wait for a completion notification — it never comes.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Use per-run unique paths.
- No `rm` with a shell-variable target and no glob `rm` (both hang on a permission prompt nobody answers). Never `rm -rf` anything under `.superpowers/` or a `/tmp` glob (e.g. never `rm -rf /tmp/dse-obsidian-lifecycle-*`). Overwrite with `>` or use fresh names.
- Never `pkill`/`killall` by pattern. Kill only by PID, only one whose `readlink /proc/<pid>/cwd` is inside your worktree.
- Redirect long output to files rather than streaming (the 600 s stream watchdog kills silent agents).

## 5. Report
Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc513-hostleak-click-revealed/sc513-r2-impl-report.md`, opening with a ≤10-line executive summary (head sha, base sha, every gate's number, PNG-identity result, anti-vacuity rc). Then: commit list, files changed, the boundary kinds listed, the prose line before/after, dice-pinning outcome, and two sections — `Drive-by fixes:` (made; obviously correct, local to a touched file, cannot move a baseline) and `Follow-ups:` (left alone). If the report-file write is blocked, return the report inline.

## 6. Return contract
Your final text goes to the ticket-owner, not a human: raw facts — verdict, shas, measured numbers — no prose, plus the filesystem path of every evidence artifact (report, logs, sha256 lists, rc files). If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question; you cannot SendMessage me (a depth-2 agent cannot reach its parent; `to: 'main'` goes to the dispatcher). If you ever do send a message anyway, its FIRST WORD must be `SC-513:`.
