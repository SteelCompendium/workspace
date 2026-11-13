# SC-581 r2 — independent adversarial review: the Conditions window's "Default" colour option

## 0. Context loading

- Ledger (current state, overrides everything): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc581-condition-colour-clear/decisions.md`.
- The implementer's brief and report in the same dir: `sc581-r1-brief-implementer.md`, `sc581-r1-implementer-report.md` (read its summary; judge the code, not the report's claims).
- **You never call the tracker (Linear).**
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc581-condition-colour-clear`, plugin at `.../draw-steel-elements`, branch `sc581-condition-colour-clear`. Review the diff `git -C <plugin> diff 1516f894..HEAD` plus the superproject's `git -C <superproject> diff 4cfac4bf..HEAD -- CHANGELOG.md DESIGN.md`. **Every git command is `git -C <absolute path>`.** Do not commit to the branch; if you need to probe with code changes, do it in a scratch `git worktree add` at a literal absolute path under your scratch folder (below), never in the shared main checkout (`/home/scott/code/steelCompendium/workspace/`), and never re-point remotes.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (~400 KB — read "The battery, in order" ~l.20-220 and the CURRENT line ~l.1480 only).

## 1. What was asked (verbatim from the ledger)

Scott (ticket, 2026-11-10): "Any fix is fine (a "Default" swatch, or clicking the selected swatch to unset it); the SC-436 marker accepts either."

Owner ruling (2026-11-13):
> Fix shape: an explicit **"Default" option, first in the Color group**, mirroring the Icon group's "Default" button ("Use default condition icon"). Pressing it deletes `color` from the condition (key removed, not written as empty). It is pressed (`aria-pressed=true`) when the condition has no valid colour. Re-pressing a selected preset swatch keeps its current behaviour (writes that colour again, stays pressed) — no toggle-to-unset.
> The Default option must be identifiable without hue (Scott is colorblind): visible text or a non-colour glyph, plus accessible name "Default" (the group already says "Color").

## 2. Review — execute and probe, don't just read

Probe at least:
1. **The written note.** In real Obsidian (e2e or a scratch run), set a colour, press Default: the condition's YAML has no `color` key, nothing else in the block or the note changes (other conditions' colours, other keys, text above/below the block). Two conditions with colours: clearing one leaves the other's intact. A hand-written colour (`color: red`, `color: "#ABC"`, an unparseable `color: notacolour`) — what is pressed on open, and what Default does.
2. **Exactly one pressed option** in the Color group after every action (preset, custom, Default, unparseable YAML colour), and `aria-pressed` vs the custom swatch's `data-selected` (SC-361) stay consistent.
3. **Focus and keyboard**: after Default, focus is on Default; Tab / arrows / Enter / Space across the group behave as for the other swatches; the SC-580 type-to-search key handling does not swallow or misroute keys on the new button.
4. **Row preview** in the list (glyph/badge) loses its colour immediately; the tracker card that shows the condition renders uncoloured after the write.
5. **Look**: Default is distinguishable without hue in light, dark and the Steel theme; no colour literals (kit/token tests); no host leak (shots' host-leak / modal host-leak gates). View the evidence PNGs in `.../sc581-condition-colour-clear/evidence/`.
6. **Tests are not vacuous**: revert only the `src/` change in a scratch worktree and confirm the flipped SC-581 jest test and the new jest/e2e tests fail; confirm the e2e test title has no bracketed ticket id and its scenario id (if any) is unique.
7. **Gates**: re-run tsc, lint, jest, and e2e yourself. Lifecycle: re-run part 3 (`--only=G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64`) and part 1's G-S1 (ConditionsModal across live writes) at minimum; trust the implementer's other parts unless you see cause. Expected (base `1516f894`): jest 11692 / 2 skipped without the shots cache + new tests; e2e `328/331 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs` + new tests, still 3 known-bug, coverage Y/Y; lifecycle 61/61; shots 592, freeze 280/280 unless the report ships a rebaseline; parity 0/0/24. Known noise: G-S91 flake (SC-616); SC-622 `demo-vault/.obsidian/appearance.json` dirt breaks G-S97 — restore it first.
8. Docs: plugin user docs and the worktree's `CHANGELOG.md` Unreleased bullet are accurate and plain.

## 3. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc581-condition-colour-clear/sc581-r2-review-report.md`, opening with a **≤10-line executive summary** (verdict LAND / FIX-FIRST, counts by severity, gate lines you measured). Findings by severity (HIGH / MED / LOW / INFO) with file:line, a failure scenario, and a prescribed fix. If the report-file write is blocked, return it inline.

## 4. Return contract

Final text goes to the ticket-owner, not a human: verdict, finding list (severity + one line each), measured gate lines, and absolute paths of every artifact you produced. No prose.

## 5. Footguns

- Devbox: `devbox run -c <abs plugin path> -- bash <script-file>`; exit codes recorded inside a script file; output redirected to logs; never pipe a gate into `tail`.
- Scratch: your own folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc581-r2-review/`, uniquely named files, created with the Write tool.
- No `rm` with a variable or glob target; **never `rm -rf` a `/tmp` glob**; never touch `.superpowers/` outside your report file; never touch the freeze baseline.
- Never `pkill`/`killall` by pattern — kill only PIDs whose `/proc/<pid>/cwd` is inside your own tree.
- Gates as blocking foreground calls (timeout 600000). Calls over ~180 s get backgrounded by the Bash tool: then loop `timeout 175 tail --pid=<your pid> -f /dev/null` and read the gate's own log; never key a wait on a scratch filename from another run.
- You cannot `SendMessage` me; end with `STATUS: NEEDS_CONTEXT` and the question if you need input. If you ever message anyway, the first word must be `SC-581:`.
