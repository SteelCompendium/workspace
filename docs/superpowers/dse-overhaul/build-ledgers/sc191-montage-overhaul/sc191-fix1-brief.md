# SC-191 fix round 1 — review-1 findings on slices 1–2

You are the `orchestration:implementer` that built slice 2 (or a fresh replacement). Your
final text goes to the SC-191 ticket-owner (an agent), not a human: raw facts, no prose.
**You never call the tracker (Linear).** You cannot message the ticket-owner; if you need
input, end your turn with `STATUS: NEEDS_CONTEXT` and the question at the top of your
report. If you ever do send a message anyway, its FIRST WORD must be `SC-191:`.

## 1. Context

- Ledger (rulings verbatim; struck-through = superseded; the section "Owner rulings on
  deferred findings" at the end lists exactly which review findings are folded here and
  which are dropped):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-decisions.md`
- Spec: `sc191-impl-spec.md` (same dir). Review: **`sc191-review1-report.md`, lines 22–425
  are the findings — read every folded finding IN FULL there** (file:line, failure
  scenario, prescribed fix). The list below is the verdict summary, not a substitute.
- Worktree (verify `pwd`; never write under `/home/scott/code/steelCompendium/workspace/`):
  `/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/draw-steel-elements`,
  branch `sc191-montage-overhaul` @ `b2f696e`, base `origin/develop` `69eb5f7`. Run
  `git fetch origin develop` inside the clone first; if the tip moved, rebase and report the
  new base (`npm ci` if `package.json`'s obsidian version changed).
- Workspace-level files live ONLY in the worktree superproject
  `/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/<file>`.

## 2. Findings to fix — reviewer's summary, verbatim (full text in the report)

> - HIGH H-1 `src/elements/montage/model.ts:136-137` — `exhausted &&` makes `partial` unreachable while live. Fix: `if (m.successes - m.failures >= 2) return 'partial';`. Guard is PRE-EXISTING (`69eb5f7`). Mock authority: `visual-harness/sc191/mock6.js:632-635` (no exhausted gate) + approved `sc191-r5-tracks-mid-dark.png` = "Partial Success". Tests pinning the bug: `test/dom/elements/montage.test.ts:284-289`, `test/unit/model/montage-serialize.test.ts:138`. **Freeze-neutral** (default fixture is 0/0 → pending; `rebaseline.txt` hashes stay valid).
> - HIGH H-2 `styles-source.css:3615` + `:3633` (specificity 0,3,0) beat `styles-source.css:13105` `[data-dse-print="on"] .dse-btn{display:none}` (0,2,0); `:3847`/`:4309` leave `.dse-mt__track-slot` inkless in print. Measured print: cell `display:flex opacity:0.5 border:1px solid rgb(204,204,204) bg:rgb(255,255,255)`; addhero `display:flex opacity:0.5 44×44`; track-slot `border:0px none, background transparent`. Fix = explicit `[data-dse-print="on"][data-dse-element="montage"]` block. **Rebaseline hashes will change after this fix — do not send the sanction ask first.**
> - MED M-1 `src/elements/montage/BoardView.ts:166-168,87-92,126-131` — cells are `.dse-btn` (border 1px, radius 5.44px, sheen gradient, drop shadow, `opacity:0.5`); mock board is flat; contradicts ledger 2026-08-26; spec §D maps the cell to `role="button" tabindex="0"`, not `.dse-btn`.
> - MED M-2 `styles-source.css:4082` beats `:4187` — light scheme loses the current-round wash. Measured: dark current `rgba(77,184,199,.07)` vs past `rgba(255,255,255,.016)` (distinguishable); light current == past == `rgba(0,0,0,0.01)`.
> - MED M-3 `styles-source.css:4188` — `rgba(77,184,199,0.07)` is `--dse-accent` DARK (`:5450` #4db8c7); Steel light is #2a7b88 (`:12000`). No token, no light twin, no citation. Gold literal at `:4393` is correct (`--dse-vp` light/dark stable) but uncited.
> - MED M-4 `src/elements/montage/BoardView.ts:60` `role="table"` with 0 `role="row"` (measured histogram `{"<div>":15,"<button>":15}`); `:201-206` tally reads "20".
> - MED M-5 `test/dom/elements/montage.test.ts:308-320` asserts slot COUNTS in jsdom, not widths — the equal-width ruling is ungated. Measured today (Playwright 900px): mid 413.13/413.13 px, slots 68.78 vs 138.37 (2.01×, spec §G estimated 2.2×); failed 371.86/371.86; old-shape 413.13/413.13; narrow-300 202.81/202.81.
> - LOW L-1 vacuous limits → 0 slots + "Total Success reached"/"the limit is reached" under "Not started" (`model.ts:205-229`, `OutcomeBandView.ts:107-111`).
> - LOW L-2 `model.ts:72-90` malformed entry dropped silently, note lost; probed 0 notes rendered from `result: sucess`.
> - LOW L-3 `model.ts:102` `participants: []` serialises as `[]` (§B.5 forbids); `entries: []` correctly omits.
> - LOW L-4 `OutcomeBandView.ts:129` alphabetical tie-break vs mock6.js:639-643 roster order.
> - LOW L-6 `BoardView.ts:219` `.find` vs `:140-141` count — duplicate hero+round invisible but tallied.
> - INFO I-5 no widening file for 10 new lines, 0 collisions
> - INFO I-8 complete-band rule line prints the Victory sentence on a Total Failure — faithful to mock6.js:1011

Owner notes on three of them:
- **L-2:** a malformed entry must never be silently dropped from the user's note on
  write-back. Preserve it through parse→serialize untouched (spec §B.5 round-trip identity);
  render it as `none` with its note still listed. Add the test.
- **L-6:** the board and the per-hero tally must use ONE shared selector for "the entry for
  hero H in round R" (first match); a duplicate is neither shown nor counted twice. Add the test.
- **I-5:** produce `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/widening.txt`
  — the 10 NEW montage print lines (`montage-{done,failed,mid,narrow,old-shape}--steel-{print,realprint}.png`),
  `<sha256>  <filename>` format, from the FINAL tree after every fix, verified identical
  across two shot runs. Additions-only; never edit the baseline itself.
- **I-8:** the complete band's rule line states the outcome that actually happened.

Explicitly OUT of scope (ruled dropped in the ledger — do not touch): L-5, I-1, I-2, I-3,
I-4, I-6, I-7. Slice 3 (strip/guide/badge/pip) and slice 4 (menu/sheet/notes/docs) are not
this round.

Scott's rulings that the folded findings enforce, verbatim from the ledger:
> "In all cases, the "add a hero" row is a waste of space.  That button should be moved to
> the top-left "Heroes" header cell as a little "plus" button or something." (2026-08-26)
> "the `merged` design looks great.  I want to tweak the two tracks so they are the same
> horizontal width" (2026-08-29)
> "i dont really want to go back-and-forth again.  Im ready  to get this ticket finished"
> (2026-08-30) — fix what is listed; do not redesign.

## 3. Tests

Every folded finding that is behavior gets a test that is shown red before the fix (say so
in the report with the failing assertion): H-1 boundary cases (successes == failures,
+1, +2, at final round with and without actions left; failure limit; success limit), M-5
(a real-width gate — Playwright measurement in the harness or a computed-style test, not a
slot count), L-1, L-2, L-3, L-4, L-6, I-8. M-4's a11y structure gets a DOM assertion.

## 4. Gates — the full `dse-verify` battery, in order, on the final tree

Skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
Expected: tsc/lint clean; jest ≥ 3559 passed / 1 skipped plus your new tests; shots 498
PNGs (no new capture ids this round), 0 FAIL, byte-identical across two runs; freeze:
exactly the 2 montage print lines mismatch (they will now carry NEW hashes because of
H-2/M-1) and 0 others; parity 0 GAPs / 0 undeclared / 16 declared.

**Regenerate the freeze package from the final tree:** overwrite
`.superpowers/sdd/sc191-montage-overhaul/rebaseline.txt` (2 lines) and the four crops
`sc191-freeze-montage--steel-{print,realprint}-{before,after}.png` ("before" = baseline
bytes, unchanged; "after" = final-tree bytes), plus `widening.txt` (I-5). The "after" print
crop must show NO bordered white boxes, NO half-opacity cells, and inked limit tracks —
look at it before you report.

Run gates via wrapper script files or with output redirected to files under a per-run
unique dir in
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/`
— never piped; read the tools' own summary lines.

## 5. Commit

One commit on `sc191-montage-overhaul`: `SC-191 fix 1 — review-1 findings (outcome
rule, print, flat cells, tokens, a11y, width gate)`. No push, no tags, no co-author
trailers, superproject pointer untouched. ⛔ Never tag/release dse. Never edit the freeze
baseline.

## 6. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-fix1-report.md`,
≤10-line executive summary first, then per finding: what changed (file:line), the test and
its red-then-green proof; measured gate numbers; the new freeze FAIL lines + the
regenerated `rebaseline.txt` / `widening.txt` / crop paths; `Drive-by fixes:` and
`Follow-ups:` lists; every artifact path. If the report-file write is blocked, return it
inline.

## 7. Footguns

Devbox wrapper (`devbox run -- bash -c 'cd <clone> && <cmd>'`; `sh` eats `$?`); redirect
long output to files; **never background a gate and wait for a notification**; never key a
wait-loop on a scratch filename/contents; stale superproject pin → compare
`D3-token-map.md` copies before believing a token-coverage red.

## 8. Return contract

`STATUS: DONE | NEEDS_CONTEXT | BLOCKED`, base sha, commit sha, report path, executive
summary verbatim, per-gate numbers, the 2 freeze FAIL lines with new hashes, paths of
`rebaseline.txt`, `widening.txt`, the four crops, and every log. No prose beyond that.
