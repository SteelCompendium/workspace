# SC-607 r4 — fix round (orchestration:implementer; resume of the r2 implementer, or a fresh one loading from files)

## Context loading
1. Ledger: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc607-open-preview-stale-card-write/decisions.md — read
   "Owner rulings on r3 (2026-11-12)" in full (binding) and "Baseline moves (cont.)".
2. Common gates/footguns (binding, updated for d0561a68): same dir, sc607-brief-common-gates-footguns.md
3. The r3 review: same dir, sc607-r3-review-report.md — findings F1-F7 (verbatim source of truth), its probe
   sc607-r3-probe.test.ts.txt (P2d/e/f move cells, P8, P9, P10, P11b, P19b), its mutants sc607-r3-mutate.py.txt /
   sc607-r3-run-mutants.sh.txt (N1-N18).
4. Your r2 report and proposal (sc607-r2-impl-report.md, sc607-dse-verify-proposal.md).
Worktree /home/scott/code/steelCompendium/worktrees/sc607-open-preview-stale-card-write; dse branch at 1daa7d8a (on 622b0904);
superproject at b3b94384. Workers never call the tracker.

## Setup
- `git -C <dse> fetch origin`; rebase the dse branch onto origin/develop — expected **d0561a68** (SC-580 + SC-583, conditions only;
  r3 found no file overlap) or later; report the sha. `npm ci` if package.json moved.
- `git -C <worktree> fetch origin`; rebase the superproject branch onto workspace origin/main (5d4611a3 or later); report the sha.
  NO dse pointer commit on the superproject branch (the dispatcher does one pointer bump at landing); leaving ` M draw-steel-elements`
  unstaged is expected.

## Task (rulings quoted from the ledger; the ledger text is authoritative)
- **F1:** "ACCEPT as a documented refusal; no code change. … Pin it in jest (move cells: hover and embed, heading and block link; to
  the end and below another section), name it in both CHANGELOGs and the proposal."
- **F2 / F3 / F4:** "DOCUMENT as residuals in the proposal (F2/F4 as residual writes that base also makes; F3 as a refusal). No code
  change."
- **F5:** "CHANGELOG headline no longer absolute (name the shapes it fixes; say rare timing races remain, as before); name the new
  refusals (F1 move, >400-line change with a twin, F3, R-Q2a adjacent block); delete the stale SC-594 "Known limit (SC-607 …)"
  sentence in both CHANGELOGs; proposal: add F1-F4, restate mutants from the r4 run (no stale M9 anchor / "M19 not constructible")."
  CHANGELOG paths: dse `/home/scott/code/steelCompendium/worktrees/sc607-open-preview-stale-card-write/draw-steel-elements/CHANGELOG.md`
  and superproject `/home/scott/code/steelCompendium/worktrees/sc607-open-preview-stale-card-write/CHANGELOG.md` — never the main
  checkout. Plain words, short sentences; the headline says what the user sees.
- **F6:** "add P19b (kills N6) and the F1 move cells (kill M19); add tests for N10 (end-of-text cache check) and N14
  (drawn-as-whole-note path); try to kill N11 (one map gives up, the other does not) and N7; classify N1, N2, N15 as equivalent /
  defence in depth with one line each."
- **F7:** "clear `drawnToken` / `drawnRead` on unload."
- **Redraw tests:** "re-model the 4 redraw tests (`reading-mode-host-hover-card.test.ts` J5 ~190, J17 ~553, ~335;
  `reading-mode-host-form-pin.test.ts` the 12 "+ (part redrawn after +)" cells) with `host.rebind`; keep N18 killed by at least one
  test that reaches the own-write-first branch through a state Obsidian produces, or record N18 as equivalent with the reason."
- Out of scope (filed): SC-612 (whole-note head-trim bias), SC-616 (G-S91 flake), SC-619 (CRLF hover refusal). Do not touch them. No
  product-code change beyond F7 — if a test you add exposes a different-counter write that base does not make, STOP and return
  NEEDS_CONTEXT with the reproduction.
- Re-run all mutants (your M1-M28 + r3's N1-N18) on the final code; report killed / survived with the reason for each survivor.
- Commit per coherent step; no pushes, no tags, no attribution lines.

## Gates (full battery on the rebased branch, per the common file)
tsc (incl. e2e) + lint clean · jest about 10759 passed / 2 skipped at base + your delta (fresh worktree count; say if warm) ·
lifecycle 61/61 in six parts (part 6 `G-S92 G-S96 G-S97 G-S99`, report each wall) · e2e `290/293 ok, 0 failed, 3 known-bug,
coverage: 172/172 pairs` · styles.css sha256 = a clean d0561a68 build (else STOP NEEDS_CONTEXT); if equal, shots/freeze/parity carry.

## Report
same dir, sc607-r4-fix-report.md (<=10-line executive summary first: dse sha + base; superproject sha + base; per-finding status
F1-F7 + redraw tests; jest; lifecycle per part + walls; e2e; styles verdict; mutants). Gate logs `sc607-r4-gate-*.log`. Private scratch:
/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc607-r4-impl/.
Final text: raw facts + every artifact path + `Drive-by fixes:` / `Follow-ups:`.
