# SC-526 r3 — independent review brief (orchestration:reviewer)

## 1. Context loading
- Read: ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc526-recoveries-popover-hostleak/decisions.md`; r1 report `sc526-r1-report.md` (exec summary + CSS section); r2 brief `sc526-r2-brief.md` and r2 report `sc526-r2-impl-report.md` (same dir).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc526-recoveries-popover-hostleak`; dse branch `sc526-recoveries-popover-hostleak` at `d40197c4` on `origin/develop` `248e202b` (or newer). Review `git -C <dse> diff origin/develop...HEAD` plus the superproject CHANGELOG commit `643185bb` (on origin/main `1ee7c9af`). r2 evidence logs: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc526-r2-impl-k7m2/` (read-only). Do not rebase. Do not push. Never tag.
- Gate skill (read-only): `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
- Workers never call the tracker. `git -C <abs path>` only. Main checkout dse dirt is Scott's vault — never touch.

## 2. The task — execute and probe, not just read
Scott's ruling, verbatim: "A looks better than A30". Ticket task, verbatim: "re-ground the two popover buttons (or move them into the kit button family), then turn on the sweep mount SC-513 left out: add `staminaRecoveryPopover:true` to the button sweep's prefs and real-click the gallery hero's `.dse-stamina-rec__pips` LAST, after every other mount (any later click outside closes the popover)."
Check, with runs, at minimum:
1. The CSS really is option A (no 30px / `--input-height` height), re-grounds every Obsidian `button` declaration in the host copy (`visual-harness/dist/obsidian-app.css`) that reaches the two classes, in every state the sweep checks (rest/hover/focus-visible; disabled Catch breath), both legacy and Steel themes, and does not change any other selector's cascade (specificity / source-order regressions in the SC-203 family; diff the computed style of a sample of other kit buttons vs origin/develop).
2. The sweep mount: really last, button sweep only, named FAILs reachable (re-run at least one anti-vacuity probe yourself), no stale SC-526 "open gap" text left in shoot.mjs; the input/checkbox claim (no pref needed) holds.
3. Re-run shots yourself (private DSE_CAMERA_TMP) and freeze; confirm the button line and the 592-PNG identity vs origin/develop. Re-run jest. Spot-check one lifecycle part and e2e only if the diff touches src/ beyond CSS.
4. CHANGELOG wording is user-facing and accurate; it sits in the worktree superproject, not the main checkout.
Findings by severity (BLOCKER/HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario, prescribed fix. Verdict LAND-READY or NOT.

## 3–4. Command shapes and footguns — identical to §3 (command shapes) and §4 of `sc526-r2-brief.md`; read and obey them. Private scratch folder `…/scratchpad/sc526-r3-rev-<4 random chars>/`.

## 5. Report `sc526-r3-review-report.md` in the ledger dir, ≤10-line exec summary first.
## 6. Return contract: raw facts — verdict, findings list, measured numbers, absolute paths of every artifact. Final text goes to the ticket-owner, not a human.
