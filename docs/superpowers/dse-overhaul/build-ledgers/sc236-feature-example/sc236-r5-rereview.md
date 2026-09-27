# SC-236 round 5 — scoped re-review of the delta `a1c39fa..5cd09e1`

## Executive summary

- **Verdict: APPROVE.** Every r3 finding is fixed, the delta touches nothing outside the finding set, and it introduces no new false claim. There is one wording nit (INFO-A) that does not block.
- Fixed?
  - MED-1 (renderFeature.ts corpus claim): **yes**.
  - MED-2 (entry.ts fixture claim and pointer): **yes**.
  - MED-3 (docs/Media/feature.png): **yes**. The chip is gone. Against a with-chip render of the same HEAD, the only difference is the header band (chip plus a sub-pixel title nudge). The image also regenerates byte-identically.
  - LOW-1 (drift that never happened): **yes**.
  - LOW-2 (stale featureSpend references): **yes**.
  - CRLF guard (INFO-2): **yes**. It derives on LF, CRLF and no-EOL input, and throws on 4 genuine no-ops, both as a unit test and in-situ in jest and the esbuild bundle.
  - Realprint evidence image: **yes**. Plain black text labels, BEFORE has the chip and AFTER does not.
- Gates at `5cd09e1`: tsc clean · jest **3998 passed / 1 skipped / 3999**, 206 of 207 suites, 3 snapshots · shots **524, 0 FAIL** · freeze `FREEZE VIOLATED (8 checksum mismatches, 0 missing)`.
  - The mismatches are the same 8 names as r3: feature, feature-collapsed, chrome-collapsed-rollout and feature-spend, each × print and realprint.
  - All 8 hashes equal `rebaseline.txt`. Applied to a scratch copy of the baseline they give `freeze OK (260/260 …)`.
- DSE `git status` is clean and HEAD is `5cd09e1`. The freeze baseline sha is still `f746e373…`, unchanged.

## Scope check

`git diff --stat a1c39fa..5cd09e1` shows 3 files:
- `docs/Media/feature.png` (MED-3).
- `src/elements/feature/renderFeature.ts`, a comment only (MED-1).
- `visual-harness/entry.ts`: comments (MED-2, LOW-1, LOW-2) plus the guard's regex and error message (INFO-2).

Nothing is outside the finding set.

## Per-finding verification

**MED-1 — fixed.** `renderFeature.ts:126-132` now says there is no *villain-shaped* `ability_type` in the corpus, lists the corpus values as Signature / Signature Ability / Triggered / Free-strike, and says every such feature has a real usage line. This matches my r3 corpus scan of data-unified json: those are exactly the 4 values, and all 646 unique features carrying one have a real usage line.

**MED-2 — fixed.** `entry.ts:269-281` now:
- justifies featureVillain as the only **standalone** villain feature card;
- names the statblock carriers that exercise the same rung (`statblock/example.yaml`, `human-bandit-chief.yaml`, `SettingsPreview.ts`). I checked `SettingsPreview.ts:114`: `ability_type: Villain Action 1` + `usage: "-"`, inside a statblock;
- points the cost-shape remark at `statblockVillainCorpus` "above", which is correct: the import is at entry.ts:88 and the comment is at :280.

**MED-3 — fixed.**
- I opened the new `docs/Media/feature.png` (1520×2654). The header shows only "5 MALICE", the crest is a sword, and "MAIN ACTION" sits in the usage slot. There is no "VILLAIN ACTION 1" chip.
- **Reproducible:** I re-ran `npm run docs-shots -- --only=feature.png` at HEAD. The output was byte-identical: git status stayed clean after the file was rewritten (`sc236-r5-logs/docs-shots.log`).
- **Nothing else changed because of SC-236.** I temporarily re-inserted `ability_type: Villain Action 1`, regenerated, and diffed that against the committed image.
  - The diff bbox is `(176, 98, 1470, 150)`, the header band only: the chip itself plus a sub-pixel re-rasterization of the "COVERAGE STRIKE" title as its row height changes.
  - Every other pixel is identical.
  - Afterwards I restored the file with `git checkout` and rewrote example.yaml from the HEAD blob. Log: `mut-docs-shots-with-chip.log`.
- The image does differ elsewhere from the *old* committed image (b8373c4, 1520×2394; the new one is 260 px taller, mostly taller power-roll tier rows). That is drift on develop since SC-152 (`styles-source.css` has about 13.6k lines changed between b8373c4 and 6c4f6aa), not SC-236. The regenerated image now simply matches the current plugin. See INFO-B.

**LOW-1 — fixed.** `entry.ts:238-240` now reads "a hand-copy would have silently kept the `ability_type: Villain Action 1` line …".

**LOW-2 — fixed.** `entry.ts:298` and `:783` cite only `featureVillain` as the literal convention.

**CRLF guard — fixed and re-proved.** The new code is `FEATURE_SPEND_FROM = /^ {4}cost: 2 Malice(?=\r?$)/m` with a replacement that carries no terminator.
- **Unit test** (`sc236-r5-logs/guard-unit.log`): I pulled the regex and replacement string straight out of entry.ts and ran them against the real example.yaml.
  - LF: the derived text equals the old literal-replace result.
  - CRLF: the derived text equals that result with CRLF endings, and the `\r\n` count is preserved.
  - Target on the last line with no trailing newline: derives.
  - Genuine no-ops that throw: `3 Malice`, `2 Malice!` (suffix), 6-space indent, and CRLF with `3 Malice`.
  - Control: the r3 literal `'    cost: 2 Malice\n'` fails on CRLF input, which confirms the r3 INFO-2 hazard was real.
- **In-situ, CRLF working tree.** I converted `example.yaml` to CRLF. Git reports no diff for it, because `text=auto` normalizes it.
  - Jest on `visual-harness`, `chromeRollout`, `feature-roll` and `feature.test.ts`: 5/5 suites, 195/195 passed (`mut-crlf-jest.log`).
  - Rebuilt harness bundle: `feature/default` rendered as main + sword with no chip, `feature/spend` rendered the Spend section, and there were no pageerrors (`mut-crlf-probe.log`).
- **In-situ, genuine no-op (CRLF + `3 Malice`).**
  - Jest: 3 suites fail at load with the new message (`mut-noop-jest.log`).
  - Bundle: every page throws `featureSpend: expected featureDefault (example.yaml) to contain a line matching /^ {4}cost: 2 Malice(?=\r?$)/m …` (`mut-noop-probe.log`).
- Restore: I rewrote example.yaml from `git cat-file blob HEAD:…`. `cmp` is byte-identical, there are 0 CR characters, and git status is clean.
  - I did not use `git checkout --` here: with `text=auto`, git sees the CRLF file as unmodified, so `checkout` could leave the CRLF bytes in place.

**Realprint evidence — correct.** `sc236-r2-evidence/feature-realprint.png` uses black-on-white "BEFORE"/"AFTER" text bands. BEFORE shows the "Villain Action 1" chip under "5 Malice", and AFTER shows only "5 Malice". The black-on-white rendering is fully legible.

**New false claims — none found.**
- The new comment says a local working tree can still be CRLF although `.gitattributes` normalizes on commit. I demonstrated this above: a CRLF working tree shows no git diff.
- The guard's error message renders the regex correctly.

## INFO (non-blocking)

- **INFO-A.** `entry.ts:270` still says featureVillain is "the same shape MINUS `usage`". Its antecedent used to be the D9 false-villain shape (`ability_type` + `usage`). Now that the preceding sentence ends with the D9 line being deleted, "same shape" has no clear referent. An optional reword: "a villain-shaped `ability_type` with NO `usage` line, so `actionTypeOf` falls through …".
- **INFO-B.** For Scott's ask: the regenerated docs image also absorbs about a month of develop design drift since SC-152 (taller tier rows, wider badge boxes). This is correct, since the image now matches the current plugin, but the diff against the old committed PNG is larger than the chip removal. Say so in the ask so the extra difference isn't mistaken for scope creep.
  - The docs camera renders at CSS width 760 @2x (`browser @2x`), so it is not pixel-comparable to the harness `feature--steel-dark.png` at 1520 @1x. That difference is expected.

## Hygiene

- DSE clone `/home/scott/code/steelCompendium/worktrees/sc236-feature-example/draw-steel-elements`:
  - `git status --porcelain` is empty and HEAD is `5cd09e1d047b95898534c93efb1ec5970575e68d`.
  - The temporary probe `visual-harness/.sc236-r5-probe.mjs` was deleted.
  - All mutations were reverted: the example.yaml byte-restore was verified with `cmp`, and `docs/Media/feature.png` was restored with `git checkout`.
- The worktree superproject shows only the pre-existing ` M draw-steel-elements` pointer.
- The freeze baseline is untouched (sha `f746e373…`). The scratch baseline copy is at `/tmp/claude-1000/…/scratchpad/freezecopy/`.
- No processes were killed.

## Logs

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc236-feature-example/sc236-r5-logs/`:

| Group | Files |
|---|---|
| Gates | `tsc.log`, `jest.log`, `shots-run1.log`, `freeze-run1.log` |
| Rebaseline | `my-8-hashes.txt`, `freeze-applied-copy.log` |
| Guard unit test | `guard-unit.log` |
| CRLF in-situ | `mut-crlf-jest.log`, `mut-crlf-harness-build.log`, `mut-crlf-probe.log` |
| Genuine no-op in-situ | `mut-noop-jest.log`, `mut-noop-harness-build.log`, `mut-noop-probe.log` |
| Docs image | `docs-shots.log`, `mut-docs-shots-with-chip.log` |
