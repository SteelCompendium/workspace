# SC-603 r2 — independent adversarial review: focus after Apply in the minion pool modal / roster Stamina edit

You are the independent reviewer for SC-603. You did not write this code. Execute and probe; do not just read. You may be replaced by a fresh worker; everything you need is in files.

## 1. Context loading

- Read first: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc603-focus-after-pool-apply/decisions.md` (the spec: owner rulings) and the implementer's report `…/sc603-r1-impl-report.md` in the same dir (read its summary, then the parts you need).
- **Workers never call the tracker** (Linear).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc603-focus-after-pool-apply`; plugin at `…/draw-steel-elements`, branch `sc603-focus-after-pool-apply`. Review HEAD: `7813b333` on base dse `develop` `b5d18f79`; superproject CHANGELOG commit `9d1568ec`. Confirm `git -C <plugin> fetch origin` shows `origin/develop` still `b5d18f79`; if it moved, say so (do not rebase — report it).
- Do NOT commit to the branch. If you need to edit code for a probe (mutation testing, an instrumented build), do it in a throwaway `git worktree add` of the dse repo at an absolute path in your scratch folder, or revert every change before you finish and prove `git -C <plugin> status` is clean.
- Battery: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (~330 KB; read "The battery, in order", the devbox / exit-code sections, "Lifecycle and e2e notes", "Hover preview modals (SC-595)" and the CURRENT numbers; not the whole file).
- Prior art: SC-588 / SC-589 ledgers under `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/`.
- Scott's live vault dirt in the MAIN checkout's dse is expected; ignore it.

## 2. What to probe (at least)

1. The rulings, one by one: does the behaviour match each, at every modal site the tracker opens? Use the implementer's per-site table as a claim to verify, not as truth. Look for sites it missed (`openModal(` / `new …Modal(` in `src/elements/initiative/view.ts` and anything they call).
2. Real Obsidian: drive the keyboard path (detail-row Stamina control → pool modal → Enter) and the mouse path (grid double-click → Stamina modal → Enter, and → Apply click), in Reading view and in the pinned sidebar tracker. Where does `document.activeElement` end up (by `data-dse-control` and instance key)? Also Cancel and Escape.
3. Wrong-target and stale-token risks: two trackers in one note, the same tracker pinned and in the note, a modal open while an outside edit rebuilds the tracker, a kill that removes the opener's creature / makes a cell DEAD, a modal opened from a hover preview (SC-595 / SC-598 territory — does the restore pull focus out of a popover, or into a closed one?), the user clicking elsewhere before the restore fires. Focus must never be pulled into the tracker when it was not there at open (ruling), and never land on the page body.
4. Timing: does the restore really run after Obsidian's Modal close handling, under load (slow host)? Any timer-based approach needs a justification.
5. Tests: are the new jest cases red on the base (check out the base src in a scratch worktree and run them, or mutate the fix away)? Does each e2e test actually assert the focused control, not just "not body"? No bracketed ticket ids in e2e test titles.
6. Gates: re-run tsc, lint, jest, e2e yourself (lifecycle too, in its five `--only` parts, if `src/` touches anything a lifecycle scenario drives — say why you ran or skipped it). Shots / freeze / parity may carry if `styles.css` sha256 equals a clean `b5d18f79` build — verify that sha yourself.
7. CHANGELOG wording (both): plain, literal, scoped to Reading view and the pinned sidebar tracker; says nothing the code does not do.

Expected at `b5d18f79`: jest 7328 / 2 skipped fresh (plus the new tests) · lifecycle 56/56 (21 + 16 + 9 + 4 + 6; parts `G-S7a … G-S9a`; `G-S9b … G-S40`; `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64`; `G-S57 G-S62 G-S61 G-S56` (G-S56 LAST); `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87`) · e2e `272/276 ok, 0 failed, 4 known-bug, coverage: 169/169 pairs` plus the new tests (known bugs SC-257, SC-355, SC-384, SC-580) · shots 592, host-leak 163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24.

## 3. Footguns

- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc603-focus-after-pool-apply/draw-steel-elements -- bash <script file>`. Never trust an echoed `$?` in `bash -c`; never pipe a gate. Capture exit codes inside a script file and read each gate's summary line.
- `git -C <absolute path>` always; never `cd` in a compound command.
- Private scratch subfolder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc603-r2-review/`, uniquely named scripts and logs, written with the Write tool.
- **Never `rm -rf` a glob, never `rm` a `/tmp` glob, no `rm` with a shell-variable target.** Delete only literal paths you created. Never touch `.superpowers/` outside `.superpowers/sdd/sc603-focus-after-pool-apply/`.
- Never `pkill`/`killall` by pattern; kill only a PID whose cwd or command line is inside this worktree or your scratch folder.
- `rm -f main.js styles.css` (literal) in the plugin root before `npx jest`.
- Every gate as one blocking FOREGROUND call under 10 minutes; no `run_in_background`, no Monitor; redirect output to a file, then read it. Never key a wait on a scratch filename or its contents.
- Never tag or release draw-steel-elements; never push.
- If the report-file write is blocked, return the report inline.
- You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher. If you need input, end with `STATUS: NEEDS_CONTEXT` and the question. If you message anyway, the first word must be `SC-603:`.

## 4. Report and return

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc603-focus-after-pool-apply/sc603-r2-review-report.md`, opening with a ≤10-line executive summary (verdict LAND / FIX / BLOCK, counts by severity, your gate numbers). Findings by severity (HIGH / MEDIUM / LOW / INFO) with file:line, the failure scenario, how you reproduced it, and a prescribed fix. Then your gate summary lines.

Final text to the ticket-owner: raw facts — verdict, shas, numbers, finding one-liners — plus absolute paths of every evidence artifact.

## 5. Notes from the owner on r1 (read before probing)

- The fix is generic: `openModal` in `src/elements/initiative/view.ts` now captures/restores focus for EVERY modal the tracker opens (Reset encounter opts out with `openModal(modal, false)`). So probe every modal the tracker opens, not just the pool and Stamina modals — including the Conditions window, which the owner kept in scope.
- The restore runs one microtask after `close()`. Probe it against: a modal opened from a hover preview (SC-595 guard; the parallel SC-598 owner is changing `managedModal.ts` — do not edit it, but say if this fix will collide), a second modal opened from inside the first, `close()` called while a rebuild is still pending (async persist), and a tracker rebuilt by an outside note change while the modal is open.
- Captain Stamina edit that flips the squad bonus is covered only in jest (no e2e fixture has `with_captain_stamina`). Say whether that is adequate.
