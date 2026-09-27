# SC-317 decisions ledger — external-link icon on plugin links that leave the vault

Worktree: /home/scott/code/steelCompendium/worktrees/sc317-extlink-icon (dse branch `sc317-extlink-icon`)
Base: dse origin/develop 619c4bd (2026-09-25)

## Scott's rulings (verbatim, dated)

- 2026-09-14, on SC-202 (quoted in the SC-317 description): "I would like the external link icon".
- No comments on SC-317 itself as of 2026-09-25.

## Ticket scope (from the description, Scott-authored 2026-09-14)

> Scope: SCC links that resolve to steelcompendium.io (`rewriteSccAnchors` emits
> `class="external-link ds-scc-web"`, `target="_blank"`, `rel="noopener"`) and any other anchor
> leaving the vault. Decide the glyph (Obsidian's arrow, or a Steel-styled one), colour (must
> work with the teal-cyan link colour, dark and light), and spacing; add it to the round-4
> re-grounding block's `.external-link` companion rather than removing the re-grounding (the
> harness must keep matching the vault). Update the `perk/links` fixture and the inline
> host-leak sweep's expected values; the freeze baseline will move for fixtures with external
> links (sanctioned rebaseline).

## Owner decisions (2026-09-25, ticket-owner; provisional defaults for Scott's review)

- D1 Glyph: Obsidian's own external-link arrow SHAPE (same affordance as links in the note
  around the card), drawn by the plugin itself — not Obsidian's leaked background-image.
- D2 Colour: the glyph takes the link's own colour (`currentColor` via mask-image on a
  pseudo-element), so it follows teal-cyan in dark and light and follows hover colour.
  No `filter`.
- D3 Spacing: small gap between text and glyph, glyph ~0.75–0.85em, optically aligned to the
  x-height/cap line. Worker proposes exact numbers with crops.
- D4 Print: the icon is SCREEN-ONLY. Obsidian's own sheet strips the icon in print
  (`.print .external-link`), and the re-grounding block is already scoped
  `:not([data-dse-print="on"])`. Expected consequence: frozen print bytes should NOT move; if
  they do, that is a finding to report, not a rebaseline to ship silently.
- D5 The re-grounding stays: Obsidian's background-image/padding stay neutralised (GROUP 7);
  the plugin's own icon is added alongside it, so harness and vault still match.
- Scott reviews D1–D3 by eye (one consolidated Needs Review ask).

## Round 1 (implementer, dse 64e88eb, superproject docs 01ca911) — owner rulings on follow-ups (2026-09-25)

- F1 `.dse-ref-web-card__link` colour not re-grounded to `--dse-accent` → FILED as **SC-366**
  (Backlog, related to SC-317). Out of scope for SC-317 fix rounds.
- F2 orphan-wrap of the trailing `::after` icon ("glued, not airtight") → reviewer probes it in a
  narrow container and judges whether an airtight form exists (e.g. an inline, not inline-block,
  pseudo carrying U+2060 WORD JOINER with the glyph painted by mask over its padding box, which
  is how Obsidian's own background-image + padding form never orphans). If a working airtight
  form exists → FOLD into the fix round. If not → drop with reason.
- Owner eyeball of r1 crops: glyph (box with arrow), teal-cyan in both schemes, sits tight to
  the word. Crops are too tight for Scott (only "entry" visible, the underline is cut off) →
  fix round must produce wider crops showing the whole link phrase plus surrounding text.

## Round 1 review (reviewer, CHANGES_REQUIRED: 0 CRIT / 0 HIGH / 1 MED / 1 LOW / 4 INFO) — owner rulings (2026-09-25)

Report: sc317-r1-review-report.md.
- MED-1 (inline-block `::after` orphans: 16–46 of 401 widths; Obsidian's padding+background form: 0)
  → FOLD. Adopt the reviewer's **v4** (anchor `padding-inline-end` + `position: relative`,
  absolute pseudo at `inset-inline-end: 0`, same mask + currentColor) — it mirrors Obsidian's own
  geometry: 0 orphans in 7 texts × 401 widths × both schemes, 0 differing px at rest in the
  card-body font. Supersedes F2's WJ idea (~~WJ inline pseudo~~ superseded by v4: WJ fails on
  forced mid-word breaks). Fix the comment and test title that claim it cannot orphan.
- LOW-1 (sweep's `::after`/pseudo sample list too narrow; `opacity: 0` and `background-image`
  leaks pass green) → FOLD: widen sampled props, also sample in the hover pass; re-run the
  reviewer's live-hole probes, all three must go RED.
- INFO-1 (RTL not mirrored; Obsidian swaps to a mirrored SVG) → FOLD if it is a single
  `:dir(rtl)` rule (e.g. mirror the pseudo); otherwise drop (plugin has no RTL fixture).
- INFO-2 (survey missed `undoNotice.ts:51`, call still right) → FOLD into the report only.
- INFO-3 (ANCHOR assertion at test:168-175 tests a constant) → FOLD (make it assert the real
  rule). Extra-unscoped-rule gap → DROP: the freeze gate is the backstop for print leaks.
- INFO-4 (hover crops can't show tracking since hover colour = rest colour) → DROP hover crops
  from Scott's evidence; wider crops still required (ledger Round 1 note).

## Session note (2026-09-25, relayed by the dispatcher from Scott)
- Posting: owner runs on Opus 5.5, not Fable → every linear-post.py call uses `--model opus-5.5`.
  (No SC-317 comments posted before this note.)

## Fix round 1 (implementer, dse f9f5f3d, superproject 3bd5b90) — DONE_WITH_CONCERNS — owner rulings (2026-09-25)

- Implementer found that v4 (absolute pseudo in anchor padding) draws the glyph over UNRELATED
  text when the link wraps across lines next to another link (the containing block of a
  multi-line relative inline is the union of its fragments). Shipped instead: in-flow
  `display: inline` `::after`, `content: '\2060'` (WORD JOINER), sized by its own
  padding-inline-end, glyph by mask over that padding, currentColor. RTL via swapped mask-image.
  (~~MED-1 adopt v4~~ superseded by this — v4 is wrong on real multi-link prose.)
- Owner ruling: ACCEPT the WJ inline form, subject to the scoped re-review confirming (a) the v4
  defect is real, (b) the WJ form never paints over other text and has 0 orphans on ordinary
  prose. The residual (icon can start a new line only under a forced mid-word break of an
  unbreakable run wider than the line, e.g. a bare URL) → DROP: rare in plugin content, and
  the glyph only starts the next line, it never overlaps text. Mentioned to Scott in one line.

## Re-review round 2 (reviewer, APPROVE_WITH_NITS on f9f5f3d) — owner rulings (2026-09-25)

Report: sc317-r2-rereview-report.md. v4 defect confirmed real (glyph over other text in 7/9
texts). WJ form: 0 overlap, 0 orphans on ordinary prose; residual only on forced mid-word breaks
(URL 6.2%, web-card 4.0%) — accepted (see prior ruling). No better form found (v5 overflows the
container at forced breaks; mk kills the focus ring).
- N1 (CSS comment misstates v4 mechanism) → FOLD: reword to the measured mechanism.
- N2 (sweep comment claims focus-visible glyph coverage it does not compare) → FOLD: add the
  comparison loop in the focus-visible pass (preferred), prove with a focus-only live-hole probe.
- N3 (redundant `glyph![0]` `:not(...)` assertion) → FOLD: drop or replace with an independent check.
- Crops: r2 crops clip the second line's underline → FOLD: recrop with more room below.

## Round 3 re-review (APPROVE on dse 2897cc5 / superproject ef62d70) — 2026-09-25
- N3 INFO (duplicate check matches only the `:where(a)` spelling) → DROP: the freeze gate catches a
  print leak from any spelling.
- Review pipeline complete. Freeze 260/260 unchanged → no rebaseline, no sanction ask.
- Open Scott ask: the visual (glyph / colour / spacing). Posted as the consolidated Needs Review ask.

## Scott ruling — 2026-09-27 (comment 05ea5845, on the visual ask c0366c46)
> looks good

- Glyph / colour / spacing as shipped at dse 2897cc5 are APPROVED. No further design round.
- Next: rebase onto current origin/develop (825ea51 or later; SC-338 landing on top), full battery,
  scoped re-review of any conflict resolution, then LAND-READY.

## Pre-landing rebase (2026-09-27) — LAND-READY
- dse 5a20d5f on develop afd6ae3 (0 conflicts; SC-317 hunks byte-identical to 2897cc5);
  superproject ad78b5b on main aeb08bc (CHANGELOG.md conflict: both Unreleased bullets kept;
  pointer = 5a20d5f). Owner verified ancestry, clean trees, pointer, CHANGELOG diff.
- Battery: tsc/lint clean; jest 4118/1 skipped/211 of 212 (base 4112 + 6); lifecycle 19/19;
  shots 532/0 FAIL, inline host-leak OK 1132; freeze 260/260; parity 0/0/16.
- r4 crops pixel-identical to the r2 crops Scott approved. No scoped re-review: no dse conflict
  hunks to review; superproject conflict was docs-only and owner-checked.
