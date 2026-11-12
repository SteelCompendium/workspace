# SC-598 r2 brief — implementation (orchestration:implementer, identity I1)

You implement ticket SC-598 in an isolated worktree. Your final text goes to the ticket-owner, not a human. **Workers never call the tracker** (Linear) — not to read history, not to post. Everything you need is in files. This brief is replacement-ready: if you are a fresh worker resuming this round, the ledger and the files below are your whole context.

## 1. Context loading (read first)

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc598-hover-modal-fast-second-click/decisions.md` — the spec (ticket text) and owner rulings O1–O11. Read it in full. O6–O11 are your task.
- Design report: `.../sc598-hover-modal-fast-second-click/sc598-r1-design-report.md` — read the executive summary, §1 (mechanism), §2 (survey table), §3 (b), §4 (recommendation), §6 (test plan: jest + G-S91), §7. The prototype: `sc598-r1-proto-b.diff.txt` (apply this, then make it production-quality). The probe harness (useful for authoring G-S91): `sc598-r1-probe-scenario.js.txt`, `sc598-r1-make-probe.py.txt`, `sc598-r1-run-probe.sh.txt`, `sc598-r1-run-lifecycle.sh.txt`. Obsidian excerpts: `sc598-r1-obsidian-excerpts.txt`.
- Prior art for test shape (landed): `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc597-hover-modal-keyboard-closes/` — `sc597-r2-impl-report.md` (how G-S87, the jest suites and the mutant table were built), `sc597-r2-mutants.log`, `sc597-r2-mutate.py.txt`.
- `dse-verify` skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (~330 KB — read in parts; `grep -n '^#'` for the outline). Required: "The battery, in order" (~lines 20-217, incl. "THE exit-code footgun", "Lifecycle and e2e notes"), and "Hover preview modals (SC-595)" (~395-402, incl. the jest rules: fake timers for 10/150 ms, Obsidian's delays as LITERALS 10/150 never from `HOVER_HELPER_DELAYS_MS`, and G-S83/G-S87 authoring footguns).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc598-hover-modal-fast-second-click` — dse submodule `draw-steel-elements/` on branch `sc598-hover-modal-fast-second-click` at `e5b6f9f2` (= origin/develop at dispatch). First: `git -C <wt>/draw-steel-elements fetch origin`; if `origin/develop` moved past `e5b6f9f2`, rebase onto it before the final battery and report the range-diff. `node_modules` was installed by r1 (`npm ci`).

## 2. The task (rulings quoted verbatim from the ledger)

O6: "**Design (b) adopted** exactly as r1 report §4 / `sc598-r1-proto-b.diff.txt`: `managedModal.ts` only — in the opening click's window-bubble listener, before `arm()`, for an anchor inside a `.hover-popover` lacking `.is-editing`: `opening.preventDefault()`, add `interactive-child` to the anchor (only if absent), dispatch one bubbling cancelable `MouseEvent('click')` (built with the anchor's window's `MouseEvent`) on the anchor, remove the class from a 10 ms timer armed after the helper's. Non-click branch unchanged; no change to openers, `HOVER_HELPER_DELAYS_MS`, the document guard, or SC-597's `el.click()`."

O7: "the 6 SC-597 jest tests that assert "exactly one click reaches the popover container" are UPDATED, not deleted or weakened: they must still assert exactly one click with the opener as target (the key's click), and now also exactly one synthetic click with the anchor as target; every SC-597 mutant (K1-K6 + the 23 of `sc597-r2-mutants.log`) must stay killed."

O8: "(b) adds two new side effects the r1 probe did not survey; r2 must check them by reading code, r3 by probing: (i) `preventDefault()` on the opening click cancels that click's default action — list every preview opener's element and confirm none relies on a default action (`<a href>`, `<label>`, checkbox/radio, `<summary>`, form submit); (ii) the synthetic click on the anchor bubbles through the anchor and its ancestors — list every DSE click listener on the anchor (cx.host.containerEl) or an ancestor and confirm none acts on it (target === anchor), and that it never opens a second modal."
→ If (i) or (ii) finds a real conflict, STOP and return `STATUS: NEEDS_CONTEXT` with the evidence; do not redesign on your own.

O11 (CHANGELOG `## Unreleased`, use this text verbatim): "A second click inside a window opened from a hover preview, right after the click that opened it, no longer closes the window and the preview. A quick double-click on the stamina bar's numbers in a preview still closes the window, as it does in a note, but the preview now stays open."

Deliverables:
1. **Code:** `src/framework/kit/managedModal.ts` per O6 (doc comment per r1 §4; keep `focusHoverPreviewNow` before `arm()` — the ordering is the point). Commit after each coherent step on the dse branch.
2. **jest:** the r1 §6 plan (8 cases in `managedModal.test.ts`, 1 in `stamina-bar.test.ts`) with a stand-in for `T3` (a window CAPTURE click listener that hides a popover that is not focused and does not contain the target, 5 ms later) and for the helper (a click listener on the `.hover-popover` container arming a literal 10 ms or 150 ms timer that skips a default-prevented event and focuses / marks `.is-editing`). Plus the O7 updates. Run the r1 §6 mutant table (and anything else you think a reviewer would try) against the jest suites; every mutant killed or argued equivalent. Record in `sc598-r2-mutants.log`.
3. **Lifecycle G-S91** in part 5, after G-S87 and before G-S56 in SCENARIOS order, per r1 §6 (5 trials, ~36-40 s). Real CDP mouse presses on the stamina bar's "15" (assert `elementFromPoint` hits the number's own element, as G-S83's `stamtext`), second press inside the modal within the helper's 150 ms, RV and LP, plus the double-click/backdrop case (preview stays, window closes) and an Escape + Apply-write trial. Show it **red on `e5b6f9f2`** (build the base bundle in a scratch `git archive` copy; `DSE_LIFECYCLE_BUNDLE=<scratch>`; G-S83 footgun (9)) and green on your head. Never put a bracketed ticket id in a test or scenario title (the e2e runner reads titles for scenario ids).
4. **CHANGELOG:** O11 text as a bullet under `## Unreleased` in YOUR worktree's superproject: `/home/scott/code/steelCompendium/worktrees/sc598-hover-modal-fast-second-click/CHANGELOG.md` — **never** under `/home/scott/code/steelCompendium/workspace/`. Commit it on the superproject branch `sc598-hover-modal-fast-second-click`. Do not bump the dse submodule pointer (landing does that).
5. **dse-verify proposal** (you do not edit SKILL.md): write `.../sc598-hover-modal-fast-second-click/sc598-dse-verify-proposal.md` with ready-to-apply edits: the new "Hover preview modals" authoring footgun (r1 §4 docs bullet; mention a test counting clicks through the preview now sees two), the jest paragraph's SC-598 test count, G-S91 in the part-5 list (57 scenarios; part 5 = `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87 G-S91`), and a CURRENT-numbers draft with `<landing sha>` placeholder.
6. Report the O8 (i)/(ii) code survey as tables in your report.

Out of scope (O3 verbatim): "SC-601 (CompendiumSearchModal in an editing hover preview), SC-594 (+/− in a preview with an identical counter elsewhere), SC-596 (latent wrong-block path), SC-588, SC-570. Do not fix them here." Also SC-604 (the double-click-closes-the-window question) and the declined private `setIsFocused` add-on (O9). Anything new goes under `Follow-ups:` in your report; small obviously-correct fixes in files you touch go under `Drive-by fixes:`.

## 3. Gates (dse-verify battery; expected numbers at dispatch, dse develop `e5b6f9f2`)

Run against the worktree's `draw-steel-elements/`. Each gate is ONE blocking foreground Bash call (timeout up to 600000 ms), output redirected to a log in your scratch folder, exit code captured inside a script file run via `devbox run -c <wt>/draw-steel-elements -- bash /abs/script.sh`. Read each gate's own summary line.

- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`): clean.
- jest: baseline **7283 passed / 2 skipped** in a fresh worktree; expect 7283 + your new tests, 2 skipped. `rm -f main.js styles.css` (literal paths in the plugin root) before jest. The SC-568 load timeouts (`initiative-default-keys`, `twin-reuse`) may time out under load: re-run those suites alone and report both.
- lifecycle: union of five `--only` parts, each its own call: `G-S7a … G-S9a` (21), `G-S9b … G-S40` (16), `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9), `G-S57 G-S62 G-S61 G-S56` (4), `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87 G-S91` (7). Take the exact id lists for parts 1 and 2 from dse-verify's battery table. **G-S56 stays LAST** in its part. Expected `57/57 ok, 0 failed`. Record each part's wall time; part 5 was ~347 s and must stay ≤ ~420 s (O4). If it goes over, STOP and return `STATUS: NEEDS_CONTEXT` with a split proposal. Add no phases to G-S64. RECOV-R07 is NO LONGER a known load flake (SC-570 landed): a red there is a real signal.
- e2e: `OBSIDIAN-E2E done: 264/269 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs` (known bugs SC-257, SC-355, SC-384, SC-580, SC-588). Must end `0 failed` with full coverage.
- No CSS change is planned: after the production build, `sha256sum styles.css` must equal a build of `e5b6f9f2` (SC-597 recorded `5e5ff488…`; verify). If byte-identical, shots (592, host-leak 163/978, modal host-leak 39/234, capture clip 147), freeze 280/280 and parity 0/0/24 **carry** and are not re-run. If styles.css changes, STOP and return `STATUS: NEEDS_CONTEXT`.

## 4. Footguns (every one has cost real time)

- **Devbox:** Node is not on PATH. `devbox run -c /home/scott/code/steelCompendium/worktrees/sc598-hover-modal-fast-second-click/draw-steel-elements -- bash /abs/path/script.sh`. Never `cd X && devbox run …` in a compound command; never trust an echoed `$?` inside `bash -c` (record exit codes inside a script file). No `| tail` on a gate.
- **Every git command uses `git -C <absolute path>`**, never `cd X; git …`. Verify paths before any write. Code and CHANGELOG edits happen ONLY under `/home/scott/code/steelCompendium/worktrees/sc598-hover-modal-fast-second-click/`. The only writes allowed under `/home/scott/code/steelCompendium/workspace/` are your report/evidence files in the ledger dir `.superpowers/sdd/sc598-hover-modal-fast-second-click/`, all prefixed `sc598-r2-` (plus `sc598-dse-verify-proposal.md`).
- **Scratch:** private subfolder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc598-r2-I1/` with uniquely named scripts/logs. Use the Write tool for scratch files (no heredocs). No `rm` with a shell-variable target; no glob `rm`.
- **Never `rm -rf` a `/tmp` glob** (a worker did `rm -rf /tmp/dse-obsidian-lifecycle-*` today and wiped other efforts' kept lifecycle FAIL dirs). Lifecycle's kept FAIL temp dirs are `/tmp/dse-obsidian-lifecycle-<random>`: delete only the literal path your own run printed, or leave it.
- **Never `pkill`/`killall` by pattern** — other efforts (SC-588, SC-570) run the same commands concurrently. Kill only by PID, and only after `readlink /proc/<pid>/cwd` shows your own scratch/worktree path.
- **Never `rm -rf` the shared `.superpowers/` dir.**
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, not yours, do not touch or report it.
- Run each gate as one **blocking foreground** Bash call, output redirected to a file, then read the file. No `run_in_background`, no Monitor — a job you start does not wake you. If you must background something, poll its own log/exit file.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Use per-run unique paths.
- Redirect long output to files rather than streaming it — the 600 s stream watchdog kills silent agents.
- Commit after every coherent step so nothing sits uncommitted through a gate.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher, not me. If you need input, end your turn with `STATUS: NEEDS_CONTEXT` and the question. If you ever message anyway, its first word must be `SC-598:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc598-hover-modal-fast-second-click/sc598-r2-impl-report.md`. It **opens with a ≤10-line executive summary** (dse head sha + base, superproject sha, every gate's number, G-S91 red-on-base / green-on-head, mutants killed/total, part-5 wall time). Body: commits, O8 survey tables, jest cases added/updated, mutant table, gate logs, `Drive-by fixes:`, `Follow-ups:`. Copy gate logs and evidence into the ledger dir prefixed `sc598-r2-`. If the report-file write is blocked by your harness, return the report inline.

## 6. Return contract

Final text: raw facts only — verdict, shas, measured numbers, and the absolute path of every evidence file you produced. No prose.
