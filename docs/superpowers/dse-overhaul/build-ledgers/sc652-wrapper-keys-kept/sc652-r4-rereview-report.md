# SC-652 r4 scoped re-review — dse `f4448454` (delta `12e38fe7..f4448454` + rebase on `42c26272`), superproject `6c77ff1a`

## Executive summary
- **Verdict: FIX** — one new MEDIUM (N-1) from the rebase onto SC-650. If the owner rules N-1 out of SC-652's scope
  (the faulty comparison is SC-650 / SC-608 code), file it and the branch is **LAND**: everything the fix round was
  asked to do holds.
- M-1 closed: all six r2 hero cases and both base-broken SC-514 cases write the key once, parse, and redraw clean.
  The 22 non-hero probe outputs are byte-identical to the r2 head; all 36 outputs match my r2 fix probe. L-1 and I-4
  are done as ruled. Superproject: exactly two commits on origin/main `2945c3ea` (it has not moved), as specified.
- N-1 (MEDIUM): in the pinned sidebar, a montage that has a `prefs:` / `collapsed:` line closes an open window with
  the "changed outside" Notice when the card's own write echoes back. SC-650's `update()` compares the plain
  serialization with the reserved-key-wrapped one. SC-652 extends this to unknown-only `prefs:` and `collapsed: yes`.
  The fix is two lines and was probed green.
- Gates at `f4448454`: tsc incl. e2e clean, lint clean, jest **13582 passed / 1 skipped**. Lifecycle part 4 **3/4**:
  G-S61 failed on the torn-read line only (6 of 6 failing phases, 0 stale frames); load 16.4 at start, 3.8 at end.
  Host load per the SC-668 ruling. e2e not re-run (no probe touched an e2e path). The r3 log has MONT-X15..X18 and
  CTR-K01 ✓.

## Findings

### MEDIUM

**N-1 — pinned sidebar: the montage's (and the initiative tracker's) "is the block unchanged?" check compares two
different serializations, so a block with a reserved line closes its open window when its own write echoes back.**
`src/elements/montage/view.ts:128` writes `this.disk = { raw: normalizeBlockText(out), ser: out }`, where `out` is the
pipeline's WRAPPED serializer output (`withReservedKeys`: the `prefs:` / `collapsed:` lines come first). `:191` then
asks `serializeModel(model) === this.disk.ser` with the plain model serialization, which has no reserved lines. The
two can never be equal for a block that has a reserved line. The initiative tracker has the same pattern:
`src/elements/initiative/view.ts:207` vs `:266`. I read that code but did not probe it at runtime.

Scenario (jest, SC-650's own harness and the sidebar's real refresh `prepareModel` → `update()`,
`r4rev-probe3.test.ts`, OW26 shape). The montage block is `prefs:\n  boardDensity: compact` + SC-650's `BASE`, pinned in
the sidebar. Quick success on Kira → the write flushes → open Set limits → the note's modify event refreshes the panel
with the body just written (or with an edit elsewhere in the note).

| reserved line | base `42c26272` | head `f4448454` |
|---|---|---|
| none | window stays, 0 Notices | window stays, 0 Notices |
| `prefs: {boardDensity: compact}` (unknown-only) | stays (base dropped the line) | **window closes, 1 Notice** |
| `collapsed: yes` | stays (base dropped the line) | **window closes, 1 Notice** |
| `collapsed: true` | closes, 1 Notice (pre-existing) | closes, 1 Notice |
| `prefs: {reduceMotion: true}` (applied) | closes, 1 Notice (pre-existing) | closes, 1 Notice |

So SC-650 already has this bug for blocks the wrapper always handled. SC-652 extends it to exactly the blocks this
ticket starts keeping. Consequence: anything typed in the window is discarded, and a Notice says the note changed
outside when it did not. No note data is lost. This changes behaviour on screen, which the "Behaviour on screen is
unchanged" ruling covers. The OW24 shape (no own write before the window opens) is unaffected, because then both
sides are the plain serialization.

Fix: record the plain serialization on both sides. Change `montage/view.ts:128` and `initiative/view.ts:207` to
`this.disk = { raw: normalizeBlockText(out), ser: serializeModel(model) };`. `raw` keeps the note's own text, and
`:209` / `:266` (initiative `:275` / `:333`) already store `serializeModel(model)`. Probed in a throwaway copy of
`f4448454`: every row above becomes "window stays, 0 Notices", and the reserved lines are still written once. The
existing suites pass 173/173: `montage-outside-edit`, `initiative-outside-edit`, `sidebarInitiative`,
`wrapperKeysKept`. Suggested pin: OW26 with a `prefs:` line in `montage-outside-edit.test.ts`. The fix touches
SC-650 / SC-608 files: tell the dispatcher, or file the fix against SC-650 if the owner rules it out of scope.

### INFO

- **I-7 — the helper's fallback test only sees a column-0 key, which matters only for a body that is already
  broken.** `prefOverrides.ts` `bodyDeclaresTopLevel`: when the body does not parse, `"prefs": x\nbad: [` returns
  false. A ds-hero splice that does not parse is broken before any wrapper runs, for example
  `state: &s` + `prefs: *s`: the splice drops the anchor, and the result is "Unresolved alias" on base and head alike,
  byte-identical. Pre-existing, SC-669-adjacent, no action.
- **I-8 — helper attack table (24 bodies).** All correct:
  - True: plain, `"prefs":`, `'prefs':`, `? prefs`, `!!str prefs`, flow document, `---` marker, CRLF, an indented
    document.
  - False: a key only nested, a block scalar, a folded double-quoted scalar, a list item, a comment, `"prefs ":`, a
    `<<:` merge key (no merge in YAML 1.2, consistent with extraction), an empty body, `{}`.
  - Unparseable bodies fall back to the line test: duplicate key, unresolved alias, multi-document.

## Scope items

1. **M-1**: `r2rev-probe.test.ts` at `f4448454` (`r2rev-out-head-r4p1.json`).
   - `"prefs": {boardDensity: compact}`, `'prefs': compact`, `? prefs`, `"collapsed": yes`, and the two base-broken
     ones (`"prefs": {reduceMotion: true}`, `"collapsed": true`): one key, re-parse clean.
   - Redraw clean: re-parse succeeds, and r3's `wrapperKeysKept` SC-514 block redraws each case.
   - Column-0 applied override ×3 writes: single.
   - `r4rev-probe4.test.ts`: `!!str prefs:` / `!!str collapsed:`, a `---` marker, and CRLF quoted are all single. A
     key inside `state:` and a `<<:` merge key are schema-rejected before any write, the same as base.
   - 22 non-hero outputs byte-identical to the r2 head (`r4rev-summary-p1-r2head-vs-r4head.txt`); all 36 identical to
     the r2 fix probe.
   - Hero form Save / redraw (`r2rev-probe2.test.ts`): 8/8, outputs as at r2.
2. **L-1**: the stale sentence is gone. `collapsedKey.ts` `withCollapseKeys` doc now points at the shared helper.
   **I-4**: CTR-K01 is in `e2e/specs/counter/kept-keys.e2e.ts`, with the same title and id, once in all of
   `e2e/specs`. The montage spec keeps MONT-X15..X18.
3. **Rebase sanity (SC-650 paths)**, `r4rev-probe3.test.ts`:
   - An outside edit in the sidebar (block changed), then a card write: `prefs:` unknown-only and `collapsed: yes`
     written once. Base drops both.
   - A Reading view redraw after an outside edit with a window open (1 Notice as designed), then a write: kept once.
   - OW24 shape then Log: window stays, Log writes, lines kept once.
   - The only regression is N-1.
   - r3 e2e log: `627/636 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs`, with ✓ for MONT-X15, X16, X17, X18 and
     CTR-K01.
4. **Superproject** `/home/scott/code/steelCompendium/worktrees/sc652-wrapper-keys-kept`:
   - Re-fetched; `ls-remote` shows origin/main still at `2945c3ea`. HEAD is `6c77ff1a`, HEAD~2 is `2945c3ea`, and the
     tree is clean.
   - `7f7f3eeb` touches only `CHANGELOG.md`. The bullet is the first under `## Unreleased` and is identical to
     `sc652-changelog-draft.md`.
   - `6c77ff1a` touches only the `draw-steel-elements` gitlink, which is `f4448454858f…`.
   - Neither commit has a trailer or attribution.
5. **Gates**:

| gate | result | log |
|---|---|---|
| tsc incl. `-p e2e` | clean, EXIT=0 | r4rev-tsc.log |
| lint | clean, EXIT=0 | r4rev-lint.log |
| jest | 13582 passed / 1 skipped / 13583, EXIT=0 (= r3) | r4rev-jest.log |
| lifecycle part 4 | 3/4: G-S57, G-S62, G-S56 ok; G-S61 FAIL, torn-read only in all 6 failing phases (0 stale frames); loadavg 16.37 at start, 3.83 at end | r4rev-lc-p4.log, r4rev-lc-load.txt |
| e2e | not re-run (brief); r3 log checked | sc652-r1-impl/r3/e2e.log |

## Probes and artifacts
Everything is in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc652-r2-review/`:
- Probes: `r4rev-probes.sh`, `r2rev-probe-{head,base}-r4p{1,2,3,4}.log`, `r2rev-out-{head,base}-r4p{1,2,3,4}.json`,
  `r4rev-probe3.test.ts` (SC-650 harness + `r4rev-probe3-tail.ts`), `r4rev-probe4.test.ts` (+ `r4rev-probe4-mid.ts`,
  `r4rev-probe4-unit.ts`), `r4rev-summary-p1-r2head-vs-r4head.txt`.
- N-1 fix probe: `r4rev-diskfix.sh`, `r4rev-diskfix-probe3.log`, `r4rev-diskfix-suites.log`,
  `r2rev-out-headdiskfix-r4p3.json`.
- Gates: `r4rev-quick.sh`, `r4rev-lc4.sh`, plus the gate logs above.

The base side ran on throwaway `wt-base` at `42c26272`. `wt-head` is at `f4448454`, with its src reverted after the
fix probe; both carry untracked probe tests only. Branch worktree: `f4448454`, clean.
