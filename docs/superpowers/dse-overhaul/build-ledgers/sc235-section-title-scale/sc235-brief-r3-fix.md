# SC-235 round 3 — fix round (implementer, author of round 1)

Your final text goes to the ticket-owner, not a human. **Workers never call the tracker.**

## 0. Context

- Ledger `decisions.md` (this dir) — read "Round 2 result" and "Owner rulings, round 2"; they
  are your spec. Review report: `sc235-r2-review-report.md` (findings with file:line; glyph
  probe section 5; its scripts/logs in `r2-review/`, reuse them — copy, don't edit).
- Worktree `/home/scott/code/steelCompendium/worktrees/sc235-section-title-scale`, DSE branch
  `sc235-section-title-scale` head `43b76cc` on `origin/develop` `825ea51`. `git fetch origin`
  in the DSE clone first; if develop moved, rebase and say so. Superproject branch: rebase onto
  `origin/main` (`601b44a` or later) — fetch inside the worktree superproject.
- Verify `pwd` before every write. Workspace-level files (CHANGELOG.md) are in YOUR worktree
  superproject, never under `/home/scott/code/steelCompendium/workspace/` (only your ledger-dir
  files go there). No DSE `main`, no tags, no `just deploy*`, never touch the shared freeze
  baseline, never `rm -rf` under `.superpowers/` beyond your own `sc235-*` files.
- Commit after every coherent step.

## 1. Fixes (owner rulings, quoted from the ledger)

> - HIGH-1 -> FIX: every claim says the COMPUTED values match the site and the letters render
>   about 2px (25%) taller because the site fakes its small caps; never "matches the site's size".

Files: `draw-steel-elements/CHANGELOG.md` (~25-30), superproject `CHANGELOG.md` (~11-17),
`styles-source.css` (~8178, ~8180), `visual-harness/parity/README.md` (~542), plus any other
place your round-1 commits made the claim (grep). Keep the CHANGELOG bullets short and plain.

> - MED-1 -> FIX by pinning: the spend chip (`.dse-section--spend .dse-section__title`) keeps
>   TODAY's 16px / 0.07em under A (it is a different site element, `.sc-ability__enh .cost`,
>   out of this ticket's scope).

Pin it with the same `--dse-fs-body`-derived form (x1 / 0.07em) in the spend rule (~9332),
with a one-line comment. Prove the chip's computed font-size/letter-spacing and its box width
equal base `825ea51` (the reviewer measured 333px at base).

> - LOW-1 -> FOLD (one comment line explaining `--dse-fs-body * k` vs `--dse-fs-subheading`).

## 2. Evidence rebuild (MED-2), in `r3-evidence/`

Scott is colorblind — every label is text; never let colour carry meaning.

1. `sc235-compare-wide.png`: rows = feature/ability, statblock (nested feature), kit (signature
   ability). Drop the synthetic featureblock row. Columns, labelled in text at the top:
   **Today (16px)** | **A: this branch (18px)** | **B: probe (15px, 1.8px spacing)** | **Site**.
   B is a probe: inject `font-size: calc(var(--dse-fs-body) * 0.9375); letter-spacing: 0.12em`
   on `.dse-section__title` (not the spend chip) at capture time. **Verify at capture time,
   by computed style, that each cell has the size it claims** (Today 16, A 18, B 15, site 18)
   — a probe that silently doesn't apply was the reason SC-232's evidence was rejected twice.
   1 image px = 1 CSS px in every cell; crop, never rescale. Caption under each cell in plain
   words: "letters 9px tall" (the measured rendered ink height of the small caps, with the
   reviewer's pixel-scan method).
2. `sc235-glyph-zoom.png`: the word "EFFECT" from the same feature card in four rows — Site,
   Today, A, B — enlarged 6x nearest-neighbour (the reviewer's `r2-review/glyph-options-6x.png`
   is the model; drop its weight-400 probe row). Plain labels, e.g.
   "Site: letters 8px tall, word 55px wide" / "Today (16px): letters 9px tall, word 60px wide".
   Say in the image title that 6x enlargement is applied.
3. `sc235-compare-narrow.png`: keep round 1's content (300px, Today vs A), rebuilt on the
   current head, and add a 240px row showing the statblock "(2 Malice)" wrap (reviewer LOW-2).

View all three images yourself and confirm they show what the captions claim.

## 3. Gates (dse-verify, in order, foreground, output to per-run files in `r3-evidence/`)

Expected at the final head: tsc/lint clean; jest 4115 total (4114 passed / 1 skipped) plus any
test you add; lifecycle 19/19; shots 532 / 0 FAIL; freeze 260/260; parity 0 GAPs / 0 undeclared
/ 10 DECLARED / exit 0.

## 4. Process rules (non-negotiable)

- Devbox: `devbox run -- bash -c 'cd <abs path> && <cmd>' > <log> 2>&1; echo rc=$?`; never
  pipe a gate into `tail`. Redirect long output to files — the 600s stream watchdog kills
  silent agents.
- Run every gate in the foreground. Never background a gate or wait on a `Monitor`.
- Never key a wait-loop on a scratch filename or its contents (stale logs from other branches
  match); per-run unique paths.
- **Never `pkill`/`killall` by pattern.** Kill only by PID whose command line contains
  `worktrees/sc235-section-title-scale/`.
- You cannot `SendMessage` me; end with `STATUS: NEEDS_CONTEXT` + the question. If you ever
  message anyway, first word `SC-235:`.
- If the report-file write is blocked, return the report inline.

## 5. Report

`sc235-r3-fix-report.md` in this dir, ≤10-line executive summary first (STATUS, dse head sha,
superproject sha, gate numbers, per-finding done/not-done). Body: the per-cell computed-size
verification table, the letter-height/word-width table (Site/Today/A/B), the spend-chip
before/after table, the narrow table. Final text: raw facts + absolute paths of every artifact.
