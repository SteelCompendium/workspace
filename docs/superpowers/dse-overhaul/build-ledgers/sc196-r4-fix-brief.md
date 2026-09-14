# SC-196 round 4 (fix round) brief

Same rules as `sc196-r3-brief.md` (worktree is your only write location, verify `pwd`, devbox
wrapping, foreground gates, per-run log files, no tracker, no push, no tag, never touch
`.superpowers/` outside `sc196-light-contrast/`). Re-read `decisions.md` first.

## The findings — verbatim from the independent review, fix ALL of them

`sc196-r3-review-findings-verbatim.md` (same dir) holds the reviewer's "How the decisive fact was
established" section and every finding HIGH-1, HIGH-2, MEDIUM-1, MEDIUM-2, LOW-1, LOW-2 with
file:line and prescribed fixes. Read it in full. Owner rulings on top:

- HIGH-1 / HIGH-2: the selected initiative cell MUST hover as a word that says it is selected
  (e.g. "Selected — Goblin #1"; unselected cells "Select Goblin #1"). Fix the kit's
  `IconButtonHandle.setTooltip` so a tooltip set after mount actually persists (it currently loses
  to the aria-label restore at `iconButton.ts:129-133` / mount order `:109-110`). Since Obsidian's
  `setTooltip` writes only `aria-label` (proven by the reviewer's asar decompile), accept that the
  accessible name and the tooltip text are one string and design the wording for both.
- MEDIUM-1: fix the run-together roll-row strings ("≤113 + M damage"). Either drop the row body
  from the label or join range + body with a real separator. Rendered examples must read like
  "Not rolled. ≤11: 3 + M damage".
- MEDIUM-2: do not claim screen-reader exposure for roleless `<div>` rows in your report or in code
  comments. The deliverable there is the hover tooltip. (Adding a role is NOT in scope — leave the
  DOM roles as they are.)
- LOW-1 / LOW-2 (folded into this round): every tooltip test must assert the RENDERED end state
  (the element's final `aria-label` attribute after mount + state change), not that a mock was
  called. Run the reviewer's mutation yourself (`scratchpad/jest.mutated.config.ts` +
  `obsidian-notooltip.ts` listed in the review's evidence paths, or your own equivalent that stubs
  `setTooltip` to a no-op) and confirm every new test goes red under it. Quote the red count.

## Also in this round — changelog bullets (docs are part of done)

Two bullets, one per changelog, describing the user-facing change in plain language for a
non-technical Obsidian user. Name the colors in words (Scott is colorblind).

1. `/home/scott/code/steelCompendium/worktrees/sc196-light-contrast/draw-steel-elements/CHANGELOG.md`
   — under `## 7.0.0 (unreleased…)`, match the existing `[FIX]`/`[FEATURE]` bullet style. Content:
   the light color scheme now has its own state palette (stamina healthy/winded/dying/temp, power-roll
   tiers, malice, victory points, warnings, the selection ring) darkened until every state reads at
   WCAG AA against light grounds; the dark scheme is unchanged; the +N temporary-stamina badge, the
   selected initiative cell, and roll-result rows now show a hover tooltip naming their state.
2. `/home/scott/code/steelCompendium/worktrees/sc196-light-contrast/CHANGELOG.md` (the WORKTREE's
   copy — never `/home/scott/code/steelCompendium/workspace/CHANGELOG.md`) — one bullet under
   `## Unreleased`, style `- **DSE plugin: … (SC-196).** …`, same content condensed.

Commit the dse changes (code + tests + CHANGELOG) as one or two commits on `sc196-light-contrast`,
then bump the submodule pointer in the superproject together with the workspace CHANGELOG bullet.

## Gates — the full battery again (dse-verify order, foreground, per-run logs prefixed `sc196-r4-`)
Expected: tsc/lint clean; jest all green (report totals; was 3870/1 skipped/202 of 203 suites);
shots 0 FAIL with `host-copy pin OK` + `button host-leak OK`; `freeze OK (260/260 …)` exit 0,
0 mismatches; parity 0 gaps / 0 undeclared / 16 declared, exit 0. Also `lightContrast.test.ts`
alone still 25/25. Then the mutation run (red count).

## Evidence
Refresh `sc196-r4-dom-evidence.log`: the final `aria-label` for each of the three surfaces in each
state (unselected/selected; active/dimmed row; temp on/off).

## Report + return contract
`sc196-r4-report.md`, ≤10-line executive summary first (verdict, dse sha, superproject sha, gate
numbers, mutation red count, per-surface final tooltip strings, evidence paths), then detail,
`Drive-by fixes:` and `Follow-ups:`. Final text = executive summary + evidence paths. NEEDS_CONTEXT
protocol and messaging rules as in r3.
