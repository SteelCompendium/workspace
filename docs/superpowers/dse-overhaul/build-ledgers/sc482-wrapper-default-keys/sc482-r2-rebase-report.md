# SC-482 r2 report (LOW-1 + LOW-2 folded, rebased, full battery)

## Executive summary

- STATUS: DONE. Plugin head `053b625` on origin/develop `8d890f9` (8 commits). Superproject head `01971d9` on origin/main `3c25464` (CHANGELOG bullet only; plugin pointer unstaged for landing).
- Hand-resolved conflicts: ONE, in the superproject, from the earlier rebase onto `383ec3f` (SC-432's bullet vs mine): `CHANGELOG.md` `## Unreleased`, kept both bullets, no markers (grep 0). The final rebase onto `3c25464` and every plugin rebase had no conflicts, including `visual-harness/obsidian-lifecycle.mjs` (comment edit merged cleanly).
- Battery on the 8d890f9-based head (evidence of record): tsc (+e2e) clean; lint clean; jest 5653 passed / 1 skipped / 236 of 237 suites (before and after shots; = base 5585 + 56 r1 + 12 r2); lifecycle 31/31; e2e `95/98 ok, 0 failed, 3 known-bug, coverage: 66/66 pairs` (run `20261021-234003-a2b7`); shots 580 PNGs, 0 FAIL, `text scale OK (1626 ...)` and `text scale once OK (104184 comparisons over 208 loads ...)`; freeze `freeze OK (280/280 ...)`; parity 0 gaps / 0 undeclared / 24 declared.
- The new STAM e2e tests (SC-432) pass: none asserts a default key the user never wrote.

## LOW-1: empty source whose values return to defaults is written as `{}` (FIXED)

- Cause: `stringifyYaml({})` is `{}`. Fix: new `stringifyOmittingUntouched(owner, dto?)` in `src/elements/shared/undeclaredDefaults.ts`; when filtering left no defined values it returns `''`. A model with no record is stringified whole (even `{}`), as before. "Defined" matters: a key holding `undefined` (counter `name`, `max_value`) is not content (yaml drops it), so the check is `Object.values(kept).every(v => v === undefined)`.
- Wired into counter, project, montage, party, encounter, stamina-bar (`stringifyOmittingUntouched(model)`; montage passes its ordered DTO), and negotiation inline (it builds its own object).
- Host check through the real write path (test): empty ds-montage, End round (writes `current_round: 2`), Back to round 1 -> body is `''` and the whole note is byte-identical to the original (fence open, one empty line, fence close; text around untouched). No host change (src/framework/host is off limits and not needed).
- Tests (red first, commit `8a13a18`; 7 failed on the base): `wrapperDefaultKeys.test.ts` x6 `serialize(parse({}))` is `''` (one per element), the montage write-path test, and the plugin-built Counter keeps the whole output; `undeclaredDefaults.test.ts` +3 (`stringifyOmittingUntouched`: filtered keys / empty body, only-undefined is empty, no-record keeps `{}`).
- Encounter "empty source render" is covered at serialize level, not via render: an empty encounter renders with a `_computed` write, so its body is not empty (that write is SC-486).

## LOW-2: encounter `party:`-only source gains no `monsters: []` (TEST ADDED)

- Test: source `party: {hero_count: 4, hero_level: 3}`, render only -> body has `party` + `_computed` (`budget: 40, ratio: 0, band: trivial, victories: 1`), no `monsters`.
- Mutant confirmed: changing `encounter/model.ts` keys to `['party']` makes this test fail (1 failed, 46 skipped under `-t "party-only"`); reverted, diff clean.

## Docs

`.repo-docs/architecture.md`: one sentence for the empty-body rule. CHANGELOG bullet unchanged.

## Why the logs show repeated gate runs (honest account)

- The base moved four times during the round (772c3cd -> 8d075db -> 95981f1 -> 8d890f9), each time the owner told me to discard prior results. Only the `i-*` logs are the evidence of record; `r2-*`, `g8-*`, `h-*` and `f-*` are superseded.
- Two e2e runs on 8d075db (`g8-e2e` / `g8-e2eb`) and two lifecycle runs on 95981f1 (`h-life` / `h-life2`) exist because the first of each failed from load, not code: `g8-e2e` (load average ~18, 4 sessions of other agents) had one real-looking failure `RECOV-R07` (write count 2 vs 1, final note content correct) plus 18 cascade "did not run" after two `before all` hook timeouts of ~45 s; `h-life` failed G-S11 (`Cannot read properties of undefined (reading 'view')` evaluating the sidebar leaf) and G-S12 (sidebar write timeout). Both gates were rerun unchanged with no code change and were fully green (`g8-e2eb`: 89/93, 64/64; `h-life2`: 31/31). Those failing paths (stamina recoveries popover timing, sidebar leaf) do not touch anything this change alters in a way the passing reruns contradict, but I did not root-cause them; flagging as a possible load-sensitive flake. The final battery (`i-*`) ran all gates once each with no rerun.
- The `f-freeze` log/rc were overwritten by a stray rerun of the freeze script before I changed its tag; the evidence is `i-freeze`.
- Shots was run via a background task and polled with a bounded loop (the tool moves any call over 600 s to the background); the log is read after its own rc file appeared.

## Gate logs (`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc482-r1-impl-a23f8c687d4289a3e/`)

`i-tsc.log`, `i-lint.log`, `i-jest-pre.log`, `i-life.log` (port 9343), `i-e2e.log`, `i-shots.log`, `i-freeze.log`, `i-jest-post.log`, `i-parity.log` (each with its `.rc`).

## Drive-by fixes

None.

## Follow-ups

1. Possible load-sensitive flakes observed once each and not reproduced: e2e `RECOV-R07` (write count) and lifecycle `G-S11`/`G-S12` (sidebar leaf). Worth a ticket only if they recur.
2. Encounter's render-time `_computed` write remains SC-486.
