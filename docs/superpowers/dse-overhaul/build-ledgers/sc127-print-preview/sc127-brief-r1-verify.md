# SC-127 round 1 — verify the Print preview bug in REAL Obsidian (dark theme)

You are an `orchestration:implementer` worker. Your final text goes to the SC-127
ticket-owner (an agent), not a human: raw facts, no prose, plus the absolute path of every
artifact you produce. **Workers never call the tracker (Linear)** — not to read, not to post.

## Context loading (read first)

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/sc127-decisions.md`
  (Scott's ruling and the rescope). Read it instead of any ticket thread.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc127-print-preview/draw-steel-elements`
  — branch `sc127-print-preview`, cut from dse `origin/develop` `e4bcd0f`. Verify `pwd` before
  any write. NEVER write under `/home/scott/code/steelCompendium/workspace/` (shared main
  checkout; other agents work there).
- Skills to read: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
  (sections "The battery", "Devbox wrapping", "Modal checks inside the real-Obsidian camera",
  "Rebuild before live-vault review") and
  `/home/scott/code/steelCompendium/workspace/draw-steel-elements/AGENTS.md` (the "Visual
  harness" section). Also `visual-harness/README.md` in the worktree.
- Devbox: Node/npm are NOT on PATH. Always
  `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc127-print-preview/draw-steel-elements && <cmd>'`
  (run from `/home/scott/code/steelCompendium/workspace` or the worktree superproject root —
  both have devbox.json; use the worktree's:
  `cd /home/scott/code/steelCompendium/worktrees/sc127-print-preview && devbox run -- bash -c '...'`).
  Devbox's sh wrapper eats `$?`/`$PIPESTATUS`; never pipe a gate into `tail`; redirect output
  to files.

## The task — evidence only, NO code changes

Answer one question with ground-truth PNGs from a REAL spawned Obsidian:

**Does Settings → Appearance → "Print preview" (pref `printPreview`, reflected as
`data-dse-print="on"` on every element root) render unreadably in a DARK-theme vault —
dark/black labels and titles on a near-black card, and/or a white background under
light-coloured body text?** And, as the control: what does the same preview look like in a
LIGHT-theme vault?

The dispatcher's hypothesis (from the browser-harness twin `statblock-charline-two--steel-print.png`):
labels (Might, Agility, Power Roll, Effect, Immunity) and card titles are black on a
near-black card; below about 1140 CSS px the background turns white while body text stays
light. One sub-question: is that white-below-the-fold part real in Obsidian, or a harness
page/sheet-background covering only the viewport?

### How

1. `npm ci` if `node_modules` is missing, then `npm run build-no-check` so the vault-loaded
   `main.js`/`styles.css` match the branch.
2. Use the real-Obsidian camera, `visual-harness/obsidian-camera.mjs` (`npm run
   obsidian-shots` is its normal entry). It already flips `body.theme-dark/light` per
   capture (`BGS` at line ~91) and its `--docs` mode supports a per-entry `pref` (see
   ~line 1897: `entry.pref` → `prefs.set('printPreview','on')`, restored after). Read the
   file's header and those regions; pick the cheapest way to get, for EACH of
   dark and light theme, full-element captures with `printPreview: 'on'` of at least:
   `statblock` (the `statblock-charline-two` fixture if it has a note, else the default
   statblock), `feature`, `featureblock`, `hero`, `initiative`, `montage`, and
   `negotiation`. Also one capture per theme of the SAME element with `printPreview: 'off'`
   for a side-by-side. If narrowing the camera to a subset is possible via its existing
   CLI flags, use it; if you must add a temporary docs-manifest or a small throwaway script
   that drives the camera, keep it out of the commit (do not commit anything this round).
3. **Display and port: PRIVATE ONLY.** Start your own Xvfb (the repo's devbox lists `xvfb`;
   `visual-harness/docs-shots.mjs` `startXvfb()` shows how it resolves the binary) on an
   unused display number (e.g. `:87`) and run the camera with
   `DSE_CAMERA_DISPLAY=:87 DSE_CAMERA_PORT=9287` (pick a free port). **Never use display
   `:1` or port 9223 — that is Scott's live desktop/Obsidian.** Set `DSE_CAMERA_TMP` to a
   path under your scratch dir so you don't collide with other camera runs.
4. Also run a **real PDF export** of one statblock note in the dark-theme vault if the
   camera or a small CDP call makes it cheap (`Page.printToPDF` through the CDP port works),
   and render page 1 to PNG — this is the "what the export actually produces" reference. If
   this costs more than ~15 minutes, skip it and say so; the realprint harness shot is an
   acceptable stand-in.
5. Measure, do not just eyeball: for the dark+preview statblock capture, sample computed
   `color` and the effective background behind: the card title, one characteristic label
   (e.g. "Might"), one body text run, one label in the lower half of the card. Report
   hex/rgb values and a WCAG contrast ratio for each pair. Do the same for light+preview.
6. Look at every PNG you produce (Read tool) and describe what you see in plain words, naming
   colours in prose (Scott is colourblind — "black text on a charcoal card", never just
   "the dark one").

### Bounds

- No source edits in `src/` or `styles-source.css`. This round is evidence only.
- Do not run the full battery. Do not touch `.superpowers/sdd/freeze-baseline.sha256` or
  `check-freeze.sh`.
- Kill your Xvfb and Obsidian processes when done. Never kill processes you did not start.
- Time box: if the camera cannot be made to run on a private display within ~45 minutes of
  effort, stop, write what blocked you, and return STATUS: NEEDS_CONTEXT.

## Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/sc127-r1-verify-report.md`.
**Open with a ≤10-line executive summary**: VERDICT (bug confirmed in real Obsidian dark
theme: yes/no/partial), the white-below-the-fold answer, the contrast numbers, and the list
of PNG paths. Copy every evidence PNG into
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/r1/` with names like
`sc127-r1-statblock-dark-preview-on.png`, `sc127-r1-statblock-light-preview-on.png`,
`sc127-r1-statblock-dark-preview-off.png`, `sc127-r1-statblock-dark-pdf-export-p1.png`.
If the report-file write is blocked by your harness, return the report inline.

## Footguns

- Never key a wait-loop on a scratch filename or its contents — the scratch dir is
  pre-populated across sessions and branches; a stale log from another branch will match.
  Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream
  watchdog kills silent agents. Run the camera in the FOREGROUND with output redirected;
  do not background it and wait for a notification (that notification never comes).
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and
  `to: 'main'` routes to the top-level dispatcher, not me. If you need input mid-task, end
  your turn with `STATUS: NEEDS_CONTEXT` and the question in your report. If you ever do
  send a message anyway, its FIRST WORD must be `SC-127:`.
- `docs-shots.mjs` starts its own Xvfb; `obsidian-camera.mjs` refuses `--docs` on `:1`
  without an opt-out. Mirror the docs-shots approach for a private display.

## Return contract

Final text: VERDICT line; the white-below-fold answer; the contrast pairs (numbers); the
absolute path of the report and of every PNG; anything that blocked you. No prose beyond
that.
