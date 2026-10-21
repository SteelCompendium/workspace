# SC-432 r1 implementation brief

You are the implementer for SC-432. Your final text goes to the ticket-owner, not a human.

## 1. Context loading

- Read FIRST: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc432-free-recovery/decisions.md` (the ledger: spec, Scott's ruling verbatim, owner decisions). It is the only source of truth for requirements.
- **Workers never call the tracker** (Linear) — not to read history, not to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc432-free-recovery`. Every submodule is on branch `sc432-free-recovery`. Verify `pwd`/paths before any write. The plugin is at `/home/scott/code/steelCompendium/worktrees/sc432-free-recovery/draw-steel-elements`.
- **NEVER write in `/home/scott/code/steelCompendium/workspace/`** (the shared main checkout) except your report/log files in the ledger dir. The workspace-level files you edit (CHANGELOG.md) live in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc432-free-recovery/CHANGELOG.md`.
- The main checkout shows a modified `demo-vault/Welcome.md` plus untracked `compendium-manifest.json` / `demo-vault/*.md` in dse: that is Scott's live vault. Expected; do not flag or touch.
- Use `git -C <absolute path>` for every git command — never `cd X; git …`.
- First: `git -C <dse> fetch origin` and confirm the branch is on `origin/develop` = `ab34293`. If origin/develop has moved, rebase onto it and say so in the report. Superproject branch is on origin/main `b21e48b`.
- Read `draw-steel-elements/e2e/README.md` and the `dse-verify` skill (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`) before running gates.

## 2. The task

Scott's ruling, verbatim (2026-10-18): "I agree with your recommendation.  Maybe make a confirmation dialog for the hero without a pool to ensure the user understands"

The recommendation it agrees with (ticket, verbatim): "disable Spend Recovery for creatures. For heroes with no pool to spend from, keep it as a plain "heal one Recovery's worth" shortcut, relabelled so it does not claim to spend anything."

Fix (ticket, verbatim):
> * Creatures: Spend Recovery disabled, with a reason tooltip (monsters have no Recoveries).
> * Heroes without a pool: relabel the button (it heals one Recovery's worth and spends nothing), and confirm before applying, so the user knows no Recovery is being tracked.
> * Heroes with a pool: unchanged.
> * The initiative host already has the mechanism: SC-132 H1 passed `spendRecovery: false` for the hero sheet.

Owner decisions (ledger, verbatim):
> Confirmation timing = on the FIRST press of the relabelled button in a modal session (the moment the user acts), not at Apply. Cancel adds nothing. Later presses in the same modal session do not re-ask.
> Wording is the implementer's proposal, one shared source of truth per string (SC-428 rule), name-then-reason tooltip pattern (SC-324).

Concretely:

1. **Survey first (short).** Find every host that opens `StaminaEditModal` (stamina-bar, hero sheet, initiative tracker heroes and creatures, minion pool, anything else) and how each decides hero vs creature and pool vs no pool. List them in the report with file:line. A legacy `ds-stamina` block without `recoveries_max` counts as a hero without a pool (ticket repro).
2. **Creatures:** Spend Recovery present but disabled, tooltip = button name then reason (follow the SC-324 pattern already in `StaminaEditModal.ts`), reason text one shared constant (e.g. "Creatures have no Recoveries"). It must stay disabled regardless of current/max Stamina — the none-left / max reasons must not override it for a creature.
3. **Heroes without a pool:** relabel the button so it does not say "Spend" (propose wording, e.g. "Heal (Recovery value)" — your call, keep it short and literal; state the heal amount if the current button does). First press in a modal session opens a confirmation dialog that says plainly that this heals one Recovery's worth and no Recovery is tracked/spent because the hero has no Recoveries pool. Confirm = the heal is added to the pending change exactly as today; Cancel / Escape = nothing added, the stamina modal stays open with its pending state intact. Later presses in the same session do not re-ask. Reuse an existing DSE confirm modal/kit component if one exists; give its buttons `data-dse-control` ids. Escape in the confirm dialog must close only the confirm dialog (SC-431 added an `escapeConsumer` registry / `DseModal.onEscapeKey` — check the nested-modal case works in real Obsidian via e2e).
4. **Heroes with a pool:** byte-identical behaviour.
5. **Tests:** flip every SC-432 marker. `grep -rn "SC-432"` in `test/` and `e2e/`: jest `test.failing` / `[known bug SC-432]` describe in `test/dom/views/stamina-edit-modal-matrix.test.ts` (~:660-727) -> plain tests; the `[current behaviour — SC-432 …]` pins in `stamina-edit-modal-matrix.test.ts`, `stamina-edit-modal.test.ts` (:147, :263), `e2e/specs/stamina-bar/stamina-recoveries.e2e.ts` (STAM-Q13 :236) -> rewritten to assert the new behaviour with titles that no longer carry the suffix; `knownBug('SC-432', …)` in `e2e/specs/initiative/stamina-entry.e2e.ts` (:136) -> plain test. Add e2e scenarios for: confirm dialog Confirm path (note file gains the heal, recoveries untouched/absent), Cancel path (no change), Escape-in-confirm (only the confirm closes; stamina modal still open with pending state), no re-ask on the second press, hero-with-pool unchanged (no dialog). Add manifest rows for new controls (coverage gate). Assert the NOTE FILE, not just the DOM. Leave `grep -rn "SC-432"` returning only legitimate history comments.
6. **Docs/CHANGELOG:** a bullet under `## Unreleased` in YOUR worktree's superproject `CHANGELOG.md` (user-facing, plain words). If DSE user docs describe Spend Recovery, update them.
7. Commit after every coherent step (dse commits on branch `sc432-free-recovery`; superproject CHANGELOG commit on the superproject branch — do NOT bump the dse submodule pointer, landing does that). Do not push.

Out of scope: anything not listed. Report other findings as `Follow-ups:`; obviously-correct local fixes in files you touch as `Drive-by fixes:`.

## 3. Gates (dse-verify skill, full battery, in order)

Run every gate through a wrapper script FILE that captures rc (devbox eats `$?`; never pipe a gate). `devbox run -c /home/scott/code/steelCompendium/worktrees/sc432-free-recovery/draw-steel-elements -- bash /abs/path/script.sh`. `rm -f main.js styles.css` in the plugin root before jest.

Baseline at ab34293 (CURRENT in dse-verify): tsc (incl. `tsc -p e2e`) + lint clean · jest **5262 passed / 1 skipped / 230 of 231 suites** · lifecycle **27/27** · e2e **`83/87 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs`** · shots **572**, 0 FAIL, `pressed toggle parity OK` · freeze **`freeze OK (276/276 …)`** · parity **0 GAPs / 0 undeclared / 24 DECLARED**.

Expected after: jest > 5262 passed, still 1 skipped (test.failing markers become plain passes); lifecycle 27/27; e2e 0 failed, known-bug **3** (the SC-432 one removed), coverage Y/Y with Y >= 57; freeze 276/276 unless a frozen shot renders a changed button — if freeze fails, DO NOT touch the baseline: write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc432-free-recovery/rebaseline.txt` (ready-to-apply hash lines) + before/after crops and report it; parity 0/0/24.

Lifecycle: set your own `DSE_LIFECYCLE_PORT` (e.g. 9291). Footguns:
- Never `pkill`/`killall` by pattern. Kill only by PID whose command line contains `worktrees/sc432-free-recovery/`.
- Never `rm -rf` a shared `/tmp` glob (e.g. `/tmp/dse-obsidian-lifecycle-*`) or the shared `.superpowers/` dir. Delete only paths you created and recorded.
- Never `--headed` on `:1`.
- On a timeout-shaped jest red in settings-tab / settings-preview / sidebarInitiative, check `/proc/loadavg` and re-run before believing it.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents. Run gates in the FOREGROUND (timeout up to 600000 ms per call); do not background a gate and wait for a notification — it will not come.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.

## 4. Evidence and report

- Logs: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc432-free-recovery/sc432-r1-<gate>.log`.
- Screenshots for Scott (taken from the real-Obsidian e2e run or failure-bundle-style capture; put them in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc432-free-recovery/evidence/`): (a) stamina modal for a creature showing the disabled Spend Recovery with its tooltip visible or the reason text legible; (b) stamina modal for a no-pool hero showing the relabelled button; (c) the confirmation dialog open over the stamina modal; (d) hero with a pool, unchanged. Crop to the modal; legible at normal zoom.
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc432-free-recovery/sc432-r1-impl-report.md`. Open with a ≤10-line executive summary (verdict, dse head sha, superproject sha, gate numbers, chosen wording strings). Then: entry-point survey, design notes (confirm mechanism, session flag), test changes, Follow-ups, Drive-by fixes.
- If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Final text: raw facts, no prose — verdict (DONE / BLOCKED / NEEDS_CONTEXT), dse head sha + commit list, superproject sha, every gate's measured numbers, the exact new user-facing strings, and the absolute path of every evidence artifact (report, logs, screenshots, rebaseline.txt if any).

You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher, not me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report; I will resume you. If you ever do send a message anyway, its FIRST WORD must be `SC-432:`.
