# SC-570 r1 — diagnose the RECOV-R07 double write (reviewer, diagnosis round)

## 1. Context loading

- Read first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc570-recov-r07-double-write/decisions.md` (the ledger: ticket text, rulings, baselines).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc570-recov-r07-double-write`, dse at `draw-steel-elements/` on branch `sc570-recov-r07-double-write`, HEAD must be `79da77f8` (dse develop). Verify with `git -C <abs path> log -1 --oneline` before anything else; `pwd` checks before any write. Never work in `/home/scott/code/steelCompendium/workspace/draw-steel-elements` (the shared main checkout; its modified `demo-vault/Welcome.md` and untracked vault files are Scott's live vault — expected, not yours, never touch).
- Read the gate skill parts you need: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` is ~320 KB — grep it, read only the battery table (lines ~20-135), the devbox wrapping section, and "Lifecycle and e2e notes (SC-480)" (~line 177). Find how to run one e2e spec / scenario alone from `draw-steel-elements/e2e/` and `package.json`.
- **You never call the tracker (Linear)** — not to read, not to post. Everything you need is here and in the files named.

## 2. The task

The ticket (SC-570, verbatim from the ledger): e2e RECOV-R07 failed once — "Pressing the Recoveries popover's Catch breath button produced **two** writes to the note where the test expects one (`w.count` received 2, expected 1)." Unknown: "whether this is a real double write, or a late write from the test's earlier minus/plus presses landing inside the Catch breath wait." First step the ticket names: "check whether the popover's minus/plus presses write on a delay. If they do, the test should wait for those writes to finish before it presses Catch breath. If they don't, reproduce under load and log each write."

Answer, with evidence:

1. **Mechanism.** Read `e2e/specs/stamina-bar/stamina-recoveries.e2e.ts` (RECOV-R07 near line 344-357), the e2e driver's `waitForWrite` (how it counts writes, its window), and the popover product code (`src/framework/kit/RecoveriesStrip.ts`, `src/elements/stamina-bar/view.ts`, `src/elements/stamina-bar/model.ts`, `src/model/StaminaBar.ts` — follow the calls). Do the −/+ steppers write on a debounce (the dse-verify note says 400 ms)? What does Catch breath do with a still-pending stepper write — flush it, cancel it, ignore it?
2. **Product or test?** Decide whether a USER could hit a wrong outcome: e.g. press + then Catch breath within the debounce window → does the note end with the right Recoveries and Stamina, or does the late stepper write overwrite the Catch breath result with a stale value (a Recovery not spent / Stamina heal lost / a Recovery spent twice)? **Check the CONTENT of each write, not only the count.** Prove it at runtime (jest DOM test against the real code with fake timers, and/or an e2e probe in real Obsidian), not by reading alone.
3. **Evidence bundles** from the two prior failures (machine-local, read-only — do not move or delete):
   - `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc561-r2-impl-9Jgy/gate-e2e-run1-FAIL-RECOV-R07.log` (green re-run `gate-e2e2.log` alongside)
   - `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc500-review-r1-R1/e2e-full-RECOV-R07-bundle/` (SC-517: "two writes, both after the Catch Breath mark")
   Say whether they match your mechanism (timestamps, write contents).
4. **Reproduce deterministically** without loading the shared host: prefer a controlled delay (CDP `Emulation.setCPUThrottlingRate`, or a temporary probe that widens the race in a scratch copy) over CPU-stress tools — other agents' gates share this machine. Show RECOV-R07 red under the forced condition on unchanged `79da77f8` code.
5. **Prescribe the fix**, exactly (file:line, the change, and the test that proves it red-on-base / green-after). If product: the minimal product change (e.g. Catch breath flushes or supersedes a pending stepper write) plus a jest test and an e2e assertion that pins note CONTENT. If test-only: the exact wait (settle the stepper writes before the Catch breath mark) and why that is not masking a product defect. Note any other spec in the e2e suite with the same stepper-then-action shape.

**Do not commit to the branch in this round.** Probes live uncommitted or in your scratch folder; leave the worktree clean (`git -C … status` clean) at the end, using `git -C <abs> checkout -- <your probe files>` / `git -C <abs> stash` on files YOU changed only.

## 3. Gates / numbers

No full battery this round. Baselines at `79da77f8` for reference: jest 7262 passed / 1 skipped (css cached; ~7261 / 2 fresh) · e2e `264/269 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`. If you run e2e alone on the stamina-recoveries spec, report its counts.

## 4. Report path

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc570-recov-r07-double-write/sc570-r1-diagnosis.md` — opens with a ≤10-line executive summary: verdict (PRODUCT / TEST / BOTH), mechanism in one sentence, user-visible consequence if any, the prescribed fix in one sentence, repro status.

## 5. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — verdict, mechanism, shas, measured numbers, the prescribed fix — no prose padding, **plus the absolute path of every evidence artifact you produced** (logs, probe diffs, repro bundles). Every report file opens with the ≤10-line summary.

## Footguns (all apply)

- If the report-file write is blocked by your harness, return the report inline.
- Scratch: use a private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc570-r1-reviewer-<4 random chars>/` with uniquely named scripts and logs; the session scratchpad is shared by every agent — never a generic name like `gate.sh`. Create scratch files with the Write tool.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents. Run each gate as ONE blocking foreground call; no `run_in_background`, no Monitor, no waiting for a completion notice (it never comes).
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc570-recov-r07-double-write/draw-steel-elements -- bash <script-file>`; never `cd X && devbox …` compound commands. Devbox eats `$?` / `$PIPESTATUS` and `| tail` masks failures: record exit codes from inside a script file, read each gate's own summary line.
- Before `npx jest`: `rm -f main.js styles.css` in the plugin root (literal absolute paths). Jest timeouts under load (check `/proc/loadavg`) are not regressions — re-run the suite alone.
- **Never `rm -rf` a `/tmp` glob** (e.g. `/tmp/dse-obsidian-*`, `/tmp/dse-e2e-*`): a worker did this today and wiped other efforts' kept lifecycle FAIL dirs. Delete only literal paths you created and recorded. No `rm` with a shell-variable target (it hangs on a permission prompt). Never `rm -rf` anything under `.superpowers/`.
- **Never `pkill`/`killall` by pattern** — other efforts run the same e2e/obsidian commands. Kill only a PID whose `readlink /proc/<pid>/cwd` or command line is inside YOUR worktree.
- Every git command as `git -C <absolute path> …`, never `cd X; git …`.
- Never put a bracketed ticket id (e.g. `[SC-570]`) in an e2e test title — the runner reads bracketed ids as scenario ids.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` goes to the dispatcher, not me. If you need input, end your turn with `STATUS: NEEDS_CONTEXT` and the question in your report. If you ever do send a message, its FIRST WORD must be `SC-570:`.
