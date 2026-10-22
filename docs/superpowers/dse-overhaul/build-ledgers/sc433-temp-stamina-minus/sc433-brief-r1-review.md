# SC-433 r1 independent review brief

You are the independent reviewer for SC-433 (you did not write this code). Your final text goes to the ticket-owner, not a human.

## 1. Context loading

- Read FIRST: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc433-temp-stamina-minus/decisions.md` (spec, Scott's ruling verbatim, owner decisions) and the implementer's report `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc433-temp-stamina-minus/sc433-r1-impl-report.md`.
- **Workers never call the tracker** (Linear) — not to read history, not to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc433-temp-stamina-minus`; plugin at `<dse>` = `/home/scott/code/steelCompendium/worktrees/sc433-temp-stamina-minus/draw-steel-elements`, branch `sc433-temp-stamina-minus`. Diff under review: `git -C <dse> diff 3973b56..HEAD` (dse) and `git -C /home/scott/code/steelCompendium/worktrees/sc433-temp-stamina-minus diff 262dad6..HEAD` (superproject CHANGELOG). Expected dse head: e0b14f3 (superproject 78e4d6b). Implementer-measured: jest 5699/1/238 of 239; lifecycle 31/31; e2e 100/100 ok, 0 failed, 0 known-bug, 66/66 pairs; shots 580; freeze 280/280; parity 0/0/24.
- **Do not edit the branch.** Probes go in your private scratch folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc433-r1-review/` (throwaway jest files there, or a scratch copy). If you must place a probe test inside `<dse>/test` to run it, delete that exact file afterwards and confirm `git -C <dse> status` is clean.
- Never write in `/home/scott/code/steelCompendium/workspace/` except your report in the ledger dir. Scott's live-vault dirt in the main checkout's dse (`demo-vault/…`, `compendium-manifest.json`) is expected.
- Use `git -C <absolute path>` for every git command; never `cd` inside a compound command.

## 2. What to review — execute and probe, not just read

The ruling (verbatim): "I like your recommendation" — the recommendation: "make the temp field a direct edit, like the Stamina field. Keep "keep the higher" only for gaining temp from an effect." Fix: "the temp stepper and typed value set temp directly, minus included. If the modal has a "gain temporary Stamina" path, it keeps take-the-higher."

Probe at least:
1. Ticket repro: temp 5, "+" twice → 7, "−" → 6, Apply writes 6. Typed 50 → Apply → reopen → typed 5 → Apply writes 5. Typed lower value without Apply then "+" / "−" sequences.
2. Floor: "−" at 0 is disabled (CB-8: never a silent no-op); typed negative clamps to 0; "−" enabled state tracks the running value after every action (Damage absorbing temp, Full Heal, Kill, typed value, stepper).
3. Interplay: Damage after a temp edit and temp edit after Damage in the same session (temp absorbs first; running value correct; the preview text matches what Apply writes). Kill / Full Heal unchanged. Stamina field unchanged.
4. Every host that opens `StaminaEditModal` (stamina-bar, hero sheet, initiative tracker heroes/creatures, minion pools, anything else): the new behaviour reaches each one, and Apply's write path for temp writes the exact value (no residual max() in a host/controller/model helper — grep for `Math.max` near temp in `src/`).
5. Whether any "gain temp from an effect" path exists and, if so, that it still keeps the higher.
6. Note-file integrity on Apply: content above/below the block survives; two stamina blocks in one note don't cross-talk; a block that had no temp key — does lowering/setting temp to 0 write a key the user never wrote? (SC-482 added `src/elements/shared/undeclaredDefaults.ts`: a block without `temp_stamina` that ends at temp 0 should not gain the key; check stamina-bar's use.)
7. Tests: every former SC-433 marker is now a plain test that would FAIL on 3973b56 (check at least two by reverting the src change in a scratch copy or reasoning from the old code); no vacuous assertions; e2e asserts the note file. `grep -rn "SC-433"` leaves only history comments.
8. Re-run tsc, lint, jest, and e2e yourself (e2e is the deciding gate: expect `0 failed, 0 known-bug`, coverage Y/Y). You may skip shots/freeze/parity if the diff touches no CSS/fixture/render code — say so.

## 3. Gate command rules (each has stalled a worker before)

- Write scripts with the Write tool into your private scratch folder, uniquely named (`sc433-r1-rev-jest.sh` …). Run as `devbox run -c /home/scott/code/steelCompendium/worktrees/sc433-temp-stamina-minus/draw-steel-elements -- bash <abs script>`; the script `cd`s, redirects output to a log, writes its own exit code to a per-gate file. Never `echo rc=$?` in `bash -c`; never pipe a gate.
- One blocking foreground gate per Bash call (timeout up to 600000 ms). No `run_in_background`, no Monitor, no waiting for notifications.
- No glob `rm`; delete only exact paths you created. Never `pkill`/`killall` by pattern — kill only by PID inside `worktrees/sc433-temp-stamina-minus/`. Never `rm -rf` a shared `/tmp` glob or `.superpowers/`. Never `--headed` on `:1`. Own `DSE_LIFECYCLE_PORT` (e.g. 9533) if you run lifecycle.
- Never key a wait-loop on a scratch filename or its contents. Redirect long output to a file.
- Baselines at 3973b56: jest 5696 passed / 1 skipped / 238 of 239 suites; lifecycle 31/31; e2e `95/98 ok, 0 failed, 3 known-bug, coverage: 66/66 pairs`; shots 580; freeze 280/280; parity 0/0/24. Expected after: e2e `0 failed, 0 known-bug`.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc433-temp-stamina-minus/sc433-r1-review-report.md`. Open with a ≤10-line executive summary (verdict APPROVE / FIX REQUIRED, counts by severity, gate numbers you measured). Then findings by severity (CRITICAL / HIGH / MEDIUM / LOW / INFO) with file:line, a failure scenario, and a prescribed fix. If the report-file write is blocked, return it inline.

## 5. Return contract

Final text: raw facts — verdict, finding count by severity with one line each, measured gate numbers, absolute paths of the report and any probe logs. You cannot `SendMessage` me; if you need input, end with STATUS: NEEDS_CONTEXT and the question. If you ever send a message anyway, its FIRST WORD must be `SC-433:`.
