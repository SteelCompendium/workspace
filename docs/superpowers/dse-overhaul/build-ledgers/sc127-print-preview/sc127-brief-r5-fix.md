# SC-127 round 5 — fix round for the round-4 review findings

You are the SC-127 implementer (resumed). Same worktree, branch, skills, devbox wrapping,
gate discipline (FOREGROUND only, output redirected to per-run files, `sc127-r5-` prefix)
and footguns as `sc127-brief-r3-impl.md`. Workers never call the tracker. No co-author/AI
trailers. Commit after every coherent step.

Read first: the ledger `sc127-decisions.md` (the 2026-09-24 round-4 rulings entry — those
rulings are your scope; nothing else), then the review report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/sc127-r4-review-report.md`
(exec summary + each finding's section; its evidence is under `.../sc127/r4/`, incl.
`sc127-r4-residual-dark-token-census.txt` and the probe scripts `probe4.mjs`,
`tokcensus.mjs`, `hover.mjs` which you may reuse).

## 0. Rebase first (finding I-4)
`git fetch origin` in the dse clone; `git rebase origin/develop` (reviewer saw `f6fb208`,
SC-240/241 — touches initiative's view, no file overlap expected). `npm ci` if
`package.json`'s obsidian version changed. Record the new base sha. Then the superproject
pointer will be re-bumped at the end.

## Findings to fix — quoted verbatim from the reviewer

> **MEDIUM-1** `styles-source.css:14461-14509`: the host block does not re-declare
> `--background-modifier-form-field-hover`, `--background-modifier-border-hover` or
> `--background-modifier-border-focus`.
> - Effect: in a dark vault, hovering or focusing a preview number field (Ferocity, Surges,
>   party, project, initiative, counter) turns it charcoal `rgb(46,46,46)` with ink
>   `rgb(34,34,34)`, about 1.3:1. The light vault stays white.
> - Fix: set those three tokens to `color-base-00`, `color-base-35` and `color-base-40`.
>   Make guard (b) compare the resolved value of every token the app sheet consumes, not
>   just the 18 literals. 255 tokens still resolve dark on a preview root (census file below).

Owner's shaping of the guard part (this is the ruling, LOW-4 folds in): guard (b) becomes
**census-based**: in the harness, enumerate every host `--*` custom property read (via
`var(--…)`, including fallbacks) by any rule — in the pinned Obsidian sheet AND in the
plugin sheet — whose selector matches a node inside a `[data-dse-print="on"]` root on the
gallery, counting `:hover` / `:focus` / `:focus-visible` / `:focus-within` / `:active`
rules as matching (strip the pseudo-class for the match test, as `assertBtnHostLeak` does
for states). For each such token, assert the DARK preview root resolves it to the SAME
value the pinned sheet's `.theme-light` resolves it to. Print `SC-127 host palette census
OK (<n> consumed tokens × dark preview == theme-light)`; on drift print the token names,
both values and the consuming selector. Prove can-fail (drop one token from the block →
DRIFTED). This replaces the 18-literal check (keep the literal check only if the census
does not already cover those 18).

> **MEDIUM-2** `shoot.mjs:5317-5341` vs `:5487-5494`: guard (c) re-implements the paper
> exemption instead of calling it.
> - Proof: I removed the white check from the real exemption. The self-test still printed
>   OK, the `--element=hero` run was still OK, and jest still passed 34/34.
> - Fix: one shared function called by both the loop and the self-test, or a jest pin on the
>   exact condition.

Do the shared function (one predicate, called by the loop and the self-test), and re-run
the reviewer's proof: remove the white check → the self-test must now FAIL. Restore.

> **LOW-1** `styles-source.css:14504` / `shoot.mjs:278-299`: `--table-header-border-color`
> is not re-declared.
> - Effect: 37 `th` borders are `#333` in the dark twin vs `#e4e4e4` in the light twin and
>   realprint, across 8 captures. The gate cannot see it because it compares no border
>   colours.
> - Fix: re-declare the token, add the four `border*Color` properties to the gate, pin
>   them in jest. This moves those 8 twin PNGs.

> **LOW-2**: the caret colour inside every preview root stays `#dadada` (pale caret on
> white inputs), and the scrollbar thumb is 10% white (invisible on the paper). Fix: add
> `--caret-color`/`caret-color` and the scrollbar tokens to the host block.

> **LOW-3** `styles-source.css:14455-14456`: the comment says "nothing checks them against
> the sheet automatically yet", but guard (b) now does.

> **LOW-4** `shoot.mjs:1292`: guard (b) pins the 18 literals only, not the 31 re-declared
> mappings.  (→ covered by the census above.)

Out of scope (owner's rulings — do not touch): I-1 link accent (host palette, identical in
realprint); I-3 print-on/off nesting hybrids; SC-348 role chips.

## Then
- Full battery per dse-verify at the rebased tip: expected tsc/lint clean; jest ≥ 3935 + your
  new tests (report base vs branch); shots 524 (or more if develop added fixtures), 0 FAIL,
  all in-run OK lines incl. the new census line; freeze exactly 130 twin FAILED / 0
  realprint FAILED (if develop widened the baseline, say so); parity 0/0/16.
- Regenerate `sc127-rebaseline.txt` (130 twin lines) deterministic across two CLEAN sweeps;
  realprint unchanged in both. Regenerate the five `sc127-r3-after-*` shots as
  `sc127-r5-after-<id>-dark-twin.png` at the final commit (copy the real shot files).
- Re-bump the superproject pointer (commit in the worktree superproject).
- Report `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/sc127-r5-fix-report.md`,
  ≤10-line executive summary first: final dse + superproject shas, base sha, battery,
  freeze counts, rebaseline determinism, can-fail proofs per finding, census token count.
  End your turn with the return contract (raw facts, paths). If blocked → `STATUS:
  NEEDS_CONTEXT`. Never wait on a background job.
