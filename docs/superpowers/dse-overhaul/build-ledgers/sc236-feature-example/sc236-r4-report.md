# SC-236 round 4 — fix round report (independent review findings)

## Executive summary

- **Status: DONE.** DSE branch `sc236-feature-example`, new commit `5cd09e1` on top of
  `a1c39fa` (base `6c4f6aa`, `origin/develop` unmoved — no rebase needed). Fixes all 3
  MEDIUM + 2 LOW findings and both actionable INFO items from `sc236-r3-review.md`; skipped
  the two informational-only INFO items per the owner's ruling ("drop"). Comment/doc/evidence
  changes only — no code behavior, DOM, or test-pinned logic changed.
- Gates re-measured at `5cd09e1`: `tsc` clean · `lint` clean exit 0 · `jest`
  **3998 passed / 1 skipped / 3999 total**, 206/207 suites, 3 snapshots (unchanged from r2)
  · `obsidian-lifecycle` **6/6 ok, 0 failed**, exit 0 (first attempt hit a one-off `CDP
  socket closed` crash unrelated to this change — see "Lifecycle flake" below — clean on
  immediate retry) · `shots` **524, 0 FAIL** · freeze **`FREEZE VIOLATED (8 checksum
  mismatches, 0 missing)`**, the identical 8-name set as r2 · **all 8 hashes diffed
  byte-identical against `rebaseline.txt`** (r2's rebaseline is still valid, unchanged) ·
  `parity` **0 GAPs / 0 undeclared WARNs / 16 DECLARED**, exit 0 (unchanged from r2).
- `git status` clean in the DSE clone; superproject shows only the expected pre-existing
  dirty submodule pointer.

## Findings fixed (per decisions.md "r3 review" rulings — all FOLD)

**MEDIUM-1** — `src/elements/feature/renderFeature.ts:126-128` (`actionTypeOf` doc
comment) falsely claimed no real corpus ability carries `ability_type` at all. Corpus has
831 occurrences (Signature Ability 461, Signature 260, Triggered 106, Free-strike 4), every
one paired with a real `usage` line. Reworded to "no *villain-shaped* `ability_type`",
keeping the true conclusion (this rung never decides for shipped content) intact.

**MEDIUM-2** — `visual-harness/entry.ts:267-273` (`featureVillain` rationale) falsely
claimed no fixture anywhere else exercises the `ability_type` rung, and misdirected the
cost-shape pointer at `featureVillain`'s own shape. `src/elements/statblock/example.yaml`,
`test/fixtures/statblock/human-bandit-chief.yaml` and `SettingsPreview.ts` all carry a
villain-shaped `ability_type`, and `test/dom/elements/statblock.test.ts` pins it. Restored
the accurate reason — `featureVillain` is the only **standalone** villain feature card
(spine-less crest + eyebrow tint, no bar, per D3); the statblock fixtures exercise the same
rung only nested inside a statblock — and pointed the cost-shape remark at
`statblockVillainCorpus` instead.

**MEDIUM-3** — `docs/Media/feature.png` still showed the "VILLAIN ACTION 1" chip.
Regenerated with `devbox run -- bash -c 'cd .../draw-steel-elements && npm run docs-shots
-- --only=feature.png'` (log: `sc236-r4-logs/docs-shots.log`). Verified `git status --short`
showed only `docs/Media/feature.png` changed (plus this round's own comment edits already
in the working tree) — no unrelated drift from `notes-gen.mjs`'s demo-vault regeneration.
Viewed the new PNG: chip is gone, header shows only "5 MALICE" + "MAIN ACTION", matching
`example.yaml` exactly.

**LOW-1** — `entry.ts:238-240` claimed a hand-copy "silently drifted out of sync" — false;
the base literal was byte-equal to example.yaml with the Spend substitution applied, so no
drift ever happened. Reworded to "a hand-copy *would have* silently kept" the deleted line.

**LOW-2** — `entry.ts:296` and `:781` still cited "same convention as
featureSpend/featureVillain" for hand-written literals; `featureSpend` is now derived, not
a literal. Both now cite `featureVillain` only.

**INFO (CRLF guard hardening)** — the `featureSpend` guard's literal
`'    cost: 2 Malice\n'` target would not match a CRLF-normalized working tree, causing a
false-positive throw. Replaced with a regex,
`/^ {4}cost: 2 Malice(?=\r?$)/m`, whose lookahead matches an optional trailing `\r` without
consuming the line terminator — so the guard fires only on a genuine shape change, on
either line-ending style.
- Proved the CRLF fix in isolation with a standalone Node snippet (`\r\n`-joined string):
  the regex matched and replaced correctly, preserving every `\r\n`.
- **Re-proved the guard still throws on a genuine no-op**, matching r3's own mutation
  method: changed `example.yaml`'s `cost: 2 Malice` to `cost: 3 Malice` (working tree only,
  never committed), ran `npx jest fixtures.test.ts chromeRollout.test.ts feature-roll.test.ts`
  → all 3 suites failed to load with the guard's error message (log:
  `sc236-r4-logs/guard-canfail-jest.log`), then reverted with `git checkout --` (`git diff`
  on the file empty afterward).

**INFO (realprint evidence crop)** — added
`sc236-r2-evidence/feature-realprint.png` (same style as the others: stacked
BEFORE/AFTER, plain black-on-white text labels, header region, ≤1600px wide). The
`--steel-realprint` twin renders black-on-white and reads far more legibly than the
`--steel-print` crop the reviewer flagged as near-invisible in both states (pre-existing,
not caused by SC-236).

**Skipped per owner ruling ("drop", informational only):** INFO-1 (guard blast radius in
the harness bundle — acceptable, jest catches it first), INFO-3 (first-occurrence-only
replace — acceptable given the guard's purpose), INFO-5 (precedence pinned redundantly
elsewhere — confirms r2's claim, no action), INFO-6 (main workspace checkout dirty,
pre-existing and unrelated to this review).

## Lifecycle flake (first `obsidian-lifecycle` attempt)

First run: `G-S7a`/`G-S7b`/`G-S6a` ok, then `G-S6b FAIL: page eval failed: TypeError:
Cannot read properties of null (reading 'saving')`, then `G-S6u`/`G-S5n` both
`FAIL: CDP socket closed` (log: `sc236-r4-logs/obsidian-lifecycle.log`). Checked for a
port/process collision (`pgrep -af "obsidian-lifecycle\|Xvfb :16"`, `ss -ltnp | grep 9262`)
— the one process holding port 9262 had already exited by the time it was checked, and
nothing under `worktrees/sc236-feature-example/` was involved. This round's changes are
comments, a docs PNG, and a regex swap in a harness-only fixture derivation — none reach
the sidebar/leaf-close code path `G-S6b` exercises, so a real regression here was already
unlikely. Immediate retry: **`OBSIDIAN-LIFECYCLE done: 6/6 ok, 0 failed`, exit 0** (log:
`sc236-r4-logs/obsidian-lifecycle-retry1.log`), consistent with a one-off CDP crash rather
than a caused failure. No process was killed (nothing needed killing).

## Files changed (DSE clone, this commit)

- `src/elements/feature/renderFeature.ts` — MEDIUM-1 comment fix.
- `visual-harness/entry.ts` — MEDIUM-2, LOW-1, LOW-2 comment fixes + the CRLF-agnostic
  guard regex (INFO).
- `docs/Media/feature.png` — MEDIUM-3 regeneration.

## Drive-by fixes

None — every edit is a prescribed review finding.

## Follow-ups

None new.

## Artifacts

- Report (this file):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc236-feature-example/sc236-r4-report.md`
- Logs dir:
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc236-feature-example/sc236-r4-logs/`
  (`tsc.log`, `lint.log`, `docs-shots.log`, `guard-canfail-jest.log`, `jest.log`,
  `obsidian-lifecycle.log`, `obsidian-lifecycle-retry1.log`, `shots-run1.log`,
  `freeze-run1.log`, `r4-hashes.txt`, `parity.log`)
- New evidence crop:
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc236-feature-example/sc236-r2-evidence/feature-realprint.png`
  (added alongside r2's existing `feature-dark.png`, `feature-print.png`,
  `feature-spend-dark.png` — all four now cover the full evidence set for the Needs Review
  ask)
- `rebaseline.txt` (from r2, still valid, unchanged):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc236-feature-example/rebaseline.txt`
