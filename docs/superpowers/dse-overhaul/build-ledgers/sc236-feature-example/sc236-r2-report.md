# SC-236 round 2 — implement V1 report

## Executive summary

- **Status: DONE.** DSE branch `sc236-feature-example`, 3 commits on top of `6c4f6aa`
  (`origin/develop` had not moved — no rebase needed): `57de502` (fix: delete
  `ability_type` line + derive `featureSpend` + reword comments), `ac9df92` (test: rewrite
  content pin + inline precedence pin), `a1c39fa` (docs: CHANGELOG bullet).
- Gates: `tsc` clean · `lint` clean exit 0 · `jest` **3998 passed / 1 skipped / 3999 total**,
  206 of 207 suites, 3 snapshots (base 3997 + net +1 new test) · `obsidian-lifecycle`
  **6/6 ok, 0 failed**, exit 0 · `shots` **524, 0 FAIL** (×2 runs) · freeze
  **`FREEZE VIOLATED (8 checksum mismatches, 0 missing)`** — exactly
  `feature--steel-{print,realprint}`, `feature-collapsed--steel-{print,realprint}`,
  `chrome-collapsed-rollout--steel-{print,realprint}`, `feature-spend--steel-{print,realprint}`,
  no others, identical set on both shots runs · `parity` **0 GAPs / 0 undeclared WARNs /
  16 DECLARED**, exit 0.
- `rebaseline.txt`: **8 lines**, deterministic across 2 independent `npm run shots` runs
  (byte-identical); the 6 pre-existing lines verified byte-identical to r1's
  `v1-rebaseline.txt`.
- `git status` clean in the DSE clone. Superproject shows only the expected dirty submodule
  pointer (unlanded); nothing else touched there — DSE's own `CHANGELOG.md` already had an
  unreleased section, so no superproject edit was needed.

## Files changed (DSE clone)

- `src/elements/feature/example.yaml` — deleted the line `ability_type: Villain Action 1`;
  nothing else in the file changed. This is the task's core edit (V1).
- `visual-harness/entry.ts`:
  - `featureSpend` changed from a hand-copied literal to a derived string:
    `featureDefault.replace('    cost: 2 Malice\n', '    cost: Spend Heroic Resource\n')`,
    wrapped in an IIFE that throws at harness load if the replace is a no-op (verified — see
    "Guard proof" below). It was already stale before this round (it still carried the
    `ability_type` line r1 measured as deleted from the real file), which is exactly the
    failure mode the derivation removes.
  - Comment above `featureSpend` (~line 234) reworded: no longer describes it as a
    "verbatim copy"; explains the derivation and the guard.
  - Comment above `featureVillain` (~line 261) reworded: the old text said example.yaml
    "cannot be 'fixed' without... breaking the precedence rule" — no longer true, since it
    *has* been fixed. New text explains `featureVillain` still exists because it's now the
    only fixture anywhere that exercises `actionTypeOf`'s `ability_type` fallback rung (real
    corpus villain actions signal via `cost`, not `ability_type`).
- `src/elements/feature/renderFeature.ts` (~lines 113-128, `actionTypeOf`'s doc comment) —
  reworded the sentence claiming `feature/example.yaml` "deliberately stays `main` and its
  frozen shots never move" (false now — the file no longer demonstrates this precedence case
  at all, and its shots *did* move this round for the correct reason: the DOM changed).
  Now points at the inline-config precedence test instead.
- `test/dom/elements/feature.test.ts`:
  - Rewrote the adversarial content pin (was `test/dom/elements/feature.test.ts:536-550`)
    to assert the new truth: `example.yaml` has NO `ability_type` line
    (`not.toMatch(/^ability_type:/m)`), has `usage: Main action`, and renders
    `data-dse-act="main"` + sword crest.
  - Added a new adjacent test pinning the SC-102 precedence rule with **inline config**
    (`ability_type: Villain Action 1` + `usage: Main action` -> `main`), since the rewritten
    pin can no longer demonstrate that precedence case itself (example.yaml carries no
    `ability_type` at all now).
- `CHANGELOG.md` — one bullet under the `## 7.0.0 (unreleased; previously numbered 6.0.0)`
  section (DSE's own changelog does have an unreleased section, so the superproject's
  `CHANGELOG.md` was not touched).

## Guard proof (featureSpend derivation, task 2)

Verified with a standalone Node script (not committed) before wiring the guard into
`entry.ts`:
- `featureDefault.replace('    cost: 2 Malice\n', '    cost: Spend Heroic Resource\n')` on
  the post-edit `example.yaml`, diffed against the OLD `featureSpend` literal with the
  `ability_type: Villain Action 1` line manually removed — **byte-identical match**,
  confirming "rendered content must equal the old literal minus the ability_type line."
- Same script with a deliberately wrong search string (`cost: 999 Nope`) confirmed
  `derived === featureDefault` (a true no-op), i.e. the guard's condition correctly detects
  the no-op case that should throw.

## Can-fail proof for the rewritten content pin (task 3)

- Temporarily re-inserted `ability_type: Villain Action 1` as line 5 of
  `src/elements/feature/example.yaml` (working tree only, never committed).
- Ran only the rewritten test:
  `npx jest test/dom/elements/feature.test.ts -t "SC-236 — example.yaml has NO ability_type line"`
  → **1 failed** on `expect(exampleYaml).not.toMatch(/^ability_type:/m)`, full jest failure
  output captured at
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc236-feature-example/sc236-r2-logs/canfail-proof.log`.
- Reverted with `git checkout -- src/elements/feature/example.yaml` (file restored to the
  committed, ability_type-free state — `git diff` on it is empty).
- Re-ran the same test plus the new precedence test (`-t "SC-236"`, matches both) on the
  restored tree: **2 passed**, log at
  `.../sc236-r2-logs/newtests-pass.log`.

## Where the SC-102 precedence rule is pinned (task 4)

- **File:line:** `test/dom/elements/feature.test.ts:562` — new test
  `'[data-dse-act]: SC-102/SC-236 — precedence unchanged: a REAL usage still wins over a
  villain ability_type'`, inline config (`ability_type: Villain Action 1` + `usage: Main
  action` -> `data-dse-act="main"`), not a file read.
- The rewritten `example.yaml`-reading pin at `test/dom/elements/feature.test.ts:542`
  (formerly 536-550) was the **only** test pinning this exact combination before this round
  (confirmed by inspection of every `data-dse-act` assertion in the file — the file also has
  two inline-config tests that pin *adjacent* precedence cases: `usage: '-'` +
  `ability_type: Villain Action 1` -> villain at line 511, and a real usage beating a
  **villain cost** (not `ability_type`) at line 620 — neither covers the case this round's
  new test now covers on its own). `actionTypeOf` itself (`renderFeature.ts`) was **not**
  touched, per the brief.

## Comment/doc updates (task 5)

Grepped the whole DSE repo for `Villain Action 1` co-occurring with `example.yaml` / `D9` /
`SC-236` / `FOLLOWUPS #53`. Two files qualified and were both updated (see "Files changed"
above for the specifics):
- `visual-harness/entry.ts` — `featureSpend` comment (~line 234) and `featureVillain`
  comment (~line 261).
- `src/elements/feature/renderFeature.ts` — `actionTypeOf`'s doc comment (~lines 113-128).
- `test/dom/elements/feature.test.ts`'s own "THE ADVERSARIAL CASE" comment (~line 531) was
  also reworded as part of rewriting the test it sits above (not a separate grep hit, but
  the same stale claim).

Other files matching `Villain Action 1` (`src/elements/statblock/example.yaml`,
`test/fixtures/statblock/villain-corpus.yaml`, `test/fixtures/statblock/human-bandit-chief.yaml`,
`src/views/SettingsPreview.ts`, `docs/statblock.md`, `docs/Features.md`,
`test/dom/framework/pref-overrides.test.ts`, `test/dom/elements/statblock.test.ts`,
`.repo-docs/architecture.md`) were checked and are all **independent fixtures/docs for the
statblock family or the actionTypeOf precedence rule in general** — none references
`feature/example.yaml`, D9, SC-236, or FOLLOWUPS #53. Left untouched.

## Drive-by fixes

None. Every edit made was explicitly in the brief's scope.

## Follow-ups (for the ticket-owner to judge, not filed by me)

None new this round — r1's three follow-ups were already resolved or dropped per the
ledger's "Owner decisions after r1": follow-up 1 (featureSpend hand-copy) is fixed by this
round's task 2; follow-up 2 (chrome-collapsed-rollout indirect consumer) was informational
and is now confirmed in this round's freeze mismatch set as expected; follow-up 3 (V3's
leftover cost shape) is moot since V1 was built, not V3.

## Artifacts

- Report (this file):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc236-feature-example/sc236-r2-report.md`
- Logs dir:
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc236-feature-example/sc236-r2-logs/`
  (`tsc.log`, `lint.log`, `jest.log`, `obsidian-lifecycle.log`, `shots-run1.log`,
  `shots-run2.log`, `freeze-run1.log`, `freeze-run2.log`, `parity.log`,
  `canfail-proof.log`, `newtests-pass.log`)
- Rebaseline (ready-to-apply, NOT applied — dispatcher/ticket-owner territory):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc236-feature-example/rebaseline.txt`
  (8 lines, deterministic across 2 clean `npm run shots` sweeps)
- Evidence crops (before/after, stacked vertically, plain-text BEFORE/AFTER labels, cropped
  to the card header region ≤1600px wide):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc236-feature-example/sc236-r2-evidence/feature-dark.png`,
  `feature-print.png`, `feature-spend-dark.png`
