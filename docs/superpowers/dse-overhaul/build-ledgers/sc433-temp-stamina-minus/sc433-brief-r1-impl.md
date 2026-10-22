# SC-433 r1 implementation brief

You are the implementer for SC-433. Your final text goes to the ticket-owner, not a human.

## 1. Context loading

- Read FIRST: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc433-temp-stamina-minus/decisions.md` (the ledger: spec, Scott's ruling verbatim, owner decisions). It is the only source of truth for requirements.
- **Workers never call the tracker** (Linear) — not to read history, not to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc433-temp-stamina-minus`. Every submodule is on branch `sc433-temp-stamina-minus`. The plugin is at `/home/scott/code/steelCompendium/worktrees/sc433-temp-stamina-minus/draw-steel-elements` (call it `<dse>`). Verify paths before any write.
- **NEVER write in `/home/scott/code/steelCompendium/workspace/`** (the shared main checkout) except your report/log/evidence files in the ledger dir. The workspace-level file you edit (CHANGELOG.md) lives in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc433-temp-stamina-minus/CHANGELOG.md` — never `/home/scott/code/steelCompendium/workspace/CHANGELOG.md`.
- The main checkout shows a modified `demo-vault/Welcome.md` plus untracked `compendium-manifest.json` / `demo-vault/*.md` in dse: that is Scott's live vault. Expected; do not flag or touch.
- Use `git -C <absolute path>` for every git command — never `cd X; git …` and never `cd` inside a compound command.
- First: `git -C <dse> fetch origin` and confirm the branch is on `origin/develop` = `3973b56`. If origin/develop has moved, rebase onto it and say so in the report. The superproject branch is at `262dad6`.
- Prior work on the same modal (read the executive summaries only, for conventions): `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc432-free-recovery-ledger.md`, `sc427-apply-label-ledger.md`, `sc431-escape-field-ledger.md` in that same dir.
- Read `<dse>/e2e/README.md` and the `dse-verify` skill (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`) before running gates.

## 2. The task

Scott's ruling, verbatim (2026-10-18): "I like your recommendation"

The recommendation (ticket, verbatim): "make the temp field a direct edit, like the Stamina field. Keep "keep the higher" only for gaining temp from an effect."

Fix (ticket, verbatim): "the temp stepper and typed value set temp directly, minus included. If the modal has a "gain temporary Stamina" path, it keeps take-the-higher."

Owner decision (ledger, verbatim):
> Temp field and its +/- stepper are a direct edit (floor 0, same clamp as today for negatives), exactly like the Stamina field. Damage/Kill/Full Heal interplay with temp is unchanged. If the survey finds a separate "gain temporary Stamina from an effect" path in the modal (or a host API that grants temp), that path keeps take-the-higher; if none exists, nothing is added (no new UI).

Concretely:

1. **Survey (short).** Read `<dse>/src/views/StaminaEditModal.ts` temp stepper / typed-value handling (around :418–447, `granted = Math.max(...)`), and how `pendingTempStaminaChange` flows into Apply, the preview, Damage (temp absorbs first), Kill and Full Heal. Find whether any "gain temp from an effect" path exists (modal, hosts, `StaminaController`/model helpers). Report file:line.
2. **Fix:** "-" lowers temp by one (to a floor of 0); "+" raises by one; a typed value sets temp to exactly that value (negative clamps to 0, as today). This must hold after a Damage in the same session (ticket test A2: Damage absorbs 3 of 5 temp → running 2, then minus lowers the running value). The "-" button disabled state must match reality (disabled at 0, enabled above) — CB-8 "never a silent no-op". Keep take-the-higher only on a genuine effect-grant path if one exists. Apply writes the new temp to the note; Stamina field behaviour unchanged.
3. **Tests:** flip every SC-433 marker. `grep -rn "SC-433" <dse>/test <dse>/e2e <dse>/src`: jest `test.failing(... [known bug SC-433])` in `test/dom/views/stamina-edit-modal.test.ts` (~:508–630) become plain tests (remove `.failing` and the suffix); the e2e `knownBug('SC-433', …)` scenarios in `e2e/specs/stamina-bar/stamina-modal.e2e.ts` (T03 :171, T04 :192, T10 :244) become plain tests; the "bounds that hold today and after SC-433" tests (:212, jest :554) should be tightened to assert the exact new values. Also search for any other test pinning the old behaviour (e.g. SEM "the minus button cannot walk temp below the session-start value", "[current behaviour — ruling pending SC-408]" titles touching temp) and rewrite it to the new behaviour. Assert the NOTE FILE in e2e, not just the DOM. Add an e2e or jsdom case for the ticket's exact repro: temp 5, "+" twice → 7, "−" → 6, Apply writes 6; and typed 50 → Apply → reopen → type 5 → Apply writes 5. Leave `grep -rn "SC-433"` returning only legitimate history comments. If any new control appears (it should not), add a manifest row for the coverage gate.
4. Lifecycle G-S27 is optional (ledger): add it only if the reopen-after-Apply round trip is not already covered by e2e; say which in the report.
5. **Docs/CHANGELOG:** a bullet under `## Unreleased` in YOUR worktree's superproject `CHANGELOG.md` (user-facing, plain words, e.g. the Temporary Stamina "−" button and a lower typed value now lower temp, so a typo can be fixed). If DSE user docs describe the temp field as keep-the-higher, update them. Update the comment in `StaminaEditModal.ts` that cites SC-133 RC-5 so it states the new rule.
6. Commit after every coherent step (dse commits on branch `sc433-temp-stamina-minus`; superproject CHANGELOG commit on the superproject branch — do NOT bump the dse submodule pointer, landing does that). Do not push. Commit messages: no Claude/AI attribution or co-author trailers.

Out of scope: anything not listed. Report other findings as `Follow-ups:`; obviously-correct local fixes in files you touch as `Drive-by fixes:`.

## 3. Gates (dse-verify skill, full battery, in order)

Command rules (each of these has stalled a worker before):
- Use a private scratch folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc433-r1-impl/` with uniquely named scripts (e.g. `sc433-r1-jest.sh`). Create files with the Write tool, not heredocs.
- Run gates as `devbox run -c /home/scott/code/steelCompendium/worktrees/sc433-temp-stamina-minus/draw-steel-elements -- bash <abs path to script>`. The script itself `cd`s, runs the gate with output redirected to a log, and writes its own exit code to a per-gate file. Never `echo rc=$?` inside `bash -c` (devbox records 0). Never pipe a gate.
- **One blocking foreground gate per Bash call** (timeout up to 600000 ms). Split lifecycle / e2e / shots / parity into separate calls. No `run_in_background`, no Monitor, no waiting for notifications — they never come.
- No glob `rm` (`rm -f x/*.rc` is forbidden); delete only exact paths you created. `rm -f main.js styles.css` in the plugin root before jest is fine.
- Never `pkill`/`killall` by pattern. Kill only by PID whose command line (or `readlink /proc/<pid>/cwd`) is inside `worktrees/sc433-temp-stamina-minus/`.
- Never `rm -rf` a shared `/tmp` glob (e.g. `/tmp/dse-obsidian-lifecycle-*`) or the shared `.superpowers/` dir.
- Never `--headed` on `:1`. Set your own `DSE_LIFECYCLE_PORT` (e.g. 9433).
- On a timeout-shaped jest red in settings-tab / settings-preview / sidebarInitiative, check `/proc/loadavg` and re-run before believing it.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.

Baseline at 3973b56 (CURRENT in dse-verify): tsc (incl. `tsc -p e2e`) + lint (incl. `e2e/`) clean · jest **5696 passed / 1 skipped / 238 of 239 suites** · lifecycle **31/31** · e2e **`OBSIDIAN-E2E done: 95/98 ok, 0 failed, 3 known-bug, coverage: 66/66 pairs`** (all 3 known-bug are SC-433) · shots **580**, 0 FAIL, both text-scale lines + the modal host-leak line · freeze **`freeze OK (280/280 …)`** · parity **0 GAPs / 0 undeclared / 24 DECLARED**. (Fresh worktree: jest reads one fewer passed and 2 skipped until a shots run has cached the obsidian CSS — compare after shots, or re-run jest after shots.)

Expected after: tsc/lint clean; jest > 5696 passed, 1 skipped (test.failing markers become plain passes); lifecycle 31/31 (32/32 if you add G-S27); e2e **0 failed, 0 known-bug**, ok = total (≥ 98/98), coverage Y/Y with Y ≥ 66; shots 580, 0 FAIL; freeze 280/280 — if freeze fails, DO NOT touch the baseline: write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc433-temp-stamina-minus/rebaseline.txt` (ready-to-apply hash lines) + before/after crops and report it; parity 0/0/24. If e2e cannot reach 0 known-bug, say exactly which scenario and why.

## 4. Evidence and report

- Logs: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc433-temp-stamina-minus/sc433-r1-<gate>.log`.
- Screenshots for Scott, in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc433-temp-stamina-minus/evidence/` (from the real-Obsidian e2e run, failure-bundle-style capture, or the shots harness): (a) stamina modal at temp 7 after "+" twice from 5; (b) the same modal after one "−" showing 6 and the "−" enabled; (c) temp at 0 with "−" disabled. Crop to the modal; legible at normal zoom. Name them `sc433-a-*.png` etc.
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc433-temp-stamina-minus/sc433-r1-impl-report.md`. Open with a ≤10-line executive summary (verdict, dse head sha, superproject sha, gate numbers, whether an effect-grant path exists). Then: survey with file:line, design notes, test changes (each flipped marker), Follow-ups, Drive-by fixes.
- If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Final text: raw facts, no prose — verdict (DONE / BLOCKED / NEEDS_CONTEXT), dse head sha + commit list, superproject sha, every gate's measured numbers, and the absolute path of every evidence artifact (report, logs, screenshots, rebaseline.txt if any).

You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher, not me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report; I will resume you. If you ever do send a message anyway, its FIRST WORD must be `SC-433:`.
