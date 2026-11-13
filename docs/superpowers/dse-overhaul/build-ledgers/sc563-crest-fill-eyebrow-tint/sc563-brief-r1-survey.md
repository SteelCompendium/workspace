# SC-563 round 1 — measure + options survey (NO source changes, NO commits)

You are a design/survey worker for ticket SC-563. Your final text goes to the ticket-owner,
not a human. **Workers never call the tracker** (Linear) — not to read history, not to post.

## 1. Context loading (do this first)

- Read the ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc563-crest-fill-eyebrow-tint/decisions.md`.
- Read the two overlapping ledgers (parked on Scott, same card head):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc367-cardhead-title-scale/decisions.md`
  and `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc368-cardhead-name-accent/decisions.md`.
  Skim (exec summary + the crest / eyebrow sections only) `sc367-r1-survey-report.md` and
  `sc368-r1-survey-report.md` in those dirs — they already measured crest sizes, eyebrow ink and
  name colours; reuse, do not re-derive, anything still valid at `6270e84a`.
- Look at the ticket's evidence image:
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc367-cardhead-title-scale/r2-evidence/sc367-ask-1-cards.png`
  (rows "Today (plugin)" and "Site" for Mark and Determination).
- Read `/home/scott/code/steelCompendium/worktrees/sc563-crest-fill-eyebrow-tint/DESIGN.md`:
  the Color bullet in "Look & feel foundations", any iconography / crest guidance, "Card header
  system", "Rules for new design work". Also `docs/working-preferences.md` in the same worktree
  ("the v2 site is a reference, not gospel"; colourblindness).
  **Workspace-level files live in YOUR worktree's superproject at
  `/home/scott/code/steelCompendium/worktrees/sc563-crest-fill-eyebrow-tint/` — never write anything
  under `/home/scott/code/steelCompendium/workspace/` except your report and evidence in the
  ledger dir named in §4.**
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` sections
  "Parity semantics", "Capture-width convention", "Steel scoping rule", and the harness build
  commands in "The battery, in order" (devbox shapes). Read
  `draw-steel-elements/visual-harness/parity/README.md` in the worktree (how site pages are
  captured; selector-map pairs; rule 4 raw computed px).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc563-crest-fill-eyebrow-tint`, branch
  `sc563-crest-fill-eyebrow-tint` in every submodule. dse is at `origin/develop` = `6270e84a`.
  Run `git -C /home/scott/code/steelCompendium/worktrees/sc563-crest-fill-eyebrow-tint/draw-steel-elements fetch origin`
  and confirm `origin/develop` is still `6270e84a`; if it moved, note it and keep measuring at
  `6270e84a` (do not rebase — this round commits nothing). Verify `pwd`/paths before any write.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked
  `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, ignore it.

## 2. The task

Two look-and-feel differences between the plugin's Steel card head and the v2 site. Both are
Scott's call. **This round produces the measurements, crops and options for his ask. You change
NO tracked source and make NO commits.** Probes are injected CSS/markup in your scratch harness
run only.

Ticket text, verbatim from the ledger (filed by SC-367's owner, not a Scott ruling — verify it,
it may be wrong in detail the way SC-232's and SC-368's were):

> **Crest icon fill:** "on the site the icon inside the crest shield is a solid, filled glyph
> (Mark's person, Determination's star). In the plugin it is drawn as a thin outline, and it is
> smaller. SC-367 handles the crest and icon *size*; the outline-vs-filled difference is not a
> size question and is left for this ticket."
>
> **Trait eyebrow tint:** "on the site the "◆ TRAIT" label above a trait card's name is tinted
> with the trait's accent (a light purple on Determination). The plugin draws it in the neutral
> grey every other label uses. This is colour, close to SC-368's name-colour question — decide
> the two together."

### 2a. Crest icon — measure

- **Site:** how the icon is drawn (inline SVG / icon font / mask-image / background), its source
  file:line under the worktree's `v2/docs/stylesheets/` / `v2/docs/javascripts/` (or wherever it
  lives), its fill vs stroke, its colour, and its box size inside the crest. Do this for every
  crest kind the site draws on a card head — at least: ability by action type (main action,
  maneuver, triggered, free/other, villain if present), trait, kit signature. Name each glyph.
- **Plugin (Steel, screen):** the same — icon set and source (file:line, e.g. lucide outline SVGs
  or a sprite), how it is painted (stroke width, fill, colour token chain), box size, and the
  full list of icon kinds the crest can show. Where else the same icons render (featureblock
  `.dse-fb__feat-icon`, sidebar, trackers, any non-Steel theme) — a shape change must not spill
  there unintentionally, or the option must say it does.
- Is a filled variant available for each plugin glyph? Options to evaluate at minimum:
  (1) adopt the site's filled glyphs (same assets — note their source/licence if visible),
  (2) fill the existing outline paths via CSS (`fill: currentColor`) — say which glyphs are
  closed paths and which turn into blobs, (3) a heavier stroke only, (4) keep the outline
  (check whether DESIGN.md prefers outline icons). Note how each composes with SC-367's
  pending crest/icon size change (icon grows with the crest under A-ink; unchanged under
  "leave").
- **Print / realprint:** confirm whether the crest and icon are hidden (SC-232 r1 found 0x0).
  Count frozen lines each option moves (expect 0 if hidden; prove it, do not assume).
- **Non-hue channel:** filled vs outline is a shape difference — say whether the glyph is still
  recognisable at the crest's size for each option.

### 2b. Trait eyebrow tint — measure

- **Site:** the rule that tints the trait eyebrow (file:line), what drives the tint (per trait,
  per class, per kind?), and every value it takes across the site's trait cards; whether ability
  / kit-signature / other eyebrows are tinted too, and by what. Both schemes (site dark = `slate`,
  light = `default`). For each colour: hex, OKLCH L / C / h, WCAG contrast against the painted
  background behind the eyebrow.
- **Plugin (Steel, screen):** eyebrow colour token chain (file:line), and whether the plugin
  already has per-kind/per-class accent tokens that a tint could reuse (left stripe colours,
  class accents, etc.). Same numbers, both schemes.
- Does the eyebrow carry a non-hue channel today (the "◆" glyph, the word "TRAIT")? A tint must
  never be the only signal.
- **Print / realprint:** is the eyebrow visible in print (SC-232 found it hidden)? Frozen lines
  per option.
- **Options at minimum:** (A) copy the site's tint, (B) keep neutral (and note whether a v2 site
  ticket would be warranted), plus any reasonable middle (e.g. tint the ◆ glyph only). For each,
  state how it composes with SC-368's options **D** (keep one dark name colour — that owner's
  recommendation) and **A** (copy the site's two name colours): in particular whether a tinted
  eyebrow becomes more prominent than the name in either scheme (compare lightness — SC-368 used
  that argument against its option A/C).
- Parity: which selector-map rows (if any) see the eyebrow colour or the icon; rows each option
  would retire or add.

### 2c. Evidence

- Same-scale crops (1:1 or a stated fixed scale, never auto-fit), stacked rows
  **Today (plugin) / Site / probe options**, for: Mark (ability) and Determination (trait) at
  minimum, plus one each of maneuver, triggered and kit signature if the site's glyph differs.
  Both schemes for the eyebrow tint; dark is enough for the icon unless light differs.
- Keep it to **at most 3 composite PNGs**, each ≤ 2400 px wide (Scott reads them inline on the
  ticket). One for the icon, one for the eyebrow (dark + light), optional third.
- Every caption names colours in prose **and** gives lightness — Scott is colourblind; hue must
  never carry meaning alone. Label rows with text, not colour.
- Harness: build/run per dse-verify's command shapes inside your worktree. Give any shots run a
  private `DSE_CAMERA_TMP` under your scratch folder. You do not need to run the full battery;
  this round commits nothing.

## 3. Footguns (every one has cost real time)

- No compound `cd`. Every git command is `git -C <absolute path>`. Run tools with
  `devbox run -c /home/scott/code/steelCompendium/worktrees/sc563-crest-fill-eyebrow-tint/draw-steel-elements -- <cmd>`.
- Devbox eats exit codes; never pipe a gate into `tail`. Redirect long output to a file and read it.
  Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills
  silent agents.
- Never `rm` with a variable target; never a glob `rm` (especially under `/tmp`). Delete only literal
  paths you created. Never `rm -rf` anything under `.superpowers/` except your own files.
- One gate/long command per Bash call, in the foreground. No background jobs or monitors, except
  shots — and then poll its own log, never wait for a notification.
- Never set `DSE_LIFECYCLE_PORT`. Kill scratch processes only by literal PID, after checking
  `readlink /proc/<pid>/cwd` is inside your own worktree. Never `pkill`/`killall` by pattern.
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc563-r1-reviewer-<your agentId or a random suffix>/`.
  Uniquely named scripts and logs inside it. Use the Write tool for scratch files, not heredocs.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across
  sessions and branches, and a stale log from another branch will match. Read the process's own
  output, or write to a per-run unique path.
- Never edit `.claude/skills/*/SKILL.md`, never touch the freeze baseline, never tag/release, never
  `just deploy*`, never `steel-etl site` with `pipeline.yaml`.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to
  the dispatcher, not me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and
  the question. If you ever send a message anyway, its FIRST WORD must be `SC-563:`.

## 4. Report

- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc563-crest-fill-eyebrow-tint/sc563-r1-survey-report.md`.
  It must OPEN with a ≤10-line executive summary (what the site and plugin actually do, per
  question; the options; your recommendation per question; frozen lines moved per option).
- Evidence: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc563-crest-fill-eyebrow-tint/r1-survey/`
  (composites under `r1-survey/crops/`, any probe CSS under `r1-survey/probes/`, raw measurements
  as JSON/CSV).
- Body: per question — measurements table (file:line, sizes, hex, OKLCH L/C/h, contrast), options
  with consequences (shots moved, frozen lines, parity rows, spill to other surfaces), composition
  with SC-367 and SC-368, risks, and the exact CSS each option would need (selector + declarations,
  `styles-source.css` insertion point that touches no line SC-367/SC-368 are likely to edit).
- Return contract — your final text: raw facts, no prose. Verdict per question, recommended option,
  frozen-line counts, dse sha measured at, and the absolute path of every artifact you produced
  (report, each composite PNG, probe files, measurement data).
