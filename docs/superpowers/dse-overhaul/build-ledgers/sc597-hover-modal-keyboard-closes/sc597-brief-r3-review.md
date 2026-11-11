# SC-597 r3 brief — independent adversarial review (orchestration:reviewer, fresh identity R1)

You review SC-597's implementation. You did not design it (D1) or write it (I1). Your final text goes to the ticket-owner, not a human. **Workers never call the tracker** (Linear) — not to read history, not to post. **Execute and probe, don't just read**: re-run gates, run mutants, drive real Obsidian.

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc597-hover-modal-keyboard-closes/decisions.md` — the spec (ticket text) and rulings O1–O9. Read in full.
- Design: `sc597-r1-design-report.md` (exec summary, §1 survey, §3, §4) in the same dir. Implementation report: `sc597-r2-impl-report.md` (exec summary first). Mutants: `sc597-r2-mutants.log`. Red-on-base: `sc597-r2-red-on-base-G-S87.log`. Proposal: `sc597-dse-verify-proposal.md`.
- Prior art: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc595-hover-form-click-closes/sc595-r1-diagnosis-report.md` §1 (Obsidian popover mechanics: `p()`, `setIsFocused`, the hover timer, `T3`, the click-to-edit helper's 10/150 ms push).
- `dse-verify` skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (~300 KB, read in parts): "The battery, in order" (~20-217), "Hover preview modals (SC-595)" (~396-403), CURRENT numbers (~1395).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc597-hover-modal-keyboard-closes`; dse branch `sc597-hover-modal-keyboard-closes` at `ca31aa14` on base `4f0c87f2` (dse develop after SC-593; plugin src identical to `94133a5a`); superproject branch at `07b54207`. Review the range `4f0c87f2..ca31aa14` and the superproject CHANGELOG commit. `git -C <wt>/draw-steel-elements fetch origin` first; report if `origin/develop` moved past 4f0c87f2. Do not commit to the branch; prototype fixes go in a scratch copy and come back as diff files.

## 2. What to probe (at minimum)

1. **Correctness of design (a)** in both openers: one modal per key, synchronous open, the click reaches the `.hover-popover` embed container (bubbles), no source-editor switch in the preview (RV and LP), SC-498 keyboard behaviour outside previews intact (one modal, LP cursor not revealed), Escape closes the keyboard-opened modal (the 10 vs 150 ms helper timer: the click target is the bar/cell element, not a text node — does the helper pick 10 or 150 ms for a `bar.click()`, and does SC-595's re-push order hold either way?).
2. **O6 guards on the montage cell**: Ctrl/Meta/Alt+Enter, held-key repeat, `defaultPrevented`, a key from a child element. Any behaviour change outside previews a user would notice?
3. **Side effects of `el.click()`** being an untrusted, detail-0 click on the bar/cell: other DSE listeners on those elements or ancestors (chrome-panel guards, `RecoveriesStrip` click-outside, `sccLinkClickHandler`, document-level listeners), the hero sheet's bar, the initiative row bars (keyboard off), a cell whose sheet is already open, double-activation (Enter's keydown → click, and does Space's keyup also produce a click anywhere?).
4. **Tests are not vacuous**: re-run at least K1, K4 and one O6 mutant yourself; check the popover stand-in uses the literal 10 ms, not `HOVER_HELPER_DELAYS_MS`. Check G-S87 actually fails on 94133a5a (re-run it with `DSE_LIFECYCLE_BUNDLE=<scratch build of 94133a5a>` — dse-verify G-S83 footgun (9)) and passes on the head; check its assertions would catch a modal that closes at 300-600 ms.
5. **No SC-595 regression**: G-S83 green on the head; the SC-595 jest tests green.
6. **Gates**: re-run tsc, lint, jest, lifecycle part 5 (`--only=G-S59,G-S49,G-S73,G-S77,G-S83,G-S87` — use the exact `--only` syntax dse-verify gives; G-S56 is not in part 5), and full e2e. Expected: jest 7260 / 2 skipped (fresh worktree), part 5 6/6 (~345 s), e2e `262/267 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`; `styles.css` sha256 `5e5ff488…` unchanged.
7. Docs: the CHANGELOG bullet is plain and accurate; the dse-verify proposal is accurate and complete.

Out of scope (O2 verbatim): "SC-598 (a second click within ~150 ms of opening closes window + preview), SC-594 (+/− in a preview with an identical counter elsewhere), SC-596 (latent wrong-block path). Do not fix them here." Also SC-601 (CompendiumSearchModal in an editing preview). Report new findings as `Follow-ups:`.

## 3. Footguns

- **Devbox:** `devbox run -c /home/scott/code/steelCompendium/worktrees/sc597-hover-modal-keyboard-closes/draw-steel-elements -- bash /abs/script.sh`. Never `cd X && devbox run …`. Never trust an echoed `$?` inside `bash -c`; capture `rc=$?` in a script file. No `| tail` on a gate.
- **Every git command uses `git -C <absolute path>`.** Verify paths before any write. Never write under `/home/scott/code/steelCompendium/workspace/` except `sc597-r3-*` files in the ledger dir.
- **Scratch:** private subfolder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc597-r3-R1/`, uniquely named files, Write tool for scratch files, no `rm` with a variable target, no glob `rm`.
- **Never `rm -rf` a `/tmp` glob** (an SC-595 worker's `rm -rf /tmp/dse-obsidian-lifecycle-*` wiped other efforts' kept FAIL dirs). Delete only the literal path your run printed, or leave it.
- **Never `pkill`/`killall` by pattern**; kill only by PID after `readlink /proc/<pid>/cwd` shows your own path.
- **Never `rm -rf` the shared `.superpowers/` dir.**
- Main checkout dse dirt (`demo-vault/Welcome.md`, `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault — ignore it.
- No long `TMPDIR`; use `DSE_CAMERA_TMP`.
- Gates run **foreground**, one blocking call each, output redirected to a file. No `run_in_background`, no Monitor. Never key a wait-loop on a scratch filename or contents (stale files from other branches match). The 600 s stream watchdog kills silent agents.
- Mutants: restore the source after each and verify `git -C … status --porcelain` is clean before finishing.
- You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher, not me. For input, end with `STATUS: NEEDS_CONTEXT` and the question. If you message anyway, first word `SC-597:`.
- If the report-file write is blocked, return the report inline.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc597-hover-modal-keyboard-closes/sc597-r3-review-report.md`, opening with a **≤10-line executive summary** (verdict LAND / FIX, counts by severity, gate numbers you measured). Findings by severity (CRITICAL/HIGH/MEDIUM/LOW/INFO) with file:line, a failure scenario, and a prescribed fix. Evidence files prefixed `sc597-r3-` in the same dir.

## 5. Return contract

Final text: raw facts only — verdict, findings one line each with severity and file:line, measured gate numbers, and the absolute path of every evidence file.
