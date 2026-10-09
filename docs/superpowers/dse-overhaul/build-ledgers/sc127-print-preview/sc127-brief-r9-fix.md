# SC-127 round 9 — fix round for the round-8 re-review findings

You are the SC-127 implementer (resumed). Same worktree, branch, skills, devbox wrapping,
FOREGROUND-only gate discipline (output to `sc127-r9-*` files read on return; never wait
on a background job), footguns, no AI trailers, commit per coherent step. No tracker.

Read first: the ledger's 2026-09-25 round-8 entry (your scope = those rulings), then
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/sc127-r8-rereview-report.md`
and its evidence under `r8/` (`sc127-r8-accent-probe.log`, the three
`sc127-r8-accent-red-perk-links-*.png`).

Rebase first if `origin/develop` moved past `619c4bd`; `npm ci` if package.json changed.

## Findings — quoted verbatim from the reviewer

> **MEDIUM-B (regression vs r3/r5)**, `visual-harness/obsidian-light-island.mjs`
> (`resolveAll`, via `generateLightIsland`): the generator bakes Obsidian's default accent
> (`258 / 88% / 66%`) into 34 tokens, e.g. `--color-accent-1`, `--checkbox-color`,
> `--text-accent`.
> - Measured with the accent set to red (`0 / 80% / 45%`) on `<body>`, the way Obsidian's
>   Appearance → Accent color applies it: a checked checkbox is `rgb(152,115,247)` (purple)
>   in the dark preview vs `rgb(223,24,27)` (red) in the light twin and in realprint.
> - So for any user with a non-default accent, checkboxes, tags, blockquote bars, link hover
>   and selection no longer match the export. No gate sees it, because every gate runs with
>   the default accent.
> - Fix: resolve with sentinel accent values and rewrite them back to `var(--accent-h/s/l)`.
>   Add a correctness pass under a non-default accent; today's block must go DRIFTED on
>   those 34 tokens.

Do exactly that. The generated block must keep every accent-derived token as a formula
over `var(--accent-h)`/`var(--accent-s)`/`var(--accent-l)` (verbatim from the pinned
`.theme-light` where it is a formula there; sentinel-resolved and rewritten where the
sheet maps through an intermediate). The in-run guard gets a second correctness pass
with the body accent set to a non-default triple (e.g. `0 / 80% / 45%`) — every restated
token must resolve on the dark preview root to what `.theme-light` resolves under the
same accent. Can-fail proof: run the new pass against the CURRENT (pre-fix) block → DRIFTED
naming the 34; after the fix → OK. Also render the reviewer's `perk-links` case under the
red accent in the dark twin and confirm the checkbox/link colours equal the light twin's
(save as `sc127-r9-accent-red-perk-links-darkTwin.png`).

> **LOW-C** `printTwinDeltaAllowedSet.test.ts:271-345`: the jest "block vs generator" test
> is weaker than claimed.
> - Deleting `--color-base-30` → red (1 of 21).
> - Deleting `--text-normal` → green 21/21: mapping-only tokens are skipped, the opposite
>   of the test's own comment.
> - Editing a value → green 21/21: values are never compared.
> - Without the pinned sheet it skips cleanly, but because `visual-harness/dist` is
>   gitignored and CI runs jest first, it always skips in CI.
> - The `styles-source.css` comment saying jest "asserts the committed block equals what
>   regenerating right now would produce" is false. The in-run guard is the real protection.

Make the test compare the full generated text (or the parsed declaration map, names AND
values, mapping-only tokens included) against the committed block; can-fail on both a
deleted mapping token and an edited value. Fix the sheet comment to say what is true:
the in-run guard is the enforced check; the jest test runs only where the pinned sheet
is present (it is skipped in CI, and says so when it skips).

> **LOW-D:** item 7's "stale submodules now synced" is not true. The worktree superproject
> still shows ` M steel-etl`, ` M steelCompendium.github.io`, ` M v2`. Run
> `git submodule update` on those three before `wt-finish`.

In `/home/scott/code/steelCompendium/worktrees/sc127-print-preview`:
`git submodule update -- steel-etl v2 steelCompendium.github.io`, then confirm
`git status --short` shows only the dse pointer change (before your re-bump) and nothing
after it.

## Then
Full battery at the tip (report numbers; freeze exactly 130 twin / 0 realprint / 0
missing); two CLEAN sweeps → `sc127-rebaseline.txt` (the accent-formula rewrite should
not move twin bytes at the default accent — if any twin hash differs from the r7 file,
say which and why); after shots `sc127-r9-after-<id>-dark-twin.png` only if hashes
moved (else state "r7 afters still valid, hashes identical"); superproject re-bump; report
`sc127-r9-fix-report.md` (≤10-line executive summary; can-fail proofs per finding); end
with the return contract.
