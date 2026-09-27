# SC-338 round 2 — fix round brief (implementer)

## 1. Context

- Ledger (read first, the "Owner rulings on r1 review" block is your task list):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc338-chip-focus/decisions.md`
- Review report: `…/sc338-chip-focus/sc338-r1-review-report.md` (MEDIUM-1, LOW-1, LOW-2, INFO-4 sections).
- Worktree `/home/scott/code/steelCompendium/worktrees/sc338-chip-focus`; dse branch `sc338-chip-focus` at `7177033`,
  superproject branch at `74a71c7`. `git fetch origin` inside dse first; if origin/develop moved past `6c4f6aa`, rebase and report.
- You never call Linear. Commit after each coherent step; no AI attribution in commits.
- **Process-kill rule (adapter §8.9):** never pkill/killall by a gate pattern. Kill only by PID, and only PIDs whose command
  line contains your own worktree path — find them with `pgrep -af "worktrees/sc338-chip-focus/"`. Other agents' shots,
  parity and obsidian runs share this host.

## 2. Tasks (owner rulings, quoted from the ledger)

> - MEDIUM-1 (the `box-shadow: none` entry also strips Obsidian's drop shadow / light-mode double border from UNPRESSED chips at
>   rest + hover) -> KEEP the fix as-is (matches every other plugin button under SC-203/SC-205 host re-grounding) but it is a
>   visible rest-state change: add labeled rest-state before/after to Scott's ask, with the narrow-to-:focus-visible alternative
>   offered; add a CHANGELOG clause. Scott's call.
> - LOW-1 -> FOLD: dse-verify note states numbers inline; host-leak line 111/666 -> 114/684.
> - LOW-2 -> FOLD (no code): the "fits inside the 4px padding" claim is wrong — the focused chip is 46px/62.8px inside the body
>   edges; the padding regression is caught by `modal-montage-limits`, not `modal-montage-edit`. Report addendum corrects it.
> - INFO-4 `.dse-swatch` (Conditions color swatches) has the same focus defect -> FOLD into this ticket (same modal, same fix
>   shape); its evidence joins Scott's one ask.

Concretely:
1. **Swatches** (`.dse-swatch`, `styles-source.css` ~2131–2147, Conditions modal): same treatment as the chip — join the shared
   kit focus-ring rule and, if they are `<button>`s wearing the host focus box-shadow, the SC-203 host re-grounding list, mirroring
   the chip exactly. CAREFUL: the swatch's own look may rely on box-shadow (the pressed swatch shows a ring today) — the host
   `box-shadow: none` entry must not erase the plugin's own pressed swatch ring; check cascade/specificity and prove it with
   before/after crops. Extend the same two guard tests; prove each new assertion fails with its hunk reverted.
2. **CHANGELOG** (YOUR worktree's `/home/scott/code/steelCompendium/worktrees/sc338-chip-focus/CHANGELOG.md`, never the main
   checkout's): the bullet also says unpressed chips no longer carry Obsidian's grey drop shadow, matching the plugin's other
   buttons, and covers the swatches. Plain user-facing words.
3. **dse-verify** (YOUR worktree's `.claude/skills/dse-verify/SKILL.md`): the SC-338 note states the battery numbers inline;
   the host-leak "Expected line" moves 111/666 -> 114/684 (say it was pre-existing drift, measured 2026-09-24).
4. **Report addendum** correcting LOW-2 in your r2 report.
5. **Evidence for Scott — real Obsidian, private Xvfb + port, never `:1`.** BEFORE = a build of `6c4f6aa` (a real base build,
   not a simulation), AFTER = your branch. Produce three labeled grid PNGs (text labels in the image for every row/column —
   "before"/"after", "dark"/"light", state names; never rely on color to tell cells apart):
   - `sc338-grid-rest.png` — the montage Result row at REST (no focus, no hover): pressed Success + unpressed Failure + Assist,
     dark and light, before vs after. This is the rest-state change Scott must see.
   - `sc338-grid-swatch.png` — Conditions color swatches, keyboard-focused pressed and unpressed + unfocused pressed, dark and
     light, before vs after.
   - keep r1's focus grid (`evidence-r1/sc338-chip-focus-grid.png`); regenerate it only if the CSS change alters chip pixels.
   Save under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc338-chip-focus/evidence-r2/`. Keep each grid
   ≤ ~1600px wide; crops tight.

## 3. Gates (dse-verify skill; expected now)

tsc clean; lint clean; jest 3997 passed / 1 skipped / 206 of 207 suites (plus any assertions you add inside existing tests —
report exact; a lone `sidebarInitiative.test.ts:350` failure under load is known flake SC-360: re-run once, report both);
obsidian-lifecycle 6/6; shots 524, 0 FAIL, host-copy pin OK, host-leak `114 … 684`; freeze `260/260` — if ANY frozen line
moves, do NOT touch the baseline, write `sc338-chip-focus/rebaseline.txt` + crops and report; parity LAST 0/0/16 exit 0;
camera `modal-montage-edit` ring-checked ok and `modal-montage-limits` ok. Foreground only, output to per-run unique files, never
pipe a gate.

## 4. Report & return

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc338-chip-focus/sc338-r2-fix-report.md`, opening with a ≤10-line
executive summary. Final text to the ticket-owner: raw facts, shas (both repos), gate lines, absolute paths of every evidence file.
If the report write is blocked, return it inline. Never key a wait-loop on a scratch filename. You cannot message me — end with
STATUS: NEEDS_CONTEXT if blocked; any message you send anyway starts with `SC-338:`. Never rm anything in `.superpowers/` outside
`sc338-chip-focus/`.
