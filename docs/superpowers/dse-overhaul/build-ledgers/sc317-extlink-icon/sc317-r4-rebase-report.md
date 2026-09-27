# SC-317 pre-landing rebase report

## Executive summary

- **Verdict: LAND-READY.** Clean rebase of both repos onto current develop/main; the icon's CSS values are byte-identical to what Scott approved at `2897cc5`.
- New dse base: `origin/develop` = `afd6ae3` (SC-243/230/272/236/255/231/284/338 landed since `619c4bd`). Superproject base: `origin/main` = `aeb08bc`.
- dse head: `5a20d5f274f321cf0ece9a6c8636571de4a5a86f`. Superproject head: `ad78b5b2d0349747edbee69a8e2ee4e9e71b95af`.
- dse rebase: **zero conflicts** — every SC-317 hunk landed clean; verified byte-identical to pre-rebase `2897cc5` for the touched region.
- Superproject rebase: **one real conflict** (CHANGELOG.md — both sides added an `## Unreleased` bullet), resolved by keeping both; the submodule pointer needed manual resolution at each of the two intermediate SC-317 pointer-bump commits (see below), resolved to the current dse head each time.
- Gates: tsc/lint clean; jest **4118 passed / 1 skipped / 211 of 212 suites / 3 snapshots** (base 4112 + our 6); lifecycle **19/19 ok**; shots **532 PNGs, 0 FAIL**, inline host-leak OK **1132** (unchanged from fix round 2 — develop's landings don't touch this sweep); freeze **260/260**, exit 0; parity **0/0/16**, exit 0.
- r4 crops are **pixel-identical** to the r2 crops (bbox diff `None`, both schemes) — no develop landing touched this fixture's rendering.
- No `npm ci` needed — `package.json`'s Obsidian version is unchanged between `619c4bd` and `afd6ae3`.

## Base commits

- dse: `git fetch origin` (both before inspecting and again immediately before rebasing) resolved `origin/develop` to `afd6ae3` both times — no mid-task drift.
- Superproject: `origin/main` resolved to `aeb08bc`.

## dse rebase (`git rebase origin/develop`)

**Zero conflicts.** `git rebase origin/develop` on branch `sc317-extlink-icon` (7 commits: `3a3c4c8`..`2897cc5` — wait, see the actual pre-rebase SHAs below) applied cleanly in one shot:

```
Rebasing (1/7)...(7/7)
Successfully rebased and updated refs/heads/sc317-extlink-icon.
```

Pre-rebase SC-317 commits (base `619c4bd`): `ec48285`, `64e88eb`, `1249c17`, `f9f5f3d`, `a098362`, `fe91b20`, `2897cc5`.
Post-rebase SC-317 commits (base `afd6ae3`): `3a3c4c8`, `f8926cf`, `00b029a`, `5d3083c`, `dd99f65`, `687f300`, `5a20d5f`.

**Why zero conflicts, verified not just assumed:** checked develop's own diff (`619c4bd..afd6ae3`) against every file SC-317 touches before rebasing:
- `styles-source.css`: develop's 8 hunks sit at (pre-rebase) lines 3392, 7668, 8413, 8443, 13586, 13669, 14020, 15331 — all well below SC-317's own block (~17005+). No overlap.
- `visual-harness/shoot.mjs`: develop's 2 hunks (SC-230's `assertModalTextScaleAnchoring`) sit at lines 5013 and 5322 — both well after SC-317's inline-sweep edits (~3490-3960). Additive only (a new gate function + one call site), confirmed by diffing `2897cc5`'s copy of the file against the rebased `5a20d5f`'s copy: the only delta is develop's own SC-230 addition, verbatim.
- `visual-harness/entry.ts`: SC-317 never touched this file (confirmed: `git diff 619c4bd..2897cc5 --stat -- visual-harness/entry.ts` is empty) — the `perk/links` fixture needed no widening in any SC-317 round, so develop's own entry.ts changes (SC-236's `featureSpend` derivation, an unrelated NARROW_SHOTS entry) can't collide.
- `test/dom/theme/headingEmphasisLinkHostRegrounding.test.ts`, `test/dom/elements/refUnwrapView.test.ts`, `src/elements/shared/RefUnwrapView.ts`: zero develop-side changes to any of these files in `619c4bd..afd6ae3`.
- `package.json`: zero diff — no Obsidian version bump, so no `npm ci` was needed.

**No semantic re-think needed** — develop never touched the SC-202 r4 GROUP 5/6/7 block or the inline host-leak sweep in any way that interacts with SC-317's own shape.

**Post-rebase byte verification** (not just "rebase said success"): diffed the touched region of `styles-source.css` between pre-rebase `2897cc5` and post-rebase `5a20d5f` — the SC-317 GROUP 7 companion block (glyph rule, RTL swap, comments) is **byte-identical**, confirmed with `diff` returning empty. Same check on `visual-harness/shoot.mjs`, `test/dom/theme/headingEmphasisLinkHostRegrounding.test.ts`, `src/elements/shared/RefUnwrapView.ts`, and `test/dom/elements/refUnwrapView.test.ts`: the only delta anywhere is develop's own unrelated SC-230 addition to `shoot.mjs`; the icon's CSS values were never touched.

## Superproject rebase (`git rebase origin/main`)

Six commits replayed (`01ca911`..`ef62d70`, later renumbered to `bdd3cb3`..`ad78b5b` post-rebase, plus the final housekeeping commit `49f84d6` — the pre-rebase pointer bump to `5a20d5f` — was dropped by git as "patch contents already upstream" once the later commits folded the same pointer value in).

**Conflict 1 (real): `CHANGELOG.md`, in commit `01ca911`** (the first SC-317 docs commit). Both HEAD (develop-landed entries: SC-243, SC-338) and our commit added a bullet at the top of `## Unreleased`. Resolved by keeping BOTH: SC-317's bullet placed first (top), then SC-243, then SC-338, followed by the rest of the pre-existing list unchanged. Verified after resolving: `grep -c SC-317 CHANGELOG.md` → exactly 1 (no duplication), and the SC-243/SC-338 bullet text is byte-identical to `origin/main`'s own copy (diffed, not eyeballed).

**`DESIGN.md`, same commit (`01ca911`): auto-merged cleanly, no conflict markers.** Confirmed by grepping the resolved file for `<<<<<<<`/`=======`/`>>>>>>>` — none found — and confirming the "External-link icon" row was present and intact.

**Conflicts 2 and 3 (submodule pointer, mechanical): commits `3bd5b90` and `ef62d70`** (SC-317's own intermediate `draw-steel-elements` pointer-bump commits, from before SC-317's own dse-side rebase). Each failed with `Failed to merge submodule draw-steel-elements` because the pointer transition each commit encodes (`619c4bd`→`f9f5f3d`, then `f9f5f3d`→`2897cc5`) no longer applies against a tree already sitting on the post-dse-rebase pointer. Resolved both times identically: `git update-index --cacheinfo 160000,5a20d5f...,draw-steel-elements` (pin to the CURRENT, fully-rebased dse head) then `git rebase --continue`. This is correct, not a shortcut: these two commits' only job was ever "point the superproject at the dse commit that round produced," and the dse-side rebase already superseded both intermediate values with one final one.

**Post-rebase verification:** `git status` → `nothing to commit, working tree clean`. `git ls-tree HEAD draw-steel-elements` → `5a20d5f...`, matching `git -C draw-steel-elements rev-parse HEAD` exactly. `DESIGN.md`'s "External-link icon" row reads the FINAL wording (in-flow WORD-JOINER `::after`, not an earlier round's `::before` phrasing) — confirmed the later replayed commits (`e21295d`, `ad78b5b`) correctly built on top of the conflict-resolved base rather than reintroducing stale wording.

## Gate results (measured, in order)

| Gate | Result | Log |
|---|---|---|
| `npm run tsc` | clean | `sc317-r4-tsc-20260927-134412.log` |
| `npm run lint` | clean, exit 0 | `sc317-r4-lint-20260927-134425.log` |
| `npx jest` (after `rm -f main.js styles.css`) | **4118 passed / 1 skipped / 211 of 212 suites / 3 snapshots** | `sc317-r4-jest-20260927-134708.log` |
| `DSE_LIFECYCLE_PORT=9301 npm run obsidian-lifecycle` | **19/19 ok, 0 failed**, exit 0 | `sc317-r4-lifecycle-20260927-134758.log` |
| `npm run shots` | **532 PNGs, 0 FAIL**; inline host-leak OK **1132** comparisons, 0 diffs | `sc317-r4-shots-20260927-135042.log` |
| `check-freeze.sh` | **`freeze OK (260/260 frozen print PNGs byte-identical …)`**, exit 0 | `sc317-r4-freeze-20260927-135853.log` |
| `npm run parity` | **`0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).`**, exit 0 | `sc317-r4-parity-20260927-135857.log` |

**jest base count, measured honestly, not inferred:** ran `npx jest` on a scratch `git worktree add --detach` of `origin/develop` at `afd6ae3`. First attempt (scratch dir under the session's own `/tmp/…/scratchpad/`) reported `3 skipped / 4110 passed` — a false read: `test/dom/framework/token-coverage.test.ts` resolves a workspace-repo doc path against a fixed set of known layouts (main checkout, or `<root>/worktrees/<name>/draw-steel-elements` beside `<root>/workspace`) and silently skips 2 tests from any OTHER location (a known, documented footgun). Re-ran from a worktree placed at `/home/scott/code/steelCompendium/worktrees/sc317-base-check-r4/draw-steel-elements` (matching the recognized layout shape) instead: `1 skipped / 4112 passed / 211 of 212 suites / 3 snapshots` — the real base count. Both scratch worktrees were removed after use (`git worktree remove --force`); `git worktree list` in the dse repo shows only the SC-317 worktree itself.

**shots base count:** not independently re-measured on the base (the brief only required the base be "reported," and the delta is fully explained by develop's own landed fixtures — SC-284's narrow cardHead shots, SC-338's chip variants, etc. — none overlapping `perk/links`). 532 vs. the SC-317 branch's own pre-rebase 524 is a +8 growth from develop's landings alone; SC-317 itself adds zero new shots (no fixture widening, per the r1 implementation report).

**inline host-leak count unchanged (1132) across the rebase**, confirming develop's landings don't touch the `.external-link`/`GROUP 7` surface this sweep samples.

## Crop comparison (r2 vs. r4)

Re-cropped `perk-links--steel-{dark,light}.png` from the rebased `npm run shots` output at the SAME box as fix round 2's own crops (`y 415→545`, screen; the print crop was not re-taken since the brief only asked for the `-after` screen pair):

- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc317-extlink-icon/crops/sc317-r4-perk-links-dark-after.png`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc317-extlink-icon/crops/sc317-r4-perk-links-light-after.png`

**Pixel-identical to the r2 crops.** Compared with `PIL.ImageChops.difference` against `sc317-r2-perk-links-{dark,light}-after.png`: `diff.getbbox()` returned `None` for both schemes (no differing pixels at all, not merely "visually close"). This is expected: none of the six landed tickets (SC-243, SC-230, SC-272, SC-236, SC-255, SC-231, SC-284, SC-338) touch the `perk` element, the `.external-link`/`GROUP 7` CSS, or any shared base rule the `perk/links` fixture's rendering depends on — SC-230's text-scale change is `.dse-modal`-scoped only (no modal in this fixture), and SC-284's narrow-form change only fires at a narrowed capture width (this fixture renders at the standard main-pane width).

## Files touched (this round)

dse repo: **none** — the rebase applied every prior commit without any new edits.

Superproject worktree (`/home/scott/code/steelCompendium/worktrees/sc317-extlink-icon`):
- `CHANGELOG.md` (conflict resolution, folded into replayed commit `bdd3cb3`)
- `draw-steel-elements` submodule pointer (folded into replayed commits, final value `5a20d5f`)

## Commits

dse (`sc317-extlink-icon`, rebased onto `afd6ae3`): `3a3c4c8`, `f8926cf`, `00b029a`, `5d3083c`, `dd99f65`, `687f300`, `5a20d5f` (HEAD).

Superproject (`sc317-extlink-icon`, rebased onto `aeb08bc`): `bdd3cb3` (CHANGELOG conflict resolved), `e21295d`, `ad78b5b` (HEAD). No push, no tags; `main`/`develop` untouched.
