# SC-563 round 2 — implement option I1 (site glyph font in the action crests)

You are the implementer for SC-563. Your final text goes to the ticket-owner, not a human.
**Workers never call the tracker** (Linear) — not to read history, not to post.

## 1. Context loading (do this first)

- Ledger (current state; read ALL of it, especially "Scott ruling, ask 1" and "Owner rulings,
  implementation"): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc563-crest-fill-eyebrow-tint/decisions.md`.
- Round-1 survey report: `.../sc563-crest-fill-eyebrow-tint/sc563-r1-survey-report.md` — read §1a
  (site glyph table), §1c, §1d, §5 ("I1 instead of I2"), §6. Working probe CSS:
  `.../sc563-crest-fill-eyebrow-tint/r1-survey/probes/probe-I1-site-glyph-font.css`. The survey
  was at dse `6270e84a`; line numbers may have moved — re-locate by content.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc563-crest-fill-eyebrow-tint`, branch
  `sc563-crest-fill-eyebrow-tint` in every submodule, freshly cut: superproject at workspace
  origin/main `298a4ef9`, dse at origin/develop `d984b115`. First run
  `git -C /home/scott/code/steelCompendium/worktrees/sc563-crest-fill-eyebrow-tint/draw-steel-elements fetch origin`;
  if origin/develop moved past `d984b115`, rebase onto it and say so.
- Read the dse repo's `AGENTS.md`/`CLAUDE.md` in the worktree, and
  `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` in full (battery,
  command shapes, freeze semantics, Steel scoping rule).
- **Workspace-level files live in YOUR worktree's superproject at
  `/home/scott/code/steelCompendium/worktrees/sc563-crest-fill-eyebrow-tint/` (e.g. its `DESIGN.md`,
  `CHANGELOG.md`) — never under `/home/scott/code/steelCompendium/workspace/`.** The only thing you
  write under `workspace/` is your report/evidence in the ledger dir (§4). Verify paths before every write.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked
  `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, ignore it.

## 2. The task

Scott's ruling, verbatim from the ledger (2026-11-12):

> 1. **I1 - use the glyphs**
> 2. **E-B**

Question 1 was the crest icon (I1 = "use the site's glyph font", shown to him with the villain
crest keeping its Lucide skull). Question 2 was the trait eyebrow tint; E-B = keep it grey, so
**no eyebrow change**.

Implement, per the ledger's "Owner rulings, implementation":

1. **Font.** Embed `DrawSteelGlyphs-Regular.otf` **unmodified, full font** (no subsetting) as a
   `data:` URI `@font-face` next to the existing Source Serif 4 embedding in `styles-source.css`
   (follow exactly how that one is sourced/built — if it is generated from `assets/fonts/`, put the
   OTF there and use the same mechanism). Source file: `v2/docs/fonts/DrawSteelGlyphs-Regular.otf`
   in your worktree (cross-check bytes against `reference/DrawSteelGlyphs/` if present).
   `font-display: block`.
2. **Licence.** Add an attribution file next to `assets/fonts/OFL.txt` (copy of
   `reference/DrawSteelGlyphs/FontLicense.txt`: "© 2025 MCDM Productions, CC BY-SA 4.0"), and a
   third-party credit wherever the plugin already credits Source Serif 4 (README / NOTICE / LICENSE —
   find it).
3. **Glyphs.** On Steel, screen-only, for feature crests whose root has `data-dse-act` and is NOT
   `villain`: hide the Lucide svg and draw the glyph via `.dse-crest__glyph::before` with
   `font-family: "DrawSteelGlyphs"`, `font-size: 1.25em`, `line-height: 1`, and
   `content: "<cp>" / ""` (decorative — screen readers skip it). Codepoints mirror the site
   (`steel-etl/internal/site/ability_cards.go:88-110`): main `l`, maneuver `f`, triggered `)`,
   move `o`, none `*`, trait `*`. One commented block; the comment cites the site file, says the
   site marks these as placeholders, cites SC-565, and notes SC-367's pending crest resize would
   scale the 1.25em. Any `data-dse-act` value not in the map must keep its Lucide svg (no blank crest).
   Villain keeps the Lucide skull. No other crest icon (stamina, kit head, etc.) changes.
   Insert as a new SC-563 block clear of the lines SC-367/SC-368 would touch (survey §5 rationale).
4. **Tests** (per dse conventions): a jsdom/source-text test that the rule is Steel + screen-scoped,
   excludes villain, covers exactly the six codepoints, has the `/ ""` alt text, and that the
   `@font-face` is present — with a can-fail check (show the test fails on a mutated rule). If any
   test asserts the Lucide icon is visible on action crests, update it deliberately and say so.
5. **Docs folds:** a line in the worktree superproject's `DESIGN.md` Iconography section stating what
   the crest action icons are (DrawSteelGlyphs, site codepoints, villain = Lucide skull); a bullet
   under `## Unreleased` in the worktree superproject's `CHANGELOG.md`; any dse doc its AGENTS.md
   requires.

Out of scope: the eyebrow tint (E-B), crest/icon size (SC-367), name colour (SC-368), the site's
glyph choices (SC-565). Report anything else you notice as `Follow-ups:`; do not fix it.

Commit after every coherent step inside `draw-steel-elements` (branch `sc563-crest-fill-eyebrow-tint`,
`git -C <abs>`), no co-author/AI trailers. For the superproject doc edits, commit them on the
superproject branch; do NOT bump the dse pointer and do NOT push anything — the owner/dispatcher
handle the single pointer bump at landing.

## 3. Gates — the full dse-verify battery, in order

Expected at `d984b115` (dispatcher, 2026-11-12):
- tsc + lint clean.
- jest: 11617 passed / 2 skipped on a fresh worktree, plus your new tests.
- lifecycle 61/61, run in SIX `--only` parts, comma-separated `--only=`:
  `G-S7a … G-S9a` (21); `G-S9b … G-S40` (16); `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9);
  `G-S57,G-S62,G-S61,G-S56` (4 — G-S56 stays LAST in SCENARIOS order); `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7);
  `G-S92,G-S96,G-S97,G-S99` (4). Take the exact id lists for parts 1–2 from dse-verify. G-S91 has a
  known flake (SC-616): if only G-S91 fails, re-run that part once and report both results.
- e2e: `306/309 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`. Never put a bracketed ticket
  id in an e2e test title.
- shots: 592, 0 FAIL, host-leak 163/978, modal host-leak 39/234, `capture clip` 147.
- freeze: **280/280 expected** — crests are hidden in print. If ANY frozen line moves, STOP, do not
  touch the baseline, and report it (STATUS: NEEDS_CONTEXT) with the line list.
- parity: 0 GAPs / 0 undeclared / 24 DECLARED.
- Expected screen-shot movement (unfrozen): about 18 element×fixture combos × dark/light. Report the
  list of changed screen shots.

## 4. Evidence + report

- One composite PNG, same scale (2 image px per CSS px, never auto-fit), rows **Before** / **After**
  / **Site**, columns maneuver, main, triggered, move, no action, trait, villain, dark scheme; plus a
  light-scheme row pair for at least Mark and Determination. Reuse the round-1 scripts in
  `.../r1-survey/scripts/` (copy them to your scratch; do not edit them in place). ≤ 2400 px wide.
  Captions name colours in prose with lightness — Scott is colourblind.
- If `obsidian-shots` is available per dse-verify, spot-check one ability card in real Obsidian to
  confirm the embedded font renders (not a letter "l"). Report how you checked.
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc563-crest-fill-eyebrow-tint/sc563-r2-implement-report.md`,
  OPENING with a ≤10-line executive summary. Evidence under `.../sc563-crest-fill-eyebrow-tint/r2-implement/`.
- Return contract — final text: raw facts, no prose. STATUS, commit shas (dse + superproject), every
  gate's measured numbers, changed-shot count, `Drive-by fixes:` and `Follow-ups:` lists, and the
  absolute path of every artifact (report, composite, logs).

## 5. Footguns (every one has cost real time)

- No compound `cd`. Every git command is `git -C <absolute path>`. Run tools with
  `devbox run -c /home/scott/code/steelCompendium/worktrees/sc563-crest-fill-eyebrow-tint/draw-steel-elements -- <cmd>`.
- Devbox eats exit codes; never pipe a gate into `tail`. Record exit codes from a script FILE run via
  `devbox run -c <path> -- bash <script>` and read each gate's summary line. Redirect long output to a
  file — the 600s stream watchdog kills silent agents.
- One gate per Bash call, in the foreground. No background jobs or monitors except shots — and then
  poll its own log/exit file, never wait for a notification.
- Never `rm` with a variable target; never a glob `rm`, never `rm -rf` a `/tmp` glob. Delete only
  literal paths you created. Never touch `.superpowers/` outside this effort's dir.
- Never set `DSE_LIFECYCLE_PORT`. Give each shots run a private `DSE_CAMERA_TMP` in your scratch.
- Kill scratch processes only by literal PID after checking `readlink /proc/<pid>/cwd` is inside your
  worktree. Never `pkill`/`killall` by pattern.
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc563-r2-impl-<random suffix>/`,
  uniquely named scripts/logs inside. Use the Write tool for scratch files, not heredocs.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across
  sessions and branches, and a stale log from another branch will match. Read the process's own output,
  or write to a per-run unique path.
- `npm ci` if `node_modules` is missing or stale after the fresh cut (do not symlink the main
  checkout's node_modules this time).
- Never edit `.claude/skills/*/SKILL.md`, never touch the freeze baseline, never tag/release, never
  `just deploy*`, never touch dse `main`, never push.
- If a Bash call would need a permission prompt nobody can answer, do it another way.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me — `to: 'main'` routes to the dispatcher, not me. If you need input, end
  your turn with `STATUS: NEEDS_CONTEXT` and the question. If you ever send a message anyway, its
  FIRST WORD must be `SC-563:`.
