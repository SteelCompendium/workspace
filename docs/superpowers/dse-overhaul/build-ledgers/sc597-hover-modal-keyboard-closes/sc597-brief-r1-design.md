# SC-597 r1 brief — design + real-Obsidian probe (orchestration:reviewer, identity D1)

You are a design/probe worker for ticket SC-597. Your final text goes to the ticket-owner, not a human. **Workers never call the tracker** (Linear) — not to read history, not to post. Everything you need is in files.

## 1. Context loading (read first)

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc597-hover-modal-keyboard-closes/decisions.md` — the ticket text (the spec) and owner rulings O1–O4. Read it in full.
- Prior art (landed, SC-595): `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc595-hover-form-click-closes/`:
  - `sc595-r1-diagnosis-report.md` — §1 (what closes the popover; Obsidian 1.15.1 app.js:509 mechanics, `p()`, `setIsFocused`, the hover timer, `T3`), §3 row "No input at all", §4 "Gap: related bug 2" and C. This is the mechanism you build on.
  - `sc595-r1-probe-E-stamina-keyboard.log` (+ `-raw.log`), `sc595-r1-probe-scenario.mjs.txt`, `sc595-r1-make-probe.py.txt`, `sc595-r1-run-probe.sh.txt`, `sc595-r1-asar-extract.py.txt`, `sc595-r1-obsidian-excerpts.txt` — the probe harness technique (a scratch copy of `visual-harness/obsidian-lifecycle.mjs` with one injected scenario, real CDP mouse/keyboard). Reuse it.
  - `sc595-r3-review-report.md` exec summary and `sc595-dse-verify-proposal.md` — what landed.
- `dse-verify` skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (~300 KB — read in parts with offset/limit). Required sections: "The battery, in order" (lines ~20-217, incl. "THE exit-code footgun" and "Lifecycle and e2e notes"), and **"Hover preview modals (SC-595)"** (~line 396-403) — the SC-595 guard, the 10/150 ms keymap re-push ordering, and the G-S83 authoring footguns (1)-(10). Footgun (7) is this ticket.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc597-hover-modal-keyboard-closes` — dse submodule `draw-steel-elements/` on branch `sc597-hover-modal-keyboard-closes` at `94133a5a` (= origin/develop). First: `git -C <wt>/draw-steel-elements fetch origin` and confirm `origin/develop` is still `94133a5a`; if it moved, report the new sha and continue on 94133a5a (do not rebase).
- Relevant source (read, don't edit): `src/framework/kit/managedModal.ts` (DseModal: anchor, click guard, `HOVER_HELPER_DELAYS_MS` re-push, "a modal opened outside a click arms them at once"), `src/framework/kit/StaminaBarPanel.ts:185-205` (Enter/Space on the bar, `preventDefault` on keydown), `src/elements/montage/BoardView.ts:~379`, `src/elements/initiative/view.ts:~459`, `src/framework/kit/undoNotice.ts:78`, `src/elements/stamina-bar/view.ts`, `src/elements/hero/view.ts`.

## 2. The task

O1 (verbatim from the ledger): "a DSE modal opened from a hover preview by keyboard must behave exactly like the same modal opened by a mouse click (SC-595's landed behaviour): it stays open with the preview behind it, clicks inside it do not close it, Escape closes it, its Save/Apply writes land."

Deliver a **recommended fix design, proven by a prototype in real Obsidian**, plus a test plan. Do NOT commit anything to the worktree branch; prototypes go in a scratch copy (see §5) and are reported as diff files.

1. **Survey (bounded).** Enumerate every path by which a `DseModal` (or any modal DSE opens) can open from an element inside a hover preview **without a native `click` reaching the preview's embed container**: keyboard activation on non-`<button>` elements (Enter/Space handlers listed above; check each one actually opens a modal), and anything else you find in a quick grep (commands/hotkeys acting on a card, `focus`-triggered opens, Enter inside an input that opens a modal). Note: Enter/Space on a real `<button>` dispatches a native `click` (detail 0), which already runs `p()` — confirm, don't re-measure at length. Table: opener, file:line, element type, opens which modal, reachable in a preview (yes/no).
2. **Candidate fixes — probe each that is viable, RV and LP, Obsidian 1.15.1:**
   - (a) **Per-opener synthetic click:** the keyboard handler calls `el.click()` (or dispatches a `MouseEvent('click', {bubbles:true})`) on the same element the mouse clicks, so the existing click handler opens the modal and Obsidian's embed-container listener runs `p()` itself. Measure: does `p()` run for an untrusted click (`isFocused` true, scope pushed, window click listener added)? Does the popover's click-to-edit helper switch the preview into a source editor for it (the r1 footgun (1) "empty spot" behaviour)? Does the modal open exactly once? Does SC-595's "opening click" re-push branch then order the keymap scopes right (Escape closes the modal; check whether the helper's 10 vs 150 ms timer choice depends on the event target being text)?
   - (b) **DseModal-level, generic:** when a modal anchored in `.hover-popover` opens outside a click, make the popover count as focused — (b1) find the `HoverPopover` instance (`view.previewMode.hoverPopover` RV / `view.hoverPopover` LP, matched by `hoverEl === anchor.closest('.hover-popover')`; nested previews?) and call the private `setIsFocused(true)`; (b2) any public or structural alternative you find. Weigh private-API risk (Obsidian version drift) against coverage of future openers.
   - (c) anything better you find while probing.
   For each: what the user sees (modal open after 1.5 s idle? preview still shown? click inside the modal keeps it? Escape closes it? a Save/Apply write lands? after close, does the preview behave as in the mouse path — stays until the next outside click?). Also check the hover timer is the only closer on this path (no `T3`).
3. **Recommend one design** (or a combination, e.g. (a) for the known openers + (b) as a safety net — only if justified). State whether any part is a user-visible choice Scott must make (expected: no).
4. **Test plan:** jest cases (where: e.g. `stamina-bar.test.ts`, `managedModal.test.ts`; how to stand in for the popover; mutants that each test must kill) and real-Obsidian lifecycle coverage — extend G-S83 or a new **G-S87** in part 5 (before G-S56 in SCENARIOS order). Constraints (O3 verbatim): "Add no phases to G-S64 (part 3 is at the ~480 s line). New real-Obsidian coverage goes into G-S83 or a new G-S87 in part 5 (before G-S56 in SCENARIOS order); part 5 is ~304 s today." Estimate the added seconds. Show your prototype's scenario is **red on 94133a5a** (the bug reproduces: modal + preview gone ~300 ms after a keyboard open with the pointer resting) and **green with the prototype**.
5. Out of scope (O2 verbatim): "SC-598 (a second click within ~150 ms of opening closes window + preview), SC-594 (+/− in a preview with an identical counter elsewhere), SC-596 (latent wrong-block path). Do not fix them here." Report anything new you find as `Follow-ups:`.

Keep the probe bounded: you are designing, not implementing the final tests. If after the survey and probing (a) and (b1) one design is clearly right, stop probing and write up.

## 3. Gates

None to pass (design round). For probing, build the bundle in a scratch copy, not in the worktree branch: `git -C <wt>/draw-steel-elements archive 94133a5a | tar -x -C <your scratch dir>/dse-base`, symlink `node_modules` from the worktree (run `npm ci` in the worktree's `draw-steel-elements/` first if `node_modules` is missing), apply your prototype there, `node esbuild.config.mjs production`, then run your probe copy of the lifecycle harness with `DSE_LIFECYCLE_BUNDLE=<scratch>` (dse-verify G-S83 footgun (9)). Do not set a long `TMPDIR` (footgun (6)); use `DSE_CAMERA_TMP`.

## 4. Footguns (every one has cost real time)

- **Devbox:** Node is not on PATH. `devbox run -c /home/scott/code/steelCompendium/worktrees/sc597-hover-modal-keyboard-closes/draw-steel-elements -- bash /abs/path/script.sh`. Never `cd X && devbox run …` in a compound command; never trust an echoed `$?` inside `bash -c` (record exit codes inside a script file). No `| tail` on a gate.
- **Every git command uses `git -C <absolute path>`**, never `cd X; git …`. Verify `pwd`/paths before any write. Never write to `/home/scott/code/steelCompendium/workspace/` except your report files in the ledger dir.
- **Scratch:** private subfolder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc597-r1-D1/` with uniquely named scripts/logs. Use the Write tool for scratch files (no heredocs). No `rm` with a shell-variable target; no glob `rm`.
- **Never `rm -rf` a `/tmp` glob** (an SC-595 worker did `rm -rf /tmp/dse-obsidian-lifecycle-*` and wiped other efforts' kept FAIL dirs). Lifecycle's kept FAIL temp dirs are `/tmp/dse-obsidian-lifecycle-<random>`: delete only the literal path your own run printed, or leave it.
- **Never `pkill`/`killall` by pattern** — other efforts run the same commands concurrently. Kill only by PID, and only after `readlink /proc/<pid>/cwd` shows your own scratch/worktree path.
- **Never `rm -rf` the shared `.superpowers/` dir.**
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, not yours, do not touch or report it.
- Run each probe as one **blocking foreground** Bash call (timeout up to 600000 ms), output redirected to a file in your scratch folder, then read the file. No `run_in_background`, no Monitor — a job you start does not wake you. If you must background something, poll its own log/exit file.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Use per-run unique paths.
- Redirect long output to files rather than streaming it — the 600 s stream watchdog kills silent agents.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher, not me. If you need input, end your turn with `STATUS: NEEDS_CONTEXT` and the question. If you ever message anyway, its first word must be `SC-597:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc597-hover-modal-keyboard-closes/sc597-r1-design-report.md`. It **opens with a ≤10-line executive summary** (recommended design, whether Scott must decide, red-on-base/green-with-prototype one-liners). Body: survey table, per-candidate measurements (RV + LP), recommendation with files to change (file:line), test plan with mutants, G-S83/G-S87 placement and time estimate, `Follow-ups:`. Copy evidence (probe logs, prototype diff as `sc597-r1-proto-*.diff.txt`, probe scenario as `.txt`) into the same ledger dir, all prefixed `sc597-r1-`. If the report-file write is blocked by your harness, return the report inline.

## 6. Return contract

Final text: raw facts only — verdict/recommended design, Scott-decision yes/no, measured red/green results, and the absolute path of every evidence file you produced. No prose.
