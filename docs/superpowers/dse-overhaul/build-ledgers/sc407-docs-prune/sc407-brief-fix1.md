# SC-407 fix round 1 (resume of the r1 implementer)

Read the updated ledger first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc407-docs-prune/decisions.md` → "Owner rulings on r1 review". Review report: `sc407-r1-review.md` (same dir) — the findings below are its LOW-1..LOW-6 sections and INFO I1, which you must read there VERBATIM (file:line, scenario, prescribed fix) and apply as prescribed.

Branch `sc407-docs-prune` in `/home/scott/code/steelCompendium/worktrees/sc407-docs-prune/draw-steel-elements`, currently `eef9c63`. First `git -C <dse> fetch origin` and confirm origin/develop is still `05a6ff3`; if it moved, rebase and say so.

Fix list (all FOLD):
- LOW-1 audit §7 line ~219 "eight" → "ten" (10 pages with the switch off).
- LOW-2 CHANGELOG.md ~70-71 (SC-318 bullet): drop "the roster heading and" (encounter-builder surface).
- LOW-3 docs/running-an-encounter.md: restore an accurate sync requirement for the compendium-code example (lines ~9-10); replace `goblin-stinker` (Horde Controller) as the minion squad with `goblin-runner` (or another real minion — verify against the compendium data the example resolves).
- LOW-4 docs-shots.mjs: guard that rejects (hard error) a manifest entry whose browser-harness element is a deferred element, since the browser half renders with the switch ON (`visual-harness/entry.ts:103`); plus the README/dev-doc line the reviewer prescribes. Derive the deferred set from the registry's `deferred` flag, not a hand-copied list, if feasible.
- LOW-5 `.repo-docs/architecture.md:~111` and `AGENTS.md:~142-145` mention docs-shots forces the switch OFF for its Obsidian half (and the LOW-4 guard for the browser half); `AGENTS.md:~152` "§11" → "§11a".
- LOW-6 CHANGELOG.md:~535 garbled sentence — rewrite plainly.
- I1 `docs/index.md:21` wording consistent with the guide's "Set up the fight".

Out of scope (owner DROPPED — do not touch): sample.png height / the gallery fixture; negotiation.gif; the canvas "Read-only" badge overlap; unused `kind: 'sidebar'` camera code.

Commit per fix or per area, `(SC-407)` in the message, no attribution trailers. Do not regenerate docs/Media unless a fix requires it (none should).

Gates on the final commit (dse-verify skill): tsc/lint clean; jest 4430 passed / 1 skipped / 218 of 219 (more passed only if you add a test for the LOW-4 guard — state the delta); lifecycle 25/25; shots 568, 0 FAIL; freeze `freeze OK (274/274 …)`; parity 0/0/24 exit 0 (last). Plus: `npm run docs-shots` rc=0 with the guard in place (proves no current entry trips it) — then `git -C <dse> status` must show no Media drift you commit (if images flicker, e.g. tutorial-source-mode.png, restore them with `git -C <dse> checkout -- docs/Media`); and the link check script again (0 broken).

Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc407-docs-prune/sc407-fix1-impl-report.md`, ≤10-line executive summary first. Logs under `.../sc407-docs-prune/fix1-logs/`.

Return: raw facts (STATUS, final sha, commits, gate numbers) + evidence paths. All footguns from your r1 brief still apply (foreground gates, redirect output, PID-only kills with your worktree path, `git -C`, never write under workspace/ except the ledger dir, never push/tag, never call the tracker, NEEDS_CONTEXT instead of messaging).
