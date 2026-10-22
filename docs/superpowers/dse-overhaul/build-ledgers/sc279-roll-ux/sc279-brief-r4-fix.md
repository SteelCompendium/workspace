# SC-279 round 4 — fix round (implementer, resume)

Read: ledger `decisions.md` section "r3 review rulings", and the review `sc279-r3-review.md` (same dir: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc279-roll-ux/`). Fix EXACTLY the findings ruled FOLD, as prescribed in the review (file:line and fixes are there):
- HIGH-1 — per-feature session prefix for statblock/featureblock ability rolls (`renderFeature.ts:563`, `statblock/view.ts:456`, `featureblock/view.ts:196`); add a jest test reproducing the reviewer's probe (roll A with an edge, then B rolls WITHOUT that edge and B's strip opens collapsed).
- MEDIUM-1 — after Reset (which disables itself), move focus to the Modifiers header; test it.
- LOW-1 — align the characteristic stepper's −/+ button row with Edges/Banes.
- LOW-2 — "Reset modifiers" left edge flush with the captions/checkbox column.
- LOW-3 — at ~300px on a card, Roll + Modifiers + summary should not shatter into 3 ragged lines (summary may wrap under the row as a unit); "19–20" must never break (nowrap span or non-breaking hyphen).
- LOW-4 — restore ds-roll's Main-action checkbox from session state after re-render; test it.
- LOW-5 — DESIGN.md carve-out wording: the header summary lists modifiers that differ from their defaults (plus the characteristic). Edit the WORKTREE superproject copy `/home/scott/code/steelCompendium/worktrees/sc279-roll-ux/DESIGN.md` only.
OUT OF SCOPE (do not touch): checkbox tick glyph (INFO-1 — Scott's call later), the harness blank-below-2400px capture limit (filed as SC-409), dropping Reroll, ds-roll gating.

Rebase first: `git -C /home/scott/code/steelCompendium/worktrees/sc279-roll-ux/draw-steel-elements fetch origin` then rebase onto origin/develop if it moved (base was `f8693b5`); report new base.

Gates: full dse-verify battery, parity last. Expected: tsc/lint clean · jest ≥ 4387 passed / 1 skipped / 215 of 216 suites (+ your new tests, report exact) · lifecycle 25/25 · shots 580, 0 FAIL · freeze: exactly the same 2 mismatches (`roll--steel-print.png`, `roll--steel-realprint.png`) — if their hashes change, regenerate `sc279-rebaseline.txt` (2 deterministic runs) and say so; any OTHER frozen line moving is a defect · parity 0 / 0 / 24 DECLARED. Known flake: `sidebarInitiative` "SC-288 r2" (SC-383) — rerun once.

Regenerate the evidence set into `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc279-roll-ux/sc279-r4-evidence/` (same six names a–f as r2, plus print before/after if they changed). For (e) and any card narrow shot, crop so the whole strip incl. Reset is visible (the harness blanks below 2400 device px — SC-409; render at a size that fits).

Commit each fix on `sc279-roll-ux` (`fix(roll): … (SC-279)`), no trailers, never push.

Report: `sc279-r4-fix.md`, ≤10-line exec summary first (head shas, every gate number, per-finding status). Final text to me: raw facts + artifact paths.

Footguns (unchanged from r2 brief — re-read them there): foreground gates, output to files, devbox wrapping/exit codes, `git -C` only, never pkill by pattern (PIDs containing `worktrees/sc279-roll-ux/` only), never edit freeze-baseline.sha256, never rm -rf under `.superpowers/` beyond sc279- files, workspace-level files only in the worktree superproject, never call Linear, if blocked return inline, NEEDS_CONTEXT instead of messaging; any stray message's first word `SC-279:`.
