# SC-191 review 2 — final independent review: slices 3–4 + whole-element integrity in a real vault

You are a FRESH `orchestration:reviewer`. You did not write the spec, the code, or review 1.
Cold eyes are the point. Final text goes to the SC-191 ticket-owner (an agent): raw facts,
no prose. **Never call the tracker (Linear).** You cannot message the ticket-owner; if you
need input, end with `STATUS: NEEDS_CONTEXT` and the question at the top of your report. A
stray message's FIRST WORD must be `SC-191:`.

## 1. Context (in order)

1. Ledger — Scott's rulings verbatim, struck-through = superseded; the closing "Owner
   rulings" section lists findings already dropped by ruling (do not re-raise them):
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-decisions.md`
2. Spec `sc191-impl-spec.md` (all sections; §C, §D, §F, §G, §H, §I slices 3–4, §J).
3. Reports: `sc191-review1-report.md` + `sc191-rereview1-report.md` (slices 1–2 are
   reviewed and cleared — do NOT redo that pass; re-check only what slices 3–4 could have
   broken), `sc191-slice3-report.md`, `sc191-slice4-report.md`, `sc191-fix2-report.md`. Every claim is a claim to
   verify.
4. Worktree (verify `pwd`; write nothing under `workspace/`):
   `/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/draw-steel-elements`,
   branch `sc191-montage-overhaul` @ `8cd9d30`, base `origin/develop` `69eb5f7`.
   Review diff: `git diff 7d4451a..8cd9d30 -- src test visual-harness docs styles-source.css`
   (exclude `visual-harness/sc191/` mocks). Also skim the whole-element diff
   `git diff 69eb5f7..8cd9d30 -- src/elements/montage` once for coherence.
5. Approved look: ledger-dir PNGs `sc191-r7-pip-gold-{dark,light,grey-dark}.png`,
   `sc191-r6-pip-narrow-dark.png`, `sc191-r5-sheet-log-{dark,light}.png`,
   `sc191-r5-sheet-edit-dark.png`, `sc191-r5-menu-dark.png`, `sc191-r5-guide-open-dark.png`.
6. Gate skill `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`;
   the clone's `CLAUDE.md`; `docs/superpowers/sc169-element-menu-panel-spec.md`.

## 2. Task — execute and probe

Findings by severity (HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario, prescribed fix.

**Slice 3 — strip + guide.**
- Badge: measure the strip's `.dse-pr__badge` box and padding in the harness and a shipped
  Power Roll row in the same run; spec §J1 says 51.25 × 22.14 px, padding `4.608px 4.032px`,
  identical. Cite numbers.
- Pip (§J2): gold fill `--dse-vp`, `--dse-sheen-soft`, 1 px `--dse-metal-line` rim; ▲ reward /
  ▼ consequence; the words still present in every cell; print ink `#8a6a00`; greyscale
  capture legible (state what distinguishes reward from consequence with color removed).
- Collapsible ×2 with session persistence: open the guide, re-render, still open; pin the
  strip, re-render, still pinned; the two states are independent; nothing about them is
  written into the user's note (0 vault writes from toggling — prove it).
- Pinned-stub dedup: with the strip pinned, the foot panel's "Each test" block stands down
  and only a pointer remains (ledger 2026-08-29 / round-5 behavior).
- 300 px: no horizontal scroll inside the card; strip stacks per the mock.
- Carry-over tests (L-3 `participants: []` omission; L-4 roster-vs-alphabetical note sort)
  exist and can fail.

**Slice 4 — controls, sheet, notes, docs.**
- **Fix-2 items (ledger 2026-09-03 ruling supersedes spec §D's five-item ⋯ list):** the
  bottom bar carries `Undo`, `End round N`, `Log an action…`; `End round N` is the ONLY
  round-advance control — probe that logging actions never advances `current_round`, that
  End round increments it and writes once, that ending the final round resolves the
  outcome band, and that Undo removes the most recently logged entry and restores tallies.
  When complete, the bar stands down to `Reopen` + danger `Clear all`; report what Reopen
  does in each end case. The ⋯ carries exactly four items: add a round / add a hero /
  set limits… / Reset progress — `Clear all` must NOT be in the ⋯. Read
  `sc191-fix2-report.md` for what was built and verify it against
  `visual-harness/sc191/mock6.js` ~1415–1470.
- ⋯ menu = SC-169 chrome items (mirror the spec fully; no hand-rolled menu left);
  "add a round" lives there (ledger: the "+" lane was removed).
- Sheet (`openManagedModal` per spec §D): new and correct-existing flows; tier hint; the
  skill-reuse warning; Note field; the roll affordance. Button label is `Log an action…`
  (ledger 2026-08-29). Keyboard: open, tab through, Escape closes without writing.
- Per-cell edit + note: the note mark in the cell's top-right; the band's notes list shows
  the note text; editing an outcome updates tallies (stored scalars per §B.3) and the band.
- **Integrity probes in a REAL vault flow** (spec §C, all eight) — use the repo's real host
  path (ReadingModeBlockHost + a vault fake or the harness's vault fixture), not a unit stub:
  (1) content above/below the block survives every write; (2) two montage blocks in one
  note don't cross-talk after edits in both; (3) a hand-edited YAML value survives a
  re-trigger and a subsequent write; (4) a user-deleted block regenerates cleanly; (5) an
  old-shape block edited through the UI writes the new shape with nothing lost (title,
  limits, participants, skills_used, `_dse_anchor`, comments if any); (6) rapid repeated
  edits coalesce to one write; (7) read-only (`data-dse-readonly`): every montage control is
  disabled/badged, zero writes; (8) whatever §C names as the eighth. PASS/FAIL each with
  the probe script path.
- Docs (§H): the user docs describe the element as shipped, in plain language; any
  deferred behavior is stated per Scott's rule ("Anything we are delaying … needs to get
  clearly documented in the site documentation"); the dse changelog entry exists per the
  clone's `CLAUDE.md`; the workspace `CHANGELOG.md` `## Unreleased` bullet exists ONLY in the
  worktree superproject `/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/CHANGELOG.md`.
- Freeze package regenerated from the FINAL tree: `rebaseline.txt` (2 lines) and
  `widening.txt` (10 + any slice-3/4 print lines) hashes == your own two shot runs; the
  four crops + any new ones; **view the after-print crop and describe it**.

**Whole element.** Every color a token (D3-token-map; compare worktree vs main-checkout
copy if the pin is stale); dark, light, print; no bright white (ledger 2026-08-26); no
crests; hue never the only channel (Scott is colorblind — say what shape/word carries each
state). Compare each new capture against the approved PNGs and list every visible
difference with whether spec/ledger sanctions it. a11y: every control labelled, reachable,
`role` structure sane (review-1 M-4 fix still intact).

**Host-copy pin (machine condition).** Obsidian self-updated to 1.14.0 on this machine; the
SC-205 host-copy pin (`PINNED_OBSIDIAN = '1.13.7'`) aborts `npm run shots` with
`HOST COPY DRIFTED` at its FINAL in-run assertion — strictly AFTER every PNG is written. The
pin bump is SC-202's and has NOT yet landed on `origin/develop` (still `69eb5f7`), so this
branch is deliberately not rebased onto it. Consequences for you: shots byte-identity across
two runs, `check-freeze.sh`, and `npm run parity` (never calls the pin) are all real; the
button host-leak sweep behind the abort is NOT run — record it as "owed to the post-SC-202
re-gate", not as a finding. Devbox swallows `$?` even inside `bash -c`: run exit-code-
sensitive steps via plain bash/node with output to files (see `sc191-slice3-report.md` "The
host-pin condition"). Never touch the pin, host-copy listings, `obsidian-host-pin.mjs`,
`shoot.mjs`'s host model, or the asar. Slice reports 3 and 4 list which in-run assertions
printed OK before the abort — verify the same set prints OK in your runs.

**Battery** on the final tree, in order, output to files: tsc/lint clean; jest ≥ the
slice-4 report's number; shots 508 PNGs 0 FAIL byte-identical ×2; freeze: exactly the
2 montage print lines mismatch, 0 others; parity 0 GAPs / 0 undeclared / 16 declared (or the
declared set the slice-4 report documents — any change to the declared set is a finding).

## 3. Bounds

Fix nothing; temporary breakage reverted; `git status --short` clean at the end. Do not
re-review slices 1–2 beyond regression checks. Do not re-open ledger-settled design.

## 4. Report + return

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-review2-report.md`,
≤10-line executive summary first with verdict **LAND-READY / FIX-ROUND** and HIGH+MEDIUM
counts; findings by severity; probe results table; battery numbers; after-crop description;
artifact paths (scripts/logs under a per-run unique dir in
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/`).
Return: `STATUS`, verdict, counts, report path, executive summary verbatim, freeze result,
battery numbers, probe table, artifact paths, `git status --short`. If the report write is
blocked, return it inline.

## 5. Footguns

Devbox wrapper; `sh` eats `$?`; never pipe a gate; redirect long output to files; never
background a gate and wait for a notification; no scratch-filename wait loops; never edit
the freeze baseline; ⛔ never tag/release dse; stale superproject pin diagnosis for
`token-coverage`.
