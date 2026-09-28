# SC-235 round 2 — independent adversarial review (reviewer)

You are the independent reviewer for SC-235 (Steel section-title type scale). You did not
write this branch. Your final text goes to the ticket-owner, not a human.

## 0. Context loading

1. Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc235-section-title-scale/decisions.md`
   — the "Owner rulings" section is the spec the branch was built against. **Workers never call
   the tracker (Linear).**
2. Round-1 brief and report in the same dir: `sc235-brief-r1-implement.md`,
   `sc235-r1-implement-report.md` (read its executive summary, then whatever you need).
3. `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (gates,
   freeze, parity) and `draw-steel-elements/AGENTS.md`.

## 1. Worktree

`/home/scott/code/steelCompendium/worktrees/sc235-section-title-scale/draw-steel-elements`,
branch `sc235-section-title-scale`, head `43b76cc` on `origin/develop` `825ea51`.
Verify `pwd` before every write. You review; you do not commit to the branch. Scratch goes in
`.superpowers/sdd/sc235-section-title-scale/r2-review/` only. Never edit anything else under
`/home/scott/code/steelCompendium/workspace/`, never touch the shared freeze baseline, DSE
`main`, tags, or `just deploy*`.

## 2. What to do — execute and probe, don't just read

- Diff `origin/develop..HEAD` (dse) and the superproject CHANGELOG commit.
- Independently re-measure (don't reuse the implementer's numbers): site vs head section-title
  font-size / line-height / letter-spacing per family; today's vs head at a non-default
  Obsidian text size (ratio must be exactly x1.125); SC-230 modal body scaling x1.4.
- Hunt for knock-on changes: any other text node whose computed size moved; any em-relative
  geometry on/under `.dse-section__title` (gap, ::before diamond, padding, the spend variant,
  nested sections inside statblocks/featureblocks/kits) that shifted; section rhythm.
- Print: confirm print/export captures are byte-identical (re-run freeze yourself).
- Narrow: re-run the per-character wrap reconstruction at 300px; 0 new breaks/wraps.
- Parity: re-run; confirm 10 DECLARED, and prove the gate can now fail on section-tag size
  (e.g. temporarily revert the CSS in a scratch copy and show a GAP).
- Evidence: open both composites in `r1-evidence/`; confirm 1 image px = 1 CSS px in every
  cell (measure a known element), that the Today column really is 16px and This branch 18px,
  and that labels are text, not colour.
- Check comments/docs describe the new truth; CHANGELOG wording accurate.

Gates expected at head: tsc/lint clean; jest = base + added, 0 failed; lifecycle 19/19; shots
524 / 0 FAIL; freeze 260/260; parity 0 GAPs / 0 undeclared / 10 DECLARED / exit 0.

## 3. Process rules

- Devbox: `devbox run -- bash -c 'cd <abs path> && <cmd>' > <log> 2>&1; echo rc=$?`; never pipe
  a gate into `tail`. Redirect long-running output to files — the 600s stream watchdog kills
  silent agents.
- Run every gate in the foreground; never background or `Monitor`-wait.
- Never key a wait-loop on a scratch filename or its contents; use per-run unique log paths.
- **Never `pkill`/`killall` by pattern**; kill only by PID whose command line contains
  `worktrees/sc235-section-title-scale/`.
- You cannot `SendMessage` me; end with `STATUS: NEEDS_CONTEXT` + question if you need input.
  If you ever message anyway, first word `SC-235:`.
- If the report-file write is blocked, return the report inline.

## 4. Report

`.superpowers/sdd/sc235-section-title-scale/sc235-r2-review-report.md`, opening with a ≤10-line
executive summary: verdict (LAND-READY-AS-PROPOSAL / FIX-FIRST), counts by severity. Findings by
severity (CRITICAL/HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario, prescribed fix.
Final text: raw facts + absolute paths of every artifact.

## 5. Owner's specific probe (priority — answer this first)

Owner eyeball of `r1-evidence/sc235-compare-wide.png` (2026-09-27): the Site column's
"EFFECT" glyphs look about the SAME height as Today's 16px plugin title, and visibly SMALLER
than This branch's 18px — even though the site's computed font-size is 18px. The site's
lettering also looks lighter weight and more widely tracked. Pixel-zoom of the three:
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/a56f19e1-5165-4bc8-92ee-d6eeff34f029/scratchpad/zoom.png`
(Today | This branch | Site, 4x nearest-neighbour).

Establish why, with numbers, in both schemes:
- computed `font-family` (and the face actually used — `document.fonts` / the rendered face),
  `font-weight`, `font-variant`/`font-variant-caps`, `text-transform`, `font-synthesis`,
  `font-feature-settings` on site `.sc-ability__section-head .tag` vs plugin
  `.dse-section__title` (today and head);
- whether each side's small-caps are REAL (font `smcp`) or browser-SYNTHESIZED;
- rendered ink height of the small-cap glyphs in CSS px (pixel-scan a 1:1 capture of
  "EFFECT" on each side: site, today, head), and total rendered word width.
- Then: what plugin font-size (with the current plugin font/weight) would make the rendered
  glyph height equal the site's? Is the real gap the font face/weight/synthesis rather than
  the size?

Report this as its own section with a table, before the ordinary findings.
