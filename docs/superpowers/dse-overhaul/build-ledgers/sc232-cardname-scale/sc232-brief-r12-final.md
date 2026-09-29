# SC-232 round 12: final prep (rebase onto SC-235, reconcile parity, final evidence)

You are the round-10b worker, resumed. Every rule from `sc232-brief-r10b-finish.md` still
applies, especially **HARD RULE: FOREGROUND ONLY** (pass `timeout: 600000` on every long
gate) and the kill rule. Workers never call Linear.

Read the ledger sections "SC-235 landed", "Round 11 result" and "Owner rulings, round 12". Read
the executive summary of `sc232-r11-rereview-report.md`.

## Steps

1. **Rebase.** Run `git fetch origin`, then rebase dse onto `origin/develop`. Expect
   `6dca388` or later; if it has moved further, say so.

   SC-235 landed section titles at 15px / 0.12em, and develop's parity sits at **14
   declared**. You land second, so the reconciliation is yours. Merge both sides' edits to:
   - `visual-harness/parity/selector-map.json` `declaredDeferrals`
   - the documented-count guard in `test/unit/parity/compare.test.ts`
   - `visual-harness/parity/README.md`

   Expected result: **24 declared** (develop's 14 + SC-232's 10 `ink` rows). Commit after
   each step, and describe the resolution of every conflict.

2. **CHANGELOG fix (r11 LOW-1)**, in the WORKTREE superproject's `CHANGELOG.md`. The second
   SC-232 bullet says statblock/featureblock abilities "keep today's layout". Reword it to what
   is true: the ability "keeps its action type in the keyword band; its cost now reads beside
   the name", plus "Signature" instead of "Signature Ability". Commit it in the worktree
   superproject. Do not bump the submodule pointer.

3. **Freeze.** At the rebased head, run shots twice in the foreground and confirm the two
   runs are byte-identical. Then:
   - Run `check-freeze.sh` and confirm the FAILED set equals `rebaseline.txt`'s filename set.
   - Confirm every hash matches the head. If any hash moved, regenerate `rebaseline.txt` and
     update `rebaseline-map.md`, and state old vs new.
   - Substitute into a scratch copy of the baseline and confirm it reads 260/260.

4. **Evidence for Scott**, in `.../sc232-cardname-scale/r12-evidence/`. **Before = the rebased
   develop head** (a detached scratch checkout, which you remove afterwards). This branch = your
   head. Site = live steelcompendium.io in DARK. Rules: 1 image px = 1 CSS px, head crops only,
   and FULL row labels (widen the label column; never truncate). Text labels only, no
   color-coding. Tile text DOM-verified into a JSON next to each image.
   - `sc232-names.png`: the name-size rows from `r4-evidence/sc232-compare-wide.png` (ability,
     statblock, featureblock, kit head, kit signature, trait). Columns: Before | This branch |
     Option B (27px probe) | Site.
   - `sc232-slots.png`: the slot rows (Determination trait, Mark ability, Growing Ferocity
     class feature, Devil Malice featureblock, Devastating Rush kit signature, Human Bandit
     Chief statblock, Whip and Magic Longsword statblock sub-feature, Kneel Peasant! statblock
     ability). Columns: Before | This branch | Site.
   - `sc232-print.png`: steel-print before (develop) | after (head), one representative frozen
     id per item (W3, W2, W7, W4, W1b, Signature wording). Label each row with the capture id
     and the item. You may reuse the reviewer's `r11-evidence/scripts/`.
   - Keep each image at most about 2000px tall; split into two files rather than downscale.

5. **Gates at the final head:**
   - tsc and lint clean.
   - jest: run `rm -f main.js styles.css` first. State the base count at the new develop and
     your head's count.
   - `obsidian-lifecycle` 19/19 on your own port.
   - shots 0 FAIL.
   - freeze as in step 3.
   - parity 0 GAPs / 0 undeclared / **24 declared** / exit 0.

6. **Cleanup.** Remove any scratch worktree you created, using `git worktree remove`.

## Report

Write `.../sc232-cardname-scale/sc232-r12-report.md`. Open with an executive summary of 10
lines or fewer:
- final dse head and base
- superproject head
- the parity count
- rebaseline count old→new, and the determinism result
- gate numbers
- evidence file paths
- scratch removed: yes/no

Your final text is the same summary plus every artifact path.
