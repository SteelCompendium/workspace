# SC-196 round 3 brief — rebase + on-hover tooltips for the color-only signals

You are an implementation worker. Your final text goes to the ticket-owner, not a human:
raw facts (verdict, shas, measured numbers), no prose, plus the filesystem path of every
evidence artifact. **Workers never call the tracker (Linear)** — not to read, not to post.

## 1. Context loading (read first, in this order)

1. `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc196-light-contrast/decisions.md`
   — the decisions ledger. Scott's rulings are there verbatim; the thread is NOT your source.
2. `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — the gate
   battery, devbox command shapes, exit-code footguns, current expected numbers.
3. `/home/scott/code/steelCompendium/workspace/docs/worktrees-and-submodules.md` — submodule
   worktree mechanics.
4. `/home/scott/code/steelCompendium/workspace/draw-steel-elements/AGENTS.md` (read-only
   reference; you work in the WORKTREE copy below, never the main checkout).

**Worktree (your ONLY write location):**
`/home/scott/code/steelCompendium/worktrees/sc196-light-contrast`
- dse repo: `/home/scott/code/steelCompendium/worktrees/sc196-light-contrast/draw-steel-elements`,
  branch `sc196-light-contrast` (commits `a81f074`, `a74fa87` on develop `c09cf6f`).
- Superproject: same worktree root, on branch `sc196-light-contrast`, commit `77c0748`
  (D3 token map doc) — the workspace-level files live at
  `/home/scott/code/steelCompendium/worktrees/sc196-light-contrast/docs/...`, **never** under
  `/home/scott/code/steelCompendium/workspace/`.
- Verify `pwd` before every write. The main checkout at `.../workspace` is shared global state.

## 2. Task A — rebase onto current tracked branches

- dse: `git fetch origin` INSIDE the worktree clone, then `git rebase origin/develop`. Target sha:
  **`e12c6bd`** (origin/develop as of 2026-09-13). 65 commits behind; expect conflicts in
  `styles-source.css` (SC-202 changed print/host rules; SC-205 changed button rules) and possibly
  `test/dom/framework/theme-steel.test.ts`. Resolve keeping BOTH the incoming develop changes and
  this branch's light-scheme state palette. Do not drop any token override.
- Superproject: `git fetch origin && git rebase origin/main` — target **`728f514`**. The one commit
  `77c0748` edits `docs/superpowers/dse-overhaul/D3-token-map.md`; keep both sides on conflict.
  After rebase, stage the dse submodule pointer at the rebased tip when the round is done.
- **`npm ci` after the rebase** (package.json's obsidian version may have moved; stale
  node_modules produce phantom tsc errors).
- `rm -f main.js styles.css` in the plugin root before jest (stale build shadows main.ts).
- Commit after every coherent step. Nothing sits uncommitted through a gate.

## 3. Task B — the tooltip condition (Scott's ruling, verbatim from the ledger)

> Looks a lot better.  This all looks good.  For the things you flagged, so long as they have on-hover tooltips, I think they are fine

The "things you flagged" are three surfaces where a state is signalled by color alone:

1. **The roll-result active/dimmed row** (roll result card / power-roll panel; behind the
   default-OFF rolling preference) — the active tier row vs the dimmed non-hit rows.
2. **The `+N` temp-stamina badge** (initiative tracker; purple-bordered box that never says "temp";
   also check the stamina bar / squad-cell mini gauge's temp rendering if it has the same badge).
3. **The selection ring** on the selected initiative creature cell (the toggle `<button>` with
   `aria-pressed` + `[data-selected]`).

For each: determine whether an **on-hover tooltip that names the state in words** already exists.
Use the kit's existing tooltip mechanism (`src/framework/kit/` has a `tooltip()` helper / Obsidian
`setTooltip`, see `iconButton.ts` §2.5 and `RecoveriesStrip.ts` for the pattern) — do not invent a
new mechanism. Add where missing. Suggested wording (adjust to match neighbouring copy):
- roll-result rows: active → e.g. "Result tier — rolled 14 (tier 2)"; dimmed → "Not rolled".
  Pick something a colorblind reader gains information from.
- temp badge: "Temporary Stamina: N".
- selection ring: "Selected" on the pressed cell (and "Select" on unselected, if that reads
  naturally with the existing button semantics).
Also make sure `aria-label`/screen-reader text carries the same word if the element has none.

Tests: add jest DOM assertions (in the existing suites for those components, or a new
`test/dom/...` file) that each surface carries the tooltip text. Keep the SC-196
`lightContrast.test.ts` suite green — it pins the approved ratios; do not loosen any bar.

Out of scope (already ticketed, do NOT touch): SC-270 spent-row neutral-ink dimming, SC-271 dark
scheme misses, SC-273 token-map gate, SC-274 LOW nits. Report anything else as
`Follow-ups:` — do not fix.

## 4. Gates (all, in the dse-verify order, in the worktree)

Expected numbers (as of develop `e12c6bd`, 2026-09-13):
- `npm run tsc` clean; `npm run lint` clean, exit 0.
- `npx jest` all green; report the totals (develop had 3257 passed/185 suites at SC-205 base and
  this branch added ~24 tests; develop has grown since — just report the real count).
- `npm run shots` 0 FAIL; in-run lines `host-copy pin OK` (or `PARTIAL` if no 1.13.7+ asar) and
  `button host-leak OK (…)` present.
- `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh <worktree>/draw-steel-elements/visual-harness/shots`
  → **`freeze OK (260/260 …)`, exit 0, 0 checksum mismatches.** Any print mismatch is a leak to fix,
  not a rebaseline.
- `npm run parity` (LAST) → 0 GAPs, 0 undeclared, the documented DECLARED set (16 at last count;
  report the real number and compare with the skill).

Footguns:
- Devbox: Go/Node are not on PATH. `devbox run -- bash -c 'cd /abs/path && cmd'` from
  `/home/scott/code/steelCompendium/workspace` (devbox root). Devbox eats `$?`/`$PIPESTATUS` and
  piping a gate to `tail` eats failures — write output to files, check codes from wrapper scripts.
- **Run every gate in the FOREGROUND. Never background a gate or park on a Monitor/notification** —
  a job you start yourself never wakes you. Redirect long output to a file (per-run unique name
  under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc196-light-contrast/`) and
  read that file when the foreground command returns.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is shared and
  pre-populated across sessions/branches.
- Stale token map (adapter §8.4): `token-coverage.test.ts` reads
  `docs/superpowers/dse-overhaul/D3-token-map.md` by candidate-path search; after the superproject
  rebase the worktree copy should be current. If it goes red, `grep -c` the missing token in the
  worktree's copy vs the main checkout's before believing it; `DSE_TOKEN_MAP_PATH` overrides.
- Never `rm -rf` `.superpowers/` or anything outside `.superpowers/sdd/sc196-light-contrast/`.
- Never run `git checkout -- .` in `v2`. You should not need to touch v2 at all.
- Never create a tag or release on draw-steel-elements. Never push.
- Never run `just deploy*`, `just sync`, `just wt-finish`.

## 5. Evidence

- Light-scheme screenshots of the three surfaces with the tooltip visible if the harness can hover
  (SC-205 added hover-state passes; check `visual-harness/shoot.mjs`). If hover capture is not
  feasible, provide DOM evidence: a dump of the element's `aria-label`/tooltip attribute per surface,
  from a jest test or a small harness script. Save under
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc196-light-contrast/sc196-r3-*`.
- Confirm post-rebase the approved palette is intact: run only `lightContrast.test.ts` and quote
  its pass count; diff `styles-source.css`'s light-scheme state block against `a74fa87`'s to show
  no token value changed.

## 6. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc196-light-contrast/sc196-r3-report.md`.
**Open with a ≤10-line executive summary**: verdict, dse sha, superproject sha, each gate's
number, the three surfaces' before/after tooltip state, evidence paths. Then detail. Sections:
`Drive-by fixes:` and `Follow-ups:` (may be empty). If the file write is blocked, return the report
inline.

## 7. Return contract

Final text = the executive summary + every evidence path. No prose. If you need input mid-task,
end your turn with `STATUS: NEEDS_CONTEXT` and the question in the report — the ticket-owner will
resume you. You cannot `SendMessage` the ticket-owner: a depth-2 agent cannot address its parent,
and `to: 'main'` routes to the top-level session, not to the owner. If you ever do send a message
anyway, its FIRST WORD must be `SC-196:`.
