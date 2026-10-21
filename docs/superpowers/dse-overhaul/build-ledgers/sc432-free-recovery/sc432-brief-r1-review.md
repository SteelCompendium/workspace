# SC-432 r1 independent review brief

You are the independent adversarial reviewer for SC-432. You did not write this code. Your final text goes to the ticket-owner, not a human.

## 1. Context loading

- Read: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc432-free-recovery/decisions.md` (spec + Scott's ruling verbatim + owner decisions), `sc432-brief-r1-impl.md` (what the implementer was asked), and the executive summary + design notes of `sc432-r1-impl-report.md` (same dir).
- **Workers never call the tracker** (Linear) — not to read, not to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc432-free-recovery` (dse at `draw-steel-elements/`, branch `sc432-free-recovery`, head `1ddef76`, base origin/develop `ab34293`; superproject CHANGELOG commit `8511748`). Review `git -C <dse> diff ab34293..1ddef76` and the superproject CHANGELOG diff.
- Do not modify the branch. Probes go in throwaway files you delete, or in a separate scratch worktree/clone at an absolute path you create; record what you created. Use `git -C <absolute path>` for every git command.
- Never write into `/home/scott/code/steelCompendium/workspace/` except report/log files in the ledger dir. Scott's live vault dirt in the main checkout's dse (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is expected — ignore it.

## 2. The task — execute and probe, not just read

Scott's ruling, verbatim (2026-10-18): "I agree with your recommendation.  Maybe make a confirmation dialog for the hero without a pool to ensure the user understands"

Fix spec (ticket, verbatim):
> * Creatures: Spend Recovery disabled, with a reason tooltip (monsters have no Recoveries).
> * Heroes without a pool: relabel the button (it heals one Recovery's worth and spends nothing), and confirm before applying, so the user knows no Recovery is being tracked.
> * Heroes with a pool: unchanged.

Owner decision (ledger, verbatim): "Confirmation timing = on the FIRST press of the relabelled button in a modal session (the moment the user acts), not at Apply. Cancel adds nothing. Later presses in the same modal session do not re-ask."

Probe at least:
1. **Classification correctness across every entry point** that opens StaminaEditModal (stamina-bar, hero sheet, initiative heroes / creatures / minions, minion pool, legacy `ds-stamina` without `recoveries_max`, a hero with `recoveries_max` but 0 remaining, a hero whose block has recoveries but in a form the classifier might miss). Can any hero be misclassified as a creature (losing a working button) or a creature as a hero? Can a hero WITH a pool get the confirm/relabel?
2. **Confirm dialog lifecycle in real Obsidian**: Escape in the confirm closes only the confirm (SC-431's `escapeConsumer` / `DseModal.onEscapeKey`); clicking outside; closing the stamina modal while the confirm is open; a live write / re-render of the host block while the confirm is open (SC-340 adoption — does the stamina modal or the confirm dangle, does a Confirm after re-render write to the right block?); the session flag resets on a new modal open and does not leak across two modals/blocks.
3. **Note-file integrity**: Confirm path writes only the stamina change (recoveries absent stays absent; nothing else in the block or the note changes); Cancel writes nothing; heroes with a pool are byte-identical to base behaviour.
4. **Tests are not vacuous**: mutate the product (e.g. drop the creature disable, drop the confirm, re-ask every press) and confirm the new jest/e2e tests go red; confirm every SC-432 marker is gone and the remaining `SC-432` mentions are history only.
5. **Re-run the gates** yourself: tsc, lint, jest, lifecycle, e2e full run (0 failed, coverage Y/Y), freeze. Compare against the implementer's numbers.
6. Copy: wording is literal, does not claim to spend anything for no-pool heroes, tooltip follows name-then-reason (SC-324), one shared constant per string. Colour is never the only channel (Scott is colorblind).

## 3. Gates

dse-verify skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`. Baseline at ab34293: jest 5262 / 1 skipped / 230 of 231 · lifecycle 27/27 · e2e 83/87 ok, 0 failed, 4 known-bug, 57/57 · shots 572 · freeze 276/276 · parity 0/0/24. Expected after: known-bug 3, 0 failed, coverage Y/Y; implementer's numbers: `jest 5292/1/230 of 231 · lifecycle 27/27 · e2e 88/91 ok, 0 failed, 3 known-bug, 59/59 · shots 572 · freeze 276/276 · parity 0/0/24`.

Run gates via wrapper script FILES capturing rc (devbox eats `$?`; never pipe a gate). `rm -f main.js styles.css` before jest. Own `DSE_LIFECYCLE_PORT` (e.g. 9293). Footguns:
- Never `pkill`/`killall` by pattern; kill only by PID whose command line contains `worktrees/sc432-free-recovery/` (or your own scratch path).
- Never `rm -rf` a shared `/tmp` glob or the shared `.superpowers/` dir; delete only paths you created and recorded.
- Never `--headed` on `:1`.
- Timeout-shaped jest reds in settings-tab / settings-preview / sidebarInitiative: check `/proc/loadavg` and re-run.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents. Run gates in the FOREGROUND; never background a gate and wait for a notification — it will not come.
- Never key a wait-loop on a scratch filename or its contents — stale logs from other branches match. Read the process's own output, or write to a per-run unique path.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc432-free-recovery/sc432-r1-review-report.md`, logs as `sc432-r1-review-<name>.log` in the same dir. Open with a ≤10-line executive summary: verdict (LAND-READY / FIX-FIRST), counts by severity, re-run gate numbers. Then findings by severity (BLOCKER / HIGH / MEDIUM / LOW / INFO), each with file:line, failure scenario, and a prescribed fix. If the report-file write is blocked, return the report inline.

## 5. Return contract

Final text: raw facts, no prose — verdict, severity counts, one line per finding, measured gate numbers, absolute paths of every artifact. You cannot `SendMessage` me (depth-2; `to: 'main'` goes to the dispatcher). If you need input, end with STATUS: NEEDS_CONTEXT and the question. If you ever message anyway, the first word must be `SC-432:`.

## 6. Extra probe targets from the implementer's report

- The implementer loosened `dse.modal(kind)` in `e2e/driver/dse.ts` to match by contents (a dialog over the stamina modal made it ambiguous). Check this cannot make an existing e2e assertion vacuous (e.g. a wrong-kind modal now passing, or a "modal closed" assertion that can no longer fail).
- Cancel / Escape / X leave the session un-confirmed, so the next press asks again (implementer's choice; the owner decision only says "Later presses in the same modal session do not re-ask" after a confirm). Confirm that reading holds and nothing is staged before Confirm.
- Owner ruled DROP on the implementer's follow-up "ds-stamina-bar always opens as a hero (stamina-bar/view.ts:157)": the bar carries no creature/hero field, and the no-pool path with a confirmation is the safe behaviour for an unclassified block. Do not re-raise it unless you find a block that DOES carry a creature signal the classifier ignores.
