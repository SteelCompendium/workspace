# SC-519 r3 brief — fix round (implementer A)

Your r1 brief (`sc519-brief-r1-impl.md`) still applies in full: worktree, shell rules (section 4), report format, return contract. Read the ledger's newest entries (`sc519-decisions.md`, "owner rulings on r2 findings") and the review report `sc519-r2-review-report.md` (M-1, L-1, L-2), all in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc519-form-stale-open/`. You never call the tracker.

Start: `git -C /home/scott/code/steelCompendium/worktrees/sc519-form-stale-open/draw-steel-elements fetch origin`; confirm `origin/develop` is still c2758a2 and HEAD is 1e97599 with a clean tree (rebase onto a moved develop and say so).

## Task — exactly these three, nothing else

1. **CHANGELOG (M-1 fold):** in YOUR worktree's superproject `/home/scott/code/steelCompendium/worktrees/sc519-form-stale-open/CHANGELOG.md` (never the main checkout's), narrow the SC-519 bullet to Reading view and the sidebar. Do not mention Live Preview as fixed. Amend-free: a new superproject commit.
2. **Comment fix (L-1 fold):** the comment at `src/framework/view.ts` ~309 claims the host always shows its own Notice on a failed write. Make it say what really happens (the review measured: a disk failure such as a read-only note and a write rejected before it starts show no Notice, only a console error; see SC-524). Comment only — no behavior change.
3. **G-S45 fixed wait (L-2 fold):** replace the fixed 1000 ms settle after the sidebar pin (`visual-harness/obsidian-lifecycle.mjs` ~2702) with a wait on the panel's rebuild (a condition poll on the rebuilt sidebar card, with a deadline). If G-S40's copy (~2597) is the same code or now lives in your shared `formKit`, fix it there too. G-S45 must still FAIL against a c2758a2 bundle (`DSE_LIFECYCLE_BUNDLE`) — re-run it and record the FAIL line.

**Out of scope (filed, do not touch):** SC-523 (Live Preview pencil and form closing on a pending write), SC-524 (failed write Notice and restoring the host body). No other changes.

## Cleanup (after your gates pass)

Delete these kept lifecycle FAIL-shot dirs by literal absolute path, one `rm -rf` per literal path (no variables, no globs): `/tmp/dse-obsidian-lifecycle-UWaF1N`, `/tmp/dse-obsidian-lifecycle-VOZM1l`, `/tmp/dse-obsidian-lifecycle-Q6tRxq`, `/tmp/dse-obsidian-lifecycle-UEb2TT`, `/tmp/dse-obsidian-lifecycle-a7raUi`, `/tmp/dse-obsidian-lifecycle-RCoYhM`, `/tmp/dse-obsidian-lifecycle-t3UWgs`, `/tmp/dse-obsidian-lifecycle-bOWljr`, `/tmp/dse-obsidian-lifecycle-bvEScG`. Any NEW FAIL dir your c2758a2 red run leaves: report its path, do not delete it. Also delete your own scratch build dirs `base-c2758a2` and `var-nosidebar` inside `.../scratchpad/sc519-r1-impl-a1/` by literal path. Nothing else.

## Gates on your final HEAD

- tsc (incl. `-p e2e`) and lint clean
- jest **6074 passed / 1 skipped / 245 of 246** (after shots; a comment change adds no tests)
- lifecycle **38/38**
- e2e **123/123 ok, 0 failed, 0 known-bug, coverage 87/87**
- shots and freeze: the change touches no rendered code, so run shots + freeze only if jest needs the shots cache; otherwise state they were skipped and why. Parity: run it (last); expect 0 GAPs / 0 undeclared / 24 DECLARED.

Each gate one blocking foreground call; if a call is moved to the background by the harness, poll the gate's own log or rc file, never wait for a notice.

## Report

`sc519-r3-fix-report.md` in the ledger dir, ≤10-line executive summary first. Final text: STATUS, new shas (dse + superproject), the G-S45-vs-c2758a2 FAIL line, gate numbers, artifact paths, cleanup done. First word of any message you send anyway: `SC-519:`.
