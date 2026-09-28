# SC-318 round 1 — heading-scale survey (read + measure only, NO source edits)

You are a survey worker for ticket SC-318. Your final text goes to the ticket-owner, not a
human: raw facts, measured numbers, file:line, no prose padding.

## 1. Context loading

- Read `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc318-card-headings/decisions.md`
  FIRST (ticket framing, constraints, sibling tickets SC-232 / SC-235 and the shared
  measurement convention). Workers never call the tracker (Linear) — not to read, not to post.
- Background (read only the named sections): 
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc202-visual-harness-obsidian/sc202-r4-report.md`
  §5b and §6; `sc202-r4-review.md` MED-4 in the same dir.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc318-card-headings` (branch
  `sc318-card-headings` in every submodule). DSE is at `draw-steel-elements/`, HEAD should be
  `5a20d5f` = origin/develop. Verify with `git -C <wt>/draw-steel-elements log -1 --oneline`
  and `pwd` before anything. This round edits NO tracked file. Scratch files go under
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc318-card-headings/r1-survey/`
  (create it). Never write in the main checkout `/home/scott/code/steelCompendium/workspace/draw-steel-elements`.
- Devbox: `devbox run -- bash -c 'cd <abs path> && <cmd>'`; the devbox wrapper eats `$?` —
  redirect output to files and read the tool's own summary text.
- The `dse-verify` skill (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`)
  documents the harness (`npm run shots`, capture ids, frozen set, parity). Read what you need.

## 2. The task — answer these, with measurements

Q1. **Current plugin state.** Where heading sizes come from today:
  - the SC-202 "HEADING + EMPHASIS + LINK" GROUP 1 block in `styles-source.css` (file:line),
    its selectors, and whether it is theme-scoped (Steel vs legacy), screen vs print scoped;
  - `fontSizeContract.test.ts` UA_RESTATEMENTS / allowlist entries (file:line) and what a
    token mint requires (D3 token map `docs/superpowers/dse-overhaul/D3-token-map.md` in the
    WORKTREE superproject, `token-coverage.test.ts`);
  - existing `--dse-fs-*` tokens and their values (body, heading, subheading, …) and how they
    scale with Obsidian's text-size setting and SC-230 modal scaling;
  - the 8 real `h*` tags (SC-202 r4 §6): for each, whether it sets its own font-size / line-height
    / margin today, and the computed values in the harness at default size.

Q2. **Where headings actually render.** Which shipped content and which harness fixtures put
  markdown `#`..`######` headings inside a plugin body (perk "Familiar Statblock" h6, ancestry/
  class h3, anything else — grep the compendium/data the plugin renders and the harness
  fixtures). List capture ids that show any `h1`–`h6` (markdown or plugin tag), split into
  (a) screen-only captures, (b) FROZEN captures (in
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/freeze-baseline.sha256` — read-only).
  For each frozen id say which heading(s) it contains. This is the rebaseline blast radius.

Q3. **Reference scales, measured.** At default settings:
  - (i) **Obsidian default theme** heading scale (`--h1-size`..`--h6-size`, line-heights,
    weights, margins) — cite the source (app.css in the installed Obsidian asar, or the
    pre-SC-202 vault numbers in §5b);
  - (ii) **the live site** (v2 MkDocs Material, rem base 20px): how does steelcompendium.io
    render markdown headings INSIDE card-like bodies (a perk/feature/ancestry body with an
    `h3`/`h6`; find a page that has one) and in plain page prose (`.md-typeset h1..h6`).
    Raw computed px (font-size, line-height, weight, margins, font-family, text-transform,
    font-variant) via a headless browser (Playwright is in the DSE devDependencies). Also
    read the v2 CSS (`<wt>/v2/docs/stylesheets/`) for the rules. If the site uses a
    different face or small caps, measure RENDERED cap height too (SC-235's lesson: the site
    fakes small caps with Petrona at 70% capitals, so CSS px alone misleads).
  - (iii) the plugin today (UA): same properties, harness at default size.
  Put all three in one table, h1..h6 rows, plus body text size for each context.

Q4. **Hierarchy constraints.** Record the neighbours a heading must sit with, as measured
  numbers: card name (`.dse-head__primary--left`) today 20px, SC-232 proposal 27/33.3/41.4/
  37.8/28.8 (narrow fallback 20); section title (`.dse-section__title`) today 16px, SC-235 A
  18 / B 15; body 16px. Note any heading that would outrank the card name or undercut body text
  under each reference scale.

Q5. **Options.** Propose 2–3 concrete scales (numbers for h1..h6: font-size as a multiple of
  `--dse-fs-body`, line-height, weight, margin-top/bottom, plus the 8 plugin tags), e.g.
  "Obsidian's own scale as tokens" (restores the pre-SC-202 look), "site parity", "a compact
  card scale where h6 >= body". For each: which frozen capture ids move (count of freeze
  lines), whether it could be screen-only, and whether it collides with SC-232/SC-235
  selectors (`.dse-head*`, `.dse-section__title`) or the parity declared-deferral set.
  Recommend one, with a one-paragraph reason. Also say whether the 8 plugin tags should share
  the markdown scale or keep bespoke sizes.

Do NOT edit source, tokens, tests, or baselines. Do NOT run `npm run shots` into the tracked
shots dir unless needed; if you need captures, it is fine to run the harness in the worktree
(shots are regenerated output), but never touch the freeze baseline.

## 3. Gates

None required (read-only round). If you run `npm run shots`/`parity`, expected on this base:
shots 532 PNGs 0 FAIL, freeze 260/260 via
`bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh <wt>/draw-steel-elements/visual-harness/shots`,
parity 0 GAPs / 0 undeclared / 16 DECLARED.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc318-card-headings/sc318-r1-survey-report.md`
Open with a <=10-line executive summary (recommendation + blast radius numbers). Then Q1–Q5.

## 5. Return contract and footguns

- Final text: verdict/recommendation, key numbers, and the filesystem path of every artifact
  you produced (report, scratch scripts, any PNGs). No prose padding.
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is
  pre-populated across sessions and branches, and a stale log from another branch will match.
  Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog
  kills silent agents. Run everything in the FOREGROUND; never background a job and wait for a
  notification (it never comes).
- Kill processes only by PID, and only a PID whose command line contains
  `worktrees/sc318-card-headings/` (check `pgrep -af "worktrees/sc318-card-headings/"`). Never
  `pkill`/`killall` by pattern — other efforts run the same commands concurrently.
- Never `rm -rf` anything under `.superpowers/` except your own `sc318-card-headings/r1-survey/`.
- You cannot `SendMessage` me. If you need input, end your turn with STATUS: NEEDS_CONTEXT and
  the question. If you ever send a message anyway, its first word must be `SC-318:`.
