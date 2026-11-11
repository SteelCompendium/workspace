# SC-597 r2 brief — implementation (orchestration:implementer, identity I1)

You implement SC-597 in an isolated worktree. Your final text goes to the ticket-owner, not a human. **Workers never call the tracker** (Linear) — not to read history, not to post. Everything you need is in files. You may later be replaced by a fresh worker that reads only these files, so commit after every coherent step.

## 1. Context loading (read first)

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc597-hover-modal-keyboard-closes/decisions.md` — the spec and owner rulings O1–O9. Read it in full.
- The r1 design report (your spec): `…/sc597-hover-modal-keyboard-closes/sc597-r1-design-report.md` — §1 survey, §3 recommendation, §4 test plan (jest cases, mutants K1–K6, G-S87 steps and fixture). Prototype diff: `sc597-r1-proto-A.diff.txt`. Probe scenario (a ready template for G-S87's trials, `sc597Trial`): `sc597-r1-probe-scenario.js.txt`. Probe logs `sc597-r1-probe-*.log` for expected timings.
- `dse-verify` skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (~300 KB — read in parts). Required: "The battery, in order" (lines ~20-217, incl. "THE exit-code footgun", "Lifecycle and e2e notes"), "Hover preview modals (SC-595)" (~line 396-403, incl. G-S83 authoring footguns (1)-(10)), and the CURRENT numbers block under "Current expected numbers" (~line 1395).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc597-hover-modal-keyboard-closes` — dse submodule `draw-steel-elements/` on branch `sc597-hover-modal-keyboard-closes` at `94133a5a`. First: `git -C <wt>/draw-steel-elements fetch origin`; if `origin/develop` is no longer `94133a5a`, report the new sha in your final text and continue on 94133a5a (do not rebase unless told). Superproject branch `sc597-hover-modal-keyboard-closes` at `178dbfda`.
- The workspace-level files (CHANGELOG.md) live in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc597-hover-modal-keyboard-closes/CHANGELOG.md` — **never** under `/home/scott/code/steelCompendium/workspace/`. The only things you write under `workspace/` are your report, logs and proposal files in the ledger dir.

## 2. The task

Owner rulings (verbatim from the ledger):

> O1: Expected behaviour is not in doubt — a DSE modal opened from a hover preview by keyboard must behave exactly like the same modal opened by a mouse click (SC-595's landed behaviour): it stays open with the preview behind it, clicks inside it do not close it, Escape closes it, its Save/Apply writes land.

> O5: **Design (a) adopted** (r1 report §3): Enter/Space on the two non-`<button>` openers activates with `el.click()` on the element the mouse clicks — `StaminaBarPanel.ts` `bar.click()` (drop the `open` param), `montage/BoardView.ts` `cell.click()`. Everywhere, not only in previews. No change to `managedModal.ts`. No Scott decision: no user-visible trade-off.

> O6: r1 follow-up "BoardView.ts:378-382 lacks the stamina bar's guards (`evt.target !== cell`, modifier keys, `evt.repeat`, `defaultPrevented`)" — **folded into r2** (same lines; with (a) a held key would dispatch another click). Match `StaminaBarPanel.ts:194-197`, with jest tests.

> O9: r1 authoring footgun (CDP `keyDown` without `text` does not activate a real `<button>`; send `text: '\r'`) and the footgun (7) rewrite go into a dse-verify proposal FILE in the ledger dir (`sc597-dse-verify-proposal.md`) for the dispatcher; nobody on this ticket edits SKILL.md. Skip the optional montage LP trial (stamina LP covers LP).

> O3: Must not regress SC-595 (G-S83 and its 32 jest tests; the click guard, the 10/150 ms keymap re-push ordering, `HOVER_HELPER_DELAYS_MS`), SC-552, SC-556, SC-584. Add no phases to G-S64 (part 3 is at the ~480 s line). New real-Obsidian coverage goes into G-S83 or a new G-S87 in part 5 (before G-S56 in SCENARIOS order); part 5 is ~304 s today.

> O2: Out of scope (other tickets): SC-598 (a second click within ~150 ms of opening closes window + preview), SC-594 (+/− in a preview with an identical counter elsewhere), SC-596 (latent wrong-block path). Do not fix them here. (Also out of scope: SC-601, CompendiumSearchModal in an editing preview.)

Deliverables, in commits on the dse branch:
1. **Product fix** per O5, starting from `sc597-r1-proto-A.diff.txt` (its doc comment text is fine to adopt). Plus O6: the montage cell keydown gets the stamina bar's guards. Check first whether a cell can contain focusable children whose own Enter/Space must not be swallowed (the `evt.target !== cell` guard); keep SC-498 keyboard behaviour (Enter/Space on a focused bar/cell opens its modal once) intact.
2. **jest** per r1 §4: the SC-597 describe in `test/dom/elements/stamina-bar.test.ts` (tests 1-3) and the montage equivalents in `test/dom/elements/montage.test.ts`, plus O6 guard tests (Ctrl/Meta/Alt+Enter, `repeat`, `defaultPrevented`, a key from a child target if applicable → no click, no modal). Popover stand-in: a bubble `click` listener on the `.hover-popover` container that records the event and arms its push with a LITERAL `10` ms (never read `HOVER_HELPER_DELAYS_MS` — SC-595 r5 MEDIUM-1). Use fake timers for anything timing-related. Never put a bracketed ticket id (e.g. `[SC-597]`) in a test title — the e2e runner reads titles for scenario ids; plain "SC-597:" prefixes in describe names are fine as in existing suites, but check the existing convention and follow it.
3. **Mutants:** run K1–K6 (r1 §4 table) plus at least one mutant per O6 guard; each must turn a test red. Record every mutant, the command and the failing test names in `sc597-r2-mutants.log`. Restore the source after each (verify with `git -C … diff --stat` empty against your commit).
4. **Lifecycle G-S87** (new scenario, part 5, after G-S83 and before G-S56 in SCENARIOS order): 4 trials — stamina Enter RV, stamina Enter LP, stamina Space RV, montage Enter RV — steps per r1 §4 (real Ctrl-hover; pointer rests on the card; `focus()` on the opener then a CDP key; at 1.5 s preview AND modal open; real click on the title keeps both; stamina: Healing 3 + real Apply click writes `current_stamina: 18`, no Notice, modal closed, preview shown, then reopen by the same key and Escape 450 ms later closes only the modal; montage: Escape closes the sheet, preview shown; pointer away 1.2 s: preview shown; real click outside: preview closed). Reuse `gs83Kit` and G-S83's fixtures; add the montage fixture per r1 §4. Prove **red on 94133a5a**: build a scratch bundle from `git -C <wt>/draw-steel-elements archive 94133a5a` (dse-verify G-S83 footgun (9)) and run `DSE_LIFECYCLE_BUNDLE=<scratch> node visual-harness/obsidian-lifecycle.mjs --only=G-S87` with the new harness; all 4 trials must fail at the 1.5 s step. Save that log as `sc597-r2-red-on-base-G-S87.log`.
5. **Docs:** a `## Unreleased` bullet in the worktree superproject's `CHANGELOG.md` (user-facing, plain words: pressing Enter or Space on a stamina bar or a montage cell inside a hover preview now opens a window that stays open; follow the existing bullets' style), committed on the superproject branch. Do NOT bump the superproject's dse pointer — the dispatcher does that at landing. And the proposal file `sc597-dse-verify-proposal.md` in the ledger dir: exact replacement text for footgun (7) in "Hover preview modals (SC-595)" (per r1 §3), the new CDP `text: '\r'` authoring footgun, G-S87 added to the lifecycle scenario count (55 → 56) and the part-5 list (`G-S59 G-S49 G-S73 G-S77 G-S83 G-S87`), and a CURRENT-numbers block draft with your measured numbers.

## 3. Gates (dse-verify battery; expected numbers at dispatch, dse develop `94133a5a`)

Run against the worktree's `draw-steel-elements/`. Each gate is ONE blocking foreground Bash call (timeout up to 600000 ms), output redirected to a log in your scratch folder, exit code captured inside a script file run via `devbox run -c <wt>/draw-steel-elements -- bash /abs/script.sh`. Read each gate's own summary line.

- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`): clean.
- jest: baseline **7238 passed / 2 skipped** in a fresh worktree; expect 7238 + your new tests, 2 skipped (the skip count drops only after a shots run caches `obsidian-app.css`). The SC-568 load timeouts (`initiative-default-keys`, `twin-reuse`) may time out under load: re-run those suites alone and report both.
- lifecycle: `OBSIDIAN-LIFECYCLE done: 56/56 ok, 0 failed` as the union of five `--only` parts, each its own call: `G-S7a … G-S9a` (21), `G-S9b … G-S40` (16), `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9), `G-S57 G-S62 G-S61 G-S56` (4), `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87` (6). Take the exact id lists for parts 1 and 2 from dse-verify's battery table. **G-S56 stays LAST** in its part. Record each part's wall time; part 5 is expected ~345 s and must stay well under the 600 s tool limit. `RECOV-R07` is a known load flake (re-run alone before blaming the change).
- e2e: `OBSIDIAN-E2E done: 262/267 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs` (known bugs SC-257, SC-355, SC-384, SC-580, SC-588). Must end `0 failed` with full coverage.
- No CSS change is planned: after `npm run build-no-check` (or the production build), `sha256sum styles.css` must equal the base's `5e5ff488…` (compare against a build of 94133a5a). If byte-identical, shots (592, host-leak 163/978, modal host-leak 39/234, capture clip 147), freeze 280/280 and parity 0/0/24 **carry** and are not re-run. If styles.css changes, STOP and return STATUS: NEEDS_CONTEXT.

## 4. Footguns (every one has cost real time)

- **Devbox:** Node is not on PATH. Use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc597-hover-modal-keyboard-closes/draw-steel-elements -- bash /abs/path/script.sh`. Never `cd X && devbox run …` in a compound command. Never trust an echoed `$?` inside `bash -c` (any quoting) — capture `rc=$?` inside a script FILE. No `| tail` on a gate. Run `npm ci` in the worktree's `draw-steel-elements/` if `node_modules` is missing.
- **Every git command uses `git -C <absolute path>`**, never `cd X; git …` (a failed `cd` once ran a reset in the shared main checkout). Verify the path before every write. Commit after every coherent step.
- **Scratch:** private subfolder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc597-r2-I1/` with uniquely named scripts and logs. Use the Write tool for scratch files (no heredocs). No `rm` with a shell-variable target; no glob `rm`.
- **Never `rm -rf` a `/tmp` glob.** An SC-595 worker ran `rm -rf /tmp/dse-obsidian-lifecycle-*` and wiped other efforts' kept lifecycle FAIL dirs. Lifecycle's kept FAIL temp dirs are `/tmp/dse-obsidian-lifecycle-<random>`: delete only the literal path your own run printed, or leave it.
- **Never `pkill`/`killall` by pattern** — other efforts run the same gates concurrently. Kill only by PID after `readlink /proc/<pid>/cwd` shows your own worktree/scratch path.
- **Never `rm -rf` the shared `.superpowers/` dir.** Write only files prefixed `sc597-r2-` (and `sc597-dse-verify-proposal.md`) in the ledger dir.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, not yours; don't touch or report it.
- Do not set a long `TMPDIR` (Obsidian exits at start-up); use `DSE_CAMERA_TMP`.
- Run every gate in the **foreground**. No `run_in_background`, no Monitor — a job you start does not wake you. If something must run in the background, poll its own log/exit file.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches; a stale log from another branch will match. Use per-run unique paths.
- Redirect long output to files rather than streaming it — the 600 s stream watchdog kills silent agents.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher, not me. If you need input, end your turn with `STATUS: NEEDS_CONTEXT` and the question in your report. If you ever message anyway, the first word must be `SC-597:`.
- If the report-file write is blocked by your harness, return the report inline.

## 5. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc597-hover-modal-keyboard-closes/sc597-r2-impl-report.md`, opening with a **≤10-line executive summary** (dse head sha + commit list, superproject sha, every gate's measured number, red-on-base result, mutant tally). Copy gate logs into the ledger dir as `sc597-r2-gate-<gate>.log`, plus `sc597-r2-mutants.log`, `sc597-r2-red-on-base-G-S87.log`. Report `Drive-by fixes:` (made) and `Follow-ups:` (left alone) separately.

## 6. Return contract

Final text: raw facts only — STATUS (DONE / NEEDS_CONTEXT / BLOCKED), dse head sha and commits, superproject sha, measured gate numbers, red-on-base, mutants, styles.css sha, and the absolute path of every evidence file. No prose.
