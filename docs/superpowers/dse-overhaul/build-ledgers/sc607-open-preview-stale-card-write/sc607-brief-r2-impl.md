# SC-607 r2 — implementation (orchestration:implementer)

## Context loading (read first)
1. Ledger (rulings BINDING, quoted there verbatim): /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc607-open-preview-stale-card-write/decisions.md
   — read "2026-11-12, owner rulings on r1 open questions" (R-Q1 … R-Q6, Follow-ups) and "Baseline moves" in full.
2. Common gates/footguns (binding): /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc607-open-preview-stale-card-write/sc607-brief-common-gates-footguns.md
3. The r1 design report (your spec), same dir: sc607-r1-design-report.md — §C (the rule, its pieces, named shapes N1-N7, the two
   jest flips), §D. Starting point: the probe diff sc607-r1-probe-rule.diff.txt (written against c6077860; 304 lines,
   `ReadingModeBlockHost.ts` + `lineMap.ts`), the jest probe sc607-r1-probe.test.ts.txt (768-cell sweep + N1-N7), the mutation runner
   sc607-r1-mutate.py.txt / sc607-r1-run-mutants.sh.txt (M1-M13), and the real-Obsidian scratch scenario
   sc607-r1-probe-lifecycle-scenario.mjs.txt + sc607-r1-make-scratch.py.txt (G-S99's starting point). Do NOT use option 1's diff.
4. dse-verify SKILL (/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md; ~375 KB, read in parts, never
   whole): "Block edit form Save and embeds (SC-556)" (~336-450) incl. "Hover card writes (SC-594)" and "Known limit (SC-607)";
   "Lifecycle and e2e notes" (~177); the lifecycle authoring notes; the CURRENT block (~1452).
Workers never call the tracker.

## Setup
Worktree /home/scott/code/steelCompendium/worktrees/sc607-open-preview-stale-card-write; dse branch `sc607-open-preview-stale-card-write`
(at c6077860, no commits). FIRST:
- `git -C <dse> fetch origin` and rebase the dse branch onto origin/develop — expected **622b0904** (after SC-609; SC-601 before it added (SC-601: new `src/framework/kit/hoverPreviewGuard.ts`, `DseModal.keepHoverPreviewAlive`, G-S97) or later;
  report the sha. `npm ci` (fresh worktree; and again if the obsidian version moved).
- `git -C <worktree> fetch origin` and rebase the superproject branch onto workspace origin/main; report the sha. (Two recent
  branches were cut before a landing and had to be re-applied — the dispatcher requires this.)

## Task — implement the adopted rule (ledger R-Q1 … R-Q6, quoted; the ledger text is authoritative)
- **R-Q1 option 2:** "a part-of-note pin (embed or hover; card write AND form) is placed through the link on the note as it is now,
  and accepted only when the drawn-from block (mount snapshot or this host's own last write, the newer first) maps STRICTLY
  (head-first and tail-first `mapLine` agree) to that same line; such pins are strict at write time too (`pinnedTarget`)."
- **R-Q2a/b/d accept** the saved->refused classes; "Re-model jest flip 1 … the adjacent case expects refused, keep a NON-adjacent
  addition that still saves."
- **R-Q2c fallback:** "when either strict map gives up (returns "too many edits", not "deleted"/"disagree"), place by the link as base
  does ONLY IF the known body occurs exactly once in the drawn-from text AND exactly once in the note now; otherwise refuse. jest flip 2
  … must keep saving (re-model it with `host.rebind` where it models a redraw), and add a control: same >400-line change with the body
  twice -> refused." The line-map API must distinguish "gave up" from "deleted" — if it does not today, add that, without changing
  any whole-note caller's behaviour.
- **R-Q3 hover-window guard:** "at click/Save in a hover preview, when `hoverPopover.embed.data` is a string, require the snapshot text
  to equal it, else refuse; when it is not a string (internal API absent), skip the check (never refuse on its absence). jest model
  required for both branches." Keep the access untyped-safe and in one helper (where the plugin already reads the hover-link event's
  popover).
- **R-Q4** one `cachedRead` per card mount accepted; **R-Q6** keep the strict-miss no-fallback (M8).
- **Whole-note pins and plain non-embedded forms/cards must not change behaviour** (the r1 full-jest run had no such flip; keep it so).
  The whole-note head-trim bias is **SC-612, OUT OF SCOPE** — do not touch it.
- **Folded follow-up:** jest models of a redraw that set `sec.current = …` without `host.rebind` — re-model with `rebind` in the tests
  you touch.
- **Tests:** the r1 sweep as a committed `test.each` (assert outcome AND Notice kind per cell; never a different counter), N1-N7, the
  R-Q2c pair, the R-Q3 pair, the two re-modelled flips. Show red on base: run the new tests against the rebased base (622b0904 or later) code before
  the fix commit, save `sc607-r2-jest-red-on-base.log`. Test titles: never a bracketed ticket id.
- **Lifecycle G-S99** (ledger R-Q5): cells (a) heading hover RV + LP, (b) RV, (c) embed (a) RV, (d) block hover swap RV, (e2)
  block-hover form with a second pane, (e3) form after the swap; one no-edit control that saves; one note per cell. Green = nothing
  written, exactly one "changed on disk first" Notice, the outside edit kept (control: the + saves, no Notice). SCENARIOS order after
  G-S97 (was G-S96 before SC-601), before G-S56; runs in part 6 `G-S92 G-S96 G-S97 G-S99` if the wall stays <= ~380 s, else alone as part 7 — report the wall time(s). RED ON BASE required:
  G-S99 against a base (622b0904 or later) bundle, save `sc607-r2-lifecycle-gs99-on-base.log`; name any cell green on base.
- **Mutation-check** the r1 set M1-M13 re-targeted at your code plus mutants for the R-Q2c fallback (e.g. drop the uniqueness check,
  check only one text) and the R-Q3 guard (refuse on absence; skip when unequal). Report killed/survived and why.
- **Docs in YOUR worktree only** (never the main checkout):
  - dse `CHANGELOG.md` (`/home/scott/code/steelCompendium/worktrees/sc607-open-preview-stale-card-write/draw-steel-elements/CHANGELOG.md`)
    and the superproject `CHANGELOG.md` (`/home/scott/code/steelCompendium/worktrees/sc607-open-preview-stale-card-write/CHANGELOG.md`),
    each a bullet under Unreleased in the style of the SC-594 / SC-596 entries there: plain words — a + / - or a form Save in a hover
    preview or embed that stayed open while the note changed no longer writes a different, identical counter; it is saved into the
    counter the preview shows, or refused with the "changed on disk first" Notice. Name the rare new refusals in one sentence.
  - A dse-verify proposal file (NOT the SKILL): `sc607-dse-verify-proposal.md` in the ledger dir — replacement text for "Known limit
    (SC-607)" (it becomes the rule + residuals), the "Embeds of part of a note" / "Hover card writes" / "The 17-44 ms window" /
    "Still refused" bullets where they change, the "Two identical blocks" bullet pointer to SC-612, the lifecycle part list (part 6
    `G-S92 G-S96 G-S97 G-S99` or part 7, 61 scenarios), and a CURRENT block draft with your measured numbers.
- Commit after every coherent step (tests-red, fix, re-modelled tests, G-S99, docs). No pushes, no tags.

## Gates
Full battery per the common file, on the rebased branch: tsc (incl. e2e) + lint clean; jest 10715 passed / 2 skipped + your delta;
lifecycle 61/61 in six parts (part 6 `G-S92 G-S96 G-S97 G-S99`, or G-S99 alone as part 7 if part 6 would exceed ~380 s); e2e `280/284 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`;
styles.css sha256 equal to a clean 622b0904 build (else STOP NEEDS_CONTEXT). Since the rule adds a `cachedRead` per card mount, ALSO
run shots once and report shots 592 / host-leak 163/978 / modal host-leak 39/234 / capture clip 147 and freeze 280/280 (private
DSE_CAMERA_TMP in your scratch folder); parity carries if styles.css is unchanged.

## Report
/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc607-open-preview-stale-card-write/sc607-r2-impl-report.md (<=10-line
executive summary first: dse branch sha + base sha; superproject sha; jest numbers; lifecycle per part + wall; e2e line; styles sha
verdict; shots/freeze; red-on-base results; mutants). Gate logs `sc607-r2-gate-*.log`. Private scratch:
/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc607-r2-impl/.
Final text: raw facts + every artifact path + `Drive-by fixes:` / `Follow-ups:`.
